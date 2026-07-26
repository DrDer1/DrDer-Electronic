/* ==========================================================================
   DrDer Electronic - Simulator Canvas v5.0
   Manages drawing area, grid, zoom, pan, and coordinate system
   Fixed: Single parameter init, uses SimGetState for state access
   ========================================================================== */
(function () {
  'use strict';

  window.SimCanvas = {
    _canvas: null,
    _svgGrid: null,
    _svgWires: null,
    _placeholder: null,
    _canvasRect: null,
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
    _onMouseDownCallback: null,
    _onMouseMoveCallback: null,
    _onMouseUpCallback: null,
    _boundMouseDown: null,
    _boundMouseMove: null,
    _boundMouseUp: null,
    _boundWheel: null,

    /**
     * Initialize the canvas
     * @param {string} canvasId - ID of canvas element
     */
    init: function (canvasId) {
      this._canvas = document.getElementById(canvasId);
      if (!this._canvas) {
        console.error('SimCanvas: Element "' + canvasId + '" not found');
        return;
      }

      this._svgGrid = document.getElementById('canvasGridSvg');
      this._svgWires = document.getElementById('canvasWiresSvg');
      this._placeholder = document.getElementById('canvasPlaceholder');
      this._canvasRect = this._canvas.getBoundingClientRect();

      this._canvas.setAttribute('tabindex', '0');
      this._canvas.focus();

      this._updateGridPattern();
      this._setupEventListeners();
      this._updateStatusBar();
    },

    /**
     * Remove all event listeners
     */
    destroy: function () {
      if (!this._canvas) return;
      if (this._boundMouseDown) this._canvas.removeEventListener('mousedown', this._boundMouseDown);
      if (this._boundMouseMove) this._canvas.removeEventListener('mousemove', this._boundMouseMove);
      if (this._boundMouseUp) {
        this._canvas.removeEventListener('mouseup', this._boundMouseUp);
        this._canvas.removeEventListener('mouseleave', this._boundMouseUp);
      }
      if (this._boundWheel) this._canvas.removeEventListener('wheel', this._boundWheel);
      this._onMouseDownCallback = null;
      this._onMouseMoveCallback = null;
      this._onMouseUpCallback = null;
    },

    _setupEventListeners: function () {
      var self = this;
      this._boundMouseDown = function (e) { self._handleMouseDown(e); };
      this._boundMouseMove = function (e) { self._handleMouseMove(e); };
      this._boundMouseUp = function (e) { self._handleMouseUp(e); };
      this._boundWheel = function (e) { self._handleWheel(e); };

      this._canvas.addEventListener('mousedown', this._boundMouseDown);
      this._canvas.addEventListener('mousemove', this._boundMouseMove);
      this._canvas.addEventListener('mouseup', this._boundMouseUp);
      this._canvas.addEventListener('mouseleave', this._boundMouseUp);
      this._canvas.addEventListener('wheel', this._boundWheel, { passive: false });
      this._canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      this._canvas.addEventListener('touchstart', function (e) { self._handleTouchStart(e); }, { passive: false });
      this._canvas.addEventListener('touchmove', function (e) { self._handleTouchMove(e); }, { passive: false });
      this._canvas.addEventListener('touchend', function (e) { self._handleTouchEnd(e); });
    },

    _handleMouseDown: function (e) {
      this._canvasRect = this._canvas.getBoundingClientRect();
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        this._isPanning = true;
        this._panStartX = e.clientX - this._panOffsetX;
        this._panStartY = e.clientY - this._panOffsetY;
        this._canvas.style.cursor = 'grabbing';
        return;
      }
      if (this._onMouseDownCallback) this._onMouseDownCallback(e);
    },

    _handleMouseMove: function (e) {
      if (this._isPanning) {
        this._panOffsetX = e.clientX - this._panStartX;
        this._panOffsetY = e.clientY - this._panStartY;
        this._applyTransform();
        return;
      }
      if (this._onMouseMoveCallback) this._onMouseMoveCallback(e);
    },

    _handleMouseUp: function (e) {
      if (this._isPanning) {
        this._isPanning = false;
        this._canvas.style.cursor = '';
        return;
      }
      if (this._onMouseUpCallback) this._onMouseUpCallback(e);
    },

    _handleWheel: function (e) {
      e.preventDefault();
      this._canvasRect = this._canvas.getBoundingClientRect();
      var delta = e.deltaY > 0 ? -0.08 : 0.08;
      var newZoom = Math.max(0.2, Math.min(5, this._zoomLevel + delta));
      var mx = e.clientX - this._canvasRect.left;
      var my = e.clientY - this._canvasRect.top;
      var wx = (mx - this._panOffsetX) / this._zoomLevel;
      var wy = (my - this._panOffsetY) / this._zoomLevel;
      this._zoomLevel = newZoom;
      this._panOffsetX = mx - wx * this._zoomLevel;
      this._panOffsetY = my - wy * this._zoomLevel;
      this._applyTransform();
      this._updateStatusBar();
    },

    _handleTouchStart: function (e) {
      if (e.touches.length === 2) { e.preventDefault(); return; }
      if (e.touches.length === 1 && this._onMouseDownCallback) {
        var t = e.touches[0];
        this._onMouseDownCallback({
          button: 0, clientX: t.clientX, clientY: t.clientY,
          target: document.elementFromPoint(t.clientX, t.clientY),
          preventDefault: function () {}, shiftKey: false, ctrlKey: false, metaKey: false
        });
      }
    },

    _handleTouchMove: function (e) {
      if (e.touches.length === 1 && this._onMouseMoveCallback) {
        var t = e.touches[0];
        this._onMouseMoveCallback({ clientX: t.clientX, clientY: t.clientY });
      }
    },

    _handleTouchEnd: function () {
      if (this._onMouseUpCallback) this._onMouseUpCallback({});
    },

    onMouseDown: function (cb) { this._onMouseDownCallback = cb; },
    onMouseMove: function (cb) { this._onMouseMoveCallback = cb; },
    onMouseUp: function (cb) { this._onMouseUpCallback = cb; },

    screenToWorld: function (screenX, screenY) {
      this._canvasRect = this._canvas ? this._canvas.getBoundingClientRect() : null;
      if (!this._canvasRect) return { x: screenX, y: screenY };
      return {
        x: (screenX - this._canvasRect.left - this._panOffsetX) / this._zoomLevel,
        y: (screenY - this._canvasRect.top - this._panOffsetY) / this._zoomLevel
      };
    },

    snapPosition: function (x, y) {
      if (!this._snapToGrid) return { x: x, y: y };
      return {
        x: Math.round(x / this._gridSize) * this._gridSize,
        y: Math.round(y / this._gridSize) * this._gridSize
      };
    },

    _applyTransform: function () {
      if (!this._canvas) return;
      var t = 'translate(' + this._panOffsetX + 'px, ' + this._panOffsetY + 'px) scale(' + this._zoomLevel + ')';
      var components = this._canvas.querySelectorAll('.sim-component');
      for (var i = 0; i < components.length; i++) {
        components[i].style.transform = t;
      }
      var terminals = this._canvas.querySelectorAll('.sim-terminal');
      for (var j = 0; j < terminals.length; j++) {
        terminals[j].style.transform = 'translate(-50%,-50%) ' + t;
      }
      this._updateStatusBar();
    },

    applyTransformToElement: function (el) {
      if (!el) return;
      var t = 'translate(' + this._panOffsetX + 'px, ' + this._panOffsetY + 'px) scale(' + this._zoomLevel + ')';
      el.style.transform = t;
    },

    getGridSize: function () { return this._gridSize; },
    isSnapEnabled: function () { return this._snapToGrid; },

    toggleSnap: function () {
      this._snapToGrid = !this._snapToGrid;
      var btn = document.getElementById('simBtnSnap');
      if (btn) {
        if (this._snapToGrid) { btn.classList.add('active'); }
        else { btn.classList.remove('active'); }
      }
      this._updateStatusBar();
    },

    cycleGridSize: function () {
      this._currentGridIndex = (this._currentGridIndex + 1) % this._gridSizes.length;
      this._gridSize = this._gridSizes[this._currentGridIndex];
      this._updateGridPattern();
      var btn = document.getElementById('simBtnGridSize');
      if (btn) btn.textContent = this._gridSize + 'px';
      this._updateStatusBar();
    },

    _updateGridPattern: function () {
      var pattern = document.getElementById('gridPattern');
      if (!pattern) return;
      pattern.setAttribute('width', this._gridSize);
      pattern.setAttribute('height', this._gridSize);
      var paths = pattern.querySelectorAll('path');
      if (paths.length >= 2) {
        paths[0].setAttribute('d', 'M ' + this._gridSize + ' 0 L 0 0 0 ' + this._gridSize);
        paths[1].setAttribute('d', 'M ' + (this._gridSize * 5) + ' 0 L 0 0 0 ' + (this._gridSize * 5));
      }
    },

    zoomIn: function () {
      this._zoomLevel = Math.min(5, this._zoomLevel + 0.2);
      this._applyTransform();
    },

    zoomOut: function () {
      this._zoomLevel = Math.max(0.2, this._zoomLevel - 0.2);
      this._applyTransform();
    },

    zoomToFit: function () {
      var state = window.SimGetState ? window.SimGetState() : null;
      var components = state ? state.placedComponents : [];
      if (!components || components.length === 0) {
        this._zoomLevel = 1;
        this._panOffsetX = 0;
        this._panOffsetY = 0;
        this._applyTransform();
        return;
      }
      var canvas = this._canvas;
      if (!canvas) return;
      var cw = canvas.clientWidth;
      var ch = canvas.clientHeight;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (var i = 0; i < components.length; i++) {
        var c = components[i];
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
        var right = c.x + (c.el ? c.el.offsetWidth : 100);
        var bottom = c.y + (c.el ? c.el.offsetHeight : 60);
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      }
      var contentW = maxX - minX + 80;
      var contentH = maxY - minY + 80;
      this._zoomLevel = Math.min(2, Math.max(0.3, Math.min(cw / contentW, ch / contentH)));
      this._panOffsetX = (cw / 2) - (minX + contentW / 2) * this._zoomLevel;
      this._panOffsetY = (ch / 2) - (minY + contentH / 2) * this._zoomLevel;
      this._applyTransform();
    },

    getZoomLevel: function () { return this._zoomLevel; },

    showPlaceholder: function (show) {
      if (this._placeholder) this._placeholder.style.display = show ? '' : 'none';
    },

    _updateStatusBar: function () {
      var zoomEl = document.getElementById('simStatusZoom');
      var snapEl = document.getElementById('simStatusSnap');
      var gridEl = document.getElementById('simStatusGrid');
      if (zoomEl) zoomEl.textContent = 'تكبير: ' + Math.round(this._zoomLevel * 100) + '%';
      if (snapEl) snapEl.textContent = this._snapToGrid ? '✅ التصاق' : '❌ حر';
      if (gridEl) gridEl.textContent = 'شبكة: ' + this._gridSize + 'px';
    },

    updateComponentCount: function (count) {
      var el = document.getElementById('simStatusComponents');
      if (el) el.textContent = 'العناصر: ' + count;
    },

    updateConnectionCount: function (count) {
      var el = document.getElementById('simStatusConnections');
      if (el) el.textContent = 'التوصيلات: ' + count;
    },

    updatePositionInfo: function (x, y) {
      var el = document.getElementById('simStatusPosition');
      if (el) el.textContent = 'x: ' + Math.round(x) + ', y: ' + Math.round(y);
    },

    getCanvas: function () { return this._canvas; },
    getSVGWires: function () { return this._svgWires; }
  };
})();
