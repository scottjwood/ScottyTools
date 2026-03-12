# SCOTTYTOOLS — Personal Utility Suite

A lightweight, zero-cost web app housing personal calculators for design, fabrication, and construction work.

---

## Adding a New Tool

1. **Create** `tools/your-tool-name.html` — copy `tools/_template.html` as a starting point
2. **Register** it in `js/tools-registry.js` — add one entry to the `TOOLS` array:
```js
{
  id: 'your-tool',          // unique slug, must match filename
  label: 'Your Tool Name',
  description: 'One sentence description.',
  category: CATEGORIES.CARPENTRY,  // pick: DIGITAL | FOUNDRY | CARPENTRY | REVIT | GENERAL
  path: 'tools/your-tool.html',
  tags: ['keyword', 'another'],
  featured: false,           // true = pinned on homepage
}
```
3. That's it. The tool appears in nav search, category filters, and the grid automatically.

---

## Project Structure

```
scottytools/
├── index.html              ← Landing page
├── css/
│   └── main.css            ← All styles + CSS variables
├── js/
│   ├── tools-registry.js   ← THE registry — add tools here
│   └── nav.js              ← Shared nav component
└── tools/
    ├── _template.html      ← Copy this for new tools
    ├── aspect-ratio.html
    ├── board-foot.html
    ├── pour-weight.html
    └── unit-converter.html
```

---

## Deployment (Free — Netlify)

### Option A: Drag & Drop (fastest)
1. Go to [netlify.com](https://netlify.com) → Log in
2. Drag the entire `scottytools/` folder onto the deploy zone
3. Done — live URL in ~30 seconds

### Option B: GitHub (recommended for ongoing use)
1. Push this folder to a GitHub repo
2. Connect repo to Netlify (Build command: none, Publish dir: `/`)
3. Every `git push` auto-deploys

### Custom Domain
- Free `.netlify.app` subdomain included
- Connect your own domain in Netlify DNS settings (free)

---

## Adding Backend / API Keys (Serverless Functions)

When you need server-side logic or want to securely proxy API keys:

1. Create `netlify/functions/my-function.js`:
```js
exports.handler = async (event) => {
  const apiKey = process.env.MY_SECRET_KEY;  // set in Netlify dashboard
  // ... call external API ...
  return { statusCode: 200, body: JSON.stringify(result) };
};
```

2. Set env vars in **Netlify → Site Settings → Environment Variables**
3. Call from frontend: `fetch('/.netlify/functions/my-function')`

API keys NEVER appear in your frontend code.

---

## Local Development

See [DEV.md](DEV.md) for the full local dev setup. Short version:

```bash
netlify link      # one-time: link to the Netlify project (pulls env vars automatically)
bash dev.sh       # every session: builds + serves at http://localhost:8888
```

> **OAuth note (future):** When the auth system is extended to support localhost,
> add `http://localhost:8888/.netlify/edge-functions/auth-callback` as an
> authorized redirect URI in the Google Cloud Console OAuth client settings.

---

## Planned Tools (Ideas)

### Digital Tools
- [ ] Color space converter (HEX, RGB, HSL, HSB, CMYK)

### Bronze Foundry
- [ ] Alloy melt charge calculator (ingot + remelt)
- [ ] Investment ratio mixer (silica:plaster)
- [ ] Shrinkage allowance calculator
- [ ] Burnout schedule reference

### Finish Carpentry
- [ ] Crown molding angle calculator
- [ ] Stair stringer calculator
- [ ] Material cost estimator with waste factor
- [ ] Dovetail spacing calculator

### Revit & BIM
- [ ] Scale bar generator
- [ ] Grid spacing calculator
- [ ] Room area/perimeter checker
- [ ] Sheet size reference