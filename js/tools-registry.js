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

// ── Tool icons (SVG path data, 24x24 viewBox, stroke-based) ─────────────────
const TOOL_ICONS = {
  'unit-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3l-5 5 5 5"/><path d="M3 8h13a5 5 0 0 1 0 10h-1"/><path d="M16 21l5-5-5-5"/></svg>`,
  'color-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 9 9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3"/></svg>`,
  'flask-investment': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6m-5 0v6l-4 9a1 1 0 0 0 .9 1.5h10.2a1 1 0 0 0 .9-1.5l-4-9V3"/><path d="M6.5 14.5h11"/></svg>`,
  'pour-weight': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l3 6H9l3-6z"/><rect x="7" y="9" width="10" height="6" rx="1"/><path d="M10 15v5m4-5v5m-6 0h8"/><path d="M17 12h2a1 1 0 0 1 1 1v1"/></svg>`,
  'ledger': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/><path d="M13 13h4m-4 4h4"/></svg>`,
  'folder-structure': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 13l2 2 4-4"/></svg>`,
  'tip-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  'tig-reference': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19c0-4 2-7 2-7H10s2 3 2 7z"/><path d="M12 5v3"/><circle cx="12" cy="4" r="1"/><path d="M9 12c-2 1-4 3-4 5"/><path d="M15 12c2 1 4 3 4 5"/></svg>`,
  'tasks': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
};

function getToolIcon(id) {
  return TOOL_ICONS[id] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/></svg>`;
}

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

  {
    id: 'tip-calculator',
    label: 'Tip Calculator',
    description: 'Calculate tip and split the bill between people. Quick preset percentages — 15, 18, 20, 25% — with optional round up.',
    category: CATEGORIES.GENERAL,
    path: 'tools/tip-calculator.html',
    tags: ['tip', 'bill', 'split', 'restaurant', 'calculator', 'dining'],
    featured: false,
  },

  {
    id: 'tasks',
    label: 'Google Tasks',
    description: 'View, add, complete and delete tasks across your Google Task lists. Pick which lists to show.',
    category: CATEGORIES.GENERAL,
    path: 'tools/tasks.html',
    tags: ['tasks', 'google', 'todo', 'checklist', 'productivity'],
    featured: true,
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
  {
    id: 'tig-reference',
    label: 'TIG Reference',
    description: 'Dial-in settings for the PrimeWeld 225. Amps, balance, frequency, tungsten, filler rod, and cup by material and thickness.',
    category: CATEGORIES.FOUNDRY,
    path: 'tools/tig-reference.html',
    tags: ['tig', 'welding', 'aluminum', 'bronze', 'steel', 'stainless', 'amps', 'tungsten', 'filler'],
    featured: false,
  },

  // ── GENERAL (continued) ───────────────────────────────────────────────────
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
  if (typeof Prefs !== 'undefined') Prefs.save();
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
    const unpinned = getUnpinned();
    const isCurrentlyUnpinned = unpinned.includes(toolId);
    toggleUnpinned(toolId, !isCurrentlyUnpinned);
    return isCurrentlyUnpinned;
  } else {
    const favs = getFavorites();
    const idx = favs.indexOf(toolId);
    if (idx === -1) favs.push(toolId); else favs.splice(idx, 1);
    localStorage.setItem('st_favorites', JSON.stringify(favs));
    if (typeof Prefs !== 'undefined') Prefs.save();
    return favs.includes(toolId);
  }
}

function isFavorite(toolId) {
  const tool = TOOLS.find(t => t.id === toolId);
  if (tool && tool.featured) {
    return !getUnpinned().includes(toolId);
  }
  return getFavorites().includes(toolId);
}

// ── Card order (localStorage) ─────────────────────────────────────────────────

function getOrder(gridKey) {
  try { return JSON.parse(localStorage.getItem('st_order_' + gridKey) || '[]'); }
  catch { return []; }
}

function saveOrder(gridKey, ids) {
  localStorage.setItem('st_order_' + gridKey, JSON.stringify(ids));
  if (typeof Prefs !== 'undefined') Prefs.save();
}

function applyOrder(tools, gridKey) {
  const order = getOrder(gridKey);
  if (!order.length) return tools;
  const ordered = [];
  order.forEach(id => { const t = tools.find(t => t.id === id); if (t) ordered.push(t); });
  tools.forEach(t => { if (!order.includes(t.id)) ordered.push(t); });
  return ordered;
}