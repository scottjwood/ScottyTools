/**
 * auth.js — Google OAuth 2.0 for ScottyTools (PKCE flow)
 * ═══════════════════════════════════════════════════════════════
 * Handles sign-in, sign-out, token management, and access checks.
 *
 * Uses authorization code + PKCE flow. The refresh token lives
 * exclusively in a server-side HttpOnly cookie managed by the
 * auth-callback and auth-token edge functions. The browser only
 * ever sees short-lived access tokens cached in memory.
 *
 * Public API (identical to the previous implicit-flow version):
 *   Auth.init()           — call on every page; resolves auth state
 *   Auth.requireAuth()    — call on protected pages; shows sign-in if needed
 *   Auth.getToken()       — returns current access token or null (synchronous)
 *   Auth.getUser()        — returns { name, email, picture } or null
 *   Auth.signOut()        — clears server session and navigates to index
 *   Auth.onReady(fn)      — calls fn(user) once auth state is known
 *   Auth.requestSignIn()  — initiates the OAuth redirect flow
 *   Auth.isSignedIn()     — returns boolean
 */

const Auth = (() => {

  // ── Config (injected at build time by build.sh) ────────────────────────────
  const CLIENT_ID = '%%GOOGLE_CLIENT_ID%%';

  // All scopes requested upfront so the user only goes through consent once
  const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents',
    'openid',
    'email',
    'profile',
  ].join(' ');

  // ── Edge function endpoints ────────────────────────────────────────────────
  const TOKEN_ENDPOINT    = '/.netlify/edge-functions/auth-token';
  const SIGNOUT_ENDPOINT  = '/.netlify/edge-functions/auth-signout';
  const CALLBACK_PATH     = '/.netlify/edge-functions/auth-callback';
  const PKCE_COOKIE       = 'st_pkce';

  // ── In-memory state (never persisted to localStorage) ─────────────────────
  let _token          = null;   // current access token
  let _expiresAt      = 0;      // absolute ms timestamp of token expiry
  let _user           = null;   // { name, email, picture }
  let _readyCallbacks = [];     // null after first fireReady()
  let _refreshTimer   = null;

  // ── PKCE helpers ───────────────────────────────────────────────────────────

  function _b64url(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g,  '');
  }

  async function _generateVerifier() {
    return _b64url(crypto.getRandomValues(new Uint8Array(32)));
  }

  async function _codeChallenge(verifier) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return _b64url(hash);
  }

  function _generateState() {
    return _b64url(crypto.getRandomValues(new Uint8Array(16)));
  }

  // ── Token management ───────────────────────────────────────────────────────

  /**
   * Calls the auth-token edge function to get a valid access token.
   * The edge function reads the HttpOnly session cookie (invisible to JS),
   * refreshes via Google if needed, and returns { access_token, expires_in, user }.
   * Returns true on success, false on 401/error.
   */
  async function _fetchToken() {
    try {
      const res = await fetch(TOKEN_ENDPOINT, { credentials: 'same-origin' });
      if (res.status === 401) {
        _token     = null;
        _user      = null;
        _expiresAt = 0;
        return false;
      }
      if (!res.ok) {
        console.warn('Auth: auth-token returned', res.status);
        return false;
      }
      const data = await res.json();
      _token     = data.access_token;
      _expiresAt = Date.now() + (data.expires_in - 60) * 1000;
      if (data.user) _user = data.user;
      _scheduleRefresh(_expiresAt);
      return true;
    } catch (err) {
      console.warn('Auth: fetch token error:', err);
      return false;
    }
  }

  /**
   * Schedules a silent background refresh 2 minutes before the token expires.
   * No popup, no user interaction — the edge function handles everything.
   */
  function _scheduleRefresh(expiresAt) {
    clearTimeout(_refreshTimer);
    const delay = expiresAt - Date.now() - (2 * 60 * 1000); // 2 min early
    if (delay > 0) {
      _refreshTimer = setTimeout(async () => {
        await _fetchToken();
        // If refresh fails (e.g., token revoked), _token becomes null.
        // Pages calling getToken() will get null and should handle gracefully.
      }, delay);
    }
  }

  // ── Ready callbacks ────────────────────────────────────────────────────────

  function _fireReady() {
    const cbs = _readyCallbacks || [];
    _readyCallbacks = null;  // mark as fired
    cbs.forEach(fn => { try { fn(_user); } catch (e) { console.error(e); } });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Returns the current in-memory access token, or null if not authenticated */
  function getToken() { return _token; }

  /** Returns { name, email, picture } for the signed-in user, or null */
  function getUser() { return _user; }

  /** Returns true if the user is currently authenticated with a valid token */
  function isSignedIn() { return !!(_token && _user); }

  /**
   * onReady(fn) — calls fn(user) once auth state is resolved.
   * If already resolved, calls fn immediately.
   */
  function onReady(fn) {
    if (_readyCallbacks === null) { fn(_user); return; }
    _readyCallbacks.push(fn);
  }

  /**
   * init() — resolve auth state on page load.
   * Calls auth-token to get a valid access token from the session cookie.
   * Fires onReady callbacks once the result is known.
   */
  function init() {
    _fetchToken().then(() => {
      _fireReady();
    });
  }

  /**
   * requireAuth() — enforce authentication on protected pages.
   * Waits for auth state then shows a full-page sign-in overlay if not signed in.
   */
  function requireAuth() {
    onReady((user) => {
      if (!user) {
        _showSignInOverlay();
      }
    });
  }

  /**
   * requestSignIn() — initiate the OAuth 2.0 authorization code + PKCE flow.
   * Generates a code verifier + challenge, saves them in a temporary cookie,
   * then redirects the browser to Google's consent screen.
   * After the user authorizes, Google redirects to auth-callback which sets
   * the session cookie and redirects back to this page.
   */
  async function requestSignIn() {
    if (!CLIENT_ID || CLIENT_ID.length < 10) {
      alert('Auth not configured — CLIENT_ID missing.');
      return;
    }

    const verifier   = await _generateVerifier();
    const challenge  = await _codeChallenge(verifier);
    const state      = _generateState();
    const returnUrl  = location.href;

    // Store PKCE params in a short-lived cookie so auth-callback can read them.
    // Not HttpOnly (JS must set it); SameSite=Lax means it's sent on the
    // top-level redirect back from Google.
    const pkceData = btoa(JSON.stringify({ state, verifier, returnUrl }));
    document.cookie =
      `${PKCE_COOKIE}=${pkceData}; Path=/; SameSite=Lax; Secure; Max-Age=300`;

    const redirectUri = `${location.origin}${CALLBACK_PATH}`;

    const params = new URLSearchParams({
      client_id:             CLIENT_ID,
      redirect_uri:          redirectUri,
      response_type:         'code',
      scope:                 SCOPES,
      state,
      code_challenge:        challenge,
      code_challenge_method: 'S256',
      access_type:           'offline',
      // prompt=consent forces Google to return a refresh_token.
      // Only shown on initial sign-in or after sign-out; never during
      // background token refreshes (those are silent server-side).
      prompt:                'consent',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * signOut() — clear the server-side session and navigate home.
   * Navigates directly to the auth-signout edge function which clears
   * the HttpOnly cookie (JS cannot do this) and redirects to /.
   */
  function signOut() {
    clearTimeout(_refreshTimer);
    _token     = null;
    _user      = null;
    _expiresAt = 0;
    // Navigate to the server-side signout endpoint; it clears the
    // HttpOnly session cookie and issues a redirect to /
    window.location.href = SIGNOUT_ENDPOINT;
  }

  // ── Sign-in overlay ────────────────────────────────────────────────────────

  function _showSignInOverlay() {
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:2000;
      background:#0e0f0f;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:20px;
    `;
    overlay.innerHTML = `
      <div style="
        display:flex;align-items:center;gap:10px;
        font-family:'Barlow Condensed',sans-serif;
        font-size:1.8rem;font-weight:700;
        letter-spacing:0.06em;color:#f0f0f0;
      ">
        <svg viewBox="0 0 14 14" width="28" height="28" xmlns="http://www.w3.org/2000/svg" style="fill:#e8a020">
          <path d="M7 0L14 4V10L7 14L0 10V4L7 0Z"/>
        </svg>
        ScottyTools
      </div>
      <div style="font-size:0.8rem;color:#545f6d;letter-spacing:0.06em;margin-top:-8px">
        Sign in to continue
      </div>
      <button id="auth-signin-btn" style="
        display:flex;align-items:center;gap:10px;
        background:#fff;color:#3c3c3c;
        border:none;border-radius:8px;
        padding:11px 20px;
        font-family:'DM Mono',monospace;font-size:0.85rem;
        cursor:pointer;
        box-shadow:0 2px 12px rgba(0,0,0,0.4);
        transition:box-shadow 150ms ease;
      ">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
        </svg>
        Sign in with Google
      </button>
      <div style="font-size:0.7rem;color:#2d3540;max-width:260px;text-align:center;line-height:1.5">
        Access restricted to authorized accounts only.
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('auth-signin-btn').addEventListener('click', () => {
      requestSignIn();
    });
  }

  // ── Exports ────────────────────────────────────────────────────────────────
  return {
    init,
    requireAuth,
    requestSignIn,
    signOut,
    getToken,
    getUser,
    isSignedIn,
    onReady,
  };

})();
