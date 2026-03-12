# Local Development — ScottyTools

## How it works

`netlify dev` solves the placeholder-injection problem by running a build step
(with env vars already in scope) before starting the local server:

```
netlify dev
  │
  ├─ Pulls env vars from linked Netlify site (GOOGLE_CLIENT_ID, etc.)
  ├─ Runs dev-serve.sh
  │     ├─ bash build.sh  ← sed replaces %%GOOGLE_CLIENT_ID%% in dist/js/auth.js
  │     └─ npx serve dist -l 3000  ← static server on port 3000
  │
  └─ Proxies http://localhost:8888 → port 3000
       + serves edge functions at /.netlify/edge-functions/*
```

No placeholders survive. Auth, edge functions, and static files all work locally.

---

## First-time setup (do this once)

### 1. Node.js

Node v24 is already installed. Skip this step.

If you ever need to reinstall: download from <https://nodejs.org> or use
`winget install OpenJS.NodeJS.LTS` in PowerShell.

### 2. Netlify CLI

Already installed globally (v24+). To verify:

```bash
netlify --version
```

To reinstall:

```bash
npm install -g netlify-cli
```

### 3. Link to the Netlify project

Run this once in the repo root — it opens a browser to authenticate and
writes `.netlify/state.json` (gitignored):

```bash
netlify link
```

Choose "Use current git remote origin" when prompted.
After linking, `netlify dev` will automatically pull env vars from the site.

---

## Every session

```bash
bash dev.sh
```

That's it. The script:

1. Confirms the Netlify CLI is installed
2. Confirms the site is linked
3. Runs `netlify dev`, which builds `dist/` and starts the server

Open **<http://localhost:8888>** in your browser.

---

## What works locally vs. what requires a real deploy

| Feature | Local (`netlify dev`) | Needs deploy |
|---|---|---|
| Static pages (HTML/CSS/JS) | ✓ | — |
| `%%GOOGLE_CLIENT_ID%%` injected | ✓ (via build step) | — |
| `ledger-api` edge function | ✓ | — |
| `auth-token` edge function | ✓ | — |
| `auth-callback` edge function | ✓ (runs locally) | — |
| `auth-signout` edge function | ✓ | — |
| Google OAuth sign-in flow | ✗ — localhost is not an authorized redirect URI | ✓ |
| HttpOnly session cookie (auth) | ✗ — auth-callback can't complete locally | ✓ |
| Netlify CDN / custom headers | ✗ | ✓ |

**Bottom line:** All non-auth tools work fully locally. Auth-protected tools
(Tasks, Ledger, Drive sync) require a real deploy to complete sign-in,
but once you have a valid session cookie from a real deploy and the same
domain origin, the edge functions themselves can be tested locally.

---

## File changes and rebuilds

`build.sh` runs once when `netlify dev` starts. If you edit source files,
**restart `netlify dev`** to pick up the changes:

1. `Ctrl+C` to stop
2. `bash dev.sh` to restart

There is no hot-reload or file watcher — this is intentional (zero-dependency project).

---

## Windows / Git Bash gotchas

- **Use Git Bash, not PowerShell or cmd**, for `bash dev.sh`. The build
  scripts use Unix syntax (`sed -i`, `set -e`, etc.) that only work in bash.
- If `netlify` is not found after installing with npm, close and reopen
  Git Bash so the `PATH` refreshes, or run `npm install -g netlify-cli` again.
- The `.netlify/` directory is gitignored. If you clone to a new machine,
  run `netlify link` again.

---

## Future: OAuth on localhost

When you want to test the full sign-in flow locally, add this URI to the
authorized redirect URIs in your Google Cloud Console OAuth 2.0 client:

```
http://localhost:8888/.netlify/edge-functions/auth-callback
```

Do **not** add it to production settings — keep a separate "localhost"
OAuth client for local dev, or use the Netlify deploy preview URL instead.
