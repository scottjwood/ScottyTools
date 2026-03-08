/**
 * nav.js — Shared navigation component
 * Inject into any page with: Nav.init()
 */
const Nav = (() => {

  function render(activePage = 'home') {
    return `
      <nav class="nav">
        <a href="../index.html" class="nav-brand">
          <div class="mark">
            <svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 0L14 4V10L7 14L0 10V4L7 0Z"/>
            </svg>
          </div>
          ScottyTools
        </a>
        <div class="nav-search">
          <span class="search-icon">⌕</span>
          <input type="text" placeholder="Search tools..." id="navSearch" autocomplete="off" />
          <div class="search-results" id="searchResults"></div>
        </div>
        <a href="../index.html" class="nav-home-btn">All Tools</a>
      </nav>`;
  }

  function renderForIndex() {
    return `
      <nav class="nav">
        <a href="index.html" class="nav-brand">
          <div class="mark">
            <svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 0L14 4V10L7 14L0 10V4L7 0Z"/>
            </svg>
          </div>
          ScottyTools
        </a>
        <div class="nav-search">
          <span class="search-icon">⌕</span>
          <input type="text" placeholder="Search tools..." id="navSearch" autocomplete="off" />
          <div class="search-results" id="searchResults"></div>
        </div>
      </nav>`;
  }

  function initSearch(isIndex = false) {
    const input = document.getElementById('navSearch');
    const results = document.getElementById('searchResults');
    if (!input || !results) return;

    const prefix = isIndex ? '' : '../';

    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (q.length < 2) { results.classList.remove('visible'); return; }

      const found = searchTools(q);
      if (!found.length) {
        results.innerHTML = `<div class="search-result-item"><div class="desc">No tools found for "${q}"</div></div>`;
      } else {
        results.innerHTML = found.map(t => `
          <div class="search-result-item" onclick="location.href='${prefix}${t.path}'">
            <span class="cat-dot dot" data-cat="${t.category.id}"></span>
            <div>
              <div class="label">${t.label}</div>
              <div class="desc">${t.description}</div>
            </div>
          </div>`).join('');
      }
      results.classList.add('visible');
    });

    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !results.contains(e.target)) {
        results.classList.remove('visible');
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { results.classList.remove('visible'); input.value = ''; }
    });
  }

  function init(isIndex = false) {
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) {
      placeholder.outerHTML = isIndex ? renderForIndex() : render();
    }
    initSearch(isIndex);
  }

  return { init, render, renderForIndex };
})();
