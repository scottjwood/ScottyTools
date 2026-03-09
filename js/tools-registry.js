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
  FOUNDRY:  { id: 'foundry',  label: 'Foundry', icon: '⬟' },
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

  // ── GENERAL ───────────────────────────────────────────────────────────────
  {
    id: 'unit-converter',
    label: 'Unit Converter',
    description: 'Convert length, weight, volume, temperature, and area. Imperial, metric, and troy units. Type a value to see all conversions at once.',
    category: CATEGORIES.GENERAL,
    path: 'tools/unit-converter.html',
    tags: ['unit', 'convert', 'length', 'weight', 'volume', 'temperature', 'area', 'metric', 'imperial', 'troy'],
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
  // A tool is pinned if:
  //   - it has featured:true in the registry AND hasn't been manually unpinned, OR
  //   - it was manually starred by the user
  const unpinned = getUnpinned();
  return TOOLS.filter(t =>
    (t.featured && !unpinned.includes(t.id)) || saved.includes(t.id)
  );
}

function getUnpinned() {
  try { return JSON.parse(localStorage.getItem('st_unpinned') || '[]'); }
  catch { return []; }
}

function toggleUnpinned(toolId, forceUnpin) {
  const list = getUnpinned();
  const idx  = list.indexOf(toolId);
  if (forceUnpin && idx === -1) list.push(toolId);
  else if (!forceUnpin && idx !== -1) list.splice(idx, 1);
  localStorage.setItem('st_unpinned', JSON.stringify(list));
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
  const tool = TOOLS.find(t => t.id === toolId);
  if (tool && tool.featured) {
    // For registry-featured tools: toggle between pinned and unpinned
    const unpinned = getUnpinned();
    const isCurrentlyUnpinned = unpinned.includes(toolId);
    toggleUnpinned(toolId, !isCurrentlyUnpinned);
    return isCurrentlyUnpinned; // returns true = now pinned
  } else {
    // For non-featured tools: toggle user favorites
    const favs = getFavorites();
    const idx = favs.indexOf(toolId);
    if (idx === -1) favs.push(toolId); else favs.splice(idx, 1);
    localStorage.setItem('st_favorites', JSON.stringify(favs));
    return favs.includes(toolId);
  }
}

function isFavorite(toolId) {
  const tool = TOOLS.find(t => t.id === toolId);
  if (tool && tool.featured) {
    return !getUnpinned().includes(toolId); // featured = pinned unless unpinned
  }
  return getFavorites().includes(toolId);
}