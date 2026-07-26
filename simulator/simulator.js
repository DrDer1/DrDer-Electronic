/* ==========================================================================
   DrDer Electronic - Simulator Main Entry Point v4.3
   Fixed: Drag and wire connection events
   ========================================================================== */
(function () {
  'use strict';

  var simState = {
    placedComponents: [],
    componentIdCounter: 0
  };

  var keyboardHandler = null;

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
            '<button class="sim-tb-btn sim-tb-success" id="simBtnRun" title="تشغيل">▶️</button>' +
            '<button class="sim-tb-btn sim-tb-danger" id="simBtnStop" title="إيقاف">⏹️</button>' +
            '<button class="sim-tb-btn sim-tb-warning" id="simBtnValidate" title="تحقق">✅</button>' +
          '</div>' +
          '<div class="sim-toolbar-group">' +
            '<button class="sim-tb-btn" id="simBtnSave" title="حفظ">💾</button>' +
            '<button class="sim-tb-btn" id="simBtnLoad" title="فتح">📂</button>' +
            '<button class="sim-tb-btn" id="simBtnExport" title="تصدير">📥</button>' +
            '<button class="sim-tb-btn" id="simBtnImport" title="استيراد">📤</button>' +
            '<span class="sim-toolbar-sep"></span>' +
            '<button class="sim-tb-btn" id="simBtnProps" title="خصائص">📋</button>' +
            '<button class="sim-tb-btn sim-tb-danger" id="simBtnClearAll" title="مسح الكل">🗑️</button>' +
          '</div>' +
        '</div>' +
        '<div class="sim-canvas-container">' +
          '<div class="sim-canvas-area" id="simCanvas" tabindex="0" style="position:relative;overflow:hidden;width:100%;height:100%;">' +
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
              '<div style="text-align:center;color:#6e7681;">' +
                '<span style="font-size:3rem;opacity:0.4;display:block;">🔧</span>' +
                '<span style="font-size:0.95rem;">اسحب العناصر من المكتبة أو انقر عليها للإضافة</span>' +
              '</div>' +
            '</div>' +
            '<svg class="sim-wires-svg" id="canvasWiresSvg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;"></svg>' +
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

  // ========== ADD COMPONENT ==========
  function addComponent(compId, x, y) {
    var def = window.findComponentDef(compId);
    if (!def) return;

    var canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    var placeholder = document.getElementById('canvasPlaceholder');
    if (placeholder) placeholder.style.display = 'none';

    var id = ++simState.componentIdCounter;

    // Create element
    var el = document.createElement('div');
    el.className = 'sim-component';
    el.id = 'comp-' + id;
    el.setAttribute('data-component-id', id);
    el.setAttribute('data-comp-type', compId);
    el.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;z-index:10;cursor:move;user-select:none;background:#21262d;border:2px solid #00e5ff;border-radius:4px;padding:8px 10px;min-width:70px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', def.name);
    el.setAttribute('tabindex', '0');

    // Icon
    var icon = document.createElement('span');
    icon.style.cssText = 'font-size:1.3rem;display:block;pointer-events:none;';
    icon.textContent = def.icon;
    el.appendChild(icon);

    // Label
    var label = document.createElement('span');
    label.style.cssText = 'font-size:0.65rem;font-weight:600;color:#e6edf3;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
    label.textContent = def.name;
    el.appendChild(label);

    // Badge
    var badge = document.createElement('span');
    badge.style.cssText = 'position:absolute;top:-9px;right:-5px;background:#00e5ff;color:#000;font-size:0.55rem;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;pointer-events:none;';
    badge.textContent = id;
    el.appendChild(badge);

    // Delete button
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'sim-comp-delete';
    deleteBtn.style.cssText = 'position:absolute;top:-9px;left:-7px;width:16px;height:16px;border-radius:50%;background:#f85149;color:#fff;border:none;font-size:0.5rem;cursor:pointer;display:none;align-items:center;justify-content:center;z-index:20;padding:0;line-height:1;';
    deleteBtn.title = 'حذف';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('mousedown', function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    });
    deleteBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      if (window.SimHistory && window.SimEngine) {
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
      }
      deleteComponent(id);
    });
    el.appendChild(deleteBtn);

    el.addEventListener('mouseenter', function () { deleteBtn.style.display = 'flex'; });
    el.addEventListener('mouseleave', function () { deleteBtn.style.display = 'none'; });

    // ===== DRAG EVENTS =====
    var isDragging = false;
    var startX = 0, startY = 0, startLeft = 0, startTop = 0;

    el.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) return;
      if (ev.target.closest('.sim-terminal')) return;
      if (ev.target === deleteBtn) return;
      ev.preventDefault();
      ev.stopPropagation();

      isDragging = true;
      startX = ev.clientX;
      startY = ev.clientY;
      startLeft = parseInt(el.style.left) || 0;
      startTop = parseInt(el.style.top) || 0;
      el.style.zIndex = '20';
      el.style.cursor = 'grabbing';

      if (window.SimSelection) {
        window.SimSelection.selectComponent(id, ev.ctrlKey || ev.metaKey, simState.placedComponents);
      }
    });

    document.addEventListener('mousemove', function (ev) {
      if (!isDragging) return;
      ev.preventDefault();

      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      var newX = startLeft + dx;
      var newY = startTop + dy;

      if (window.SimCanvas && window.SimCanvas.isSnapEnabled && window.SimCanvas.isSnapEnabled()) {
        var gs = window.SimCanvas.getGridSize();
        newX = Math.round(newX / gs) * gs;
        newY = Math.round(newY / gs) * gs;
      }

      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      el.style.left = newX + 'px';
      el.style.top = newY + 'px';

      // Update state
      var comp = getComponentById(id);
      if (comp) {
        comp.x = newX;
        comp.y = newY;
      }

      if (window.SimWires) {
        window.SimWires.drawAllWires(window.SimEngine ? window.SimEngine.isActive() : false);
      }
    });

    document.addEventListener('mouseup', function () {
      if (!isDragging) return;
      var dx = Math.abs(parseInt(el.style.left) - startLeft);
      var dy = Math.abs(parseInt(el.style.top) - startTop);
      if (dx > 1 || dy > 1) {
        if (window.SimHistory && window.SimEngine) {
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
        }
      }
      isDragging = false;
      el.style.zIndex = '10';
      el.style.cursor = 'move';
    });

    // Click to select
    el.addEventListener('click', function (ev) {
      if (Math.abs(parseInt(el.style.left) - startLeft) > 2) return;
      if (Math.abs(parseInt(el.style.top) - startTop) > 2) return;
      ev.stopPropagation();
      if (window.SimProperties) {
        var comp = getComponentById(id);
        if (comp) window.SimProperties.show(comp);
      }
    });

    // Double click for switch toggle
    el.addEventListener('dblclick', function (ev) {
      ev.stopPropagation();
      var comp = getComponentById(id);
      if (comp && window.SimEngine) {
        var cdef = window.findComponentDef(comp.compId);
        if (cdef && cdef.type === 'switch') {
          window.SimEngine.toggleSwitch(id);
        }
      }
    });

    // ===== TERMINALS =====
    var positions = window.getTerminalPositions(def.terminals || 2);
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var term = document.createElement('div');
      term.className = 'sim-terminal';
      term.style.cssText = 'position:absolute;left:' + pos.x + '%;top:' + pos.y + '%;width:12px;height:12px;background:#00e5ff;border:2px solid #0d1117;border-radius:50%;z-index:15;cursor:crosshair;transform:translate(-50%,-50%);';
      term.setAttribute('data-component-id', id);
      term.setAttribute('data-terminal-index', i);
      term.setAttribute('aria-label', 'طرف ' + (i + 1));
      term.title = 'طرف ' + (i + 1) + ' - اسحب للتوصيل';

      (function (termEl, compId, termIdx) {
        var isConnecting = false;
        var connStartX = 0, connStartY = 0;

        termEl.addEventListener('mousedown', function (ev) {
          ev.stopPropagation();
          ev.preventDefault();
          isConnecting = true;
          connStartX = ev.clientX;
          connStartY = ev.clientY;

          if (window.SimWires) {
            window.SimWires.startConnection(compId, termIdx, ev.clientX, ev.clientY);
          }
        });

        document.addEventListener('mousemove', function (ev) {
          if (!isConnecting) return;
          if (window.SimWires) {
            window.SimWires.updateTempWire(ev.clientX, ev.clientY);
          }
        });

        document.addEventListener('mouseup', function (ev) {
          if (!isConnecting) return;
          isConnecting = false;

          if (window.SimWires) {
            if (window.SimHistory && window.SimEngine) {
              window.SimHistory.push(window.SimEngine.getStateSnapshot());
            }
            var result = window.SimWires.finishConnection(ev.clientX, ev.clientY);
            if (result) {
              if (result.success) {
                window.SimWires.drawAllWires(window.SimEngine ? window.SimEngine.isActive() : false);
                if (window.SimCanvas) {
                  window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
                }
                showFeedback('✅ تم التوصيل', 'success');
              } else {
                showFeedback(result.message || '⚠️ فشل التوصيل', 'error');
              }
            }
          }
        });
      })(term, id, i);

      el.appendChild(term);
    }

    canvas.appendChild(el);

    // Apply transform
    if (window.SimCanvas) {
      window.SimCanvas.applyTransformToElement(el);
    }

    simState.placedComponents.push({
      id: id, compId: compId, el: el, x: x, y: y,
      properties: {}, rotation: 0,
      compState: { active: false, energized: false, closed: false }
    });

    if (window.SimCanvas) {
      window.SimCanvas.updateComponentCount(simState.placedComponents.length);
    }

    console.log('Added: ' + def.name + ' id=' + id);
  }

  // ========== DELETE COMPONENT ==========
  function deleteComponent(id) {
    var comp = getComponentById(id);
    if (comp && comp.el && comp.el.parentNode) {
      comp.el.parentNode.removeChild(comp.el);
    }
    simState.placedComponents = simState.placedComponents.filter(function (c) { return c.id !== id; });
    if (window.SimWires) {
      window.SimWires.deleteConnectionsForComponent(id);
      window.SimWires.drawAllWires(window.SimEngine ? window.SimEngine.isActive() : false);
    }
    if (window.SimSelection) window.SimSelection.removeComponent(id, simState.placedComponents);
    if (simState.placedComponents.length === 0) {
      var ph = document.getElementById('canvasPlaceholder');
      if (ph) ph.style.display = '';
    }
    if (window.SimCanvas) {
      window.SimCanvas.updateComponentCount(simState.placedComponents.length);
      window.SimCanvas.updateConnectionCount(window.SimWires ? window.SimWires.getConnectionCount() : 0);
    }
    if (window.SimProperties) window.SimProperties.hide();
  }

  function getComponentById(id) {
    for (var i = 0; i < simState.placedComponents.length; i++) {
      if (simState.placedComponents[i].id === id) return simState.placedComponents[i];
    }
    return null;
  }

  // ========== INIT ==========
  function initSimulator() {
    simState.placedComponents = [];
    simState.componentIdCounter = 0;

    console.log('Initializing simulator...');

    if (window.SimCanvas) window.SimCanvas.init('simCanvas');
    if (window.SimWires) window.SimWires.init(simState, window.SimCanvas);
    if (window.SimEngine) window.SimEngine.init(simState);
    if (window.SimSelection) window.SimSelection.init();
    if (window.SimProperties) window.SimProperties.init(simState);

    setupLibraryDirectly();
    setupToolbarButtons();
    setupKeyboardShortcuts();

    // Close properties button
    var closeBtn = document.getElementById('btnCloseProperties');
    if (closeBtn && window.SimProperties) {
      closeBtn.addEventListener('click', function () { window.SimProperties.hide(); });
    }

    console.log('Simulator initialized');
  }

  // ========== LIBRARY ==========
  function setupLibraryDirectly() {
    var scroll = document.getElementById('simLibraryScroll');
    var searchInput = document.getElementById('simLibrarySearch');

    if (scroll) {
      scroll.addEventListener('click', function (e) {
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
          if (compId) {
            if (window.SimHistory && window.SimEngine) {
              window.SimHistory.push(window.SimEngine.getStateSnapshot());
            }
            addComponent(compId, 60 + Math.random() * 120, 60 + Math.random() * 120);
          }
          return;
        }
      });

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

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var query = this.value.toLowerCase().trim();
        var allItems = document.querySelectorAll('.sim-lib-item');
        allItems.forEach(function (item) {
          var text = item.textContent.toLowerCase();
          item.style.display = (query === '' || text.indexOf(query) !== -1) ? '' : 'none';
        });
      });
    }

    // Drop on canvas
    var canvas = document.getElementById('simCanvas');
    if (canvas) {
      canvas.addEventListener('dragover', function (e) { e.preventDefault(); });
      canvas.addEventListener('drop', function (e) {
        e.preventDefault();
        var compId = e.dataTransfer.getData('text/plain');
        if (compId) {
          var rect = canvas.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          addComponent(compId, Math.max(0, x - 35), Math.max(0, y - 20));
        }
      });
    }
  }

  // ========== TOOLBAR ==========
  function setupToolbarButtons() {
    var bind = function (id, handler) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', handler);
    };

    bind('simBtnUndo', function () {
      if (window.SimHistory && window.SimEngine && window.SimHistory.canUndo()) {
        window.SimHistory.undo(
          function () { return window.SimEngine.getStateSnapshot(); },
          function (s) { window.SimEngine.restoreSnapshot(s); }
        );
        if (window.SimWires) window.SimWires.drawAllWires(window.SimEngine.isActive());
        if (window.SimCanvas) window.SimCanvas.updateComponentCount(simState.placedComponents.length);
      }
    });

    bind('simBtnRedo', function () {
      if (window.SimHistory && window.SimEngine && window.SimHistory.canRedo()) {
        window.SimHistory.redo(
          function () { return window.SimEngine.getStateSnapshot(); },
          function (s) { window.SimEngine.restoreSnapshot(s); }
        );
        if (window.SimWires) window.SimWires.drawAllWires(window.SimEngine.isActive());
        if (window.SimCanvas) window.SimCanvas.updateComponentCount(simState.placedComponents.length);
      }
    });

    bind('simBtnRun', function () {
      if (window.SimEngine) {
        var r = window.SimEngine.run();
        showFeedback(r.message, r.success ? 'success' : 'error');
      }
    });

    bind('simBtnStop', function () {
      if (window.SimEngine) {
        var r = window.SimEngine.stop();
        showFeedback(r.message, 'info');
      }
    });

    bind('simBtnValidate', function () {
      if (window.SimValidation && window.SimWires) {
        var v = window.SimValidation.validate(simState.placedComponents, window.SimWires.getConnections());
        showFeedback(v.valid ? '✅ الدائرة صحيحة!' : '⚠️ ' + v.issues.join(' | '), v.valid ? 'success' : 'error');
      }
    });

    bind('simBtnZoomIn', function () { if (window.SimCanvas) window.SimCanvas.zoomIn(); });
    bind('simBtnZoomOut', function () { if (window.SimCanvas) window.SimCanvas.zoomOut(); });
    bind('simBtnZoomFit', function () { if (window.SimCanvas) window.SimCanvas.zoomToFit(simState.placedComponents); });
    bind('simBtnSnap', function () { if (window.SimCanvas) window.SimCanvas.toggleSnap(); });
    bind('simBtnGridSize', function () { if (window.SimCanvas) window.SimCanvas.cycleGridSize(); });

    bind('simBtnClearAll', function () {
      if (simState.placedComponents.length === 0) return;
      if (!confirm('مسح جميع العناصر؟')) return;
      if (window.SimHistory && window.SimEngine) window.SimHistory.push(window.SimEngine.getStateSnapshot());
      var canvas = document.getElementById('simCanvas');
      if (canvas) {
        var comps = canvas.querySelectorAll('.sim-component');
        for (var i = 0; i < comps.length; i++) comps[i].remove();
      }
      simState.placedComponents = [];
      if (window.SimWires) window.SimWires.clearAll();
      if (window.SimSelection) window.SimSelection.clearAll();
      if (window.SimProperties) window.SimProperties.hide();
      var ph = document.getElementById('canvasPlaceholder');
      if (ph) ph.style.display = '';
      if (window.SimCanvas) { window.SimCanvas.updateComponentCount(0); window.SimCanvas.updateConnectionCount(0); }
      showFeedback('🗑️ تم المسح', 'info');
    });

    bind('simBtnSave', function () {
      if (!window.SimProject) return;
      var name = prompt('اسم المشروع:');
      if (!name) return;
      var r = window.SimProject.save(name, simState, window.SimWires);
      showFeedback(r.message, r.success ? 'success' : 'error');
    });

    bind('simBtnExport', function () {
      if (!window.SimProject) return;
      var name = prompt('اسم الملف:', 'مشروع');
      if (!name) return;
      var r = window.SimProject.exportToJSON(simState, window.SimWires, name);
      showFeedback(r.message, 'success');
    });

    bind('simBtnImport', function () {
      if (!window.SimProject) return;
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = function (e) {
        var file = e.target.files[0];
        if (!file) return;
        window.SimProject.importFromJSON(file).then(function (r) {
          if (r.success && window.SimEngine) {
            window.SimEngine.restoreSnapshot(r.project.data);
            if (window.SimWires) window.SimWires.drawAllWires(false);
            showFeedback('✅ تم الاستيراد', 'success');
          }
        });
      };
      input.click();
    });
  }

  // ========== KEYBOARD ==========
  function setupKeyboardShortcuts() {
    if (keyboardHandler) document.removeEventListener('keydown', keyboardHandler);
    keyboardHandler = function (e) {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      var ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (window.SimHistory && window.SimEngine && window.SimHistory.canUndo()) {
          window.SimHistory.undo(function () { return window.SimEngine.getStateSnapshot(); }, function (s) { window.SimEngine.restoreSnapshot(s); });
          if (window.SimWires) window.SimWires.drawAllWires(window.SimEngine.isActive());
        }
      }
      if (ctrl && e.key === 'y') {
        e.preventDefault();
        if (window.SimHistory && window.SimEngine && window.SimHistory.canRedo()) {
          window.SimHistory.redo(function () { return window.SimEngine.getStateSnapshot(); }, function (s) { window.SimEngine.restoreSnapshot(s); });
          if (window.SimWires) window.SimWires.drawAllWires(window.SimEngine.isActive());
        }
      }
      if (e.key === 'Delete' && window.SimSelection) {
        var ids = window.SimSelection.getSelectedIds();
        if (ids.length > 0) {
          e.preventDefault();
          if (window.SimHistory && window.SimEngine) window.SimHistory.push(window.SimEngine.getStateSnapshot());
          for (var i = 0; i < ids.length; i++) deleteComponent(ids[i]);
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

  function showFeedback(msg, type) {
    var fb = document.getElementById('simFeedbackMsg');
    if (!fb) return;
    fb.textContent = msg;
    fb.className = 'sim-feedback-msg';
    if (type) fb.classList.add(type);
    fb.style.display = 'block';
    clearTimeout(fb._timeout);
    fb._timeout = setTimeout(function () { fb.style.display = 'none'; }, 3000);
  }

  // ========== PUBLIC API ==========
  window.getSimulatorHTML = getSimulatorHTML;
  window.initSimulator = initSimulator;
  window.SimAddComponent = addComponent;
  window.SimDeleteComponent = deleteComponent;
  window.SimGetState = function () { return simState; };
})();
