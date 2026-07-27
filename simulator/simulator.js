/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator.js - Main Entry Point
   
   Responsibility:
   - Generate the simulator HTML
   - Initialize all modules in correct order
   - Connect modules together
   - No drag logic, no wire logic, no simulation logic
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     Public API - Called by app.js
     ====================================================================== */

  /**
   * Generate the complete simulator HTML
   * Called by app.js when navigating to simulator page
   * @returns {string} HTML string
   */
  window.getSimulatorHTML = function () {
    var libraryHTML = '';
    var categories = window.SIM_COMPONENTS;

    // Build library HTML from component categories
    for (var catKey in categories) {
      if (!Object.prototype.hasOwnProperty.call(categories, catKey)) continue;
      var cat = categories[catKey];
      if (!cat || !cat.items) continue;

      libraryHTML += '<div class="sim-category" data-category="' + catKey + '">';
      libraryHTML += '<div class="sim-cat-header" data-cat="' + catKey + '">';
      libraryHTML += '<span>' + cat.icon + ' ' + cat.name + '</span>';
      libraryHTML += '<span class="sim-cat-arrow">▼</span>';
      libraryHTML += '</div>';
      libraryHTML += '<div class="sim-cat-items" id="simCatItems-' + catKey + '">';

      for (var i = 0; i < cat.items.length; i++) {
        var item = cat.items[i];
        libraryHTML += '<button class="sim-lib-item" data-comp="' + item.id + '" title="' + item.name + '" draggable="true">';
        libraryHTML += '<span class="sim-lib-icon">' + item.icon + '</span>';
        libraryHTML += '<span class="sim-lib-name">' + item.name + '</span>';
        libraryHTML += '</button>';
      }

      libraryHTML += '</div></div>';
    }

    return '<div class="sim-full-container">' +

      /* ========== Left Panel - Library ========== */
      '<aside class="sim-panel-left" id="simToolbox">' +
        '<div class="sim-panel-header"><h3>📦 مكتبة العناصر</h3></div>' +
        '<input type="search" class="sim-search-input" id="simLibrarySearch" placeholder="🔍 بحث عن عنصر..." autocomplete="off">' +
        '<div class="sim-library-scroll" id="simLibraryScroll">' + libraryHTML + '</div>' +
      '</aside>' +

      /* ========== Main Area ========== */
      '<div class="sim-main-area">' +

        /* ===== Toolbar ===== */
        '<div class="sim-toolbar">' +
          '<div class="sim-toolbar-group">' +
            '<button class="sim-tb-btn" id="simBtnUndo" title="تراجع Ctrl+Z" disabled>↩</button>' +
            '<button class="sim-tb-btn" id="simBtnRedo" title="إعادة Ctrl+Y" disabled>↪</button>' +
            '<span class="sim-toolbar-sep"></span>' +
            '<button class="sim-tb-btn" id="simBtnDelete" title="حذف Del">🗑️</button>' +
            '<span class="sim-toolbar-sep"></span>' +
            '<button class="sim-tb-btn" id="simBtnZoomIn" title="تكبير">🔍+</button>' +
            '<button class="sim-tb-btn" id="simBtnZoomOut" title="تصغير">🔍-</button>' +
            '<button class="sim-tb-btn" id="simBtnZoomFit" title="ملائمة">🔲</button>' +
            '<span class="sim-toolbar-sep"></span>' +
            '<button class="sim-tb-btn active" id="simBtnSnap" title="التصاق الشبكة">📏</button>' +
            '<button class="sim-tb-btn" id="simBtnGridSize" title="حجم الشبكة">20px</button>' +
          '</div>' +
          '<div class="sim-toolbar-group">' +
            '<button class="sim-tb-btn sim-tb-success" id="simBtnRun" title="تشغيل المحاكاة">▶️</button>' +
            '<button class="sim-tb-btn sim-tb-danger" id="simBtnStop" title="إيقاف المحاكاة">⏹️</button>' +
            '<button class="sim-tb-btn sim-tb-warning" id="simBtnValidate" title="تحقق من الدائرة">✅</button>' +
          '</div>' +
          '<div class="sim-toolbar-group">' +
            '<button class="sim-tb-btn" id="simBtnSave" title="حفظ المشروع">💾</button>' +
            '<button class="sim-tb-btn" id="simBtnLoad" title="تحميل مشروع">📂</button>' +
            '<button class="sim-tb-btn" id="simBtnExport" title="تصدير JSON">📥</button>' +
            '<button class="sim-tb-btn" id="simBtnImport" title="استيراد JSON">📤</button>' +
            '<span class="sim-toolbar-sep"></span>' +
            '<button class="sim-tb-btn" id="simBtnProps" title="خصائص">📋</button>' +
            '<button class="sim-tb-btn sim-tb-danger" id="simBtnClearAll" title="مسح الكل">🗑️</button>' +
          '</div>' +
        '</div>' +

        /* ===== Canvas ===== */
        '<div class="sim-canvas-container">' +
          '<div class="sim-canvas-area" id="simCanvas" tabindex="0">' +
            '<svg class="sim-grid-svg" id="canvasGridSvg">' +
              '<defs>' +
                '<pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">' +
                  '<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#30363d" stroke-width="0.5" opacity="0.2"/>' +
                  '<path d="M 100 0 L 0 0 0 100" fill="none" stroke="#30363d" stroke-width="1" opacity="0.4"/>' +
                '</pattern>' +
              '</defs>' +
              '<rect width="100%" height="100%" fill="url(#gridPattern)"/>' +
            '</svg>' +
            '<div class="canvas-placeholder" id="canvasPlaceholder">' +
              '<div>' +
                '<span style="font-size:3rem;opacity:0.4;display:block;">🔧</span>' +
                '<span style="font-size:0.95rem;">اسحب العناصر من المكتبة أو انقر عليها للإضافة</span>' +
                '<br><span style="font-size:0.72rem;opacity:0.5;">زر الفأرة الأوسط للسحب | العجلة للتكبير | Ctrl+Z للتراجع</span>' +
              '</div>' +
            '</div>' +
            '<svg class="sim-wires-svg" id="canvasWiresSvg"></svg>' +
          '</div>' +
        '</div>' +

        /* ===== Status Bar ===== */
        '<div class="sim-statusbar">' +
          '<span class="sim-status-item" id="simStatusZoom">تكبير: 100%</span>' +
          '<span class="sim-status-item" id="simStatusComponents">العناصر: 0</span>' +
          '<span class="sim-status-item" id="simStatusConnections">التوصيلات: 0</span>' +
          '<span class="sim-status-item" id="simStatusPosition">x: 0, y: 0</span>' +
          '<span class="sim-status-item" id="simStatusGrid">شبكة: 20px</span>' +
          '<span class="sim-status-item" id="simStatusSnap">✅ التصاق</span>' +
        '</div>' +

        /* ===== Feedback ===== */
        '<div class="sim-feedback-msg" id="simFeedbackMsg" style="display:none;"></div>' +
      '</div>' +

      /* ========== Right Panel - Properties ========== */
      '<aside class="sim-panel-right" id="simProperties" style="display:none;">' +
        '<div class="sim-panel-header">' +
          '<h3>📋 خصائص العنصر</h3>' +
          '<button class="btn-icon-sm" id="btnCloseProperties" title="إغلاق">✕</button>' +
        '</div>' +
        '<div class="sim-props-content" id="propertiesContent">' +
          '<p class="sim-props-empty">اختر عنصراً لعرض خصائصه</p>' +
        '</div>' +
      '</aside>' +
    '</div>';
  };

  /**
   * Initialize the simulator
   * Called by app.js after HTML is injected into the DOM
   */
  window.initSimulator = function () {
    console.log('Simulator 2.0 initializing...');

    // Step 1: Reset state
    if (window.SimState) {
      window.SimState.reset();
      console.log('[1/9] State initialized');
    } else {
      console.error('SimState not loaded');
      return;
    }

    // Step 2: Initialize canvas (zoom, pan, grid)
    if (window.SimCanvas) {
      window.SimCanvas.init('simCanvas');
      console.log('[2/9] Canvas initialized');
    }

    // Step 3: Initialize selection
    if (window.SimSelection) {
      window.SimSelection.init();
      console.log('[3/9] Selection initialized');
    }

    // Step 4: Initialize wires
    if (window.SimWires) {
      window.SimWires.init();
      console.log('[4/9] Wires initialized');
    }

    // Step 5: Initialize properties
    if (window.SimProperties) {
      window.SimProperties.init();
      console.log('[5/9] Properties initialized');
    }

    // Step 6: Initialize history
    if (window.SimHistory) {
      window.SimHistory.init();
      console.log('[6/9] History initialized');
    }

    // Step 7: Setup library (click handlers, search)
    setupLibrary();

    // Step 8: Setup toolbar buttons
    setupToolbar();

    // Step 9: Initialize events LAST (after all modules ready)
    if (window.SimEvents) {
      window.SimEvents.init('simCanvas');
      console.log('[7/9] Events initialized');
    }

    // Setup properties callback
    if (window.SimProperties) {
      window.SimProperties.onPropertyChanged(function (component, property, value) {
        if (property === 'delete') {
          if (window.SimHistory) {
            window.SimHistory.push(window.SimState.getSnapshot());
          }
          deleteComponent(component.id);
          window.SimProperties.hide();
        } else if (property === 'x' || property === 'y') {
          if (window.SimWires) {
            window.SimWires.drawAllWires(window.SimState ? window.SimState.simulationActive : false);
          }
        }
      });
    }

    // Update status bar
    updateCounts();

    console.log('Simulator 2.0 initialized successfully ✅');
  };

  /* ======================================================================
     Library Setup
     ====================================================================== */

  function setupLibrary() {
    var scroll = document.getElementById('simLibraryScroll');
    var searchInput = document.getElementById('simLibrarySearch');

    // Category toggle
    if (scroll) {
      scroll.addEventListener('click', function (e) {
        // Toggle category
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

        // Add component
        var item = e.target.closest('.sim-lib-item');
        if (item) {
          var compId = item.getAttribute('data-comp');
          if (compId) {
            // Save state for undo
            if (window.SimHistory) {
              window.SimHistory.push(window.SimState.getSnapshot());
            }
            addComponent(compId);
          }
        }
      });

      // Drag from library
      scroll.addEventListener('dragstart', function (e) {
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

    // Search
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = this.value.toLowerCase().trim();
        var items = document.querySelectorAll('.sim-lib-item');

        for (var i = 0; i < items.length; i++) {
          var text = items[i].textContent.toLowerCase();
          items[i].style.display = (q === '' || text.indexOf(q) !== -1) ? '' : 'none';
        }

        // Show/hide categories
        var categories = document.querySelectorAll('.sim-category');
        for (var c = 0; c < categories.length; c++) {
          var cat = categories[c];
          if (q === '') {
            cat.style.display = '';
          } else {
            var visible = cat.querySelectorAll('.sim-lib-item:not([style*="display: none"])');
            cat.style.display = visible.length > 0 ? '' : 'none';
          }
        }
      });
    }

    // Drop on canvas
    var canvas = document.getElementById('simCanvas');
    if (canvas) {
      canvas.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      canvas.addEventListener('drop', function (e) {
        e.preventDefault();
        var compId = e.dataTransfer.getData('text/plain');
        if (compId) {
          if (window.SimHistory) {
            window.SimHistory.push(window.SimState.getSnapshot());
          }
          var world = window.SimCanvas ? window.SimCanvas.screenToWorld(e.clientX, e.clientY) : { x: e.clientX, y: e.clientY };
          addComponent(compId, world.x - 35, world.y - 20);
        }
      });
    }
  }

  /* ======================================================================
     Toolbar Setup
     ====================================================================== */

  function setupToolbar() {
    var bind = function (id, handler) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', handler);
    };

    // Undo
    bind('simBtnUndo', function () {
      if (window.SimHistory && window.SimHistory.canUndo()) {
        window.SimHistory.undo(
          function () { return window.SimState.getSnapshot(); },
          function (snapshot) {
            window.SimState.restoreSnapshot(snapshot);
            rebuildAll();
          }
        );
      }
    });

    // Redo
    bind('simBtnRedo', function () {
      if (window.SimHistory && window.SimHistory.canRedo()) {
        window.SimHistory.redo(
          function () { return window.SimState.getSnapshot(); },
          function (snapshot) {
            window.SimState.restoreSnapshot(snapshot);
            rebuildAll();
          }
        );
      }
    });

    // Run simulation
    bind('simBtnRun', function () {
      if (window.SimEngine) {
        var result = window.SimEngine.run();
        showFeedback(result.message, result.success ? 'success' : 'error');

        // Update visuals
        if (result.success) {
          updateComponentVisuals();
          if (window.SimWires) {
            window.SimWires.drawAllWires(true);
          }
        }
      }
    });

    // Stop simulation
    bind('simBtnStop', function () {
      if (window.SimEngine) {
        var result = window.SimEngine.stop();
        showFeedback(result.message, 'info');
        updateComponentVisuals();
        if (window.SimWires) {
          window.SimWires.drawAllWires(false);
        }
      }
    });

    // Validate
    bind('simBtnValidate', function () {
      if (window.SimValidation) {
        var v = window.SimValidation.validate(
          window.SimState.getComponents(),
          window.SimState.getWires()
        );
        if (v.valid) {
          showFeedback('✅ الدائرة صحيحة!', 'success');
        } else {
          showFeedback('⚠️ ' + v.issues.join(' | '), 'error');
        }
        if (v.warnings.length > 0) {
          setTimeout(function () {
            showFeedback('💡 ' + v.warnings.join(' | '), 'warning');
          }, 2000);
        }
      }
    });

    // Zoom
    bind('simBtnZoomIn', function () { if (window.SimCanvas) window.SimCanvas.zoomIn(); });
    bind('simBtnZoomOut', function () { if (window.SimCanvas) window.SimCanvas.zoomOut(); });
    bind('simBtnZoomFit', function () { if (window.SimCanvas) window.SimCanvas.zoomToFit(); });

    // Grid
    bind('simBtnSnap', function () { if (window.SimCanvas) window.SimCanvas.toggleSnap(); });
    bind('simBtnGridSize', function () { if (window.SimCanvas) window.SimCanvas.cycleGridSize(); });

    // Delete selected
    bind('simBtnDelete', function () {
      var ids = window.SimState.getSelectedIds();
      if (ids.length === 0) {
        showFeedback('⚠️ اختر عنصراً أولاً', 'warning');
        return;
      }
      if (window.SimHistory) {
        window.SimHistory.push(window.SimState.getSnapshot());
      }
      for (var i = 0; i < ids.length; i++) {
        deleteComponent(ids[i]);
      }
      showFeedback('🗑️ تم حذف ' + ids.length + ' عناصر', 'info');
    });

    // Clear all
    bind('simBtnClearAll', function () {
      if (window.SimState.getComponentCount() === 0) return;
      if (!confirm('هل أنت متأكد من مسح جميع العناصر؟')) return;

      if (window.SimHistory) {
        window.SimHistory.push(window.SimState.getSnapshot());
      }

      var canvas = document.getElementById('simCanvas');
      if (canvas) {
        var comps = canvas.querySelectorAll('.sim-component');
        for (var i = 0; i < comps.length; i++) {
          comps[i].remove();
        }
      }

      window.SimState.reset();
      if (window.SimWires) window.SimWires.clearAll();
      if (window.SimSelection) window.SimSelection.clearAll();
      if (window.SimProperties) window.SimProperties.hide();
      if (window.SimCanvas) window.SimCanvas.showPlaceholder(true);
      updateCounts();
      showFeedback('🗑️ تم مسح جميع العناصر', 'info');
    });

    // Save
    bind('simBtnSave', function () {
      var name = prompt('📁 أدخل اسم المشروع:');
      if (!name) return;
      var result = window.SimProject.save(name);
      showFeedback(result.message, result.success ? 'success' : 'error');
    });

    // Load
    bind('simBtnLoad', function () {
      var projects = window.SimProject.getAll();
      if (projects.length === 0) {
        showFeedback('⚠️ لا توجد مشاريع محفوظة', 'warning');
        return;
      }

      var list = '';
      for (var i = 0; i < projects.length; i++) {
        list += (i + 1) + '. ' + projects[i].name + '\n';
      }

      var choice = prompt('📂 اختر رقم المشروع:\n\n' + list);
      if (!choice) return;

      var idx = parseInt(choice) - 1;
      if (isNaN(idx) || idx < 0 || idx >= projects.length) {
        showFeedback('⚠️ رقم غير صالح', 'error');
        return;
      }

      var result = window.SimProject.load(projects[idx].id);
      if (result.success) {
        window.SimState.restoreSnapshot(result.project.data);
        rebuildAll();
        showFeedback('✅ تم تحميل المشروع: ' + result.project.name, 'success');
      } else {
        showFeedback(result.message, 'error');
      }
    });

    // Export
    bind('simBtnExport', function () {
      var name = prompt('📥 اسم ملف التصدير:', 'مشروع_DrDer');
      if (!name) return;
      var result = window.SimProject.exportToJSON(name);
      showFeedback(result.message, 'success');
    });

    // Import
    bind('simBtnImport', function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = function (e) {
        var file = e.target.files[0];
        if (!file) return;
        window.SimProject.importFromJSON(file).then(function (result) {
          if (result.success) {
            window.SimState.restoreSnapshot(result.project.data);
            rebuildAll();
            showFeedback('✅ تم استيراد المشروع: ' + (result.project.name || 'بدون اسم'), 'success');
          } else {
            showFeedback(result.message, 'error');
          }
        });
      };
      input.click();
    });

    // Properties panel toggle
    bind('simBtnProps', function () {
      var ids = window.SimState.getSelectedIds();
      if (ids.length === 1) {
        var comp = window.SimState.getComponent(ids[0]);
        if (comp && window.SimProperties) {
          window.SimProperties.toggle(comp);
        }
      }
    });
  }

  /* ======================================================================
     Component Management
     ====================================================================== */

  /**
   * Add a component to the canvas and state
   * @param {string} compId - Component definition ID
   * @param {number} [x] - X position (random if not specified)
   * @param {number} [y] - Y position (random if not specified)
   */
  function addComponent(compId, x, y) {
    var def = window.findComponentDef(compId);
    if (!def) return;

    var canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    // Hide placeholder
    if (window.SimCanvas) {
      window.SimCanvas.showPlaceholder(false);
    }

    if (x === undefined) x = 60 + Math.random() * 200;
    if (y === undefined) y = 60 + Math.random() * 150;

    // Create element
    var el = document.createElement('div');
    el.className = 'sim-component';
    el.setAttribute('data-component-id', '');
    el.setAttribute('data-comp-type', compId);
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    // Icon
    var icon = document.createElement('span');
    icon.className = 'sim-comp-icon';
    icon.textContent = def.icon;
    el.appendChild(icon);

    // Label
    var label = document.createElement('span');
    label.className = 'sim-comp-label';
    label.textContent = def.name;
    el.appendChild(label);

    // Badge (will be updated after adding to state)
    var badge = document.createElement('span');
    badge.className = 'sim-comp-badge';
    badge.textContent = '...';
    el.appendChild(badge);

    // Delete button
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'sim-comp-delete';
    deleteBtn.title = 'حذف';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('pointerdown', function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    });
    deleteBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      var cid = parseInt(el.getAttribute('data-component-id'));
      if (!isNaN(cid)) {
        if (window.SimHistory) {
          window.SimHistory.push(window.SimState.getSnapshot());
        }
        deleteComponent(cid);
      }
    });
    el.appendChild(deleteBtn);

    // Add to state
    var component = window.SimState.addComponent(compId, x, y, el);

    // Update badge and data attribute
    badge.textContent = component.id;
    el.setAttribute('data-component-id', component.id);

    // Add terminals
    var positions = window.getTerminalPositions(def.terminals || 2);
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var term = document.createElement('div');
      term.className = 'sim-terminal';
      term.style.left = pos.x + '%';
      term.style.top = pos.y + '%';
      term.setAttribute('data-component-id', component.id);
      term.setAttribute('data-terminal-index', i);
      term.title = 'طرف ' + (i + 1);
      el.appendChild(term);
    }

    // Add to canvas
    canvas.appendChild(el);

    // Apply canvas transform
    if (window.SimCanvas) {
      window.SimCanvas.applyTransformToElement(el);
    }

    // Update counts
    updateCounts();
  }

  /**
   * Delete a component from canvas and state
   * @param {number} id - Component ID
   */
  function deleteComponent(id) {
    var comp = window.SimState.getComponent(id);
    if (comp && comp.el && comp.el.parentNode) {
      comp.el.parentNode.removeChild(comp.el);
    }

    window.SimState.removeComponent(id);

    if (window.SimWires) {
      window.SimWires.drawAllWires(window.SimState.simulationActive);
    }

    if (window.SimState.getComponentCount() === 0) {
      if (window.SimCanvas) window.SimCanvas.showPlaceholder(true);
    }

    if (window.SimProperties) window.SimProperties.hide();
    updateCounts();
  }

  /* ======================================================================
     UI Helpers
     ====================================================================== */

  /**
   * Rebuild all components from state (used after undo/redo/load)
   */
  function rebuildAll() {
    var canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    // Remove all existing components
    var existing = canvas.querySelectorAll('.sim-component');
    for (var i = 0; i < existing.length; i++) {
      existing[i].remove();
    }

    // Clear wires
    if (window.SimWires) window.SimWires.clearAll();

    // Recreate all components
    var components = window.SimState.getComponents();
    for (var c = 0; c < components.length; c++) {
      var comp = components[c];
      var def = window.findComponentDef(comp.compId);
      if (!def) continue;

      // Create element
      var el = document.createElement('div');
      el.className = 'sim-component';
      el.setAttribute('data-component-id', comp.id);
      el.setAttribute('data-comp-type', comp.compId);
      el.style.left = comp.x + 'px';
      el.style.top = comp.y + 'px';

      if (comp.rotation) {
        el.style.transform = 'rotate(' + comp.rotation + 'deg)';
      }

      // Icon
      var icon = document.createElement('span');
      icon.className = 'sim-comp-icon';
      icon.textContent = def.icon;
      el.appendChild(icon);

      // Label
      var label = document.createElement('span');
      label.className = 'sim-comp-label';
      label.textContent = def.name;
      el.appendChild(label);

      // Badge
      var badge = document.createElement('span');
      badge.className = 'sim-comp-badge';
      badge.textContent = comp.id;
      el.appendChild(badge);

      // Delete button
      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'sim-comp-delete';
      deleteBtn.title = 'حذف';
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('pointerdown', function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
      });
      deleteBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        var cid = parseInt(el.getAttribute('data-component-id'));
        if (!isNaN(cid)) {
          if (window.SimHistory) {
            window.SimHistory.push(window.SimState.getSnapshot());
          }
          deleteComponent(cid);
        }
      });
      el.appendChild(deleteBtn);

      // Terminals
      var positions = window.getTerminalPositions(def.terminals || 2);
      for (var t = 0; t < positions.length; t++) {
        var pos = positions[t];
        var term = document.createElement('div');
        term.className = 'sim-terminal';
        term.style.left = pos.x + '%';
        term.style.top = pos.y + '%';
        term.setAttribute('data-component-id', comp.id);
        term.setAttribute('data-terminal-index', t);
        term.title = 'طرف ' + (t + 1);
        el.appendChild(term);
      }

      canvas.appendChild(el);
      comp.el = el;

      // Apply transform
      if (window.SimCanvas) {
        window.SimCanvas.applyTransformToElement(el);
      }
    }

    // Redraw wires
    if (window.SimWires) {
      window.SimWires.drawAllWires(window.SimState.simulationActive);
    }

    // Update placeholder
    if (window.SimCanvas) {
      window.SimCanvas.showPlaceholder(components.length === 0);
    }

    updateCounts();
  }

  /**
   * Update visual states of all components based on simulation
   */
  function updateComponentVisuals() {
    var components = window.SimState.getComponents();
    var simActive = window.SimState.simulationActive;

    for (var i = 0; i < components.length; i++) {
      var comp = components[i];
      if (!comp.el) continue;

      if (simActive && comp.compState.active) {
        comp.el.classList.add('simulating');
      } else {
        comp.el.classList.remove('simulating');
      }

      if (simActive && comp.compState.energized) {
        comp.el.classList.add('energized');
      } else {
        comp.el.classList.remove('energized');
      }
    }
  }

  /**
   * Update component and wire counts in status bar
   */
  function updateCounts() {
    if (window.SimCanvas) {
      window.SimCanvas.updateComponentCount(window.SimState.getComponentCount());
      window.SimCanvas.updateConnectionCount(window.SimState.getWireCount());
    }
  }

  /**
   * Show feedback message
   * @param {string} msg - Message text
   * @param {string} [type] - Message type (success, error, warning, info)
   */
  function showFeedback(msg, type) {
    var fb = document.getElementById('simFeedbackMsg');
    if (!fb) return;

    fb.textContent = msg;
    fb.className = 'sim-feedback-msg';
    if (type) fb.classList.add(type);
    fb.style.display = 'block';

    clearTimeout(fb._timeout);
    fb._timeout = setTimeout(function () {
      fb.style.display = 'none';
    }, 3500);
  }

  /**
   * Called externally to rebuild all UI
   */
  window.SimUI = {
    showFeedback: showFeedback,
    rebuildAll: rebuildAll,
    deleteComponent: deleteComponent,
    updateCounts: updateCounts
  };

})();
