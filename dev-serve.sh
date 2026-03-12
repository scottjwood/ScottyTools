#!/bin/bash
# dev-serve.sh — internal script used by netlify dev (via netlify.toml [dev] command).
#
# netlify dev injects env vars from the linked Netlify site BEFORE running this,
# so build.sh's sed substitution (%%GOOGLE_CLIENT_ID%% etc.) works correctly.
#
# Do NOT run this directly — use dev.sh or `netlify dev` instead.

set -e

echo "Building dist/ with env vars from linked Netlify site..."
bash build.sh

echo ""
echo "Starting static file server on port 3000..."
exec npx --yes serve dist -l 3000
