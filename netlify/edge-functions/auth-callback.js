// netlify/edge-functions/auth-callback.js
// ═══════════════════════════════════════════════════════════════
// OAuth 2.0 authorization code + PKCE callback handler
//
// Google redirects here after the user authenticates:
//   GET /.netlify/edge-functions/auth-callback?code=...&state=...
//
// This function:
//   1. Verifies the state param against the st_pkce cookie (CSRF protection)
//   2. Exchanges the code for tokens (access + refresh) via Google
//   3. Verifies the user's email against ALLOWED_EMAIL
//   4. Encrypts the session (refresh token + user info) with AES-256-GCM
//   5. Sets a secure HttpOnly session cookie
//   6. Redirects the browser back to the originating page
//
// Reads from Netlify environment variables (never exposed to browser):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, ALLOWED_EMAIL
// ═══════════════════════════════════════════════════════════════

const SESSION_COOKIE = 'st_session';
const PKCE_COOKIE    = 'st_pkce';

export default async function handler(req) {
  const url   = new URL(req.url);
  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const CLIENT_ID      = Deno.env.get('GOOGLE_CLIENT_ID');
  const CLIENT_SECRET  = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const SESSION_SECRET = Deno.env.get('SESSION_SECRET');
  const ALLOWED_EMAIL  = Deno.env.get('ALLOWED_EMAIL') || '';

  if (!CLIENT_ID || !CLIENT_SECRET || !SESSION_SECRET) {
    return new Response('Server misconfigured — missing environment variables.', { status: 500 });
  }

  const root = rootUrl(req);

  if (error) {
    return Response.redirect(`${root}?auth_error=${encodeURIComponent(error)}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(root, 302);
  }

  // ── Verify PKCE state from cookie ──────────────────────────────────────────
  const cookies = parseCookies(req.headers.get('cookie') || '');
  const pkceRaw = cookies[PKCE_COOKIE];

  if (!pkceRaw) {
    return new Response('Missing PKCE cookie — please try signing in again.', { status: 400 });
  }

  let pkce;
  try {
    pkce = JSON.parse(atob(pkceRaw));
  } catch {
    return new Response('Invalid PKCE cookie.', { status: 400 });
  }

  if (!pkce.state || pkce.state !== state) {
    return new Response('State mismatch — possible CSRF attack.', { status: 400 });
  }

  // ── Exchange authorization code for tokens ─────────────────────────────────
  const redirectUri = callbackUrl(req);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
      code_verifier: pkce.verifier,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error('auth-callback: token exchange failed:', body);
    return new Response('Token exchange failed.', { status: 502 });
  }

  const tokens = await tokenRes.json();

  if (!tokens.refresh_token) {
    // This happens if access_type=offline was missing from the auth URL,
    // or if the user has previously authorized and prompt=consent was not used.
    console.error('auth-callback: no refresh_token in response:', JSON.stringify(tokens));
    return new Response('No refresh token returned — ensure prompt=consent and access_type=offline in the auth URL.', { status: 502 });
  }

  // ── Fetch and verify user info ─────────────────────────────────────────────
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return new Response('Failed to fetch user info.', { status: 502 });
  }

  const userInfo = await userRes.json();

  if (ALLOWED_EMAIL.length >= 3) {
    if ((userInfo.email || '').toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      return new Response(`Access denied: ${userInfo.email} is not authorized.`, { status: 403 });
    }
  }

  const user = {
    name:    userInfo.name    || '',
    email:   userInfo.email   || '',
    picture: userInfo.picture || '',
  };

  // ── Encrypt and store session ──────────────────────────────────────────────
  const session = {
    refresh_token: tokens.refresh_token,
    access_token:  tokens.access_token,
    // Subtract 60s so the client refreshes slightly before actual expiry
    expires_at:    Date.now() + (tokens.expires_in - 60) * 1000,
    user,
  };

  const encrypted = await encryptSession(session, SESSION_SECRET);

  // ── Redirect back to originating page ─────────────────────────────────────
  const returnUrl = sanitizeReturnUrl(pkce.returnUrl, root);

  const headers = new Headers();
  // Session cookie: HttpOnly, Secure, 30-day max-age
  headers.append('Set-Cookie',
    `${SESSION_COOKIE}=${encrypted}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
  );
  // Clear the temporary PKCE cookie
  headers.append('Set-Cookie',
    `${PKCE_COOKIE}=; HttpOnly; Path=/; Max-Age=0`
  );
  headers.set('Location', returnUrl);

  return new Response(null, { status: 302, headers });
}

// ── Crypto: AES-256-GCM encrypt/decrypt ───────────────────────────────────────
// Session format: base64( iv[12] || ciphertext_with_gcm_tag )

async function encryptSession(data, secretHex) {
  const key    = await importKey(secretHex);
  const iv     = crypto.getRandomValues(new Uint8Array(12));
  const plain  = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);

  const buf = new Uint8Array(12 + cipher.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(cipher), 12);

  return btoa(String.fromCharCode(...buf));
}

async function importKey(secretHex) {
  // SESSION_SECRET must be a 64-char hex string (32 bytes / 256 bits)
  const bytes = hexToBytes(secretHex);
  return crypto.subtle.importKey(
    'raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  );
}

function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

// ── URL helpers ───────────────────────────────────────────────────────────────

function rootUrl(req) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}/`;
}

function callbackUrl(req) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}/.netlify/edge-functions/auth-callback`;
}

/** Ensure returnUrl is same-origin to prevent open redirects */
function sanitizeReturnUrl(returnUrl, fallback) {
  try {
    const fallbackOrigin = new URL(fallback).origin;
    const target         = new URL(returnUrl);
    if (target.origin === fallbackOrigin) return returnUrl;
  } catch { /* fall through */ }
  return fallback;
}

// ── Cookie parser ─────────────────────────────────────────────────────────────

function parseCookies(header) {
  const cookies = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) cookies[k] = v;
  }
  return cookies;
}

export const config = { path: '/.netlify/edge-functions/auth-callback' };
