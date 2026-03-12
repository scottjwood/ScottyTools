# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Deploy

```bash
bash build.sh        # copies assets → dist/, injects env vars, output ready for Netlify
```

`build.sh` copies all HTML/CSS/JS/edge-functions to `dist/` and injects `GOOGLE_CLIENT_ID` into `dist/js/auth.js` via `sed`. The Netlify publish directory is `dist/`. There is no local dev server — test changes by pushing to the repo and checking a Netlify deploy preview.

**Required Netlify environment variables:**

| Variable | Where used |
|---|---|
| `GOOGLE_CLIENT_ID` | Injected into browser JS at build time (public) |
| `GOOGLE_CLIENT_SECRET` | Edge function only — never in `dist/js/` |
| `SESSION_SECRET` | Edge function only — 64-char hex string (32-byte AES-256 key) |
| `ALLOWED_EMAIL` | Edge function + build debug output |
| `SCRIPT_URL` / `API_TOKEN` | `ledger-api` edge function (Apps Script proxy) |

## Architecture

Zero-dependency vanilla HTML/CSS/JS. No framework, no npm, no bundler.

### Shared JS modules (loaded on every page)

- **[js/tools-registry.js](js/tools-registry.js)** — `TOOLS` array + helpers (`searchTools`, `getFeaturedTools`, `toggleFavorite`, `saveOrder`). This is the only file to edit when adding a tool.
- **[js/nav.js](js/nav.js)** — injects the fixed navbar (search + auth slot) into `#nav-placeholder`. Calls `Auth.onReady()` to render the sign-in/avatar state.
- **[js/auth.js](js/auth.js)** — OAuth 2.0 PKCE flow. `Auth.init()` calls the `auth-token` edge function on page load to hydrate an in-memory access token. `Auth.getToken()` is synchronous once ready. The refresh token never touches the browser — it lives in an HttpOnly cookie managed by the edge functions.
- **[js/prefs.js](js/prefs.js)** — syncs localStorage to a `scottytools-prefs.json` file in the user's Google Drive. Only loaded on `index.html`. Call `Prefs.save()` after mutating any `st_` localStorage key so the change propagates.

### Edge functions (Deno, `netlify/edge-functions/`)

| Function | Path | Purpose |
|---|---|---|
| `auth-callback` | `/.netlify/edge-functions/auth-callback` | Receives OAuth redirect; exchanges code, encrypts session into HttpOnly cookie |
| `auth-token` | `/.netlify/edge-functions/auth-token` | Returns valid access token (from cache or refresh); called by `Auth.init()` |
| `auth-signout` | `/.netlify/edge-functions/auth-signout` | Clears HttpOnly cookie; browser navigates here directly on sign-out |
| `ledger-api` | `/.netlify/edge-functions/ledger-api` | Proxies Ledger → Google Apps Script; adds `SCRIPT_URL` + `API_TOKEN` server-side |

Session encryption: AES-256-GCM, cookie format `base64(iv[12] ‖ ciphertext_with_tag)`.

### Page structure

Every tool page follows this structure:

```html
<div id="nav-placeholder"></div>
<main class="page"> … </main>

<script src="../js/tools-registry.js"></script>
<script src="../js/nav.js"></script>
<script src="../js/auth.js"></script>
<script>
  Auth.init();
  Nav.init();
  // tool logic
</script>
```

Protected pages additionally call `Auth.requireAuth()` (shows a full-screen sign-in overlay if unauthenticated) and use `Auth.getToken()` inside `Auth.onReady()` to make Google API calls.

## Adding a New Tool

1. Add one entry to the `TOOLS` array in [js/tools-registry.js](js/tools-registry.js). The `id` must match the filename (without `.html`). Current categories: `CATEGORIES.DIGITAL`, `CATEGORIES.FOUNDRY`, `CATEGORIES.GENERAL`.
2. Copy [tools/_template.html](tools/_template.html) → `tools/your-tool.html`.
3. Done — the tool appears in nav search, category filters, and the homepage grid automatically.

For tools that need Google API access, follow the pattern in [tools/tasks.html](tools/tasks.html): call `Auth.requireAuth()`, then make API requests with `Authorization: Bearer ${Auth.getToken()}` inside `Auth.onReady()`.

## Key Conventions

- **localStorage keys** are prefixed `st_` (e.g. `st_favorites`, `st_order_pinned`). After mutating, call `Prefs.save()` if `prefs.js` is loaded.
- **CSS design tokens** live in the `:root` block at the top of [css/main.css](css/main.css). Amber accent: `#e8a020` / `var(--accent)`. Fonts: `DM Mono` (inputs/mono), `Barlow Condensed` (headings), `Barlow` (body).
- **Tool icons** are added to the `TOOL_ICONS` object in `tools-registry.js` — 24×24 SVG path data, stroke-based.
- **`GOOGLE_CLIENT_SECRET` and `SESSION_SECRET`** must never appear in any file under `js/` or `tools/` — those are copied verbatim to `dist/`.
