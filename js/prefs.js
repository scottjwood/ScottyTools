/**
 * prefs.js — Synced preferences via Google Drive
 * ═══════════════════════════════════════════════════════════════
 * Transparently wraps localStorage with Google Drive persistence.
 * On load: fetches scottytools-prefs.json from Drive, hydrates localStorage.
 * On write: debounces and pushes updated prefs back to Drive.
 *
 * Keys synced:
 *   st_favorites       — user-starred tool ids
 *   st_unpinned        — registry-featured tools manually unpinned
 *   st_order_pinned    — drag order for pinned grid
 *   st_order_all       — drag order for all-tools grid
 *   tasks_active_lists — selected task list ids
 *
 * Usage:
 *   Prefs.init()              — call once after Auth.onReady
 *   Prefs.onLoaded(fn)        — fn() called when prefs are ready to use
 *   Prefs.save()              — manually trigger a Drive save (debounced)
 */

const Prefs = (() => {

  const FILENAME    = 'scottytools-prefs.json';
  const SYNCED_KEYS = [
    'st_favorites',
    'st_unpinned',
    'st_order_pinned',
    'st_order_all',
    'tasks_active_lists',
  ];

  let _fileId       = null;
  let _saveTimer    = null;
  let _loadedCbs    = [];
  let _loaded       = false;
  let _saving       = false;

  // ── Drive API helpers ─────────────────────────────────────────────────────

  function token() { return Auth.getToken(); }

  async function driveRequest(url, opts = {}) {
    const t = token();
    if (!t) throw new Error('Not authenticated');
    const res = await fetch(url, {
      ...opts,
      headers: { 'Authorization': 'Bearer ' + t, ...(opts.headers || {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Drive API error ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  }

  // Search for existing prefs file
  async function findFile() {
    const q = encodeURIComponent(`name='${FILENAME}' and trashed=false and mimeType='application/json'`);
    const data = await driveRequest(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&spaces=drive`
    );
    return data.files?.[0]?.id || null;
  }

  // Read file content
  async function readFile(fileId) {
    const data = await driveRequest(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    );
    return data; // already parsed JSON
  }

  // Create new file
  async function createFile(content) {
    const meta = new Blob(
      [JSON.stringify({ name: FILENAME, mimeType: 'application/json' })],
      { type: 'application/json' }
    );
    const body = new Blob([JSON.stringify(content)], { type: 'application/json' });
    const form = new FormData();
    form.append('metadata', meta);
    form.append('file', body);

    const t = token();
    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      { method: 'POST', headers: { 'Authorization': 'Bearer ' + t }, body: form }
    );
    const data = await res.json();
    return data.id;
  }

  // Update existing file
  async function updateFile(fileId, content) {
    const t = token();
    await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + t,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      }
    );
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load() {
    try {
      _fileId = await findFile();

      if (_fileId) {
        const prefs = await readFile(_fileId);
        if (prefs && typeof prefs === 'object') {
          // Hydrate localStorage with Drive values
          SYNCED_KEYS.forEach(key => {
            if (prefs[key] !== undefined) {
              localStorage.setItem(key, JSON.stringify(prefs[key]));
            }
          });
          console.log('[Prefs] Loaded from Drive');
        }
      } else {
        // No file yet — push current localStorage up as initial save
        console.log('[Prefs] No Drive file found, will create on first save');
        await pushToDrive();
      }
    } catch (e) {
      console.warn('[Prefs] Load failed (using local):', e.message);
    }

    _loaded = true;
    const cbs = _loadedCbs;
    _loadedCbs = [];
    cbs.forEach(fn => fn());
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function buildPrefsObject() {
    const prefs = {};
    SYNCED_KEYS.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        prefs[key] = raw ? JSON.parse(raw) : null;
      } catch {
        prefs[key] = null;
      }
    });
    prefs._savedAt = new Date().toISOString();
    return prefs;
  }

  async function pushToDrive() {
    if (_saving) return;
    _saving = true;
    try {
      const prefs = buildPrefsObject();
      if (_fileId) {
        await updateFile(_fileId, prefs);
      } else {
        _fileId = await createFile(prefs);
      }
      console.log('[Prefs] Saved to Drive');
    } catch (e) {
      console.warn('[Prefs] Save failed:', e.message);
    }
    _saving = false;
  }

  // Debounced public save — batches rapid changes (e.g. drag reorder)
  function save() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(pushToDrive, 1200);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init() {
    Auth.onReady(user => {
      if (user) {
        load();
      } else {
        // Not signed in — mark loaded so page doesn't hang
        _loaded = true;
        const cbs = _loadedCbs;
        _loadedCbs = [];
        cbs.forEach(fn => fn());
      }
    });
  }

  function onLoaded(fn) {
    if (_loaded) { fn(); return; }
    _loadedCbs.push(fn);
  }

  return { init, onLoaded, save };

})();
