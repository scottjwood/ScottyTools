// netlify/edge-functions/ledger-api.js
// ═══════════════════════════════════════════════════════════════
// Secure proxy for Ledger → Google Apps Script
//
// The browser calls:  GET /.netlify/edge-functions/ledger-api?action=...&payload=...
// This function adds the real SCRIPT_URL and API_TOKEN (from Netlify
// environment variables) and forwards the request to Apps Script.
// The browser never sees the credentials.
// ═══════════════════════════════════════════════════════════════

export default async function handler(req) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read credentials from Netlify environment variables (never exposed to browser)
  const SCRIPT_URL = Deno.env.get('SCRIPT_URL');
  const API_TOKEN  = Deno.env.get('API_TOKEN');

  if (!SCRIPT_URL || !API_TOKEN) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Server misconfigured — SCRIPT_URL or API_TOKEN env var missing.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Pull action and payload from the incoming request
  const incoming = new URL(req.url);
  const action   = incoming.searchParams.get('action')  || '';
  const payload  = incoming.searchParams.get('payload') || '{}';

  // Forward to Apps Script with real credentials added server-side
  const upstream = new URL(SCRIPT_URL);
  upstream.searchParams.set('action',  action);
  upstream.searchParams.set('payload', payload);
  upstream.searchParams.set('token',   API_TOKEN);

  try {
    const response = await fetch(upstream.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    const text = await response.text();

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Allow the ScottyTools frontend to call this
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Upstream fetch failed: ' + err.message,
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = { path: '/.netlify/edge-functions/ledger-api' };
