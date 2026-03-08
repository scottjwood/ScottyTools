#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ScottyTools Build Script
# Copies site to dist/ and injects Netlify env vars into ledger.html
# ═══════════════════════════════════════════════════════════════
set -e

echo "Building ScottyTools..."

# Clean and recreate dist
rm -rf dist
mkdir -p dist/tools dist/css dist/js

# Copy everything
cp index.html dist/
cp css/*.css  dist/css/
cp js/*.js    dist/js/
cp tools/*.html dist/tools/
[ -f README.md ] && cp README.md dist/

# Inject secrets into ledger.html only
# SCRIPT_URL and API_TOKEN come from Netlify environment variables
cp dist/tools/ledger.html dist/tools/_ledger_build.html

sed -i "s|%%SCRIPT_URL%%|${SCRIPT_URL:-}|g"   dist/tools/_ledger_build.html
sed -i "s|%%API_TOKEN%%|${API_TOKEN:-}|g"     dist/tools/_ledger_build.html

mv dist/tools/_ledger_build.html dist/tools/ledger.html

echo "✓ Secrets injected into ledger.html"
echo "✓ Build complete → dist/"
