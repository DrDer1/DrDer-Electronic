/* ==========================================================================
   DrDer Electronic - Simulator Main Entry Point v4.1
   Fixed: Component rendering and initialization
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
      '<!-- Left Panel -->' +
      '<aside class="sim-panel-left" id="simToolbox">' +
        '<div class="sim-panel-header"><h3>📦 مكتبة العناصر</h3></div>' +
        '<input type="search" class="sim-search-input" id="simLibrarySearch" placeholder="🔍 بحث عن عنصر..." autocomplete="off">' +
        '<div class="sim-library-scroll" id="simLibraryScroll">' + libraryHTML + '</div>' +
      '</aside>' +
      '<!-- Main Area -->' +
      '<div class="sim-main-area">' +
        '<!-- Toolbar -->' +
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
        '<!-- Canvas -->' +
        '<div class="sim-canvas-container">' +
          '<div class="sim-canvas-area" id="simCanvas" tabindex="0" style="position:relative;overflow:hidden;">' +
            '<svg class="sim-grid-svg" id="canvasGridSvg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;">' +
              '<defs>' +
                '<pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">' +
                  '<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#30363d" stroke-width="0.5" opacity="0.2"/>' +
                  '<path d="M 100 0 L 0 0 0 100" fill="none" stroke="#30363d" stroke-width="1" opacity="0.4"/>' +
                '</pattern>' +
              '</defs>' +
              '<rect width="100%" height="100%" fill="url(#gridPattern)"/>' +
            '</svg>' +
            '<div class="canvas-placeholder" id="canvasPlaceholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1;">' +
              '<div class="placeholder-content" style="text-align:center;color:#6e7681;">' +
                '<span class="placeholder-icon" style="font-size:3rem;opacity:0.4;">🔧</span>' +
                '<span class="placeholder-text" style="font-size:0.95rem;">اسحب العناصر من المكتبة أو انقر عليها للإضافة</span>' +
                '<span class="placeholder-hint" style="font-size:0.72rem;opacity:0.5;">زر الفأرة الأوسط للسحب | العجلة للتكبير | Ctrl+Z للتراجع</span>' +
              '</div>' +
            '</div>' +
            '<svg class="sim-wires-svg" id="canvasWiresSvg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;"></svg>' +
          '</div>' +
        '</div>' +
        '<!-- Status Bar -->' +
        '<div class="sim-statusbar">' +
          '<span class="sim-status-item" id="simStatusZoom">تكبير: 100%</span>' +
          '<span class="sim-status-item" id="simStatusComponents">العناصر: 0</span>' +
          '<span class="sim-status-item" id="simStatusConnections">التوصيلات: 0</span>' +
          '<span class="sim-status-item" id="simStatusPosition">x: 0, y: 0</span>' +
          '<span class="sim-status-item" id="simStatusGrid">شبكة: 20px</span>' +
          '<span class="sim-status-item" id="simStatusSnap">✅ التصاق</span>' +
        '</div>' +
        '<!-- Feedback -->' +
        '<div class="sim-feedback-msg" id="simFeedbackMsg" style="display:none;"></div>' +
      '</div>' +
      '<!-- Right Panel -->' +
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
   * Add a component to the canvas
   */
  function addComponent(compId, x, y) {
    var def = window.findComponentDef(compId);
    if (!def) {
      console.warn('Component not found:', compId);
      return;
    }

    var canvas = document.getElementById('simCanvas');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    // Hide placeholder
    var placeholder = document.getElementById('canvasPlaceholder');
    if (placeholder) placeholder.style.display = 'none';

    var id = ++simState.componentIdCounter;

    // Create component element
    var el = document.createElement('div');
    el.className = 'sim-component';
    el.id = 'comp-' + id;
    el.setAttribute('data-component-id', id);
    el.setAttribute('data-comp-type', compId);
    el.style.position = 'absolute';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.zIndex = '10';
    el.style.cursor = 'move';
    el.style.userSelect = 'none';
    el.style.background = '#21262d';
    el.style.border = '2px solid #00e5ff';
    el.style.borderRadius = '4px';
    el.style.padding = '8px 10px';
    el.style.minWidth = '70px';
    el.style.textAlign = 'center';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.gap = '3px';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', def.name);
    el.setAttribute('tabindex', '0');

    // Icon
    var icon = document.createElement('span');
    icon.style.fontSize = '1.3rem';
    icon.style.display = 'block';
    icon.textContent = def.icon;
    el.appendChild(icon);

    // Label
    var label = document.createElement('span');
    label.style.fontSize = '0.65rem';
    label.style.fontWeight = '600';
    label.style.color = '#e6edf3';
    label.style.maxWidth = '80px';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.whiteSpace = 'nowrap';
    label.textContent = def.name;
    el.appendChild(label);

    // Badge
    var badge = document.createElement('span');
    badge.style.position = 'absolute';
    badge.style.top = '-9px';
    badge.style.right = '-5px';
    badge.style.background = '#00e5ff';
    badge.style.color = '#000';
    badge.style.fontSize = '0.55rem';
    badge.style.fontWeight = '700';
    badge.style.width = '16px';
    badge.style.height = '16px';
    badge.style.borderRadius = '50%';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.zIndex = '6';
    badge.textContent = id;
    el.appendChild(badge);

    // Delete button
    var deleteBtn = document.createElement('button');
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '-9px';
    deleteBtn.style.left = '-7px';
    deleteBtn.style.width = '16px';
    deleteBtn.style.height = '16px';
    deleteBtn.style.borderRadius = '50%';
    deleteBtn.style.background = '#f85149';
    deleteBtn.style.color = '#fff';
    deleteBtn.style.border = 'none';
    deleteBtn.style.fontSize = '0.5rem';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.display = 'none';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.style.zIndex = '6';
    deleteBtn.style.padding = '0';
    deleteBtn.style.lineHeight = '1';
    deleteBtn.title = 'حذف';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      window.SimHistory.push(window.SimEngine.getStateSnapshot());
      deleteComponent(id);
    });
    el.appendChild(deleteBtn);

    // Show delete on hover
    el.addEventListener('mouseenter', function () { deleteBtn.style.display = 'flex'; });
    el.addEventListener('mouseleave', function () { deleteBtn.style.display = 'none'; });

    // Drag events
    el.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) return;
      if (ev.target.closest('.sim-terminal')) return;
      if (ev.target === deleteBtn) return;
      ev.preventDefault();
      ev.stopPropagation();
      var comp = getComponentById(id);
      if (comp && window.SimDrag) {
        window.SimDrag.startDrag(comp, ev.clientX, ev.clientY);
      }
    });

    // Click to select
    el.addEventListener('click', function (ev) {
      if (window.SimDrag && window.SimDrag.isDragging()) return;
      ev.stopPropagation();
      if (window.SimSelection) {
        window.SimSelection.selectComponent(id, ev.ctrlKey || ev.metaKey, simState.placedComponents);
        if (window.SimSelection.getSelectedCount() === 1) {
          var comp = getComponentById(id);
          if (comp && window.SimProperties) {
            window.SimProperties.show(comp);
          }
        }
      }
    });

    // Double click to toggle switch
    el.addEventListener('dblclick', function (ev) {
      ev.stopPropagation();
      var comp = getComponentById(id);
      if (comp && window.SimEngine) {
        var componentDef = window.findComponentDef(comp.compId);
        if (componentDef && componentDef.type === 'switch') {
          window.SimEngine.toggleSwitch(id);
        }
      }
    });

    // Add terminals
    var positions = window.getTerminalPositions(def.terminals || 2);
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var term = document.createElement('div');
      term.className = 'sim-terminal';
      term.style.position = 'absolute';
      term.style.left = pos.x + '%';
      term.style.top = pos.y + '%';
      term.style.width = '10px';
      term.style.height = '10px';
      term.style.background = '#00e5ff';
      term.style.border = '2px solid #0d1117';
      term.style.borderRadius = '50%';
      term.style.zIndex = '7';
      term.style.cursor = 'crosshair';
      term.style.transform = 'translate(-50%,-50%)';
      term.setAttribute('data-component-id', id);
      term.setAttribute('data-terminal-index', i);
      term.setAttribute('aria-label', 'طرف ' + (i + 1));
      term.title = 'طرف ' + (i + 1);

      (function (termEl, compId, termIdx) {
        termEl.addEventListener('mousedown', function (ev) {
          ev.stopPropagation();
          ev.preventDefault();
          if (window.SimWires) {
            window.SimWires.startConnection(compId, termIdx, ev.clientX, ev.clientY);
          }
        });
      })(term, id, i);

      el.appendChild(term);
    }

    // Add to canvas
    canvas.appendChild(el);

    // Apply transform
    if (window.SimCanvas) {
      window.SimCanvas.applyTransformToElement(el);
    }

    // Store in state
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

    // Update counts
    if (window.SimCanvas) {
      window.SimCanvas.updateComponentCount(simState.placedComponents.length);
    }

    console.log('Component added:', def.name, 'at', x, y, 'total:', simState.placedComponents.length);
  }

  /**
   * Delete a component
   */
  function deleteComponent(id) {
    var comp = getComponentById(id);
    if (comp && comp.el && comp.el.parentNode) {
      comp.el.parentNode.removeChild(comp.el);
    }

    simState.placedComponents = simState.placedComponents.filter(function (c) { return c.id !== id; });

    if (window.SimWires) {
      window.SimWires.deleteConnectionsForComponent(id);
    }

    if (window.SimSelection) {
      window.SimSelection.removeComponent(id, simState.placedComponents);
    }

    if (window.SimWires) {
      window.SimWires.drawAllWires(window.SimEngine ? window.SimEngine.isActive() : false);
    }

    if (simState.placedComponents.length === 0) {
      var placeholder = document.getElementById('canvasPlaceholder');
      if (placeholder) placeholder.style.display = '';
    }

    if (window.SimCanvas) {
      window.SimCanvas.updateComponentCount(simState.placedComponents.length);
      window.SimCanvas.updateConnectionCount(window.SimWires ? window.SimWires.getConnectionCount() : 0);
    }
  }

  function getComponentById(id) {
    for (var i = 0; i < simState.placedComponents.length; i++) {
      if (simState.placedComponents[i].id === id) return simState.placedComponents[i];
    }
    return null;
  }

  /**
   * Initialize simulator
   */
  function initSimulator() {
    simState.placedComponents = [];
    simState.componentIdCounter = 0;

    console.log('Initializing simulator...');

    // Initialize modules in order
    if (window.SimCanvas) {
      window.SimCanvas.init('simCanvas', simState);
      console.log('SimCanvas initialized');
    } else {
      console.error('SimCanvas not loaded');
    }

    if (window.SimDrag) {
      window.SimDrag.init(simState, document.getElementById('simCanvas'));
    }

    if (window.SimSelection) {
      window.SimSelection.init();
    }

    if (window.SimWires) {
      window.SimWires.init(simState, window.SimCanvas);
    }

    if (window.SimEngine) {
      window.SimEngine.init(simState);
    }

    if (window.SimProperties) {
      window.SimProperties.init(simState);
    }

    if (window.SimLibrary) {
      window.SimLibrary.init();
    }

    if (window.SimUI) {
      window.SimUI.init();
    }

    // Setup canvas callbacks
    setupCanvasCallbacks();

    // Setup library click handler directly
    var libraryScroll = document.getElementById('simLibraryScroll');
    if (libraryScroll) {
      libraryScroll.addEventListener('click', function (e) {
        var item = e.target.closest('.sim-lib-item');
        if (item) {
          var compId = item.getAttribute('data-comp');
          if (compId) {
            window.SimHistory.push(window.SimEngine.getStateSnapshot());
            var x = 40 + Math.random() * 100;
            var y = 40 + Math.random() * 100;
            addComponent(compId, x, y);
          }
        }
      });
    }

    // Setup category toggle
    if (libraryScroll) {
      libraryScroll.addEventListener('click', function (e) {
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
        }
      });
    }

    // Setup search
    var searchInput = document.getElementById('simLibrarySearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var query = this.value.toLowerCase();
        var items = document.querySelectorAll('.sim-lib-item');
        items.forEach(function (item) {
          var text = item.textContent.toLowerCase();
          item.style.display = (query === '' || text.indexOf(query) !== -1) ? '' : 'none';
        });
      });
    }

    // Setup drag and drop
    var canvas = document.getElementById('simCanvas');
    if (canvas) {
      canvas.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      canvas.addEventListener('drop', function (e) {
        e.preventDefault();
        var compId = e.dataTransfer.getData('text/plain');
        if (compId && window.SimCanvas) {
          var world = window.SimCanvas.screenToWorld(e.clientX, e.clientY);
          var snapped = window.SimCanvas.snapPosition(world.x, world.y);
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
          addComponent(compId, Math.max(0, snapped.x), Math.max(0, snapped.y));
        }
      });
    }

    // Setup properties close button
    var closeBtn = document.getElementById('btnCloseProperties');
    if (closeBtn && window.SimProperties) {
      closeBtn.addEventListener('click', function () {
        window.SimProperties.hide();
      });
    }

    setupKeyboardShortcuts();

    console.log('Simulator initialized successfully');
  }

  function setupCanvasCallbacks() {
    if (!window.SimCanvas) return;

    window.SimCanvas.onMouseDown(function (e) {
      if (e.target.closest('.sim-terminal')) return;
      if (e.target.closest('.sim-comp-delete')) return;

      var compEl = e.target.closest('.sim-component');
      if (compEl) return;

      if (e.target.closest('.sim-wire-path')) {
        if (window.SimSelection) {
          window.SimSelection.selectWire(e.target.closest('.sim-wire-path'));
        }
        return;
      }

      if (e.target.id === 'simCanvas' || e.target.closest('.canvas-placeholder') ||
          e.target.closest('.sim-grid-svg') || e.target.id === 'canvasGridSvg') {
        if (window.SimSelection) {
          window.SimSelection.clearAll(simState.placedComponents);
        }
        if (window.SimProperties) {
          window.SimProperties.hide();
        }
      }
    });

    window.SimCanvas.onMouseMove(function (e) {
      if (window.SimCanvas) {
        var world = window.SimCanvas.screenToWorld(e.clientX, e.clientY);
        window.SimCanvas.updatePositionInfo(world.x, world.y);
      }

      if (window.SimDrag && window.SimDrag.isDragging()) {
        window.SimDrag.dragMove(e.clientX, e.clientY, window.SimCanvas, window.SimSelection);
        if (window.SimWires) {
          window.SimWires.drawAllWires(window.SimEngine ? window.SimEngine.isActive() : false);
        }
      }

      if (window.SimWires && window.SimWires.isConnecting()) {
        window.SimWires.updateTempWire(e.clientX, e.clientY);
      }
    });

    window.SimCanvas.onMouseUp(function (e) {
      if (window.SimDrag && window.SimDrag.isDragging()) {
        var moved = window.SimDrag.endDrag();
        if (moved && window.SimHistory) {
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
        }
        return;
      }

      if (window.SimWires && window.SimWires.isConnecting()) {
        if (window.SimHistory) {
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
        }
        var result = window.SimWires.finishConnection(e.clientX, e.clientY);

        if (result) {
          if (result.success) {
            window.SimWires.drawAllWires(window.SimEngine ? window.SimEngine.isActive() : false);
            window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
            if (window.SimUI) {
              window.SimUI.showFeedback('✅ تم توصيل العنصرين بنجاح', 'success');
            }
          } else {
            if (window.SimUI) {
              window.SimUI.showFeedback(result.message || '⚠️ فشل التوصيل', 'error');
            }
          }
        }
      }
    });
  }

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
        if (window.SimHistory && window.SimHistory.canUndo()) {
          window.SimHistory.undo(
            function () { return window.SimEngine.getStateSnapshot(); },
            function (snapshot) { window.SimEngine.restoreSnapshot(snapshot); }
          );
          if (window.SimWires) window.SimWires.drawAllWires(window.SimEngine.isActive());
          if (window.SimCanvas) {
            window.SimCanvas.updateComponentCount(simState.placedComponents.length);
            window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
          }
        }
      }

      if (ctrl && e.key === 'y') {
        e.preventDefault();
        if (window.SimHistory && window.SimHistory.canRedo()) {
          window.SimHistory.redo(
            function () { return window.SimEngine.getStateSnapshot(); },
            function (snapshot) { window.SimEngine.restoreSnapshot(snapshot); }
          );
          if (window.SimWires) window.SimWires.drawAllWires(window.SimEngine.isActive());
          if (window.SimCanvas) {
            window.SimCanvas.updateComponentCount(simState.placedComponents.length);
            window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
          }
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (window.SimSelection) {
          var selectedIds = window.SimSelection.getSelectedIds();
          if (selectedIds.length > 0) {
            e.preventDefault();
            if (window.SimHistory) window.SimHistory.push(window.SimEngine.getStateSnapshot());
            for (var i = 0; i < selectedIds.length; i++) {
              deleteComponent(selectedIds[i]);
            }
          }
        }
      }

      if (e.key === 'Escape') {
        if (window.SimSelection) window.SimSelection.clearAll(simState.placedComponents);
        if (window.SimProperties) window.SimProperties.hide();
        if (window.SimWires) window.SimWires.cancelConnection();
      }
    };

    document.addEventListener('keydown', keyboardHandler);
  }

  window.getSimulatorHTML = getSimulatorHTML;
  window.initSimulator = initSimulator;
  window.SimAddComponent = addComponent;
  window.SimDeleteComponent = deleteComponent;
  window.SimGetState = function () { return simState; };
})();
