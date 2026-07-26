/* ==========================================================================
   DrDer Electronic - Simulator Canvas
   Manages the drawing area, grid, zoom, pan, and coordinate system
   ========================================================================== */
(function () {
  'use strict';

  window.SimCanvas = {
    _canvas: null,
    _svgGrid: null,
    _svgWires: null,
    _placeholder: null,
    _container: null,
    _state: null,
    _gridSize: 20,
    _snapToGrid: true,
    _zoomLevel: 1,
    _panOffsetX: 0,
    _panOffsetY: 0,
    _isPanning: false,
    _panStartX: 0,
    _panStartY: 0,
    _gridSizes: [10, 20, 40, 50],
    _currentGridIndex: 1,
    _onMouseDown: null,
    _onMouseMove: null,
    _onMouseUp: null,
    _onWheel: null,
    _boundMouseDown: null,
    _boundMouseMove: null,
    _boundMouseUp: null,
    _boundWheel: null,

    /* ========================================================================
       Initialize
       ======================================================================== */
    init(canvasId, state) {
      this._canvas = document.getElementById(canvasId);
      this._container = this._canvas ? this._canvas.parentElement : null;
      this._svgGrid = document.getElementById('canvasGridSvg');
      this._svgWires = document.getElementById('canvasWiresSvg');
      this._placeholder = document.getElementById('canvasPlaceholder');
      this._state = state;

      if (!this._canvas) {
        console.error('SimCanvas: Canvas element not found');
        return;
      }

      this._canvas.setAttribute('tabindex', '0');
      this._canvas.focus();

      this._updateGridPattern();
      this._setupEventListeners();
      this._updatePlaceholder();

      window.addEventListener('resize', () => {
        this._updateCanvasRect();
        if (this._onMouseMove) this._onMouseMove({ clientX: 0, clientY: 0 });
      });
    },

    /* ========================================================================
       Event Listeners
       ======================================================================== */
    _setupEventListeners() {
      this._boundMouseDown = this._handleMouseDown.bind(this);
      this._boundMouseMove = this._handleMouseMove.bind(this);
      this._boundMouseUp = this._handleMouseUp.bind(this);
      this._boundWheel = this._handleWheel.bind(this);

      this._canvas.addEventListener('mousedown', this._boundMouseDown);
      this._canvas.addEventListener('mousemove', this._boundMouseMove);
      this._canvas.addEventListener('mouseup', this._boundMouseUp);
      this._canvas.addEventListener('mouseleave', this._boundMouseUp);
      this._canvas.addEventListener('wheel', this._boundWheel, { passive: false });
      this._canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      this._canvas.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
      this._canvas.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
      this._canvas.addEventListener('touchend', this._handleTouchEnd.bind(this));
    },

    destroy() {
      if (this._canvas) {
        this._canvas.removeEventListener('mousedown', this._boundMouseDown);
        this._canvas.removeEventListener('mousemove', this._boundMouseMove);
        this._canvas.removeEventListener('mouseup', this._boundMouseUp);
        this._canvas.removeEventListener('mouseleave', this._boundMouseUp);
        this._canvas.removeEventListener('wheel', this._boundWheel);
      }
    },

    /* ========================================================================
       Mouse/Touch Event Handlers
       ======================================================================== */
    _handleMouseDown(e) {
      this._updateCanvasRect();

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        this._isPanning = true;
        this._panStartX = e.clientX - this._panOffsetX;
        this._panStartY = e.clientY - this._panOffsetY;
        this._canvas.style.cursor = 'grabbing';
        return;
      }

      if (this._onMouseDown) {
        this._onMouseDown(e);
      }
    },

    _handleMouseMove(e) {
      if (this._isPanning) {
        this._panOffsetX = e.clientX - this._panStartX;
        this._panOffsetY = e.clientY - this._panStartY;
        this._applyTransform();
        return;
      }

      if (this._onMouseMove) {
        this._onMouseMove(e);
      }
    },

    _handleMouseUp(e) {
      if (this._isPanning) {
        this._isPanning = false;
        this._canvas.style.cursor = '';
        return;
      }

      if (this._onMouseUp) {
        this._onMouseUp(e);
      }
    },

    _handleWheel(e) {
      e.preventDefault();
      this._updateCanvasRect();

      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const newZoom = Math.max(0.2, Math.min(5, this._zoomLevel + delta));

      const mx = e.clientX - this._canvasRect.left;
      const my = e.clientY - this._canvasRect.top;
      const wx = (mx - this._panOffsetX) / this._zoomLevel;
      const wy = (my - this._panOffsetY) / this._zoomLevel;

      this._zoomLevel = newZoom;
      this._panOffsetX = mx - wx * this._zoomLevel;
      this._panOffsetY = my - wy * this._zoomLevel;

      this._applyTransform();
      this._updateStatusBar();
    },

    _handleTouchStart(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        return;
      }
      if (e.touches.length === 1 && this._onMouseDown) {
        const t = e.touches[0];
        this._onMouseDown({
          button: 0,
          clientX: t.clientX,
          clientY: t.clientY,
          target: document.elementFromPoint(t.clientX, t.clientY),
          preventDefault: () => {},
          shiftKey: false,
          ctrlKey: false,
          metaKey: false
        });
      }
    },

    _handleTouchMove(e) {
      if (e.touches.length === 1 && this._onMouseMove) {
        const t = e.touches[0];
        this._onMouseMove({ clientX: t.clientX, clientY: t.clientY });
      }
    },

    _handleTouchEnd(e) {
      if (this._onMouseUp) {
        this._onMouseUp({});
      }
    },

    /* ========================================================================
       Event Registration
       ======================================================================== */
    onMouseDown(callback) { this._onMouseDown = callback; },
    onMouseMove(callback) { this._onMouseMove = callback; },
    onMouseUp(callback) { this._onMouseUp = callback; },
    onWheel(callback) { this._onWheel = callback; },

    /* ========================================================================
       Coordinate System
       ======================================================================== */
    _updateCanvasRect() {
      if (this._canvas) {
        this._canvasRect = this._canvas.getBoundingClientRect();
      }
    },

    screenToWorld(screenX, screenY) {
      this._updateCanvasRect();
      if (!this._canvasRect) return { x: 0, y: 0 };

      return {
        x: (screenX - this._canvasRect.left - this._panOffsetX) / this._zoomLevel,
        y: (screenY - this._canvasRect.top - this._panOffsetY) / this._zoomLevel
      };
    },

    worldToScreen(worldX, worldY) {
      this._updateCanvasRect();
      if (!this._canvasRect) return { x: 0, y: 0 };

      return {
        x: worldX * this._zoomLevel + this._panOffsetX + this._canvasRect.left,
        y: worldY * this._zoomLevel + this._panOffsetY + this._canvasRect.top
      };
    },

    snapPosition(x, y) {
      if (!this._snapToGrid) return { x, y };
      return {
        x: Math.round(x / this._gridSize) * this._gridSize,
        y: Math.round(y / this._gridSize) * this._gridSize
      };
    },

    /* ========================================================================
       Transform
       ======================================================================== */
    _applyTransform() {
      const t = `translate(${this._panOffsetX}px, ${this._panOffsetY}px) scale(${this._zoomLevel})`;

      if (this._canvas) {
        this._canvas.querySelectorAll('.sim-component').forEach(el => {
          el.style.transform = t;
        });
        this._canvas.querySelectorAll('.sim-terminal').forEach(el => {
          el.style.transform = `translate(-50%,-50%) ${t}`;
        });
      }

      this._updateStatusBar();
    },

    applyTransformToElement(el) {
      const t = `translate(${this._panOffsetX}px, ${this._panOffsetY}px) scale(${this._zoomLevel})`;
      if (el) el.style.transform = t;
    },

    /* ========================================================================
       Grid System
       ======================================================================== */
    getGridSize() { return this._gridSize; },

    isSnapEnabled() { return this._snapToGrid; },

    toggleSnap() {
      this._snapToGrid = !this._snapToGrid;
      const btn = document.getElementById('simBtnSnap');
      if (btn) btn.classList.toggle('active', this._snapToGrid);
      this._updateStatusBar();
    },

    cycleGridSize() {
      this._currentGridIndex = (this._currentGridIndex + 1) % this._gridSizes.length;
      this._gridSize = this._gridSizes[this._currentGridIndex];
      this._updateGridPattern();
      const btn = document.getElementById('simBtnGridSize');
      if (btn) btn.textContent = `${this._gridSize}px`;
      this._updateStatusBar();
    },

    _updateGridPattern() {
      const pattern = document.getElementById('gridPattern');
      if (!pattern) return;

      pattern.setAttribute('width', this._gridSize);
      pattern.setAttribute('height', this._gridSize);

      const paths = pattern.querySelectorAll('path');
      if (paths.length >= 2) {
        paths[0].setAttribute('d', `M ${this._gridSize} 0 L 0 0 0 ${this._gridSize}`);
        paths[1].setAttribute('d', `M ${this._gridSize * 5} 0 L 0 0 0 ${this._gridSize * 5}`);
      }
    },

    /* ========================================================================
       Zoom Controls
       ======================================================================== */
    zoomIn() {
      this._zoomLevel = Math.min(5, this._zoomLevel + 0.2);
      this._applyTransform();
      this._updateStatusBar();
    },

    zoomOut() {
      this._zoomLevel = Math.max(0.2, this._zoomLevel - 0.2);
      this._applyTransform();
      this._updateStatusBar();
    },

    zoomToFit(components) {
      if (!components || components.length === 0) {
        this._zoomLevel = 1;
        this._panOffsetX = 0;
        this._panOffsetY = 0;
        this._applyTransform();
        this._updateStatusBar();
        return;
      }

      const canvas = this._canvas;
      if (!canvas) return;

      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const minX = Math.min(...components.map(c => c.x));
      const minY = Math.min(...components.map(c => c.y));
      const maxX = Math.max(...components.map(c => c.x + (c.el ? c.el.offsetWidth : 100)));
      const maxY = Math.max(...components.map(c => c.y + (c.el ? c.el.offsetHeight : 60)));
      const ctw = maxX - minX + 80;
      const cth = maxY - minY + 80;

      this._zoomLevel = Math.min(2, Math.max(0.3, Math.min(cw / ctw, ch / cth)));
      this._panOffsetX = (cw / 2) - (minX + ctw / 2) * this._zoomLevel;
      this._panOffsetY = (ch / 2) - (minY + cth / 2) * this._zoomLevel;

      this._applyTransform();
      this._updateStatusBar();
    },

    getZoomLevel() { return this._zoomLevel; },

    /* ========================================================================
       Placeholder
       ======================================================================== */
    _updatePlaceholder() { this.showPlaceholder(true); },

    showPlaceholder(show) {
      if (this._placeholder) {
        this._placeholder.style.display = show ? '' : 'none';
      }
    },

    /* ========================================================================
       Status Bar
       ======================================================================== */
    _updateStatusBar() {
      const zoomEl = document.getElementById('simStatusZoom');
      const snapEl = document.getElementById('simStatusSnap');
      const gridEl = document.getElementById('simStatusGrid');

      if (zoomEl) zoomEl.textContent = `تكبير: ${Math.round(this._zoomLevel * 100)}%`;
      if (snapEl) snapEl.textContent = this._snapToGrid ? '✅ التصاق' : '❌ حر';
      if (gridEl) gridEl.textContent = `شبكة: ${this._gridSize}px`;
    },

    updateComponentCount(count) {
      const el = document.getElementById('simStatusComponents');
      if (el) el.textContent = `العناصر: ${count}`;
    },

    updateConnectionCount(count) {
      const el = document.getElementById('simStatusConnections');
      if (el) el.textContent = `التوصيلات: ${count}`;
    },

    updatePositionInfo(x, y) {
      const el = document.getElementById('simStatusPosition');
      if (el) el.textContent = `x: ${Math.round(x)}, y: ${Math.round(y)}`;
    },

    /* ========================================================================
       Canvas Element
       ======================================================================== */
    getCanvas() { return this._canvas; },

    getSVGWires() { return this._svgWires; },

    getContainer() { return this._container; }
  };
})();
