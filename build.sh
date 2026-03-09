#!/bin/bash
# ScottyTools build script
set -e

echo "Building ScottyTools..."

rm -rf dist
mkdir -p dist/tools dist/css dist/js dist/netlify/edge-functions

cp index.html dist/
cp css/*.css  dist/css/
cp js/*.js    dist/js/
cp tools/*.html dist/tools/
cp netlify/edge-functions/*.js dist/netlify/edge-functions/
[ -f README.md ] && cp README.md dist/
# Favicons
cp favicon.svg dist/
cp favicon-32.png dist/
cp favicon-16.png dist/
cp apple-touch-icon.png dist/

# Debug — show whether env vars are present (not their values)
echo "GOOGLE_CLIENT_ID set: $([ -n "$GOOGLE_CLIENT_ID" ] && echo YES || echo NO)"
echo "ALLOWED_EMAIL set:    $([ -n "$ALLOWED_EMAIL" ] && echo YES || echo NO)"
echo "SCRIPT_URL set:       $([ -n "$SCRIPT_URL" ] && echo YES || echo NO)"
echo "API_TOKEN set:        $([ -n "$API_TOKEN" ] && echo YES || echo NO)"

# Inject Google OAuth credentials into auth.js
sed -i "s|%%GOOGLE_CLIENT_ID%%|${GOOGLE_CLIENT_ID:-}|g" dist/js/auth.js
sed -i "s|%%ALLOWED_EMAIL%%|${ALLOWED_EMAIL:-}|g"       dist/js/auth.js

# Inject Ledger API credentials into edge function
sed -i "s|%%SCRIPT_URL%%|${SCRIPT_URL:-}|g"  dist/netlify/edge-functions/ledger-api.js
sed -i "s|%%API_TOKEN%%|${API_TOKEN:-}|g"    dist/netlify/edge-functions/ledger-api.js

echo "✓ Credentials injected"
echo "✓ Build complete → dist/"