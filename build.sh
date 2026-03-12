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
cp apple-touch-icon.png dist/

# Debug — show whether env vars are present (not their values)
echo "GOOGLE_CLIENT_ID set:     $([ -n "$GOOGLE_CLIENT_ID" ] && echo YES || echo NO)"
echo "ALLOWED_EMAIL set:        $([ -n "$ALLOWED_EMAIL" ] && echo YES || echo NO)"
echo "GOOGLE_CLIENT_SECRET set: $([ -n "$GOOGLE_CLIENT_SECRET" ] && echo YES || echo NO)"
echo "SESSION_SECRET set:       $([ -n "$SESSION_SECRET" ] && echo YES || echo NO)"
echo "SCRIPT_URL set:           $([ -n "$SCRIPT_URL" ] && echo YES || echo NO)"
echo "API_TOKEN set:            $([ -n "$API_TOKEN" ] && echo YES || echo NO)"

# Inject Google Client ID into auth.js (public value, safe to embed in browser JS)
sed -i "s|%%GOOGLE_CLIENT_ID%%|${GOOGLE_CLIENT_ID:-}|g" dist/js/auth.js

echo "✓ Credentials injected"
echo "✓ Build complete → dist/"
