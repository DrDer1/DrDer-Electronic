/* ==========================================================================
   DrDer Electronic - Circuit Simulator
   Drag & Drop | Wire Connection | Validation
   ========================================================================== */

(function () {
  'use strict';

  const COMPONENTS = [
    { id: 'battery', name: 'بطارية', icon: '🔋', type: 'source', voltage: 12 },
    { id: 'switch', name: 'مفتاح', icon: '🔘', type: 'control' },
    { id: 'lamp', name: 'لمبة', icon: '💡', type: 'load' },
    { id: 'motor', name: 'محرك', icon: '⚙️', type: 'load' },
    { id: 'contactor', name: 'كونتاكتور', icon: '🔌', type: 'control' },
    { id: 'relay', name: 'ريليه', icon: '🔀', type: 'control' },
    { id: 'breaker', name: 'قاطع', icon: '🔒', type: 'protection' },
    { id: 'resistor', name: 'مقاومة', icon: '⚡', type: 'passive' },
  ];

  let _placedComponents = [];
  let _connections = [];
  let _dragging = null;
  let _dragOffsetX = 0;
  let _dragOffsetY = 0;
  let _connectionStart = null;
  let _componentIdCounter = 0;
  let _canvasRect = null;

  function getSimulatorHTML() {
    const toolbarButtons = COMPONENTS.map(
      (comp) =>
        `<button class="component-btn" data-comp="${comp.id}" title="${comp.name}" aria-label="إضافة ${comp.name}">${comp.icon} ${comp.name}</button>`
    ).join('');

    return `
      <div class="simulator-container">
        <div class="sim-toolbar" id="simToolbar">
          ${toolbarButtons}
          <button class="component-btn" style="background:var(--danger-dim);border-color:var(--danger);color:var(--danger);" id="btnClearSim" title="مسح الكل" aria-label="مسح جميع العناصر">🗑️ مسح</button>
        </div>
        <div class="sim-canvas-area" id="simCanvas">
          <div class="canvas-placeholder" id="canvasPlaceholder">
            🖱️ اسحب العناصر من الأعلى إلى هنا لبناء الدائرة
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

  function initSimulator() {
    _placedComponents = [];
    _connections = [];
    _componentIdCounter = 0;
    _dragging = null;
    _connectionStart = null;

    const canvas = document.getElementById('simCanvas');
    const toolbar = document.getElementById('simToolbar');
    const btnClear = document.getElementById('btnClearSim');
    const btnRun = document.getElementById('btnSimRun');
    const btnStop = document.getElementById('btnSimStop');
    const btnValidate = document.getElementById('btnSimValidate');
    const placeholder = document.getElementById('canvasPlaceholder');

    if (!canvas) return;

    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleCanvasTouchEnd);
    window.addEventListener('resize', updateCanvasRect);
    updateCanvasRect();

    if (toolbar) {
      toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.component-btn');
        if (!btn || btn.id === 'btnClearSim') return;
        const compId = btn.dataset.comp;
        if (compId) addComponentToCanvas(compId);
      });
    }

    if (btnClear) btnClear.addEventListener('click', clearSimulator);
    if (btnRun) btnRun.addEventListener('click', runSimulation);
    if (btnStop) btnStop.addEventListener('click', stopSimulation);
    if (btnValidate) btnValidate.addEventListener('click', validateCircuit);
  }

  function updateCanvasRect() {
    const canvas = document.getElementById('simCanvas');
    if (canvas) _canvasRect = canvas.getBoundingClientRect();
  }

  function addComponentToCanvas(compId, x, y) {
    const comp = COMPONENTS.find((c) => c.id === compId);
    if (!comp) return;

    const canvas = document.getElementById('simCanvas');
    const placeholder = document.getElementById('canvasPlaceholder');
    if (!canvas) return;

    if (placeholder) placeholder.style.display = 'none';

    updateCanvasRect();

    if (x === undefined || y === undefined) {
      const count = _placedComponents.filter((c) => c.compId === compId).length;
      x = 40 + (count % 4) * 130;
      y = 40 + Math.floor(count / 4) * 90;
    }

    const id = ++_componentIdCounter;
    const el = document.createElement('div');
    el.className = 'placed-component';
    el.id = `comp-${id}`;
    el.dataset.componentId = id;
    el.dataset.compType = compId;
    el.textContent = `${comp.icon} ${comp.name}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${comp.name} - قابل للسحب`);
    el.setAttribute('tabindex', '0');

    el.addEventListener('mousedown', startDragElement);
    el.addEventListener('touchstart', startDragElementTouch, { passive: false });

    const connPoint = document.createElement('div');
    connPoint.className = 'connection-point';
    connPoint.style.right = '-6px';
    connPoint.style.top = '50%';
    connPoint.style.transform = 'translateY(-50%)';
    connPoint.dataset.componentId = id;
    connPoint.dataset.side = 'right';
    connPoint.setAttribute('aria-label', 'نقطة توصيل');
    connPoint.addEventListener('mousedown', (e) => startConnection(e, id, 'right'));
    connPoint.addEventListener('touchstart', (e) => startConnectionTouch(e, id, 'right'), { passive: false });
    el.appendChild(connPoint);

    const connPointLeft = document.createElement('div');
    connPointLeft.className = 'connection-point';
    connPointLeft.style.left = '-6px';
    connPointLeft.style.top = '50%';
    connPointLeft.style.transform = 'translateY(-50%)';
    connPointLeft.dataset.componentId = id;
    connPointLeft.dataset.side = 'left';
    connPointLeft.setAttribute('aria-label', 'نقطة توصيل');
    connPointLeft.addEventListener('mousedown', (e) => startConnection(e, id, 'left'));
    connPointLeft.addEventListener('touchstart', (e) => startConnectionTouch(e, id, 'left'), { passive: false });
    el.appendChild(connPointLeft);

    canvas.appendChild(el);

    _placedComponents.push({
      id,
      compId,
      el,
      x,
      y,
    });
  }

  /* ========== Drag & Drop ========== */
  function getEventPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function startDragElement(e) {
    if (e.target.classList.contains('connection-point')) return;
    e.preventDefault();
    const el = e.currentTarget;
    const id = parseInt(el.dataset.componentId);
    const pos = getEventPos(e);

    _dragging = { id, el };
    _dragOffsetX = pos.x - el.offsetLeft;
    _dragOffsetY = pos.y - el.offsetTop;

    el.style.zIndex = '10';
    el.style.cursor = 'grabbing';
  }

  function startDragElementTouch(e) {
    if (e.target.classList.contains('connection-point')) return;
    e.preventDefault();
    const el = e.currentTarget;
    const id = parseInt(el.dataset.componentId);
    const pos = getEventPos(e);

    _dragging = { id, el };
    _dragOffsetX = pos.x - el.offsetLeft;
    _dragOffsetY = pos.y - el.offsetTop;

    el.style.zIndex = '10';
  }

  function handleCanvasMouseMove(e) {
    handleDragMove(e);
    handleConnectionMove(e);
  }

  function handleCanvasTouchMove(e) {
    handleDragMove(e);
    handleConnectionMove(e);
  }

  function handleDragMove(e) {
    if (!_dragging) return;
    e.preventDefault();

    const pos = getEventPos(e);
    const canvas = document.getElementById('simCanvas');
    if (!canvas || !_canvasRect) return;

    const newX = pos.x - _canvasRect.left - _dragOffsetX;
    const newY = pos.y - _canvasRect.top - _dragOffsetY;

    const clampedX = Math.max(0, Math.min(newX, canvas.clientWidth - _dragging.el.offsetWidth));
    const clampedY = Math.max(0, Math.min(newY, canvas.clientHeight - _dragging.el.offsetHeight));

    _dragging.el.style.left = `${clampedX}px`;
    _dragging.el.style.top = `${clampedY}px`;

    const comp = _placedComponents.find((c) => c.id === _dragging.id);
    if (comp) {
      comp.x = clampedX;
      comp.y = clampedY;
    }

    redrawConnections();
  }

  function handleCanvasMouseUp(e) {
    stopDragging();
    stopConnection(e);
  }

  function handleCanvasTouchEnd(e) {
    stopDragging();
    stopConnection(e);
  }

  function stopDragging() {
    if (_dragging) {
      _dragging.el.style.zIndex = '5';
      _dragging.el.style.cursor = 'move';
      _dragging = null;
    }
  }

  /* ========== Connections ========== */
  function startConnection(e, componentId, side) {
    e.stopPropagation();
    e.preventDefault();
    _connectionStart = { componentId, side };
  }

  function startConnectionTouch(e, componentId, side) {
    e.stopPropagation();
    e.preventDefault();
    _connectionStart = { componentId, side };
  }

  function handleConnectionMove(e) {
    if (!_connectionStart) return;
    e.preventDefault();
  }

  function stopConnection(e) {
    if (!_connectionStart) return;

    const pos = getEventPos(e);
    const canvas = document.getElementById('simCanvas');
    if (!canvas || !_canvasRect) {
      _connectionStart = null;
      return;
    }

    const relX = pos.x - _canvasRect.left;
    const relY = pos.y - _canvasRect.top;

    let targetPoint = null;
    const points = canvas.querySelectorAll('.connection-point');

    points.forEach((point) => {
      const pointId = parseInt(point.dataset.componentId);
      if (pointId === _connectionStart.componentId) return;

      const pointRect = point.getBoundingClientRect();
      const pointCx = pointRect.left + pointRect.width / 2 - _canvasRect.left;
      const pointCy = pointRect.top + pointRect.height / 2 - _canvasRect.top;

      const dist = Math.sqrt((relX - pointCx) ** 2 + (relY - pointCy) ** 2);
      if (dist < 25) {
        targetPoint = { componentId: pointId, side: point.dataset.side };
      }
    });

    if (targetPoint) {
      const exists = _connections.some(
        (c) =>
          (c.from.componentId === _connectionStart.componentId &&
            c.to.componentId === targetPoint.componentId) ||
          (c.from.componentId === targetPoint.componentId &&
            c.to.componentId === _connectionStart.componentId)
      );

      if (!exists) {
        _connections.push({
          from: { componentId: _connectionStart.componentId, side: _connectionStart.side },
          to: { componentId: targetPoint.componentId, side: targetPoint.side },
        });
        redrawConnections();
        document.getElementById('simFeedback').textContent = '✅ تم التوصيل بين العنصرين';
        document.getElementById('simFeedback').className = 'sim-feedback success';
      }
    }

    _connectionStart = null;
  }

  function redrawConnections() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    canvas.querySelectorAll('.wire-line').forEach((w) => w.remove());

    _connections.forEach((conn) => {
      const fromComp = _placedComponents.find((c) => c.id === conn.from.componentId);
      const toComp = _placedComponents.find((c) => c.id === conn.to.componentId);

      if (!fromComp || !toComp) return;

      const fromEl = fromComp.el;
      const toEl = toComp.el;

      const fromCx = fromEl.offsetLeft + (conn.from.side === 'right' ? fromEl.offsetWidth : 0);
      const fromCy = fromEl.offsetTop + fromEl.offsetHeight / 2;
      const toCx = toEl.offsetLeft + (conn.to.side === 'right' ? toEl.offsetWidth : 0);
      const toCy = toEl.offsetTop + toEl.offsetHeight / 2;

      const wire = document.createElement('div');
      wire.className = 'wire-line';

      const dx = toCx - fromCx;
      const dy = toCy - fromCy;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      wire.style.width = `${length}px`;
      wire.style.left = `${fromCx}px`;
      wire.style.top = `${fromCy - 1.5}px`;
      wire.style.transform = `rotate(${angle}deg)`;

      canvas.appendChild(wire);
    });
  }

  /* ========== Canvas Events ========== */
  function handleCanvasMouseDown(e) {
    if (e.target === document.getElementById('simCanvas') || e.target.classList.contains('canvas-placeholder')) {
      const compId = prompt(
        'اختر عنصراً:\n' + COMPONENTS.map((c, i) => `${i + 1}. ${c.icon} ${c.name}`).join('\n')
      );
      if (compId) {
        const index = parseInt(compId) - 1;
        if (index >= 0 && index < COMPONENTS.length) {
          addComponentToCanvas(COMPONENTS[index].id);
        }
      }
    }
  }

  function handleCanvasTouchStart(e) {
    if (e.target === document.getElementById('simCanvas') || e.target.classList.contains('canvas-placeholder')) {
      e.preventDefault();
    }
  }

  /* ========== Validation ========== */
  function validateCircuit() {
    const feedback = document.getElementById('simFeedback');
    if (!feedback) return;

    const hasSource = _placedComponents.some((c) => c.compId === 'battery');
    const hasLoad = _placedComponents.some(
      (c) => c.compId === 'lamp' || c.compId === 'motor' || c.compId === 'resistor'
    );
    const hasControl = _placedComponents.some(
      (c) => c.compId === 'switch' || c.compId === 'contactor' || c.compId === 'relay'
    );

    if (_placedComponents.length === 0) {
      feedback.textContent = '⚠️ لم تتم إضافة أي عناصر. أضف عناصر لبناء الدائرة.';
      feedback.className = 'sim-feedback error';
      return;
    }

    if (!hasSource) {
      feedback.textContent = '⚠️ لا يوجد مصدر طاقة. أضف بطارية لتشغيل الدائرة.';
      feedback.className = 'sim-feedback error';
      return;
    }

    if (!hasLoad) {
      feedback.textContent = '⚠️ لا يوجد حمل. أضف لمبة أو محرك أو مقاومة.';
      feedback.className = 'sim-feedback error';
      return;
    }

    if (_connections.length < 2 && _placedComponents.length > 1) {
      feedback.textContent = '⚠️ التوصيلات غير مكتملة. قم بتوصيل العناصر ببعضها.';
      feedback.className = 'sim-feedback error';
      return;
    }

    const connectedIds = new Set();
    _connections.forEach((c) => {
      connectedIds.add(c.from.componentId);
      connectedIds.add(c.to.componentId);
    });

    const sourceConnected = _placedComponents
      .filter((c) => c.compId === 'battery')
      .some((c) => connectedIds.has(c.id));
    const loadConnected = _placedComponents
      .filter((c) => c.compId === 'lamp' || c.compId === 'motor')
      .some((c) => connectedIds.has(c.id));

    if (!sourceConnected && _placedComponents.length > 1) {
      feedback.textContent = '⚠️ البطارية غير موصولة. قم بتوصيل البطارية بالدائرة.';
      feedback.className = 'sim-feedback error';
      return;
    }

    if (!loadConnected && hasLoad && _placedComponents.length > 1) {
      feedback.textContent = '⚠️ الحمل غير موصول. قم بتوصيل الحمل بالدائرة.';
      feedback.className = 'sim-feedback error';
      return;
    }

    if (!hasControl && _placedComponents.length > 2) {
      feedback.textContent = 'ℹ️ لا يوجد مفتاح أو كونتاكتور. الدائرة ستعمل مباشرة عند التوصيل.';
      feedback.className = 'sim-feedback success';
    } else if (hasControl && !_placedComponents.filter((c) => c.compId === 'switch' || c.compId === 'contactor').some((c) => connectedIds.has(c.id)) && _placedComponents.length > 2) {
      feedback.textContent = 'ℹ️ المفتاح أو الكونتاكتور غير موصول. قد لا تتمكن من التحكم بالدائرة.';
      feedback.className = 'sim-feedback error';
    } else {
      feedback.textContent = '✅ الدائرة صحيحة! جميع التوصيلات سليمة وجاهزة للتشغيل.';
      feedback.className = 'sim-feedback success';
    }
  }

  function runSimulation() {
    const feedback = document.getElementById('simFeedback');
    if (!feedback) return;

    validateCircuit();

    if (feedback.classList.contains('success')) {
      feedback.textContent = '⚡ تم تشغيل الدائرة بنجاح! التيار يسري في المسار المحدد.';
      feedback.className = 'sim-feedback success';

      const loadEls = _placedComponents.filter((c) => c.compId === 'lamp' || c.compId === 'motor');
      loadEls.forEach((c) => {
        c.el.style.boxShadow = '0 0 16px rgba(63, 185, 80, 0.6)';
        c.el.style.borderColor = '#3fb950';
      });

      const sourceEls = _placedComponents.filter((c) => c.compId === 'battery');
      sourceEls.forEach((c) => {
        c.el.style.boxShadow = '0 0 16px rgba(0, 229, 255, 0.6)';
      });
    } else {
      feedback.textContent = '❌ لا يمكن تشغيل الدائرة. تحقق من التوصيلات أولاً.';
      feedback.className = 'sim-feedback error';
    }
  }

  function stopSimulation() {
    const feedback = document.getElementById('simFeedback');
    if (!feedback) return;

    feedback.textContent = '⏹️ تم إيقاف الدائرة.';
    feedback.className = 'sim-feedback';

    _placedComponents.forEach((c) => {
      c.el.style.boxShadow = '';
      c.el.style.borderColor = '#00e5ff';
    });
  }

  function clearSimulator() {
    _placedComponents = [];
    _connections = [];
    _componentIdCounter = 0;
    _dragging = null;
    _connectionStart = null;

    const canvas = document.getElementById('simCanvas');
    const placeholder = document.getElementById('canvasPlaceholder');
    const feedback = document.getElementById('simFeedback');

    if (canvas) {
      canvas.querySelectorAll('.placed-component').forEach((el) => el.remove());
      canvas.querySelectorAll('.wire-line').forEach((el) => el.remove());
    }

    if (placeholder) placeholder.style.display = '';
    if (feedback) {
      feedback.textContent = '🔍 قم ببناء الدائرة ثم اضغط "تحقق من التوصيل"';
      feedback.className = 'sim-feedback';
    }
  }

  window.getSimulatorHTML = getSimulatorHTML;
  window.initSimulator = initSimulator;
})();
