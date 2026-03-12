#!/bin/bash
# ScottyTools local dev entry point.
# Run this once per session: bash dev.sh
# See DEV.md for full setup instructions.

set -e

# ── 1. Check Netlify CLI ──────────────────────────────────────────────────────
if ! command -v netlify &>/dev/null; then
  echo "Netlify CLI not found — installing..."
  npm install -g netlify-cli
fi

# ── 2. Check site is linked ───────────────────────────────────────────────────
if [ ! -f ".netlify/state.json" ]; then
  echo ""
  echo "ERROR: This site is not linked to a Netlify project."
  echo ""
  echo "Run this once to link it:"
  echo "  netlify link"
  echo ""
  echo "Then re-run: bash dev.sh"
  exit 1
fi

# ── 3. Start local dev server ─────────────────────────────────────────────────
# netlify dev will:
#   - Pull env vars from the linked Netlify site (including GOOGLE_CLIENT_ID)
#   - Run dev-serve.sh: builds dist/ (with placeholders replaced), starts static server
#   - Proxy http://localhost:8888 to the static server
#   - Serve edge functions at /.netlify/edge-functions/* on the same port
echo "Starting ScottyTools dev server..."
echo "  Static site + edge functions → http://localhost:8888"
echo ""
netlify dev
