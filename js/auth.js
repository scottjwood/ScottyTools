/**
 * auth.js — Google OAuth 2.0 for ScottyTools
 * ═══════════════════════════════════════════════════════════════
 * Handles sign-in, sign-out, token storage, and access checks.
 * Uses Google Identity Services (GIS) implicit flow — no backend needed.
 *
 * Usage:
 *   Auth.init()           — call on every page, renders sign-in UI
 *   Auth.requireAuth()    — call on protected pages, redirects if not signed in
 *   Auth.getToken()       — returns current access token or null
 *   Auth.getUser()        — returns { name, email, picture } or null
 *   Auth.signOut()        — clears session and redirects to index
 *   Auth.onReady(fn)      — calls fn(user) when auth state is known
 */

const Auth = (() => {

  // ── Config ────────────────────────────────────────────────────────────────
  const CLIENT_ID     = '%%GOOGLE_CLIENT_ID%%';
  const ALLOWED_EMAIL = '%%ALLOWED_EMAIL%%';

  // Google API scopes — request all upfront so user only authorizes once
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

  // ── Storage keys ─────────────────────────────────────────────────────────
  const KEY_TOKEN   = 'st_google_token';
  const KEY_EXPIRY  = 'st_google_expiry';
  const KEY_USER    = 'st_google_user';

  // ── Internal state ────────────────────────────────────────────────────────
  let _tokenClient = null;
  let _readyCallbacks = [];
  let _user = null;
  let _token = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function loadSession() {
    try {
      const expiry = parseInt(localStorage.getItem(KEY_EXPIRY) || '0');
      if (Date.now() < expiry) {
        _token = localStorage.getItem(KEY_TOKEN);
        _user  = JSON.parse(localStorage.getItem(KEY_USER) || 'null');
        return !!(_token && _user);
      }
    } catch {}
    clearSession();
    return false;
  }

  function saveSession(token, expiresIn, user) {
    _token = token;
    _user  = user;
    localStorage.setItem(KEY_TOKEN,  token);
    localStorage.setItem(KEY_EXPIRY, String(Date.now() + (expiresIn - 60) * 1000));
    localStorage.setItem(KEY_USER,   JSON.stringify(user));
  }

  function clearSession() {
    _token = null;
    _user  = null;
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_EXPIRY);
    localStorage.removeItem(KEY_USER);
  }

  async function fetchUserInfo(token) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  }

  function isAllowed(email) {
    if (!ALLOWED_EMAIL || ALLOWED_EMAIL.length < 3) return true; // dev fallback
    return email.toLowerCase() === ALLOWED_EMAIL.toLowerCase();
  }

  function fireReady() {
    _readyCallbacks.forEach(fn => fn(_user));
    _readyCallbacks = [];
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function getToken()  { return _token; }
  function getUser()   { return _user; }
  function isSignedIn(){ return !!(_token && _user); }

  function onReady(fn) {
    if (_readyCallbacks === null) { fn(_user); return; } // already fired
    _readyCallbacks.push(fn);
  }

  function signOut() {
    if (window.google && _token) {
      google.accounts.oauth2.revoke(_token, () => {});
    }
    clearSession();
    // Redirect to index from wherever we are
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    const prefix = depth > 1 ? '../' : '';
    window.location.href = prefix + 'index.html';
  }

  /**
   * init() — Load Google Identity Services and set up auth state.
   * Call on every page. Renders nothing visible — Nav handles the UI.
   */
  function init(opts = {}) {
    const { onSignIn } = opts;

    // Load GIS script if not already present
    if (!document.getElementById('gis-script')) {
      const script = document.createElement('script');
      script.id  = 'gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => _initGIS(onSignIn);
      document.head.appendChild(script);
    } else if (window.google?.accounts) {
      _initGIS(onSignIn);
    }

    // Restore session from storage immediately (before GIS loads)
    loadSession();
  }

  function _initGIS(onSignIn) {
    if (!CLIENT_ID || CLIENT_ID.length < 10) {
      console.warn('Auth: CLIENT_ID not configured.');
      _readyCallbacks = null;
      fireReady();
      return;
    }

    _tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error) {
          console.error('Auth error:', response.error);
          clearSession();
          fireReady();
          return;
        }
        // Fetch user profile to verify allowed email
        const userInfo = await fetchUserInfo(response.access_token);
        if (!isAllowed(userInfo.email)) {
          alert(`Access denied: ${userInfo.email} is not authorized to use ScottyTools.`);
          clearSession();
          fireReady();
          return;
        }
        const user = {
          name:    userInfo.name,
          email:   userInfo.email,
          picture: userInfo.picture,
        };
        saveSession(response.access_token, response.expires_in, user);
        _readyCallbacks = null;
        fireReady();
        if (onSignIn) onSignIn(user);
      },
    });

    // If we have a valid cached session, fire ready immediately
    if (loadSession()) {
      _readyCallbacks = null;
      fireReady();
    } else {
      // No valid session — fire ready with null (page decides what to do)
      _readyCallbacks = null;
      fireReady();
    }
  }

  /**
   * requestSignIn() — Trigger the Google OAuth popup.
   */
  function requestSignIn() {
    if (!_tokenClient) {
      alert('Auth not initialized yet. Please wait a moment and try again.');
      return;
    }
    _tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  /**
   * requireAuth(redirectPath) — Enforce auth on protected pages.
   * If not signed in, shows a sign-in screen overlay instead of the page.
   */
  function requireAuth() {
    onReady((user) => {
      if (!user) {
        _showSignInOverlay();
      }
    });
  }

  function _showSignInOverlay() {
    // Hide page content
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

    // Listen for successful sign-in and remove overlay
    onReady((user) => {
      if (user) {
        overlay.remove();
        document.body.style.overflow = '';
      }
    });
  }

  // Re-expose onReady for post-init use
  function onReadyPublic(fn) {
    if (isSignedIn()) { fn(_user); return; }
    // Re-register for next sign-in
    const orig = _tokenClient?._callback;
    fn(null);
  }

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