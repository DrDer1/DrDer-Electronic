/* ==========================================================================
   DrDer Electronic - Advanced Circuit Simulator v2.0
   Drag & Drop | Undo/Redo | Zoom/Pan | Wire Management
   ========================================================================== */

(function () {
  'use strict';

  /* ========== Component Definitions ========== */
  const COMPONENTS = [
    { id: 'battery', name: 'بطارية', icon: '🔋', type: 'source', voltage: 12, color: '#00e5ff' },
    { id: 'switch', name: 'مفتاح', icon: '🔘', type: 'control', color: '#d2991d' },
    { id: 'lamp', name: 'لمبة', icon: '💡', type: 'load', color: '#f0883e' },
    { id: 'motor', name: 'محرك', icon: '⚙️', type: 'load', color: '#a371f7' },
    { id: 'contactor', name: 'كونتاكتور', icon: '🔌', type: 'control', color: '#d2991d' },
    { id: 'relay', name: 'ريليه', icon: '🔀', type: 'control', color: '#d2991d' },
    { id: 'breaker', name: 'قاطع', icon: '🔒', type: 'protection', color: '#f85149' },
    { id: 'resistor', name: 'مقاومة', icon: '⚡', type: 'passive', color: '#58a6ff' },
  ];

  /* ========== State ========== */
  let placedComponents = [];
  let connections = [];
  let componentIdCounter = 0;
  let dragging = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragCompStartX = 0;
  let dragCompStartY = 0;
  let connectionStart = null;
  let tempWire = null;
  let canvasRect = null;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panOffsetX = 0;
  let panOffsetY = 0;
  let zoomLevel = 1;
  let undoStack = [];
  let redoStack = [];
  const MAX_UNDO = 30;

  /* ========== Get HTML ========== */
  function getSimulatorHTML() {
    const toolbarButtons = COMPONENTS.map(
      (comp) =>
        `<button class="component-btn" data-comp="${comp.id}" title="أضف ${comp.name}" aria-label="إضافة ${comp.name}">${comp.icon} ${comp.name}</button>`
    ).join('');

    return `
      <div class="simulator-container">
        <div class="sim-toolbar" id="simToolbar">
          <div class="toolbar-group">
            ${toolbarButtons}
          </div>
          <span class="toolbar-separator"></span>
          <div class="toolbar-group">
            <button class="action-btn" id="btnUndo" title="تراجع" aria-label="تراجع" disabled>↩</button>
            <button class="action-btn" id="btnRedo" title="إعادة" aria-label="إعادة" disabled>↪</button>
          </div>
          <span class="toolbar-separator"></span>
          <div class="toolbar-group">
            <button class="action-btn" id="btnZoomIn" title="تكبير" aria-label="تكبير">🔍+</button>
            <button class="action-btn" id="btnZoomOut" title="تصغير" aria-label="تصغير">🔍-</button>
            <button class="action-btn" id="btnZoomReset" title="إعادة الضبط" aria-label="إعادة ضبط التكبير">1:1</button>
          </div>
          <span class="toolbar-separator"></span>
          <div class="toolbar-group">
            <button class="action-btn danger" id="btnClearSim" title="مسح الكل" aria-label="مسح جميع العناصر">🗑️ مسح</button>
          </div>
        </div>
        <div class="sim-canvas-area" id="simCanvas">
          <div class="canvas-grid"></div>
          <div class="canvas-placeholder" id="canvasPlaceholder">
            <span class="placeholder-icon">🔧</span>
            <span>اسحب العناصر من الأعلى أو انقر عليها للإضافة</span>
            <span style="font-size:0.8rem;color:var(--text-muted);">زر الفأرة الأوسط للسحب | العجلة للتكبير</span>
          </div>
        </div>
        <div class="sim-controls">
          <button class="btn btn-success" id="btnSimRun">▶️ تشغيل</button>
          <button class="btn btn-danger" id="btnSimStop">⏹️ إيقاف</button>
          <button class="btn btn-outline" id="btnSimValidate">✅ تحقق من التوصيل</button>
        </div>
        <div class="sim-feedback" id="simFeedback">🔍 قم ببناء الدائرة ثم اضغط "تحقق من التوصيل"</div>
      </div>
    `;
  }

  /* ========== Initialize ========== */
  function initSimulator() {
    resetState();
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    updateCanvasRect();
    setupCanvasEvents(canvas);
    setupToolbarEvents();
    updateUndoRedoButtons();
  }

  function resetState() {
    placedComponents = [];
    connections = [];
    componentIdCounter = 0;
    dragging = null;
    connectionStart = null;
    tempWire = null;
    isPanning = false;
    panOffsetX = 0;
    panOffsetY = 0;
    zoomLevel = 1;
    undoStack = [];
    redoStack = [];
  }

  function updateCanvasRect() {
    const canvas = document.getElementById('simCanvas');
    if (canvas) canvasRect = canvas.getBoundingClientRect();
  }

  /* ========== Canvas Events ========== */
  function setupCanvasEvents(canvas) {
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', handleCanvasMouseUp);
    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleCanvasTouchEnd);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => {
      updateCanvasRect();
      redrawAllConnections();
    });

    document.addEventListener('keydown', handleSimKeyboard);
  }

  function handleCanvasMouseDown(e) {
    updateCanvasRect();

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      isPanning = true;
      panStartX = e.clientX - panOffsetX;
      panStartY = e.clientY - panOffsetY;
      const canvas = document.getElementById('simCanvas');
      if (canvas) canvas.classList.add('panning');
      return;
    }

    if (e.target.classList.contains('connection-point')) return;
    if (e.target.classList.contains('delete-btn')) return;
    if (e.target.closest('.placed-component')) return;
    if (e.target.closest('.wire-line')) {
      handleWireClick(e);
      return;
    }

    if (e.target === document.getElementById('simCanvas') ||
        e.target.classList.contains('canvas-grid') ||
        e.target.classList.contains('canvas-placeholder')) {
      deselectAll();
      updateUndoRedoButtons();
    }
  }

  function handleCanvasMouseMove(e) {
    if (isPanning) {
      panOffsetX = e.clientX - panStartX;
      panOffsetY = e.clientY - panStartY;
      applyTransform();
      return;
    }

    if (dragging) {
      const dx = (e.clientX - dragStartX) / zoomLevel;
      const dy = (e.clientY - dragStartY) / zoomLevel;
      const newX = dragCompStartX + dx;
      const newY = dragCompStartY + dy;
      const canvas = document.getElementById('simCanvas');
      if (!canvas) return;

      const clampedX = Math.max(0, Math.min(newX, canvas.clientWidth / zoomLevel - dragging.el.offsetWidth));
      const clampedY = Math.max(0, Math.min(newY, canvas.clientHeight / zoomLevel - dragging.el.offsetHeight));

      dragging.el.style.left = `${clampedX}px`;
      dragging.el.style.top = `${clampedY}px`;

      const comp = placedComponents.find((c) => c.id === dragging.id);
      if (comp) {
        comp.x = clampedX;
        comp.y = clampedY;
      }
      redrawAllConnections();
      return;
    }

    if (connectionStart) {
      updateTempWire(e.clientX, e.clientY);
      return;
    }
  }

  function handleCanvasMouseUp(e) {
    if (isPanning) {
      isPanning = false;
      const canvas = document.getElementById('simCanvas');
      if (canvas) canvas.classList.remove('panning');
      return;
    }

    if (dragging) {
      const comp = placedComponents.find((c) => c.id === dragging.id);
      if (comp && (Math.abs(comp.x - dragCompStartX) > 2 || Math.abs(comp.y - dragCompStartY) > 2)) {
        pushUndo();
      }
      stopDragging();
      return;
    }

    if (connectionStart) {
      finishConnection(e.clientX, e.clientY);
      return;
    }
  }

  function handleCanvasWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.3, Math.min(3, zoomLevel + delta));

    const canvas = document.getElementById('simCanvas');
    if (!canvas || !canvasRect) {
      zoomLevel = newZoom;
      applyTransform();
      return;
    }

    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    const worldX = (mouseX - panOffsetX) / zoomLevel;
    const worldY = (mouseY - panOffsetY) / zoomLevel;

    zoomLevel = newZoom;

    panOffsetX = mouseX - worldX * zoomLevel;
    panOffsetY = mouseY - worldY * zoomLevel;

    applyTransform();
  }

  function handleCanvasTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      return;
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const simulatedEvent = {
        button: 0,
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: document.elementFromPoint(touch.clientX, touch.clientY),
        preventDefault: () => {}
      };
      handleCanvasMouseDown(simulatedEvent);
    }
  }

  function handleCanvasTouchMove(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
  }

  function handleCanvasTouchEnd(e) {
    handleCanvasMouseUp({});
  }

  function handleSimKeyboard(e) {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        performRedo();
      } else {
        performUndo();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      performRedo();
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selected = placedComponents.find((c) => c.el && c.el.classList.contains('active'));
      if (selected) {
        deleteComponent(selected.id);
      }
    }
  }

  function applyTransform() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    const children = canvas.querySelectorAll('.placed-component, .wire-line, .connection-point');
    const transform = `translate(${panOffsetX}px, ${panOffsetY}px) scale(${zoomLevel})`;

    children.forEach((el) => {
      if (el.classList.contains('placed-component') || el.classList.contains('wire-line')) {
        el.style.transform = transform;
      }
    });
  }

  /* ========== Toolbar Events ========== */
  function setupToolbarEvents() {
    const toolbar = document.getElementById('simToolbar');
    if (!toolbar) return;

    toolbar.addEventListener('click', (e) => {
      const compBtn = e.target.closest('.component-btn');
      if (compBtn) {
        const compId = compBtn.dataset.comp;
        if (compId) {
          addComponentToCanvas(compId);
          pushUndo();
        }
        return;
      }

      const actionBtn = e.target.closest('.action-btn');
      if (!actionBtn) return;

      switch (actionBtn.id) {
        case 'btnUndo': performUndo(); break;
        case 'btnRedo': performRedo(); break;
        case 'btnZoomIn':
          zoomLevel = Math.min(3, zoomLevel + 0.2);
          applyTransform();
          break;
        case 'btnZoomOut':
          zoomLevel = Math.max(0.3, zoomLevel - 0.2);
          applyTransform();
          break;
        case 'btnZoomReset':
          zoomLevel = 1;
          panOffsetX = 0;
          panOffsetY = 0;
          applyTransform();
          break;
        case 'btnClearSim':
          if (placedComponents.length === 0 && connections.length === 0) return;
          pushUndo();
          clearSimulator();
          break;
      }
    });

    document.getElementById('btnSimRun')?.addEventListener('click', runSimulation);
    document.getElementById('btnSimStop')?.addEventListener('click', stopSimulation);
    document.getElementById('btnSimValidate')?.addEventListener('click', validateCircuit);
  }

  /* ========== Add Component ========== */
  function addComponentToCanvas(compId, x, y) {
    const comp = COMPONENTS.find((c) => c.id === compId);
    if (!comp) return;

    const canvas = document.getElementById('simCanvas');
    const placeholder = document.getElementById('canvasPlaceholder');
    if (!canvas) return;

    if (placeholder) placeholder.style.display = 'none';

    updateCanvasRect();

    if (x === undefined || y === undefined) {
      const count = placedComponents.filter((c) => c.compId === compId).length;
      const cols = Math.floor(canvas.clientWidth / 130) || 4;
      x = 30 + (count % cols) * 120;
      y = 30 + Math.floor(count / cols) * 80;
    }

    const id = ++componentIdCounter;
    const el = document.createElement('div');
    el.className = 'placed-component';
    el.id = `comp-${id}`;
    el.dataset.componentId = id;
    el.dataset.compType = compId;
    el.innerHTML = `${comp.icon} ${comp.name}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.borderColor = comp.color || 'var(--accent)';
    el.style.color = comp.color || 'var(--accent)';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${comp.name} - قابل للسحب`);
    el.setAttribute('tabindex', '0');

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '✕';
    deleteBtn.setAttribute('aria-label', 'حذف العنصر');
    deleteBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      pushUndo();
      deleteComponent(id);
    });
    el.appendChild(deleteBtn);

    el.addEventListener('mousedown', startDragElement);
    el.addEventListener('touchstart', startDragElementTouch, { passive: false });
    el.addEventListener('click', (e) => {
      if (!dragging) {
        e.stopPropagation();
        selectComponent(id);
      }
    });

    addConnectionPoints(el, id);

    canvas.appendChild(el);
    applyTransform();

    placedComponents.push({ id, compId, el, x, y });

    updateUndoRedoButtons();
  }

  function addConnectionPoints(el, id) {
    const sides = [
      { side: 'right', style: 'right:-6px;top:50%;transform:translateY(-50%);' },
      { side: 'left', style: 'left:-6px;top:50%;transform:translateY(-50%);' },
    ];

    sides.forEach(({ side, style }) => {
      const point = document.createElement('div');
      point.className = 'connection-point';
      point.style.cssText = style;
      point.dataset.componentId = id;
      point.dataset.side = side;
      point.setAttribute('aria-label', `نقطة توصيل ${side === 'right' ? 'يمنى' : 'يسرى'}`);
      point.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        startConnection(e, id, side);
      });
      point.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const touch = e.touches[0];
        startConnection({ clientX: touch.clientX, clientY: touch.clientY }, id, side);
      });
      el.appendChild(point);
    });
  }

  /* ========== Drag Component ========== */
  function startDragElement(e) {
    if (e.button !== 0) return;
    if (e.target.classList.contains('connection-point')) return;
    if (e.target.classList.contains('delete-btn')) return;
    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget;
    const id = parseInt(el.dataset.componentId);

    dragging = { id, el };
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragCompStartX = parseFloat(el.style.left) || 0;
    dragCompStartY = parseFloat(el.style.top) || 0;
    el.style.zIndex = '10';
    el.style.cursor = 'grabbing';
    selectComponent(id);
  }

  function startDragElementTouch(e) {
    if (e.target.classList.contains('connection-point')) return;
    if (e.target.classList.contains('delete-btn')) return;
    e.preventDefault();
    const el = e.currentTarget;
    const id = parseInt(el.dataset.componentId);
    const touch = e.touches[0];

    dragging = { id, el };
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    dragCompStartX = parseFloat(el.style.left) || 0;
    dragCompStartY = parseFloat(el.style.top) || 0;
    el.style.zIndex = '10';
  }

  function stopDragging() {
    if (dragging) {
      dragging.el.style.zIndex = '5';
      dragging.el.style.cursor = 'move';
      dragging = null;
    }
  }

  /* ========== Select Component ========== */
  function selectComponent(id) {
    placedComponents.forEach((c) => {
      if (c.el) c.el.classList.remove('active');
    });
    const comp = placedComponents.find((c) => c.id === id);
    if (comp && comp.el) {
      comp.el.classList.add('active');
    }
  }

  function deselectAll() {
    placedComponents.forEach((c) => {
      if (c.el) c.el.classList.remove('active');
    });
  }

  /* ========== Delete Component ========== */
  function deleteComponent(id) {
    const comp = placedComponents.find((c) => c.id === id);
    if (comp && comp.el) {
      comp.el.remove();
    }

    placedComponents = placedComponents.filter((c) => c.id !== id);
    connections = connections.filter(
      (c) => c.from.componentId !== id && c.to.componentId !== id
    );

    redrawAllConnections();
    updateCanvasPlaceholder();
    updateUndoRedoButtons();
  }

  /* ========== Connections ========== */
  function startConnection(e, componentId, side) {
    connectionStart = { componentId, side, x: e.clientX, y: e.clientY };
    createTempWire(e.clientX, e.clientY, componentId, side);

    const comp = placedComponents.find((c) => c.id === componentId);
    if (comp && comp.el) {
      const points = comp.el.querySelectorAll('.connection-point');
      points.forEach((p) => p.classList.add('highlight'));
    }
  }

  function createTempWire(mouseX, mouseY, componentId, side) {
    removeTempWire();
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    const comp = placedComponents.find((c) => c.id === componentId);
    if (!comp) return;

    const fromEl = comp.el;
    const fromCx = fromEl.offsetLeft + (side === 'right' ? fromEl.offsetWidth : 0);
    const fromCy = fromEl.offsetTop + fromEl.offsetHeight / 2;

    tempWire = document.createElement('div');
    tempWire.className = 'temp-wire';

    const dx = mouseX - canvasRect.left - fromCx;
    const dy = mouseY - canvasRect.top - fromCy;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    tempWire.style.width = `${length}px`;
    tempWire.style.left = `${fromCx}px`;
    tempWire.style.top = `${fromCy - 1}px`;
    tempWire.style.transform = `rotate(${angle}deg)`;

    canvas.appendChild(tempWire);
  }

  function updateTempWire(mouseX, mouseY) {
    if (!tempWire || !connectionStart) return;
    removeTempWire();
    createTempWire(mouseX, mouseY, connectionStart.componentId, connectionStart.side);
  }

  function removeTempWire() {
    if (tempWire && tempWire.parentNode) {
      tempWire.remove();
      tempWire = null;
    }
  }

  function finishConnection(mouseX, mouseY) {
    if (!connectionStart) return;

    removeTempWire();

    const comp = placedComponents.find((c) => c.id === connectionStart.componentId);
    if (comp && comp.el) {
      comp.el.querySelectorAll('.connection-point').forEach((p) => p.classList.remove('highlight'));
    }

    const canvas = document.getElementById('simCanvas');
    if (!canvas || !canvasRect) {
      connectionStart = null;
      return;
    }

    let targetPoint = null;
    const points = canvas.querySelectorAll('.connection-point');

    points.forEach((point) => {
      const pointId = parseInt(point.dataset.componentId);
      if (pointId === connectionStart.componentId) return;

      const pointRect = point.getBoundingClientRect();
      const pointCx = pointRect.left + pointRect.width / 2;
      const pointCy = pointRect.top + pointRect.height / 2;

      const dist = Math.sqrt((mouseX - pointCx) ** 2 + (mouseY - pointCy) ** 2);
      if (dist < 30) {
        targetPoint = { componentId: pointId, side: point.dataset.side };
      }
    });

    if (targetPoint) {
      const exists = connections.some(
        (c) =>
          (c.from.componentId === connectionStart.componentId && c.to.componentId === targetPoint.componentId) ||
          (c.from.componentId === targetPoint.componentId && c.to.componentId === connectionStart.componentId)
      );

      if (!exists) {
        pushUndo();
        connections.push({
          from: { componentId: connectionStart.componentId, side: connectionStart.side },
          to: { componentId: targetPoint.componentId, side: targetPoint.side },
        });
        redrawAllConnections();
        showSimFeedback('✅ تم توصيل العنصرين بنجاح', 'success');
      } else {
        showSimFeedback('⚠️ هذان العنصران متصلان بالفعل', 'error');
      }
    }

    connectionStart = null;
    updateUndoRedoButtons();
  }

  function redrawAllConnections() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    canvas.querySelectorAll('.wire-line').forEach((w) => w.remove());

    connections.forEach((conn) => {
      const fromComp = placedComponents.find((c) => c.id === conn.from.componentId);
      const toComp = placedComponents.find((c) => c.id === conn.to.componentId);

      if (!fromComp || !toComp) return;

      const fromEl = fromComp.el;
      const toEl = toComp.el;

      const fromCx = fromEl.offsetLeft + (conn.from.side === 'right' ? fromEl.offsetWidth : 0);
      const fromCy = fromEl.offsetTop + fromEl.offsetHeight / 2;
      const toCx = toEl.offsetLeft + (conn.to.side === 'right' ? toEl.offsetWidth : 0);
      const toCy = toEl.offsetTop + toEl.offsetHeight / 2;

      const wire = document.createElement('div');
      wire.className = 'wire-line';
      wire.dataset.connection = `${conn.from.componentId}-${conn.to.componentId}`;

      const dx = toCx - fromCx;
      const dy = toCy - fromCy;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      wire.style.width = `${length}px`;
      wire.style.left = `${fromCx}px`;
      wire.style.top = `${fromCy - 1.5}px`;
      wire.style.transform = `rotate(${angle}deg)`;

      wire.addEventListener('click', (e) => {
        e.stopPropagation();
        selectWire(wire);
      });

      wire.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        pushUndo();
        deleteWire(wire);
      });

      canvas.appendChild(wire);
    });
  }

  function handleWireClick(e) {
    const wire = e.target.closest('.wire-line');
    if (wire) {
      selectWire(wire);
    }
  }

  function selectWire(wire) {
    document.querySelectorAll('.wire-line').forEach((w) => w.classList.remove('active'));
    wire.classList.add('active');
    deselectAll();
  }

  function deleteWire(wire) {
    const connData = wire.dataset.connection;
    if (connData) {
      const [id1, id2] = connData.split('-').map(Number);
      connections = connections.filter(
        (c) =>
          !(
            (c.from.componentId === id1 && c.to.componentId === id2) ||
            (c.from.componentId === id2 && c.to.componentId === id1)
          )
      );
    }
    wire.remove();
    updateUndoRedoButtons();
  }

  /* ========== Undo / Redo ========== */
  function pushUndo() {
    const state = {
      placedComponents: JSON.parse(JSON.stringify(placedComponents.map((c) => ({ id: c.id, compId: c.compId, x: c.x, y: c.y })))),
      connections: JSON.parse(JSON.stringify(connections)),
      componentIdCounter,
    };

    undoStack.push(state);

    if (undoStack.length > MAX_UNDO) {
      undoStack.shift();
    }

    redoStack = [];
    updateUndoRedoButtons();
  }

  function performUndo() {
    if (undoStack.length === 0) return;

    const currentState = {
      placedComponents: JSON.parse(JSON.stringify(placedComponents.map((c) => ({ id: c.id, compId: c.compId, x: c.x, y: c.y })))),
      connections: JSON.parse(JSON.stringify(connections)),
      componentIdCounter,
    };
    redoStack.push(currentState);

    const prevState = undoStack.pop();
    restoreState(prevState);
    updateUndoRedoButtons();
  }

  function performRedo() {
    if (redoStack.length === 0) return;

    const currentState = {
      placedComponents: JSON.parse(JSON.stringify(placedComponents.map((c) => ({ id: c.id, compId: c.compId, x: c.x, y: c.y })))),
      connections: JSON.parse(JSON.stringify(connections)),
      componentIdCounter,
    };
    undoStack.push(currentState);

    const nextState = redoStack.pop();
    restoreState(nextState);
    updateUndoRedoButtons();
  }

  function restoreState(state) {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    canvas.querySelectorAll('.placed-component, .wire-line, .temp-wire').forEach((el) => el.remove());
    placedComponents = [];
    connections = [];
    componentIdCounter = state.componentIdCounter;
    dragging = null;
    connectionStart = null;
    removeTempWire();

    state.placedComponents.forEach((compData) => {
      addComponentToCanvas(compData.compId, compData.x, compData.y);
      const comp = placedComponents[placedComponents.length - 1];
      if (comp) comp.id = compData.id;
    });

    componentIdCounter = state.componentIdCounter;

    state.connections.forEach((conn) => {
      const fromExists = placedComponents.some((c) => c.id === conn.from.componentId);
      const toExists = placedComponents.some((c) => c.id === conn.to.componentId);
      if (fromExists && toExists) {
        connections.push(conn);
      }
    });

    redrawAllConnections();
    updateCanvasPlaceholder();
  }

  function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');

    if (btnUndo) {
      btnUndo.disabled = undoStack.length === 0;
    }
    if (btnRedo) {
      btnRedo.disabled = redoStack.length === 0;
    }
  }

  /* ========== Validation ========== */
  function validateCircuit() {
    const hasSource = placedComponents.some((c) => c.compId === 'battery');
    const hasLoad = placedComponents.some(
      (c) => ['lamp', 'motor', 'resistor'].includes(c.compId)
    );

    if (placedComponents.length === 0) {
      showSimFeedback('⚠️ لم تتم إضافة أي عناصر. أضف عناصر لبناء الدائرة.', 'error');
      return false;
    }

    if (!hasSource) {
      showSimFeedback('⚠️ لا يوجد مصدر طاقة. أضف بطارية لتشغيل الدائرة.', 'error');
      return false;
    }

    if (!hasLoad) {
      showSimFeedback('⚠️ لا يوجد حمل. أضف لمبة أو محرك أو مقاومة.', 'error');
      return false;
    }

    const connectedIds = new Set();
    connections.forEach((c) => {
      connectedIds.add(c.from.componentId);
      connectedIds.add(c.to.componentId);
    });

    const sourceConnected = placedComponents
      .filter((c) => c.compId === 'battery')
      .some((c) => connectedIds.has(c.id));

    const loadConnected = placedComponents
      .filter((c) => ['lamp', 'motor', 'resistor'].includes(c.compId))
      .some((c) => connectedIds.has(c.id));

    if (!sourceConnected && placedComponents.length > 1) {
      showSimFeedback('⚠️ البطارية غير موصولة. قم بتوصيلها بالدائرة.', 'error');
      return false;
    }

    if (!loadConnected && hasLoad && placedComponents.length > 1) {
      showSimFeedback('⚠️ الحمل غير موصول. قم بتوصيله بالدائرة.', 'error');
      return false;
    }

    showSimFeedback('✅ الدائرة صحيحة! جميع التوصيلات سليمة وجاهزة للتشغيل.', 'success');
    return true;
  }

  function runSimulation() {
    const isValid = validateCircuit();

    if (isValid) {
      showSimFeedback('⚡ تم تشغيل الدائرة بنجاح! التيار يسري في المسار المحدد.', 'success');

      placedComponents.forEach((c) => {
        if (['lamp', 'motor'].includes(c.compId)) {
          c.el.style.boxShadow = '0 0 20px rgba(63, 185, 80, 0.7)';
          c.el.style.borderColor = '#3fb950';
        }
        if (c.compId === 'battery') {
          c.el.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.7)';
        }
      });

      connections.forEach((conn) => {
        const fromId = conn.from.componentId;
        const toId = conn.to.componentId;
        document.querySelectorAll('.wire-line').forEach((wire) => {
          if (wire.dataset.connection === `${fromId}-${toId}` || wire.dataset.connection === `${toId}-${fromId}`) {
            wire.classList.add('active');
          }
        });
      });
    }
  }

  function stopSimulation() {
    showSimFeedback('⏹️ تم إيقاف الدائرة.', 'info');

    placedComponents.forEach((c) => {
      c.el.style.boxShadow = '';
      c.el.style.borderColor = COMPONENTS.find((comp) => comp.id === c.compId)?.color || 'var(--accent)';
    });

    document.querySelectorAll('.wire-line').forEach((wire) => {
      wire.classList.remove('active');
    });
  }

  function clearSimulator() {
    const canvas = document.getElementById('simCanvas');
    if (canvas) {
      canvas.querySelectorAll('.placed-component, .wire-line, .temp-wire').forEach((el) => el.remove());
    }

    placedComponents = [];
    connections = [];
    dragging = null;
    connectionStart = null;
    removeTempWire();
    updateCanvasPlaceholder();
    showSimFeedback('🔍 قم ببناء الدائرة ثم اضغط "تحقق من التوصيل"', '');
    updateUndoRedoButtons();
  }

  function showSimFeedback(message, type) {
    const feedback = document.getElementById('simFeedback');
    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = 'sim-feedback';
    if (type) feedback.classList.add(type);
  }

  function updateCanvasPlaceholder() {
    const placeholder = document.getElementById('canvasPlaceholder');
    if (!placeholder) return;

    if (placedComponents.length === 0) {
      placeholder.style.display = '';
    } else {
      placeholder.style.display = 'none';
    }
  }

  /* ========== Public API ========== */
  window.getSimulatorHTML = getSimulatorHTML;
  window.initSimulator = initSimulator;
})();
