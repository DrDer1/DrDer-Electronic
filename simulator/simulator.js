/* ==========================================================================
   DrDer Electronic - Simulator Main Entry Point
   Initializes and coordinates all simulator modules
   ========================================================================== */
(function () {
  'use strict';

  /**
   * Global simulator state shared across all modules
   */
  const simState = {
    placedComponents: [],
    componentIdCounter: 0
  };

  /**
   * Generate the simulator HTML
   */
  function getSimulatorHTML() {
    let libraryHTML = '';
    Object.entries(window.SIM_COMPONENTS).forEach(([catKey, cat]) => {
      libraryHTML += `
        <div class="sim-category" data-category="${catKey}">
          <div class="sim-cat-header" data-cat="${catKey}">
            <span>${cat.icon} ${cat.name}</span>
            <span class="sim-cat-arrow">▼</span>
          </div>
          <div class="sim-cat-items" id="simCatItems-${catKey}">
      `;
      cat.items.forEach(item => {
        libraryHTML += `
          <button class="sim-lib-item" data-comp="${item.id}" title="${item.name}" draggable="true">
            <span class="sim-lib-icon">${item.icon}</span>
            <span class="sim-lib-name">${item.name}</span>
          </button>
        `;
      });
      libraryHTML += `</div></div>`;
    });

    return `
    <div class="sim-full-container">
      <!-- Left Panel - Library -->
      <aside class="sim-panel-left" id="simToolbox">
        <div class="sim-panel-header">
          <h3>📦 مكتبة العناصر</h3>
        </div>
        <input type="search" class="sim-search-input" id="simLibrarySearch" placeholder="🔍 بحث عن عنصر..." autocomplete="off">
        <div class="sim-library-scroll" id="simLibraryScroll">
          ${libraryHTML}
        </div>
      </aside>

      <!-- Main Area -->
      <div class="sim-main-area">
        <!-- Top Toolbar -->
        <div class="sim-toolbar">
          <div class="sim-toolbar-group">
            <button class="sim-tb-btn" id="simBtnUndo" title="تراجع Ctrl+Z" disabled>↩</button>
            <button class="sim-tb-btn" id="simBtnRedo" title="إعادة Ctrl+Y" disabled>↪</button>
            <span class="sim-toolbar-sep"></span>
            <button class="sim-tb-btn" id="simBtnCopy" title="نسخ Ctrl+C">📋</button>
            <button class="sim-tb-btn" id="simBtnPaste" title="لصق Ctrl+V">📄</button>
            <button class="sim-tb-btn" id="simBtnDelete" title="حذف Del">🗑️</button>
            <span class="sim-toolbar-sep"></span>
            <button class="sim-tb-btn" id="simBtnZoomIn" title="تكبير">🔍+</button>
            <button class="sim-tb-btn" id="simBtnZoomOut" title="تصغير">🔍-</button>
            <button class="sim-tb-btn" id="simBtnZoomFit" title="ملائمة">🔲</button>
            <span class="sim-toolbar-sep"></span>
            <button class="sim-tb-btn active" id="simBtnSnap" title="التصاق الشبكة">📏</button>
            <button class="sim-tb-btn" id="simBtnGridSize" title="حجم الشبكة">20px</button>
          </div>
          <div class="sim-toolbar-group">
            <button class="sim-tb-btn sim-tb-success" id="simBtnRun" title="تشغيل">▶️</button>
            <button class="sim-tb-btn sim-tb-danger" id="simBtnStop" title="إيقاف">⏹️</button>
            <button class="sim-tb-btn sim-tb-warning" id="simBtnValidate" title="تحقق">✅</button>
          </div>
          <div class="sim-toolbar-group">
            <button class="sim-tb-btn" id="simBtnSave" title="حفظ">💾</button>
            <button class="sim-tb-btn" id="simBtnLoad" title="فتح">📂</button>
            <button class="sim-tb-btn" id="simBtnExport" title="تصدير">📥</button>
            <button class="sim-tb-btn" id="simBtnImport" title="استيراد">📤</button>
            <span class="sim-toolbar-sep"></span>
            <button class="sim-tb-btn" id="simBtnProps" title="خصائص">📋</button>
            <button class="sim-tb-btn sim-tb-danger" id="simBtnClearAll" title="مسح الكل">🗑️</button>
          </div>
        </div>

        <!-- Canvas -->
        <div class="sim-canvas-container">
          <div class="sim-canvas-area" id="simCanvas" tabindex="0">
            <svg class="sim-grid-svg" id="canvasGridSvg">
              <defs>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-color)" stroke-width="0.5" opacity="0.2"/>
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--border-color)" stroke-width="1" opacity="0.4"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridPattern)"/>
            </svg>
            <div class="canvas-placeholder" id="canvasPlaceholder">
              <div class="placeholder-content">
                <span class="placeholder-icon">🔧</span>
                <span class="placeholder-text">اسحب العناصر من المكتبة أو انقر عليها للإضافة</span>
                <span class="placeholder-hint">زر الفأرة الأوسط للسحب | العجلة للتكبير | Ctrl+Z للتراجع</span>
              </div>
            </div>
            <svg class="sim-wires-svg" id="canvasWiresSvg"></svg>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="sim-statusbar">
          <span class="sim-status-item" id="simStatusZoom">تكبير: 100%</span>
          <span class="sim-status-item" id="simStatusComponents">العناصر: 0</span>
          <span class="sim-status-item" id="simStatusConnections">التوصيلات: 0</span>
          <span class="sim-status-item" id="simStatusPosition">x: 0, y: 0</span>
          <span class="sim-status-item" id="simStatusGrid">شبكة: 20px</span>
          <span class="sim-status-item" id="simStatusSnap">✅ التصاق</span>
        </div>

        <!-- Feedback -->
        <div class="sim-feedback-msg" id="simFeedbackMsg" style="display:none;"></div>
      </div>

      <!-- Right Panel - Properties -->
      <aside class="sim-panel-right" id="simProperties" style="display:none;">
        <div class="sim-panel-header">
          <h3>📋 خصائص العنصر</h3>
          <button class="btn-icon-sm" id="btnCloseProperties" title="إغلاق">✕</button>
        </div>
        <div class="sim-props-content" id="propertiesContent">
          <p class="sim-props-empty">اختر عنصراً لعرض خصائصه</p>
        </div>
      </aside>
    </div>`;
  }

  /**
   * Initialize the simulator
   */
  function initSimulator() {
    // Reset state
    simState.placedComponents = [];
    simState.componentIdCounter = 0;

    // Initialize all modules
    window.SimCanvas.init('simCanvas', simState);
    window.SimDrag.init(simState, window.SimCanvas.getCanvas());
    window.SimSelection.init();
    window.SimWires.init(simState, window.SimCanvas);
    window.SimEngine.init(simState);
    window.SimProperties.init(simState);
    window.SimLibrary.init();
    window.SimUI.init();

    // Setup canvas event handlers
    window.SimCanvas.onMouseDown((e) => {
      // Check if clicked on a component
      if (e.target.closest('.sim-terminal')) return;
      if (e.target.closest('.sim-comp-delete')) return;

      const compEl = e.target.closest('.sim-component');
      if (compEl) return; // Handled by component's own event      // Check if clicked on a wire
      if (e.target.closest('.sim-wire-path')) {
        window.SimSelection.selectWire(e.target.closest('.sim-wire-path'));
        return;
      }

      // Clicked on empty canvas
      if (e.target.id === 'simCanvas' || e.target.closest('.canvas-placeholder') ||
          e.target.closest('.sim-grid-svg') || e.target.id === 'canvasGridSvg') {
        window.SimSelection.clearAll(simState.placedComponents);
        window.SimProperties.hide();
      }
    });

    window.SimCanvas.onMouseMove((e) => {
      // Update position in status bar
      const world = window.SimCanvas.screenToWorld(e.clientX, e.clientY);
      window.SimCanvas.updatePositionInfo(world.x, world.y);

      // Handle dragging
      if (window.SimDrag.isDragging()) {
        window.SimDrag.dragMove(e.clientX, e.clientY, window.SimCanvas, window.SimSelection);
        window.SimWires.drawAllWires(window.SimEngine.isActive());
      }

      // Handle wire creation
      if (window.SimWires.isConnecting()) {
        window.SimWires.updateTempWire(e.clientX, e.clientY);
      }
    });

    window.SimCanvas.onMouseUp((e) => {
      // End dragging
      if (window.SimDrag.isDragging()) {
        const moved = window.SimDrag.endDrag();
        if (moved) {
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
        }
        return;
      }

      // Finish wire connection
      if (window.SimWires.isConnecting()) {
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        const result = window.SimWires.finishConnection(e.clientX, e.clientY);

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

    // Properties callback
    window.SimProperties.onPropertyChanged((component, property, value) => {
      if (property === 'delete') {
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        window.SimUI._deleteComponent(component.id);
        window.SimProperties.hide();
      } else {
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        window.SimWires.drawAllWires(window.SimEngine.isActive());
      }
    });

    // Library callback
    window.SimLibrary.onComponentSelect((compId) => {
      window.SimHistory.push(window.SimEngine.getStateSnapshot());
      const x = 40 + Math.random() * 100;
      const y = 40 + Math.random() * 100;
      window.SimUI._addComponent(compId, x, y);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (window.SimHistory.canUndo()) {
          window.SimHistory.undo(
            () => window.SimEngine.getStateSnapshot(),
            (snapshot) => window.SimEngine.restoreSnapshot(snapshot)
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
            () => window.SimEngine.getStateSnapshot(),
            (snapshot) => window.SimEngine.restoreSnapshot(snapshot)
          );
          window.SimWires.drawAllWires(window.SimEngine.isActive());
          window.SimCanvas.updateComponentCount(simState.placedComponents.length);
          window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedIds = window.SimSelection.getSelectedIds();
        if (selectedIds.length > 0) {
          e.preventDefault();
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
          selectedIds.forEach(id => window.SimUI._deleteComponent(id));
        }
      }

      if (e.key === 'Escape') {
        window.SimSelection.clearAll(simState.placedComponents);
        window.SimProperties.hide();
        window.SimWires.cancelConnection();
      }
    });
  }

  /* ========================================================================
     Public API - Must match what app.js expects
     ======================================================================== */
  window.getSimulatorHTML = getSimulatorHTML;
  window.initSimulator = initSimulator;
})();
