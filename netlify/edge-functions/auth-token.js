// netlify/edge-functions/auth-token.js
// ═══════════════════════════════════════════════════════════════
// Access token dispenser — called by the browser on every page load
// and automatically before the cached token expires.
//
//   GET /.netlify/edge-functions/auth-token
//   Returns: { access_token, expires_in, user }
//   Returns: 401 if session cookie is missing or invalid/expired
//
// Behavior:
//   - Reads and decrypts the HttpOnly session cookie (set by auth-callback)
//   - If the cached access token is still valid, returns it immediately
//   - Otherwise uses the refresh token to fetch a new access token from Google,
//     updates the session cookie, and returns the new token
//   - If the refresh token is invalid/revoked, returns 401 and clears the cookie
//
// Reads from Netlify environment variables:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET
// ═══════════════════════════════════════════════════════════════

const SESSION_COOKIE = 'st_session';

export default async function handler(req) {
  const CLIENT_ID      = Deno.env.get('GOOGLE_CLIENT_ID');
  const CLIENT_SECRET  = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const SESSION_SECRET = Deno.env.get('SESSION_SECRET');

  if (!CLIENT_ID || !CLIENT_SECRET || !SESSION_SECRET) {
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  const cookies       = parseCookies(req.headers.get('cookie') || '');
  const sessionCookie = cookies[SESSION_COOKIE];

  if (!sessionCookie) {
    return jsonResponse({ error: 'No session' }, 401);
  }

  // ── Decrypt session ────────────────────────────────────────────────────────
  let session;
  try {
    session = await decryptSession(sessionCookie, SESSION_SECRET);
  } catch (err) {
    console.warn('auth-token: session decryption failed:', err.message);
    return clearCookieAndReturn401();
  }

  if (!session?.refresh_token) {
    return clearCookieAndReturn401();
  }

  // ── Return cached access token if still valid ──────────────────────────────
  if (session.access_token && session.expires_at && Date.now() < session.expires_at) {
    return jsonResponse({
      access_token: session.access_token,
      expires_in:   Math.max(0, Math.floor((session.expires_at - Date.now()) / 1000)),
      user:         session.user,
    });
  }

  // ── Refresh the access token ───────────────────────────────────────────────
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      refresh_token: session.refresh_token,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.warn('auth-token: refresh failed:', tokenRes.status, body);
    // Refresh token is invalid or revoked — force the user to sign in again
    return clearCookieAndReturn401();
  }

  const tokens = await tokenRes.json();

  // ── Re-encrypt session with updated access token ───────────────────────────
  const newSession = {
    ...session,
    access_token: tokens.access_token,
    expires_at:   Date.now() + (tokens.expires_in - 60) * 1000,
    // refresh_token is only returned when rotating; preserve the existing one
    refresh_token: tokens.refresh_token || session.refresh_token,
  };

  const encrypted = await encryptSession(newSession, SESSION_SECRET);

  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  // Refresh the cookie's Max-Age so the 30-day window resets on activity
  headers.append('Set-Cookie',
    `${SESSION_COOKIE}=${encrypted}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
  );

  return new Response(JSON.stringify({
    access_token: tokens.access_token,
    expires_in:   tokens.expires_in,
    user:         session.user,
  }), { status: 200, headers });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clearCookieAndReturn401() {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  headers.append('Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
  return new Response(JSON.stringify({ error: 'Session expired' }), {
    status: 401,
    headers,
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Crypto: AES-256-GCM encrypt/decrypt ───────────────────────────────────────
// Session format: base64( iv[12] || ciphertext_with_gcm_tag )

async function decryptSession(cookieVal, secretHex) {
  const key  = await importKey(secretHex);
  const buf  = Uint8Array.from(atob(cookieVal), c => c.charCodeAt(0));
  const iv   = buf.slice(0, 12);
  const data = buf.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return JSON.parse(new TextDecoder().decode(plain));
}

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

export const config = { path: '/.netlify/edge-functions/auth-token' };
