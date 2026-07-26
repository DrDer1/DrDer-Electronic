/* ==========================================================================
   DrDer Electronic - Professional Circuit Simulator v3.0
   Industrial Grade | Full Component Library | Real Simulation Engine
   ========================================================================== */

(function () {
  'use strict';

  /* ========================================================================
     Component Library
     ======================================================================== */
  const COMPONENT_CATEGORIES = {
    sources: {
      name: 'مصادر الطاقة', icon: '🔋',
      items: [
        { id: 'battery', name: 'بطارية', icon: '🔋', type: 'source', subtype: 'dc', voltage: 12, current: 5, terminals: 2 },
        { id: 'dc_supply', name: 'مصدر DC', icon: '⎓', type: 'source', subtype: 'dc', voltage: 24, current: 10, terminals: 2 },
        { id: 'ac_supply_1ph', name: 'مصدر AC أحادي', icon: '∿', type: 'source', subtype: 'ac_1ph', voltage: 220, current: 16, frequency: 50, terminals: 2 },
        { id: 'ac_supply_3ph', name: 'مصدر AC ثلاثي', icon: '⚡', type: 'source', subtype: 'ac_3ph', voltage: 380, current: 32, frequency: 50, terminals: 4 },
        { id: 'transformer', name: 'محول', icon: '🔃', type: 'source', subtype: 'transformer', primaryV: 380, secondaryV: 220, power: 1000, terminals: 4 },
        { id: 'power_supply', name: 'مزود طاقة', icon: '🔌', type: 'source', subtype: 'psu', inputV: 220, outputV: 24, current: 5, terminals: 4 }
      ]
    },
    protection: {
      name: 'الحماية', icon: '🛡️',
      items: [
        { id: 'fuse', name: 'فيوز', icon: '🔗', type: 'protection', subtype: 'fuse', current: 10, terminals: 2 },
        { id: 'mcb', name: 'MCB قاطع مصغر', icon: '🔒', type: 'protection', subtype: 'mcb', current: 16, curve: 'C', poles: 1, terminals: 2 },
        { id: 'mccb', name: 'MCCB قاطع مقولب', icon: '🔐', type: 'protection', subtype: 'mccb', current: 100, poles: 3, terminals: 6 },
        { id: 'rcbo', name: 'RCBO', icon: '🛡️', type: 'protection', subtype: 'rcbo', current: 16, leakage: 30, terminals: 4 },
        { id: 'rcd', name: 'RCD حماية تفاضلية', icon: '⚡', type: 'protection', subtype: 'rcd', current: 40, leakage: 30, terminals: 4 },
        { id: 'spd', name: 'SPD حماية زيادة', icon: '🌩️', type: 'protection', subtype: 'spd', voltage: 275, terminals: 3 },
        { id: 'overload', name: 'Overload Relay', icon: '🔴', type: 'protection', subtype: 'overload', current: 10, terminals: 3 }
      ]
    },
    controls: {
      name: 'التحكم', icon: '🎛️',
      items: [
        { id: 'push_no', name: 'Push Button NO', icon: '🟢', type: 'control', subtype: 'push_no', color: '#3fb950', terminals: 2 },
        { id: 'push_nc', name: 'Push Button NC', icon: '🔴', type: 'control', subtype: 'push_nc', color: '#f85149', terminals: 2 },
        { id: 'selector_switch', name: 'Selector Switch', icon: '🔘', type: 'control', subtype: 'selector', positions: 2, terminals: 3 },
        { id: 'emergency_stop', name: 'Emergency Stop', icon: '⛔', type: 'control', subtype: 'emergency', color: '#f85149', terminals: 2 },
        { id: 'limit_switch_no', name: 'Limit Switch NO', icon: '↔️', type: 'control', subtype: 'limit_no', terminals: 2 },
        { id: 'limit_switch_nc', name: 'Limit Switch NC', icon: '↔️', type: 'control', subtype: 'limit_nc', terminals: 2 },
        { id: 'float_switch', name: 'Float Switch', icon: '🔄', type: 'control', subtype: 'float', terminals: 2 },
        { id: 'pressure_switch', name: 'Pressure Switch', icon: '💨', type: 'control', subtype: 'pressure', terminals: 2 },
        { id: 'temp_switch', name: 'Temperature Switch', icon: '🌡️', type: 'control', subtype: 'temperature', terminals: 2 }
      ]
    },
    relays_contactors: {
      name: 'الريليه والكونتاكتور', icon: '🔀',
      items: [
        { id: 'relay', name: 'Relay ريليه', icon: '🔀', type: 'relay', subtype: 'relay', coilV: 24, contacts: 4, terminals: 8 },
        { id: 'contactor', name: 'Contactor كونتاكتور', icon: '🔌', type: 'relay', subtype: 'contactor', coilV: 220, powerContacts: 3, auxContacts: 2, terminals: 10 },
        { id: 'timer_on', name: 'Timer ON Delay', icon: '⏱️', type: 'relay', subtype: 'timer_on', coilV: 24, delay: 5, contacts: 2, terminals: 6 },
        { id: 'timer_off', name: 'Timer OFF Delay', icon: '⏲️', type: 'relay', subtype: 'timer_off', coilV: 24, delay: 5, contacts: 2, terminals: 6 },
        { id: 'aux_contact_no', name: 'Aux Contact NO', icon: '➕', type: 'relay', subtype: 'aux_no', terminals: 2 },
        { id: 'aux_contact_nc', name: 'Aux Contact NC', icon: '➖', type: 'relay', subtype: 'aux_nc', terminals: 2 }
      ]
    },
    loads: {
      name: 'الأحمال', icon: '💡',
      items: [
        { id: 'lamp', name: 'Lamp لمبة', icon: '💡', type: 'load', subtype: 'lamp', voltage: 220, power: 60, terminals: 2 },
        { id: 'motor_1ph', name: 'Motor 1 Phase', icon: '⚙️', type: 'load', subtype: 'motor_1ph', voltage: 220, power: 750, terminals: 2 },
        { id: 'motor_3ph', name: 'Motor 3 Phase', icon: '⚙️', type: 'load', subtype: 'motor_3ph', voltage: 380, power: 3000, terminals: 3 },
        { id: 'heater', name: 'Heater سخان', icon: '🔥', type: 'load', subtype: 'heater', voltage: 220, power: 2000, terminals: 2 },
        { id: 'fan', name: 'Fan مروحة', icon: '🌀', type: 'load', subtype: 'fan', voltage: 220, power: 100, terminals: 2 },
        { id: 'solenoid', name: 'Solenoid ملف', icon: '🧲', type: 'load', subtype: 'solenoid', voltage: 24, terminals: 2 },
        { id: 'buzzer', name: 'Buzzer طنان', icon: '🔔', type: 'load', subtype: 'buzzer', voltage: 12, terminals: 2 }
      ]
    },
    sensors: {
      name: 'الحساسات', icon: '📡',
      items: [
        { id: 'proximity_sensor', name: 'Proximity Sensor', icon: '📳', type: 'sensor', subtype: 'proximity', voltage: 24, terminals: 3 },
        { id: 'photo_sensor', name: 'Photo Sensor', icon: '📸', type: 'sensor', subtype: 'photo', voltage: 24, terminals: 3 },
        { id: 'ultrasonic_sensor', name: 'Ultrasonic Sensor', icon: '📡', type: 'sensor', subtype: 'ultrasonic', voltage: 24, terminals: 3 },
        { id: 'temp_sensor', name: 'Temp Sensor', icon: '🌡️', type: 'sensor', subtype: 'temp', voltage: 24, terminals: 3 }
      ]
    },
    passive: {
      name: 'العناصر السلبية', icon: '⚡',
      items: [
        { id: 'resistor', name: 'Resistor مقاومة', icon: '⚡', type: 'passive', subtype: 'resistor', value: 1000, unit: 'Ω', terminals: 2 },
        { id: 'capacitor', name: 'Capacitor مكثف', icon: '🔲', type: 'passive', subtype: 'capacitor', value: 100, unit: 'µF', terminals: 2 },
        { id: 'inductor', name: 'Inductor ملف', icon: '🧲', type: 'passive', subtype: 'inductor', value: 10, unit: 'mH', terminals: 2 }
      ]
    }
  };

  /* ========================================================================
     State
     ======================================================================== */
  const state = {
    placedComponents: [],
    connections: [],
    componentIdCounter: 0,
    dragging: null,
    dragStartX: 0, dragStartY: 0,
    dragCompStartX: 0, dragCompStartY: 0,
    connectionStart: null,
    canvasRect: null,
    isPanning: false,
    panStartX: 0, panStartY: 0,
    panOffsetX: 0, panOffsetY: 0,
    zoomLevel: 1,
    undoStack: [], redoStack: [],
    selectedComponents: [],
    clipboard: [],
    gridSize: 20,
    snapToGrid: true,
    simulationActive: false,
    propertiesTarget: null,
  };

  const MAX_UNDO = 50;
  const GRID_SIZES = [10, 20, 40];
  let currentGridIndex = 1;

  /* ========================================================================
     Helpers
     ======================================================================== */
  function getAllComponents() {
    const all = [];
    Object.values(COMPONENT_CATEGORIES).forEach(cat => all.push(...cat.items));
    return all;
  }

  function findComponentDef(compId) {
    return getAllComponents().find(c => c.id === compId);
  }

  function getTerminalPositions(count) {
    if (count === 2) return [{ x: 0, y: 50 }, { x: 100, y: 50 }];
    if (count === 3) return [{ x: 0, y: 30 }, { x: 100, y: 30 }, { x: 50, y: 85 }];
    if (count === 4) return [{ x: 0, y: 25 }, { x: 100, y: 25 }, { x: 0, y: 75 }, { x: 100, y: 75 }];
    if (count === 6) return [{ x: 0, y: 15 }, { x: 100, y: 15 }, { x: 0, y: 42 }, { x: 100, y: 42 }, { x: 0, y: 70 }, { x: 100, y: 70 }];
    if (count === 8) {
      const p = [];
      for (let i = 0; i < 4; i++) { p.push({ x: 0, y: 10 + i * 25 }); p.push({ x: 100, y: 10 + i * 25 }); }
      return p;
    }
    if (count === 10) {
      const p = [];
      for (let i = 0; i < 5; i++) { p.push({ x: 0, y: 8 + i * 20 }); p.push({ x: 100, y: 8 + i * 20 }); }
      return p;
    }
    return Array.from({ length: count }, (_, i) => ({ x: i % 2 === 0 ? 0 : 100, y: 15 + Math.floor(i / 2) * (70 / Math.ceil(count / 2)) }));
  }

  function getTerminalPixelPos(comp, terminalIndex) {
    const def = findComponentDef(comp.compId);
    const positions = getTerminalPositions(def?.terminals || 2);
    const pos = positions[terminalIndex] || positions[0];
    return { x: (pos.x / 100) * comp.el.offsetWidth, y: (pos.y / 100) * comp.el.offsetHeight };
  }

  /* ========================================================================
     Get HTML
     ======================================================================== */
  function getSimulatorHTML() {
    let toolboxHTML = '';
    Object.entries(COMPONENT_CATEGORIES).forEach(([key, cat]) => {
      toolboxHTML += `
        <div class="toolbox-category">
          <div class="toolbox-cat-header" data-cat="${key}">
            <span>${cat.icon} ${cat.name}</span>
            <span class="toolbox-arrow">▼</span>
          </div>
          <div class="toolbox-cat-items" id="toolbox-${key}">
            ${cat.items.map(comp => `
              <button class="toolbox-item" data-comp="${comp.id}" title="${comp.name}" draggable="true">
                <span class="toolbox-item-icon">${comp.icon}</span>
                <span class="toolbox-item-name">${comp.name}</span>
              </button>
            `).join('')}
          </div>
        </div>`;
    });

    return `
    <div class="simulator-full-container">
      <aside class="sim-sidebar sim-sidebar-left" id="simToolbox">
        <div class="sidebar-header">
          <h3>📦 مكتبة العناصر</h3>
        </div>
        <input type="search" class="toolbox-search" id="toolboxSearch" placeholder="🔍 بحث..." autocomplete="off">
        <div class="toolbox-scroll">${toolboxHTML}</div>
      </aside>
      <div class="sim-main-area">
        <div class="sim-top-toolbar" id="simTopToolbar">
          <div class="toolbar-group">
            <button class="tb-btn" id="btnUndo" title="تراجع Ctrl+Z" disabled>↩</button>
            <button class="tb-btn" id="btnRedo" title="إعادة Ctrl+Y" disabled>↪</button>
            <span class="tb-sep"></span>
            <button class="tb-btn" id="btnCopy" title="نسخ Ctrl+C">📋</button>
            <button class="tb-btn" id="btnPaste" title="لصق Ctrl+V">📄</button>
            <button class="tb-btn" id="btnDelete" title="حذف Del">🗑️</button>
            <span class="tb-sep"></span>
            <button class="tb-btn" id="btnZoomIn" title="تكبير">🔍+</button>
            <button class="tb-btn" id="btnZoomOut" title="تصغير">🔍-</button>
            <button class="tb-btn" id="btnZoomFit" title="ملائمة">🔲</button>
            <span class="tb-sep"></span>
            <button class="tb-btn ${state.snapToGrid ? 'active' : ''}" id="btnSnapGrid" title="شبكة">📏</button>
            <button class="tb-btn" id="btnGridSize" title="حجم الشبكة">${state.gridSize}px</button>
          </div>
          <div class="toolbar-group">
            <button class="tb-btn tb-btn-success" id="btnSimRun" title="تشغيل المحاكاة">▶️</button>
            <button class="tb-btn tb-btn-danger" id="btnSimStop" title="إيقاف المحاكاة">⏹️</button>
            <button class="tb-btn tb-btn-warning" id="btnSimValidate" title="تحقق">✅</button>
          </div>
          <div class="toolbar-group">
            <button class="tb-btn tb-btn-danger" id="btnClearAll" title="مسح الكل">🗑️</button>
            <button class="tb-btn" id="btnToggleSidebar" title="خصائص">📋</button>
          </div>
        </div>
        <div class="sim-canvas-wrapper">
          <div class="sim-canvas-area" id="simCanvas" tabindex="0">
            <svg class="canvas-grid-svg" id="canvasGridSvg">
              <defs>
                <pattern id="gridPattern" width="${state.gridSize}" height="${state.gridSize}" patternUnits="userSpaceOnUse">
                  <path d="M ${state.gridSize} 0 L 0 0 0 ${state.gridSize}" fill="none" stroke="var(--border-color)" stroke-width="0.5" opacity="0.2"/>
                  <path d="M ${state.gridSize * 5} 0 L 0 0 0 ${state.gridSize * 5}" fill="none" stroke="var(--border-color)" stroke-width="1" opacity="0.4"/>
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
            <svg class="canvas-wires-svg" id="canvasWiresSvg"></svg>
          </div>
        </div>
        <div class="sim-statusbar" id="simStatusBar">
          <span class="status-item" id="statusZoom">تكبير: 100%</span>
          <span class="status-item" id="statusComponents">العناصر: 0</span>
          <span class="status-item" id="statusConnections">التوصيلات: 0</span>
          <span class="status-item" id="statusPosition">x: 0, y: 0</span>
          <span class="status-item" id="statusGrid">شبكة: ${state.gridSize}px</span>
          <span class="status-item" id="statusSnap">${state.snapToGrid ? '✅ التصاق' : '❌ حر'}</span>
        </div>
        <div class="sim-feedback" id="simFeedback" style="display:none;"></div>
      </div>
      <aside class="sim-sidebar sim-sidebar-right" id="simProperties" style="display:none;">
        <div class="sidebar-header">
          <h3>📋 خصائص العنصر</h3>
          <button class="btn-icon-sm" id="btnCloseProperties" title="إغلاق">✕</button>
        </div>
        <div class="properties-content" id="propertiesContent">
          <p class="properties-empty">اختر عنصراً لعرض خصائصه</p>
        </div>
      </aside>
    </div>`;
  }

  /* ========================================================================
     Init
     ======================================================================== */
  function initSimulator() {
    resetState();
    setupCanvas();
    setupToolbar();
    setupToolbox();
    setupKeyboard();
    setupDragDrop();
    updateStatusBar();
    updateUndoRedoButtons();
  }

  function resetState() {
    state.placedComponents = [];
    state.connections = [];
    state.componentIdCounter = 0;
    state.dragging = null;
    state.connectionStart = null;
    state.isPanning = false;
    state.panOffsetX = 0; state.panOffsetY = 0;
    state.zoomLevel = 1;
    state.undoStack = []; state.redoStack = [];
    state.selectedComponents = [];
    state.clipboard = [];
    state.simulationActive = false;
    state.propertiesTarget = null;
  }

  /* ========================================================================
     Canvas Events
     ======================================================================== */
  function setupCanvas() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    state.canvasRect = canvas.getBoundingClientRect();

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('resize', () => {
      state.canvasRect = canvas.getBoundingClientRect();
      redrawAllWires();
    });
    canvas.focus();
  }

  function onMouseDown(e) {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    state.canvasRect = canvas.getBoundingClientRect();

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      state.isPanning = true;
      state.panStartX = e.clientX - state.panOffsetX;
      state.panStartY = e.clientY - state.panOffsetY;
      canvas.style.cursor = 'grabbing';
      return;
    }
    if (e.target.closest('.connection-point')) return;
    if (e.target.closest('.delete-comp-btn')) return;

    const compEl = e.target.closest('.placed-component');
    if (compEl) {
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) clearSelection();
      selectComponent(parseInt(compEl.dataset.componentId), e.ctrlKey || e.metaKey);
      return;
    }
    if (e.target.closest('.wire-path')) {
      document.querySelectorAll('.wire-path').forEach(w => w.classList.remove('selected'));
      e.target.closest('.wire-path').classList.add('selected');
      clearSelection();
      return;
    }
    if (e.target === canvas || e.target.id === 'canvasGridSvg' || e.target.closest('.canvas-placeholder')) {
      clearSelection();
      hideProperties();
    }
  }

  function onMouseMove(e) {
    const canvas = document.getElementById('simCanvas');
    if (canvas && state.canvasRect) {
      const x = Math.round((e.clientX - state.canvasRect.left - state.panOffsetX) / state.zoomLevel);
      const y = Math.round((e.clientY - state.canvasRect.top - state.panOffsetY) / state.zoomLevel);
      const posEl = document.getElementById('statusPosition');
      if (posEl) posEl.textContent = `x: ${x}, y: ${y}`;
    }
    if (state.isPanning) {
      state.panOffsetX = e.clientX - state.panStartX;
      state.panOffsetY = e.clientY - state.panStartY;
      applyTransform();
      return;
    }
    if (state.dragging) {
      const dx = (e.clientX - state.dragStartX) / state.zoomLevel;
      const dy = (e.clientY - state.dragStartY) / state.zoomLevel;
      let newX = state.dragCompStartX + dx;
      let newY = state.dragCompStartY + dy;
      if (state.snapToGrid) {
        newX = Math.round(newX / state.gridSize) * state.gridSize;
        newY = Math.round(newY / state.gridSize) * state.gridSize;
      }
      newX = Math.max(0, newX); newY = Math.max(0, newY);
      const mdx = newX - state.dragCompStartX;
      const mdy = newY - state.dragCompStartY;
      const ids = (state.selectedComponents.length > 0 && state.selectedComponents.includes(state.dragging.id))
        ? state.selectedComponents : [state.dragging.id];
      ids.forEach(id => {
        const c = state.placedComponents.find(c2 => c2.id === id);
        if (!c || !c.el) return;
        if (id === state.dragging.id) { c.x = newX; c.y = newY; c.el.style.left = `${newX}px`; c.el.style.top = `${newY}px`; }
        else { c.x += mdx; c.y += mdy; c.el.style.left = `${c.x}px`; c.el.style.top = `${c.y}px`; }
      });
      redrawAllWires();
      return;
    }
    if (state.connectionStart) {
      drawTempWire(e.clientX, e.clientY);
    }
  }

  function onMouseUp(e) {
    if (state.isPanning) { state.isPanning = false; const c = document.getElementById('simCanvas'); if (c) c.style.cursor = ''; return; }
    if (state.dragging) {
      if (Math.abs((e.clientX - state.dragStartX) / state.zoomLevel) > 1 || Math.abs((e.clientY - state.dragStartY) / state.zoomLevel) > 1) pushUndo();
      stopDragging(); updateStatusBar(); return;
    }
    if (state.connectionStart) { finishConnection(e.clientX, e.clientY); return; }
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newZoom = Math.max(0.2, Math.min(5, state.zoomLevel + delta));
    const canvas = document.getElementById('simCanvas');
    if (!canvas || !state.canvasRect) { state.zoomLevel = newZoom; applyTransform(); updateStatusBar(); return; }
    const mx = e.clientX - state.canvasRect.left;
    const my = e.clientY - state.canvasRect.top;
    const wx = (mx - state.panOffsetX) / state.zoomLevel;
    const wy = (my - state.panOffsetY) / state.zoomLevel;
    state.zoomLevel = newZoom;
    state.panOffsetX = mx - wx * state.zoomLevel;
    state.panOffsetY = my - wy * state.zoomLevel;
    applyTransform(); updateStatusBar();
  }

  function applyTransform() {
    const t = `translate(${state.panOffsetX}px, ${state.panOffsetY}px) scale(${state.zoomLevel})`;
    document.querySelectorAll('.placed-component').forEach(el => el.style.transform = t);
    document.querySelectorAll('.connection-point').forEach(el => el.style.transform = `translate(-50%,-50%) ${t}`);
    redrawAllWires();
  }

  /* ========================================================================
     Component CRUD
     ======================================================================== */
  function addComponentToCanvas(compId, x, y) {
    const def = findComponentDef(compId);
    if (!def) return;
    const canvas = document.getElementById('simCanvas');
    const ph = document.getElementById('canvasPlaceholder');
    if (!canvas) return;
    if (ph) ph.style.display = 'none';

    if (x === undefined || y === undefined) {
      const cnt = state.placedComponents.filter(c => c.compId === compId).length;
      x = 40 + (cnt % 6) * 110;
      y = 40 + Math.floor(cnt / 6) * 90;
      if (state.snapToGrid) { x = Math.round(x / state.gridSize) * state.gridSize; y = Math.round(y / state.gridSize) * state.gridSize; }
    }

    const id = ++state.componentIdCounter;
    const el = document.createElement('div');
    el.className = 'placed-component';
    el.id = `comp-${id}`;
    el.dataset.componentId = id;
    el.dataset.compType = compId;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.style.transform = `translate(${state.panOffsetX}px, ${state.panOffsetY}px) scale(${state.zoomLevel})`;
    el.setAttribute('role', 'button'); el.setAttribute('aria-label', def.name); el.setAttribute('tabindex', '0');

    el.innerHTML = `<span class="comp-icon">${def.icon}</span><span class="comp-label">${def.name}</span><span class="comp-id-badge">${id}</span><button class="delete-comp-btn" title="حذف">✕</button>`;

    el.querySelector('.delete-comp-btn').addEventListener('click', (ev) => { ev.stopPropagation(); ev.preventDefault(); pushUndo(); deleteComponent(id); });
    el.addEventListener('mousedown', startDrag);
    el.addEventListener('click', (ev) => { if (!state.dragging) { ev.stopPropagation(); selectComponent(id, ev.ctrlKey || ev.metaKey); } });
    el.addEventListener('dblclick', (ev) => { ev.stopPropagation(); showProperties(id); });

    addTerminals(el, id, def);
    canvas.appendChild(el);
    state.placedComponents.push({ id, compId, el, x, y, properties: { ...def }, compState: { active: false, conducting: false } });
    updateStatusBar(); updateUndoRedoButtons();
  }

  function addTerminals(el, componentId, def) {
    const positions = getTerminalPositions(def.terminals || 2);
    positions.forEach((pos, i) => {
      const t = document.createElement('div');
      t.className = 'connection-point';
      t.style.left = `${pos.x}%`; t.style.top = `${pos.y}%`;
      t.style.transform = `translate(-50%,-50%) translate(${state.panOffsetX}px, ${state.panOffsetY}px) scale(${state.zoomLevel})`;
      t.dataset.componentId = componentId;
      t.dataset.terminalIndex = i;
      t.setAttribute('aria-label', `طرف ${i + 1}`);
      t.title = `طرف ${i + 1}`;
      t.addEventListener('mousedown', (ev) => { ev.stopPropagation(); ev.preventDefault(); startConnection(componentId, i, ev); });
      el.appendChild(t);
    });
  }

  function deleteComponent(id) {
    const comp = state.placedComponents.find(c => c.id === id);
    if (comp?.el) comp.el.remove();
    state.placedComponents = state.placedComponents.filter(c => c.id !== id);
    state.connections = state.connections.filter(c => c.fromCompId !== id && c.toCompId !== id);
    state.selectedComponents = state.selectedComponents.filter(s => s !== id);
    redrawAllWires(); updateCanvasPlaceholder(); updateStatusBar(); updateUndoRedoButtons(); hideProperties();
  }

  /* ========================================================================
     Drag
     ======================================================================== */
  function startDrag(e) {
    if (e.button !== 0) return;
    if (e.target.closest('.connection-point') || e.target.closest('.delete-comp-btn')) return;
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget;
    const id = parseInt(el.dataset.componentId);
    state.dragging = { id, el };
    state.dragStartX = e.clientX; state.dragStartY = e.clientY;
    state.dragCompStartX = parseFloat(el.style.left) || 0;
    state.dragCompStartY = parseFloat(el.style.top) || 0;
    el.style.zIndex = '20'; el.style.cursor = 'grabbing';
  }

  function stopDragging() {
    if (state.dragging) { state.dragging.el.style.zIndex = '10'; state.dragging.el.style.cursor = 'move'; state.dragging = null; }
  }

  /* ========================================================================
     Selection
     ======================================================================== */
  function selectComponent(id, add) {
    if (!add) clearSelection();
    const comp = state.placedComponents.find(c => c.id === id);
    if (!comp) return;
    if (add && state.selectedComponents.includes(id)) {
      state.selectedComponents = state.selectedComponents.filter(s => s !== id);
      comp.el.classList.remove('selected');
    } else {
      if (!state.selectedComponents.includes(id)) state.selectedComponents.push(id);
      comp.el.classList.add('selected');
    }
    document.querySelectorAll('.wire-path').forEach(w => w.classList.remove('selected'));
    if (state.selectedComponents.length === 1 && !add) showProperties(id);
    else if (state.selectedComponents.length === 0) hideProperties();
  }

  function clearSelection() {
    state.selectedComponents.forEach(id => { const c = state.placedComponents.find(c2 => c2.id === id); if (c?.el) c.el.classList.remove('selected'); });
    state.selectedComponents = [];
    hideProperties();
  }

  /* ========================================================================
     Connections
     ======================================================================== */
  function startConnection(componentId, terminalIndex, e) {
    const cx = e.clientX, cy = e.clientY;
    state.connectionStart = { componentId, terminalIndex, x: cx, y: cy };
    drawTempWire(cx, cy);
  }

  function drawTempWire(mx, my) {
    const svg = document.getElementById('canvasWiresSvg');
    if (!svg || !state.connectionStart || !state.canvasRect) return;
    const comp = state.placedComponents.find(c => c.id === state.connectionStart.componentId);
    if (!comp?.el) return;
    const pos = getTerminalPixelPos(comp, state.connectionStart.terminalIndex);
    const fx = comp.x + pos.x, fy = comp.y + pos.y;
    const tx = (mx - state.canvasRect.left - state.panOffsetX) / state.zoomLevel;
    const ty = (my - state.canvasRect.top - state.panOffsetY) / state.zoomLevel;
    let g = document.getElementById('tempWireGroup');
    if (!g) { g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'tempWireGroup'; svg.appendChild(g); }
    g.innerHTML = `<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="8,4" opacity="0.8"/>`;
  }

  function finishConnection(mx, my) {
    const tg = document.getElementById('tempWireGroup'); if (tg) tg.remove();
    if (!state.connectionStart || !state.canvasRect) { state.connectionStart = null; return; }
    const canvas = document.getElementById('simCanvas');
    let best = null, bestDist = 30 / state.zoomLevel;
    const tx = (mx - state.canvasRect.left - state.panOffsetX) / state.zoomLevel;
    const ty = (my - state.canvasRect.top - state.panOffsetY) / state.zoomLevel;

    canvas.querySelectorAll('.connection-point').forEach(pt => {
      const pid = parseInt(pt.dataset.componentId);
      if (pid === state.connectionStart.componentId) return;
      const r = pt.getBoundingClientRect();
      const pcx = (r.left + r.width / 2 - state.canvasRect.left - state.panOffsetX) / state.zoomLevel;
      const pcy = (r.top + r.height / 2 - state.canvasRect.top - state.panOffsetY) / state.zoomLevel;
      const d = Math.sqrt((tx - pcx) ** 2 + (ty - pcy) ** 2);
      if (d < bestDist) { bestDist = d; best = { componentId: pid, terminalIndex: parseInt(pt.dataset.terminalIndex) }; }
    });

    if (best) {
      const exists = state.connections.some(c =>
        (c.fromCompId === state.connectionStart.componentId && c.toCompId === best.componentId && c.fromTerminal === state.connectionStart.terminalIndex && c.toTerminal === best.terminalIndex) ||
        (c.fromCompId === best.componentId && c.toCompId === state.connectionStart.componentId && c.fromTerminal === best.terminalIndex && c.toTerminal === state.connectionStart.terminalIndex)
      );
      if (!exists) {
        pushUndo();
        state.connections.push({ fromCompId: state.connectionStart.componentId, fromTerminal: state.connectionStart.terminalIndex, toCompId: best.componentId, toTerminal: best.terminalIndex });
        redrawAllWires(); showFeedback('✅ تم توصيل العنصرين بنجاح', 'success'); updateStatusBar();
      } else showFeedback('⚠️ هذان الطرفان متصلان بالفعل', 'warning');
    }
    state.connectionStart = null; updateUndoRedoButtons();
  }

  function redrawAllWires() {
    const svg = document.getElementById('canvasWiresSvg');
    if (!svg) return;
    svg.querySelectorAll('.wire-path, .wire-group, #tempWireGroup').forEach(el => el.remove());
    state.connections.forEach((conn, idx) => {
      const fc = state.placedComponents.find(c => c.id === conn.fromCompId);
      const tc = state.placedComponents.find(c => c.id === conn.toCompId);
      if (!fc?.el || !tc?.el) return;
      const fp = getTerminalPixelPos(fc, conn.fromTerminal);
      const tp = getTerminalPixelPos(tc, conn.toTerminal);
      const x1 = fc.x + fp.x, y1 = fc.y + fp.y, x2 = tc.x + tp.x, y2 = tc.y + tp.y;
      const midX = (x1 + x2) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', state.simulationActive ? '#3fb950' : '#d2991d');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linecap', 'round');
      path.classList.add('wire-path');
      path.dataset.connectionIndex = idx;
      path.addEventListener('click', (ev) => { ev.stopPropagation(); clearSelection(); document.querySelectorAll('.wire-path').forEach(w => w.classList.remove('selected')); path.classList.add('selected'); });
      path.addEventListener('dblclick', (ev) => { ev.stopPropagation(); pushUndo(); deleteWire(idx); });
      svg.appendChild(path);
    });
  }

  function deleteWire(idx) {
    if (idx >= 0 && idx < state.connections.length) { state.connections.splice(idx, 1); redrawAllWires(); updateStatusBar(); updateUndoRedoButtons(); }
  }

  /* ========================================================================
     Simulation
     ======================================================================== */
  function runSimulation() {
    if (state.placedComponents.length === 0) { showFeedback('⚠️ لا توجد عناصر. أضف عناصر لبناء الدائرة.', 'error'); return; }
    const hasSource = state.placedComponents.some(c => ['battery', 'dc_supply', 'ac_supply_1ph', 'ac_supply_3ph', 'power_supply'].includes(c.compId));
    if (!hasSource) { showFeedback('⚠️ لا يوجد مصدر طاقة.', 'error'); return; }
    const hasLoad = state.placedComponents.some(c => ['lamp', 'motor_1ph', 'motor_3ph', 'heater', 'fan', 'solenoid', 'buzzer'].includes(c.compId));
    if (!hasLoad) { showFeedback('⚠️ لا يوجد حمل.', 'error'); return; }

    state.simulationActive = true;
    const conducting = simulateConnectivity();
    state.placedComponents.forEach(c => {
      if (['lamp', 'motor_1ph', 'motor_3ph', 'fan', 'heater'].includes(c.compId)) {
        if (conducting.has(c.id)) { c.el.classList.add('simulating'); c.compState.active = true; }
        else { c.el.classList.remove('simulating'); c.compState.active = false; }
      }
      if (['relay', 'contactor', 'timer_on', 'timer_off'].includes(c.compId) && conducting.has(c.id)) c.el.classList.add('coil-energized');
    });
    redrawAllWires();
    showFeedback('⚡ تم تشغيل الدائرة بنجاح!', 'success');
  }

  function simulateConnectivity() {
    const conducting = new Set();
    const visited = new Set();
    const sources = state.placedComponents.filter(c => ['battery', 'dc_supply', 'ac_supply_1ph', 'ac_supply_3ph', 'power_supply'].includes(c.compId));

    function dfs(compId, fromTerminal) {
      const key = `${compId}-${fromTerminal}`;
      if (visited.has(key)) return;
      visited.add(key);
      conducting.add(compId);
      const comp = state.placedComponents.find(c => c.id === compId);
      if (!comp) return;
      const def = findComponentDef(comp.compId);
      if (def?.type === 'control') {
        if (def.subtype === 'push_no' && !comp.compState.pressed) return;
        if (def.subtype === 'push_nc' && comp.compState.pressed) return;
        if (def.subtype === 'emergency' && comp.compState.pressed) return;
      }
      if (def?.type === 'protection' && comp.compState.tripped) return;

      state.connections.forEach(conn => {
        if (conn.fromCompId === compId && conn.fromTerminal !== fromTerminal) dfs(conn.toCompId, conn.toTerminal);
        if (conn.toCompId === compId && conn.toTerminal !== fromTerminal) dfs(conn.fromCompId, conn.fromTerminal);
      });
    }

    sources.forEach(s => { const terms = findComponentDef(s.compId)?.terminals || 2; for (let i = 0; i < terms; i++) dfs(s.id, i); });
    return conducting;
  }

  function stopSimulation() {
    state.simulationActive = false;
    state.placedComponents.forEach(c => { c.el.classList.remove('simulating', 'coil-energized'); c.compState.active = false; });
    redrawAllWires();
    showFeedback('⏹️ تم إيقاف المحاكاة.', 'info');
  }

  function validateCircuit() {
    const issues = [];
    if (state.placedComponents.length === 0) issues.push('لا توجد عناصر');
    if (!state.placedComponents.some(c => ['battery', 'dc_supply', 'ac_supply_1ph', 'ac_supply_3ph', 'power_supply'].includes(c.compId))) issues.push('لا يوجد مصدر طاقة');
    if (!state.placedComponents.some(c => ['lamp', 'motor_1ph', 'motor_3ph', 'heater', 'fan', 'solenoid', 'buzzer', 'relay', 'contactor'].includes(c.compId))) issues.push('لا يوجد حمل');
    if (state.connections.length === 0 && state.placedComponents.length > 1) issues.push('لا توجد توصيلات');
    const cids = new Set(); state.connections.forEach(c => { cids.add(c.fromCompId); cids.add(c.toCompId); });
    const unc = state.placedComponents.filter(c => !cids.has(c.id) && state.placedComponents.length > 1);
    if (unc.length > 0) issues.push(`${unc.length} عناصر غير موصولة`);
    if (issues.length === 0) showFeedback('✅ الدائرة صحيحة!', 'success');
    else showFeedback('⚠️ ' + issues.join(' | '), 'error');
  }

  /* ========================================================================
     Undo/Redo
     ======================================================================== */
  function pushUndo() {
    const snap = JSON.stringify({
      comps: state.placedComponents.map(c => ({ id: c.id, compId: c.compId, x: c.x, y: c.y })),
      conns: [...state.connections], cid: state.componentIdCounter
    });
    state.undoStack.push(snap);
    if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
    state.redoStack = []; updateUndoRedoButtons();
  }

  function performUndo() {
    if (state.undoStack.length === 0) return;
    const cur = JSON.stringify({
      comps: state.placedComponents.map(c => ({ id: c.id, compId: c.compId, x: c.x, y: c.y })),
      conns: [...state.connections], cid: state.componentIdCounter
    });
    state.redoStack.push(cur);
    restoreSnapshot(JSON.parse(state.undoStack.pop()));
    updateUndoRedoButtons();
  }

  function performRedo() {
    if (state.redoStack.length === 0) return;
    const cur = JSON.stringify({
      comps: state.placedComponents.map(c => ({ id: c.id, compId: c.compId, x: c.x, y: c.y })),
      conns: [...state.connections], cid: state.componentIdCounter
    });
    state.undoStack.push(cur);
    restoreSnapshot(JSON.parse(state.redoStack.pop()));
    updateUndoRedoButtons();
  }

  function restoreSnapshot(snap) {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    canvas.querySelectorAll('.placed-component, .connection-point').forEach(el => el.remove());
    state.placedComponents = []; state.connections = []; state.selectedComponents = []; state.dragging = null; state.connectionStart = null; hideProperties();
    state.componentIdCounter = snap.cid;
    snap.comps.forEach(cd => { addComponentToCanvas(cd.compId, cd.x, cd.y); const c = state.placedComponents[state.placedComponents.length - 1]; if (c) c.id = cd.id; });
    state.componentIdCounter = snap.cid;
    state.connections = snap.conns.filter(conn => state.placedComponents.some(c => c.id === conn.fromCompId) && state.placedComponents.some(c => c.id === conn.toCompId));
    redrawAllWires(); updateCanvasPlaceholder(); updateStatusBar();
  }

  function updateUndoRedoButtons() {
    const bu = document.getElementById('btnUndo'), br = document.getElementById('btnRedo');
    if (bu) bu.disabled = state.undoStack.length === 0;
    if (br) br.disabled = state.redoStack.length === 0;
  }

  /* ========================================================================
     Properties
     ======================================================================== */
  function showProperties(componentId) {
    const comp = state.placedComponents.find(c => c.id === componentId);
    if (!comp) return;
    state.propertiesTarget = componentId;
    const panel = document.getElementById('simProperties'), content = document.getElementById('propertiesContent');
    if (!panel || !content) return;
    panel.style.display = '';
    const def = findComponentDef(comp.compId);
    content.innerHTML = `
      <div class="prop-group"><h4>🔧 معلومات</h4>
        <div class="prop-row"><label>النوع:</label><span>${def.name}</span></div>
        <div class="prop-row"><label>المعرف:</label><span>${comp.id}</span></div>
      </div>
      <div class="prop-group"><h4>📐 الموقع</h4>
        <div class="prop-row"><label>X:</label><input type="number" class="prop-input" id="propX" value="${Math.round(comp.x)}"></div>
        <div class="prop-row"><label>Y:</label><input type="number" class="prop-input" id="propY" value="${Math.round(comp.y)}"></div>
      </div>
      ${def.voltage ? `<div class="prop-group"><h4>⚡ كهرباء</h4><div class="prop-row"><label>الجهد:</label><span>${def.voltage} V</span></div>${def.current ? `<div class="prop-row"><label>التيار:</label><span>${def.current} A</span></div>` : ''}${def.power ? `<div class="prop-row"><label>القدرة:</label><span>${def.power} W</span></div>` : ''}</div>` : ''}
      <div class="prop-group"><h4>📊 الحالة</h4><div class="prop-row"><label>نشط:</label><span style="color:${comp.compState.active ? 'var(--success)' : 'var(--text-muted)'}">${comp.compState.active ? '✅ نعم' : '❌ لا'}</span></div></div>
      <button class="btn btn-danger btn-sm btn-block" id="btnDeleteProp" style="margin-top:8px;">🗑️ حذف العنصر</button>`;
    document.getElementById('propX')?.addEventListener('change', e => { comp.x = parseFloat(e.target.value) || 0; comp.el.style.left = `${comp.x}px`; redrawAllWires(); });
    document.getElementById('propY')?.addEventListener('change', e => { comp.y = parseFloat(e.target.value) || 0; comp.el.style.top = `${comp.y}px`; redrawAllWires(); });
    document.getElementById('btnDeleteProp')?.addEventListener('click', () => { pushUndo(); deleteComponent(componentId); });
  }

  function hideProperties() { state.propertiesTarget = null; const p = document.getElementById('simProperties'); if (p) p.style.display = 'none'; }

  /* ========================================================================
     Toolbar
     ======================================================================== */
  function setupToolbar() {
    document.getElementById('btnUndo')?.addEventListener('click', performUndo);
    document.getElementById('btnRedo')?.addEventListener('click', performRedo);
    document.getElementById('btnSimRun')?.addEventListener('click', runSimulation);
    document.getElementById('btnSimStop')?.addEventListener('click', stopSimulation);
    document.getElementById('btnSimValidate')?.addEventListener('click', validateCircuit);
    document.getElementById('btnClearAll')?.addEventListener('click', () => { if (state.placedComponents.length === 0) return; pushUndo(); clearAll(); });
    document.getElementById('btnZoomIn')?.addEventListener('click', () => { state.zoomLevel = Math.min(5, state.zoomLevel + 0.2); applyTransform(); updateStatusBar(); });
    document.getElementById('btnZoomOut')?.addEventListener('click', () => { state.zoomLevel = Math.max(0.2, state.zoomLevel - 0.2); applyTransform(); updateStatusBar(); });
    document.getElementById('btnZoomFit')?.addEventListener('click', zoomToFit);
    document.getElementById('btnSnapGrid')?.addEventListener('click', toggleSnap);
    document.getElementById('btnGridSize')?.addEventListener('click', cycleGridSize);
    document.getElementById('btnCopy')?.addEventListener('click', copySelection);
    document.getElementById('btnPaste')?.addEventListener('click', pasteSelection);
    document.getElementById('btnDelete')?.addEventListener('click', () => { pushUndo(); deleteSelection(); });
    document.getElementById('btnToggleSidebar')?.addEventListener('click', () => {
      const p = document.getElementById('simProperties');
      if (!p) return;
      if (p.style.display === 'none' || !p.style.display) { if (state.selectedComponents.length === 1) showProperties(state.selectedComponents[0]); else p.style.display = ''; }
      else hideProperties();
    });
    document.getElementById('btnCloseProperties')?.addEventListener('click', hideProperties);
  }

  /* ========================================================================
     Toolbox
     ======================================================================== */
  function setupToolbox() {
    document.querySelectorAll('.toolbox-cat-header').forEach(h => {
      h.addEventListener('click', () => {
        const cat = h.dataset.cat;
        const items = document.getElementById(`toolbox-${cat}`);
        const arrow = h.querySelector('.toolbox-arrow');
        if (items) { const open = items.style.display !== 'none'; items.style.display = open ? 'none' : ''; if (arrow) arrow.textContent = open ? '▶' : '▼'; }
      });
    });
    document.querySelectorAll('.toolbox-item').forEach(btn => {
      btn.addEventListener('click', () => { const cid = btn.dataset.comp; if (cid) { pushUndo(); addComponentToCanvas(cid); } });
      btn.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', btn.dataset.comp); e.dataTransfer.effectAllowed = 'copy'; });
    });
    document.getElementById('toolboxSearch')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.toolbox-item').forEach(item => { item.style.display = (q === '' || item.textContent.toLowerCase().includes(q)) ? '' : 'none'; });
    });
  }

  function setupDragDrop() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    canvas.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    canvas.addEventListener('drop', e => {
      e.preventDefault();
      const cid = e.dataTransfer.getData('text/plain');
      if (cid) {
        state.canvasRect = canvas.getBoundingClientRect();
        let x = (e.clientX - state.canvasRect.left - state.panOffsetX) / state.zoomLevel;
        let y = (e.clientY - state.canvasRect.top - state.panOffsetY) / state.zoomLevel;
        if (state.snapToGrid) { x = Math.round(x / state.gridSize) * state.gridSize; y = Math.round(y / state.gridSize) * state.gridSize; }
        pushUndo(); addComponentToCanvas(cid, Math.max(0, x), Math.max(0, y));
      }
    });
  }

  /* ========================================================================
     Keyboard
     ======================================================================== */
  function setupKeyboard() {
    document.addEventListener('keydown', e => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z') { e.preventDefault(); e.shiftKey ? performRedo() : performUndo(); }
      if (ctrl && e.key === 'y') { e.preventDefault(); performRedo(); }
      if (ctrl && e.key === 'c') { e.preventDefault(); copySelection(); }
      if (ctrl && e.key === 'v') { e.preventDefault(); pasteSelection(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedComponents.length > 0) { e.preventDefault(); pushUndo(); deleteSelection(); }
      if (e.key === 'Escape') { clearSelection(); hideProperties(); }
    });
  }

  /* ========================================================================
     Copy/Paste/Delete
     ======================================================================== */
  function copySelection() {
    if (state.selectedComponents.length === 0) return;
    state.clipboard = state.selectedComponents.map(id => { const c = state.placedComponents.find(c2 => c2.id === id); return c ? { compId: c.compId, x: c.x, y: c.y } : null; }).filter(Boolean);
    showFeedback(`📋 تم نسخ ${state.clipboard.length} عناصر`, 'info');
  }

  function pasteSelection() {
    if (state.clipboard.length === 0) return;
    pushUndo(); clearSelection();
    const ox = state.gridSize * 2, oy = state.gridSize * 2;
    state.clipboard.forEach(item => { addComponentToCanvas(item.compId, item.x + ox, item.y + oy); state.selectedComponents.push(state.placedComponents[state.placedComponents.length - 1].id); });
    state.clipboard = state.clipboard.map(item => ({ ...item, x: item.x + ox, y: item.y + oy }));
    showFeedback(`📄 تم لصق ${state.clipboard.length} عناصر`, 'success');
  }

  function deleteSelection() {
    if (state.selectedComponents.length === 0) return;
    const ids = [...state.selectedComponents];
    ids.forEach(id => deleteComponent(id));
    showFeedback(`🗑️ تم حذف ${ids.length} عناصر`, 'info');
  }

  /* ========================================================================
     Grid/Snap
     ======================================================================== */
  function toggleSnap() {
    state.snapToGrid = !state.snapToGrid;
    document.getElementById('btnSnapGrid')?.classList.toggle('active', state.snapToGrid);
    updateStatusBar();
  }

  function cycleGridSize() {
    currentGridIndex = (currentGridIndex + 1) % GRID_SIZES.length;
    state.gridSize = GRID_SIZES[currentGridIndex];
    const btn = document.getElementById('btnGridSize'); if (btn) btn.textContent = `${state.gridSize}px`;
    const pattern = document.getElementById('gridPattern');
    if (pattern) {
      pattern.setAttribute('width', state.gridSize); pattern.setAttribute('height', state.gridSize);
      pattern.querySelector('path:first-child')?.setAttribute('d', `M ${state.gridSize} 0 L 0 0 0 ${state.gridSize}`);
      pattern.querySelector('path:last-child')?.setAttribute('d', `M ${state.gridSize * 5} 0 L 0 0 0 ${state.gridSize * 5}`);
    }
    updateStatusBar();
  }

  function zoomToFit() {
    if (state.placedComponents.length === 0) { state.zoomLevel = 1; state.panOffsetX = 0; state.panOffsetY = 0; applyTransform(); updateStatusBar(); return; }
    const canvas = document.getElementById('simCanvas'); if (!canvas) return;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const minX = Math.min(...state.placedComponents.map(c => c.x));
    const minY = Math.min(...state.placedComponents.map(c => c.y));
    const maxX = Math.max(...state.placedComponents.map(c => c.x + (c.el?.offsetWidth || 100)));
    const maxY = Math.max(...state.placedComponents.map(c => c.y + (c.el?.offsetHeight || 60)));
    const ctw = maxX - minX + 60, cth = maxY - minY + 60;
    state.zoomLevel = Math.min(2, Math.max(0.3, Math.min(cw / ctw, ch / cth)));
    state.panOffsetX = (cw / 2) - (minX + ctw / 2) * state.zoomLevel;
    state.panOffsetY = (ch / 2) - (minY + cth / 2) * state.zoomLevel;
    applyTransform(); updateStatusBar();
  }

  /* ========================================================================
     Helpers
     ======================================================================== */
  function clearAll() {
    const canvas = document.getElementById('simCanvas');
    if (canvas) canvas.querySelectorAll('.placed-component').forEach(el => el.remove());
    const svg = document.getElementById('canvasWiresSvg');
    if (svg) svg.querySelectorAll('.wire-path, .wire-group, #tempWireGroup').forEach(el => el.remove());
    state.placedComponents = []; state.connections = []; state.selectedComponents = []; state.dragging = null; state.connectionStart = null; state.simulationActive = false; hideProperties();
    updateCanvasPlaceholder(); updateStatusBar(); updateUndoRedoButtons();
  }

  function updateCanvasPlaceholder() {
    const ph = document.getElementById('canvasPlaceholder');
    if (ph) ph.style.display = state.placedComponents.length === 0 ? '' : 'none';
  }

  function updateStatusBar() {
    document.getElementById('statusZoom').textContent = `تكبير: ${Math.round(state.zoomLevel * 100)}%`;
    document.getElementById('statusComponents').textContent = `العناصر: ${state.placedComponents.length}`;
    document.getElementById('statusConnections').textContent = `التوصيلات: ${state.connections.length}`;
    document.getElementById('statusGrid').textContent = `شبكة: ${state.gridSize}px`;
    document.getElementById('statusSnap').textContent = state.snapToGrid ? '✅ التصاق' : '❌ حر';
  }

  function showFeedback(msg, type) {
    const fb = document.getElementById('simFeedback'); if (!fb) return;
    fb.textContent = msg; fb.className = 'sim-feedback'; if (type) fb.classList.add(type);
    fb.style.display = 'block';
    clearTimeout(fb._timeout);
    fb._timeout = setTimeout(() => { fb.style.display = 'none'; }, 3000);
  }

  /* ========================================================================
     Public API
     ======================================================================== */
  window.getSimulatorHTML = getSimulatorHTML;
  window.initSimulator = initSimulator;
})();
