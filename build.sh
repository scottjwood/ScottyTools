#!/bin/bash
# ScottyTools build script
# Injects environment variables into auth.js
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

# Inject Google OAuth credentials into auth.js
sed -i "s|%%GOOGLE_CLIENT_ID%%|${GOOGLE_CLIENT_ID:-}|g" dist/js/auth.js
sed -i "s|%%ALLOWED_EMAIL%%|${ALLOWED_EMAIL:-}|g"       dist/js/auth.js

# Inject Ledger API credentials into edge function
sed -i "s|%%SCRIPT_URL%%|${SCRIPT_URL:-}|g"  dist/netlify/edge-functions/ledger-api.js
sed -i "s|%%API_TOKEN%%|${API_TOKEN:-}|g"    dist/netlify/edge-functions/ledger-api.js

echo "✓ Credentials injected"
echo "✓ Build complete → dist/"