/* ==========================================================================
   DrDer Electronic - Simulator Library v4.1
   Fixed: Component search and category toggle
   ========================================================================== */
(function () {
  'use strict';

  window.SimLibrary = {
    _container: null,
    _searchInput: null,
    _onComponentSelect: null,
    _allItems: [],

    init: function () {
      this._container = document.getElementById('simLibraryScroll');
      this._searchInput = document.getElementById('simLibrarySearch');
      this._buildFlatList();
      this._setupEvents();
    },

    _buildFlatList: function () {
      this._allItems = [];
      var categories = window.SIM_COMPONENTS;
      for (var catKey in categories) {
        if (!categories.hasOwnProperty(catKey)) continue;
        var cat = categories[catKey];
        if (!cat || !cat.items) continue;
        for (var i = 0; i < cat.items.length; i++) {
          var item = cat.items[i];
          this._allItems.push({
            id: item.id,
            name: item.name,
            icon: item.icon,
            type: item.type,
            subtype: item.subtype,
            category: catKey,
            categoryName: cat.name
          });
        }
      }
    },

    _setupEvents: function () {
      var self = this;
      var container = this._container;
      var searchInput = this._searchInput;

      if (container) {
        container.addEventListener('click', function (e) {
          var header = e.target.closest('.sim-cat-header');
          if (header) {
            var catKey = header.getAttribute('data-cat');
            var items = document.getElementById('simCatItems-' + catKey);
            var arrow = header.querySelector('.sim-cat-arrow');
            if (items) {
              if (items.style.display === 'none') {
                items.style.display = '';
                if (arrow) arrow.textContent = '▼';
              } else {
                items.style.display = 'none';
                if (arrow) arrow.textContent = '▶';
              }
            }
            return;
          }

          var item = e.target.closest('.sim-lib-item');
          if (item) {
            var compId = item.getAttribute('data-comp');
            if (compId && self._onComponentSelect) {
              self._onComponentSelect(compId);
            }
            return;
          }
        });

        container.addEventListener('dragstart', function (e) {
          var item = e.target.closest('.sim-lib-item');
          if (item) {
            var compId = item.getAttribute('data-comp');
            if (compId) {
              e.dataTransfer.setData('text/plain', compId);
              e.dataTransfer.effectAllowed = 'copy';
            }
          }
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', function () {
          self._search(this.value);
        });
      }
    },

    _search: function (query) {
      var q = query.toLowerCase().trim();
      if (q === '') {
        this._showAll();
        return;
      }

      var results = [];
      for (var i = 0; i < this._allItems.length; i++) {
        var item = this._allItems[i];
        if (item.name.toLowerCase().indexOf(q) !== -1 ||
            item.categoryName.toLowerCase().indexOf(q) !== -1 ||
            item.type.toLowerCase().indexOf(q) !== -1) {
          results.push(item);
        }
      }

      var allItems = document.querySelectorAll('.sim-lib-item');
      for (var j = 0; j < allItems.length; j++) {
        var el = allItems[j];
        var compId = el.getAttribute('data-comp');
        var found = false;
        for (var k = 0; k < results.length; k++) {
          if (results[k].id === compId) {
            found = true;
            break;
          }
        }
        el.style.display = found ? '' : 'none';
      }

      var categories = document.querySelectorAll('.sim-category');
      for (var c = 0; c < categories.length; c++) {
        var cat = categories[c];
        var visibleItems = cat.querySelectorAll('.sim-lib-item[style*="display: none"]');
        var totalItems = cat.querySelectorAll('.sim-lib-item');
        if (totalItems.length > 0 && visibleItems.length === totalItems.length) {
          cat.style.display = 'none';
        } else {
          cat.style.display = '';
        }
      }
    },

    _showAll: function () {
      var allItems = document.querySelectorAll('.sim-lib-item');
      for (var i = 0; i < allItems.length; i++) {
        allItems[i].style.display = '';
      }
      var categories = document.querySelectorAll('.sim-category');
      for (var j = 0; j < categories.length; j++) {
        categories[j].style.display = '';
      }
    },

    onComponentSelect: function (cb) {
      this._onComponentSelect = cb;
    }
  };
})();
