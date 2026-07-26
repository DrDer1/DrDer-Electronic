/* ==========================================================================
   DrDer Electronic - Simulator Main Entry Point v4.0
   Initializes and coordinates all simulator modules
   ========================================================================== */
(function () {
  'use strict';

  var simState = {
    placedComponents: [],
    componentIdCounter: 0
  };

  var keyboardHandler = null;

  /**
   * Generate the simulator HTML
   * @returns {string} HTML string
   */
  function getSimulatorHTML() {
    var libraryHTML = '';
    var categories = window.SIM_COMPONENTS;

    for (var catKey in categories) {
      if (!categories.hasOwnProperty(catKey)) continue;
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
      '<aside class="sim-panel-left" id="simToolbox">' +
        '<div class="sim-panel-header"><h3>📦 مكتبة العناصر</h3></div>' +
        '<input type="search" class="sim-search-input" id="simLibrarySearch" placeholder="🔍 بحث عن عنصر..." autocomplete="off">' +
        '<div class="sim-library-scroll" id="simLibraryScroll">' + libraryHTML + '</div>' +
      '</aside>' +
      '<div class="sim-main-area">' +
        '<div class="sim-toolbar">' +
          '<div class="sim-toolbar-group">' +
            '<button class="sim-tb-btn" id="simBtnUndo" title="تراجع Ctrl+Z" disabled>↩</button>' +
            '<button class="sim-tb-btn" id="simBtnRedo" title="إعادة Ctrl+Y" disabled>↪</button>' +
            '<span class="sim-toolbar-sep"></span>' +
            '<button class="sim-tb-btn" id="simBtnCopy" title="نسخ Ctrl+C">📋</button>' +
            '<button class="sim-tb-btn" id="simBtnPaste" title="لصق Ctrl+V">📄</button>' +
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
        '<div class="sim-canvas-container">' +
          '<div class="sim-canvas-area" id="simCanvas" tabindex="0">' +
            '<svg class="sim-grid-svg" id="canvasGridSvg">' +
              '<defs>' +
                '<pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">' +
                  '<path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-color)" stroke-width="0.5" opacity="0.2"/>' +
                  '<path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--border-color)" stroke-width="1" opacity="0.4"/>' +
                '</pattern>' +
              '</defs>' +
              '<rect width="100%" height="100%" fill="url(#gridPattern)"/>' +
            '</svg>' +
            '<div class="canvas-placeholder" id="canvasPlaceholder">' +
              '<div class="placeholder-content">' +
                '<span class="placeholder-icon">🔧</span>' +
                '<span class="placeholder-text">اسحب العناصر من المكتبة أو انقر عليها للإضافة</span>' +
                '<span class="placeholder-hint">زر الفأرة الأوسط للسحب | العجلة للتكبير | Ctrl+Z للتراجع</span>' +
              '</div>' +
            '</div>' +
            '<svg class="sim-wires-svg" id="canvasWiresSvg"></svg>' +
          '</div>' +
        '</div>' +
        '<div class="sim-statusbar">' +
          '<span class="sim-status-item" id="simStatusZoom">تكبير: 100%</span>' +
          '<span class="sim-status-item" id="simStatusComponents">العناصر: 0</span>' +
          '<span class="sim-status-item" id="simStatusConnections">التوصيلات: 0</span>' +
          '<span class="sim-status-item" id="simStatusPosition">x: 0, y: 0</span>' +
          '<span class="sim-status-item" id="simStatusGrid">شبكة: 20px</span>' +
          '<span class="sim-status-item" id="simStatusSnap">✅ التصاق</span>' +
        '</div>' +
        '<div class="sim-feedback-msg" id="simFeedbackMsg" style="display:none;"></div>' +
      '</div>' +
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
  }

  /**
   * Initialize the simulator
   */
  function initSimulator() {
    simState.placedComponents = [];
    simState.componentIdCounter = 0;

    window.SimCanvas.init('simCanvas', simState);
    window.SimDrag.init(simState, window.SimCanvas.getCanvas());
    window.SimSelection.init();
    window.SimWires.init(simState, window.SimCanvas);
    window.SimEngine.init(simState);
    window.SimProperties.init(simState);
    window.SimLibrary.init();
    window.SimUI.init();

    setupCanvasCallbacks();
    setupPropertiesCallback();
    setupLibraryCallback();
    setupKeyboardShortcuts();
  }

  /**
   * Setup canvas event callbacks
   */
  function setupCanvasCallbacks() {
    window.SimCanvas.onMouseDown(function (e) {
      if (e.target.closest('.sim-terminal')) return;
      if (e.target.closest('.sim-comp-delete')) return;

      var compEl = e.target.closest('.sim-component');
      if (compEl) return;

      if (e.target.closest('.sim-wire-path')) {
        window.SimSelection.selectWire(e.target.closest('.sim-wire-path'));
        return;
      }

      if (e.target.id === 'simCanvas' || e.target.closest('.canvas-placeholder') ||
          e.target.closest('.sim-grid-svg') || e.target.id === 'canvasGridSvg') {
        window.SimSelection.clearAll(simState.placedComponents);
        window.SimProperties.hide();
      }
    });

    window.SimCanvas.onMouseMove(function (e) {
      var world = window.SimCanvas.screenToWorld(e.clientX, e.clientY);
      window.SimCanvas.updatePositionInfo(world.x, world.y);

      if (window.SimDrag.isDragging()) {
        window.SimDrag.dragMove(e.clientX, e.clientY, window.SimCanvas, window.SimSelection);
        window.SimWires.drawAllWires(window.SimEngine.isActive());
      }

      if (window.SimWires.isConnecting()) {
        window.SimWires.updateTempWire(e.clientX, e.clientY);
      }
    });

    window.SimCanvas.onMouseUp(function (e) {
      if (window.SimDrag.isDragging()) {
        var moved = window.SimDrag.endDrag();
        if (moved) {
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
        }
        return;
      }

      if (window.SimWires.isConnecting()) {
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        var result = window.SimWires.finishConnection(e.clientX, e.clientY);

        if (result) {
          if (result.success) {
            window.SimWires.drawAllWires(window.SimEngine.isActive());
            window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
            window.SimUI.showFeedback('✅ تم توصيل العنصرين بنجاح', 'success');
          } else {
            window.SimUI.showFeedback(result.message || '⚠️ فشل التوصيل', 'error');
          }
        }
      }
    });
  }

  /**
   * Setup properties panel callback
   */
  function setupPropertiesCallback() {
    window.SimProperties.onPropertyChanged(function (component, property, value) {
      if (property === 'delete') {
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        deleteComponent(component.id);
        window.SimProperties.hide();
      } else {
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        window.SimWires.drawAllWires(window.SimEngine.isActive());
      }
    });
  }

  /**
   * Setup library selection callback
   */
  function setupLibraryCallback() {
    window.SimLibrary.onComponentSelect(function (compId) {
      window.SimHistory.push(window.SimEngine.getStateSnapshot());
      var x = 40 + Math.random() * 100;
      var y = 40 + Math.random() * 100;
      addComponent(compId, x, y);
    });
  }

  /**
   * Delete a component by ID
   */
  function deleteComponent(id) {
    var comp = simState.placedComponents.find(function (c) { return c.id === id; });
    if (comp && comp.el) {
      comp.el.remove();
    }

    simState.placedComponents = simState.placedComponents.filter(function (c) { return c.id !== id; });
    window.SimWires.deleteConnectionsForComponent(id);
    window.SimSelection.removeComponent(id, simState.placedComponents);
    window.SimWires.drawAllWires(window.SimEngine.isActive());

    if (simState.placedComponents.length === 0) {
      window.SimCanvas.showPlaceholder(true);
    }

    window.SimCanvas.updateComponentCount(simState.placedComponents.length);
    window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
  }

  /**
   * Add a component to the canvas
   */
  function addComponent(compId, x, y) {
    var def = window.findComponentDef(compId);
    if (!def) return;

    var id = ++simState.componentIdCounter;

    var el = document.createElement('div');
    el.className = 'sim-component';
    el.id = 'comp-' + id;
    el.dataset.componentId = id;
    el.dataset.compType = compId;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', def.name);
    el.setAttribute('tabindex', '0');

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'sim-comp-delete';
    deleteBtn.title = 'حذف';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      window.SimHistory.push(window.SimEngine.getStateSnapshot());
      deleteComponent(id);
    });
    el.appendChild(deleteBtn);

    var icon = document.createElement('span');
    icon.className = 'sim-comp-icon';
    icon.textContent = def.icon;
    el.appendChild(icon);

    var label = document.createElement('span');
    label.className = 'sim-comp-label';
    label.textContent = def.name;
    el.appendChild(label);

    var badge = document.createElement('span');
    badge.className = 'sim-comp-badge';
    badge.textContent = id;
    el.appendChild(badge);

    el.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) return;
      if (ev.target.closest('.sim-terminal')) return;
      if (ev.target.closest('.sim-comp-delete')) return;
      ev.preventDefault();
      ev.stopPropagation();

      var comp = getComponentById(id);
      if (comp) {
        window.SimDrag.startDrag(comp, ev.clientX, ev.clientY);
      }
    });

    el.addEventListener('click', function (ev) {
      if (!window.SimDrag.isDragging()) {
        ev.stopPropagation();
        window.SimSelection.selectComponent(id, ev.ctrlKey || ev.metaKey, simState.placedComponents);

        if (window.SimSelection.getSelectedCount() === 1) {
          var comp = getComponentById(id);
          if (comp) window.SimProperties.show(comp);
        }
      }
    });

    el.addEventListener('dblclick', function (ev) {
      ev.stopPropagation();
      var comp = getComponentById(id);
      if (comp) {
        var componentDef = window.findComponentDef(comp.compId);
        if (componentDef && componentDef.type === 'switch') {
          window.SimEngine.toggleSwitch(id);
        }
      }
    });

    var positions = window.getTerminalPositions(def.terminals || 2);
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var term = document.createElement('div');
      term.className = 'sim-terminal';
      term.style.left = pos.x + '%';
      term.style.top = pos.y + '%';
      term.style.transform = 'translate(-50%,-50%)';
      term.dataset.componentId = id;
      term.dataset.terminalIndex = i;
      term.setAttribute('aria-label', 'طرف ' + (i + 1));
      term.title = 'طرف ' + (i + 1);

      term.addEventListener('mousedown', function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        var compId = parseInt(this.dataset.componentId);
        var termIdx = parseInt(this.dataset.terminalIndex);
        window.SimWires.startConnection(compId, termIdx, ev.clientX, ev.clientY);
      });

      el.appendChild(term);
    }

    var canvas = document.getElementById('simCanvas');
    if (canvas) canvas.appendChild(el);

    window.SimCanvas.applyTransformToElement(el);

    simState.placedComponents.push({
      id: id,
      compId: compId,
      el: el,
      x: x,
      y: y,
      properties: {},
      rotation: 0,
      compState: { active: false, energized: false, closed: false }
    });

    window.SimCanvas.showPlaceholder(false);
    window.SimCanvas.updateComponentCount(simState.placedComponents.length);
  }

  /**
   * Get component by ID
   */
  function getComponentById(id) {
    for (var i = 0; i < simState.placedComponents.length; i++) {
      if (simState.placedComponents[i].id === id) {
        return simState.placedComponents[i];
      }
    }
    return null;
  }

  /**
   * Setup keyboard shortcuts
   */
  function setupKeyboardShortcuts() {
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }

    keyboardHandler = function (e) {
      var activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      var ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (window.SimHistory.canUndo()) {
          window.SimHistory.undo(
            function () { return window.SimEngine.getStateSnapshot(); },
            function (snapshot) { window.SimEngine.restoreSnapshot(snapshot); }
          );
          window.SimWires.drawAllWires(window.SimEngine.isActive());
          window.SimCanvas.updateComponentCount(simState.placedComponents.length);
          window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
        }
      }

      if (ctrl && e.key === 'y') {
        e.preventDefault();
        if (window.SimHistory.canRedo()) {
          window.SimHistory.redo(
            function () { return window.SimEngine.getStateSnapshot(); },
            function (snapshot) { window.SimEngine.restoreSnapshot(snapshot); }
          );
          window.SimWires.drawAllWires(window.SimEngine.isActive());
          window.SimCanvas.updateComponentCount(simState.placedComponents.length);
          window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
        }
      }

      if (ctrl && e.key === 'c') {
        e.preventDefault();
        window.SimUI.copySelection();
      }

      if (ctrl && e.key === 'v') {
        e.preventDefault();
        window.SimUI.pasteSelection();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        var selectedIds = window.SimSelection.getSelectedIds();
        if (selectedIds.length > 0) {
          e.preventDefault();
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
          for (var i = 0; i < selectedIds.length; i++) {
            deleteComponent(selectedIds[i]);
          }
        }
      }

      if (e.key === 'Escape') {
        window.SimSelection.clearAll(simState.placedComponents);
        window.SimProperties.hide();
        window.SimWires.cancelConnection();
      }
    };

    document.addEventListener('keydown', keyboardHandler);
  }

  /* ========================================================================
     Public API
     ======================================================================== */
  window.getSimulatorHTML = getSimulatorHTML;
  window.initSimulator = initSimulator;

  window.SimAddComponent = addComponent;
  window.SimDeleteComponent = deleteComponent;
  window.SimGetState = function () { return simState; };
})();
