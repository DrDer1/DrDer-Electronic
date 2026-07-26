/* ==========================================================================
   DrDer Electronic - Simulator Component Library UI
   Manages the component library panel with search and categories
   ========================================================================== */
(function () {
  'use strict';

  window.SimLibrary = {
    _container: null,
    _searchInput: null,
    _onComponentSelect: null,
    _allItems: [],

    /* ========================================================================
       Initialize
       ======================================================================== */
    init() {
      this._container = document.getElementById('simLibraryScroll');
      this._searchInput = document.getElementById('simLibrarySearch');
      this._buildFlatList();
      this._renderCategories();
      this._setupEvents();
    },

    /* ========================================================================
       Build flat list for search
       ======================================================================== */
    _buildFlatList() {
      this._allItems = [];
      Object.entries(window.SIM_COMPONENTS).forEach(([catKey, cat]) => {
        cat.items.forEach(item => {
          this._allItems.push({ ...item, category: catKey, categoryName: cat.name });
        });
      });
    },

    /* ========================================================================
       Render all categories
       ======================================================================== */
    _renderCategories() {
      if (!this._container) return;

      let html = '';

      Object.entries(window.SIM_COMPONENTS).forEach(([catKey, cat]) => {
        html += `
          <div class="sim-category" data-category="${catKey}">
            <div class="sim-cat-header" data-cat="${catKey}">
              <span>${cat.icon} ${cat.name}</span>
              <span class="sim-cat-arrow">▼</span>
            </div>
            <div class="sim-cat-items" id="simCatItems-${catKey}">
        `;

        cat.items.forEach(item => {
          html += `
            <button class="sim-lib-item" data-comp="${item.id}" title="${item.name}" draggable="true">
              <span class="sim-lib-icon">${item.icon}</span>
              <span class="sim-lib-name">${item.name}</span>
            </button>
          `;
        });

        html += `</div></div>`;
      });

      this._container.innerHTML = html;
    },

    /* ========================================================================
       Setup events
       ======================================================================== */
    _setupEvents() {
      if (!this._container) return;

      // Category toggle
      this._container.addEventListener('click', (e) => {
        const header = e.target.closest('.sim-cat-header');
        if (header) {
          const catKey = header.dataset.cat;
          const items = document.getElementById(`simCatItems-${catKey}`);
          const arrow = header.querySelector('.sim-cat-arrow');

          if (items) {
            const isOpen = items.style.display !== 'none';
            items.style.display = isOpen ? 'none' : '';
            if (arrow) arrow.textContent = isOpen ? '▶' : '▼';
          }
          return;
        }

        const item = e.target.closest('.sim-lib-item');
        if (item) {
          const compId = item.dataset.comp;
          if (compId && this._onComponentSelect) {
            this._onComponentSelect(compId);
          }
          return;
        }
      });

      // Search
      if (this._searchInput) {
        this._searchInput.addEventListener('input', (e) => {
          this._search(e.target.value);
        });
      }

      // Drag start
      this._container.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.sim-lib-item');
        if (item && item.dataset.comp) {
          e.dataTransfer.setData('text/plain', item.dataset.comp);
          e.dataTransfer.effectAllowed = 'copy';
        }
      });
    },

    /* ========================================================================
       Search components
       ======================================================================== */
    _search(query) {
      const q = query.toLowerCase().trim();

      if (q === '') {
        this._renderCategories();
        return;
      }

      const results = this._allItems.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.subtype && item.subtype.toLowerCase().includes(q))
      );

      let html = `<div class="sim-category">
        <div class="sim-cat-header">
          <span>🔍 نتائج البحث (${results.length})</span>
        </div>
        <div class="sim-cat-items">`;

      if (results.length === 0) {
        html += `<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:0.75rem;">لا توجد نتائج</div>`;
      } else {
        results.forEach(item => {
          html += `
            <button class="sim-lib-item" data-comp="${item.id}" title="${item.name}" draggable="true">
              <span class="sim-lib-icon">${item.icon}</span>
              <span class="sim-lib-name">${item.name}</span>
            </button>
          `;
        });
      }

      html += `</div></div>`;
      this._container.innerHTML = html;
    },

    /* ========================================================================
       Callback when component selected
       ======================================================================== */
    onComponentSelect(cb) {
      this._onComponentSelect = cb;
    }
  };
})();
