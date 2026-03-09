/**
 * TOOL REGISTRY
 * =============
 * This is the single place to register all tools.
 * To add a new tool:
 *   1. Create a new file in /tools/your-tool.html
 *   2. Add an entry to TOOLS below
 *   3. That's it — it will appear in nav, search, and homepage automatically.
 */

const CATEGORIES = {
  DIGITAL:  { id: 'digital',  label: 'Digital Tools',  icon: '◈' },
  FOUNDRY:  { id: 'foundry',  label: 'Bronze Foundry', icon: '⬟' },
  GENERAL:  { id: 'general',  label: 'General',        icon: '◇' },
};

const TOOLS = [
  // ── DIGITAL TOOLS ─────────────────────────────────────────────────────────
  {
    id: 'color-converter',
    label: 'Color Space Converter',
    description: 'Convert between HEX, RGB, HSL, HSB, and CMYK color spaces.',
    category: CATEGORIES.DIGITAL,
    path: 'tools/color-converter.html',
    tags: ['color', 'hex', 'rgb', 'hsl', 'cmyk', 'design'],
    featured: false,
  },

  // ── BRONZE FOUNDRY ────────────────────────────────────────────────────────
  {
    id: 'flask-investment',
    label: 'Flask Investment Calculator',
    description: 'Calculate investment powder and water for flask casting. Set kiln time and get mix start and bronze pour times.',
    category: CATEGORIES.FOUNDRY,
    path: 'tools/flask-investment.html',
    tags: ['investment', 'flask', 'casting', 'burnout', 'kiln', 'prestige', 'optima', 'schedule'],
    featured: true,
  },
  {
    id: 'pour-weight',
    label: 'Pour Weight Estimator',
    description: 'Estimate bronze pour weight from wax weight using alloy ratios.',
    category: CATEGORIES.FOUNDRY,
    path: 'tools/pour-weight.html',
    tags: ['bronze', 'casting', 'weight', 'alloy'],
    featured: true,
  },

  // ── GENERAL ───────────────────────────────────────────────────────────────
  {
    id: 'ledger',
    label: 'Ledger',
    description: 'Time tracking and invoice prep. Log work entries by client, generate invoice text, and mark as invoiced.',
    category: CATEGORIES.GENERAL,
    path: 'tools/ledger.html',
    tags: ['time', 'invoice', 'billing', 'hours', 'client', 'work'],
    featured: true,
  },
  {
    id: 'folder-structure',
    label: 'Folder Structure Generator',
    description: 'Build a project folder structure with drag-to-reorder, presets, and .bat download.',
    category: CATEGORIES.GENERAL,
    path: 'tools/folder-structure.html',
    tags: ['folders', 'project', 'setup', 'structure', 'organize'],
    featured: true,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFeaturedTools() {
  const saved = getFavorites();
  const featured = TOOLS.filter(t => t.featured);
  const favorites = TOOLS.filter(t => saved.includes(t.id) && !t.featured);
  return [...favorites, ...featured];
}

function getToolsByCategory(categoryId) {
  return TOOLS.filter(t => t.category.id === categoryId);
}

function searchTools(query) {
  const q = query.toLowerCase();
  return TOOLS.filter(t =>
    t.label.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.includes(q))
  );
}

// ── Favorites (localStorage) ─────────────────────────────────────────────────

function getFavorites() {
  try { return JSON.parse(localStorage.getItem('st_favorites') || '[]'); }
  catch { return []; }
}

function toggleFavorite(toolId) {
  const favs = getFavorites();
  const idx = favs.indexOf(toolId);
  if (idx === -1) favs.push(toolId); else favs.splice(idx, 1);
  localStorage.setItem('st_favorites', JSON.stringify(favs));
  return favs.includes(toolId);
}

function isFavorite(toolId) {
  return getFavorites().includes(toolId);
}