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
  DIGITAL:    { id: 'digital',    label: 'Digital Tools',      icon: '◈' },
  FOUNDRY:    { id: 'foundry',    label: 'Bronze Foundry',     icon: '⬟' },
  CARPENTRY:  { id: 'carpentry',  label: 'Finish Carpentry',   icon: '⬧' },
  REVIT:      { id: 'revit',      label: 'Revit & BIM',        icon: '⬨' },
  GENERAL:    { id: 'general',    label: 'General',            icon: '◇' },
};

const TOOLS = [
  // ── DIGITAL TOOLS ─────────────────────────────────────────────────────────
  {
    id: 'aspect-ratio',
    label: 'Aspect Ratio Calculator',
    description: 'Calculate and convert between common video/image aspect ratios.',
    category: CATEGORIES.DIGITAL,
    path: 'tools/aspect-ratio.html',
    tags: ['video', 'resolution', 'dimensions'],
    featured: true,
  },
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
    id: 'pour-weight',
    label: 'Pour Weight Estimator',
    description: 'Estimate bronze pour weight from wax weight using alloy ratios.',
    category: CATEGORIES.FOUNDRY,
    path: 'tools/pour-weight.html',
    tags: ['bronze', 'casting', 'weight', 'alloy'],
    featured: true,
  },

  // ── FINISH CARPENTRY ──────────────────────────────────────────────────────
  {
    id: 'board-foot',
    label: 'Board Foot Calculator',
    description: 'Calculate board feet from dimensions for lumber purchasing.',
    category: CATEGORIES.CARPENTRY,
    path: 'tools/board-foot.html',
    tags: ['lumber', 'wood', 'material'],
    featured: true,
  },
  {
    id: 'miter-angle',
    label: 'Miter Angle Calculator',
    description: 'Calculate miter and bevel angles for polygons and compound cuts.',
    category: CATEGORIES.CARPENTRY,
    path: 'tools/miter-angle.html',
    tags: ['angle', 'miter', 'crown', 'saw'],
    featured: false,
  },

  // ── GENERAL ───────────────────────────────────────────────────────────────
  {
    id: 'folder-structure',
    label: 'Folder Structure Generator',
    description: 'Build a project folder structure with drag-to-reorder, presets, and .bat download.',
    category: CATEGORIES.GENERAL,
    path: 'tools/folder-structure.html',
    tags: ['folders', 'project', 'setup', 'structure', 'organize'],
    featured: true,
  },

  // ── REVIT & BIM ───────────────────────────────────────────────────────────
  {
    id: 'unit-converter',
    label: 'Architectural Unit Converter',
    description: "Convert between feet-inches, decimal feet, mm, and meters.",
    category: CATEGORIES.REVIT,
    path: 'tools/unit-converter.html',
    tags: ['units', 'conversion', 'imperial', 'metric'],
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