// netlify/edge-functions/auth-signout.js
// ═══════════════════════════════════════════════════════════════
// Clears the HttpOnly session cookie and redirects to the home page.
//
// The browser navigates here directly on sign-out because JavaScript
// cannot clear an HttpOnly cookie — only a server response can.
//
//   GET /.netlify/edge-functions/auth-signout
//   → 302 to /
// ═══════════════════════════════════════════════════════════════

const SESSION_COOKIE = 'st_session';

export default async function handler(req) {
  const u    = new URL(req.url);
  const root = `${u.protocol}//${u.host}/`;

  const headers = new Headers();
  headers.append('Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
  headers.set('Location', root);

  return new Response(null, { status: 302, headers });
}

export const config = { path: '/.netlify/edge-functions/auth-signout' };
