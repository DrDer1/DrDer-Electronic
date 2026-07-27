/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-canvas.js - Canvas Manager
   
   Responsibility:
   - Manage the drawing area (zoom, pan, grid)
   - Coordinate transformation (screen ↔ world)
   - Apply visual transforms to elements
   - No drag logic, no wire logic, no selection logic
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimCanvas - Manages the visual canvas area
   * Handles zoom, pan, grid, and coordinate transforms
   */
  window.SimCanvas = {

    /** @type {HTMLElement} The main canvas container element */
    _canvas: null,

    /** @type {Object} Cached bounding rect for performance */
    _canvasRect: null,

    /** @type {number[]} Available grid sizes */
    _gridSizes: [10, 20, 40, 50],

    /** @type {number} Current grid size index */
    _gridIndex: 1,

    /* ======================================================================
       Initialization
       ====================================================================== */

    /**
     * Initialize the canvas
     * @param {string} canvasId - ID of the canvas element
     */
    init: function (canvasId) {
      this._canvas = document.getElementById(canvasId);

      if (!this._canvas) {
        console.error('SimCanvas: Element "' + canvasId + '" not found');
        return;
      }

      this._canvasRect = this._canvas.getBoundingClientRect();
      this._updateGridPattern();
      this._updateStatusBar();

      // Update rect on resize
      var self = this;
      window.addEventListener('resize', function () {
        self._canvasRect = self._canvas.getBoundingClientRect();
      });
    },

    /* ======================================================================
       Coordinate Transformation
       ====================================================================== */

    /**
     * Convert screen coordinates to world coordinates
     * Accounts for pan offset and zoom level
     * @param {number} screenX - X position relative to viewport
     * @param {number} screenY - Y position relative to viewport
     * @returns {{x: number, y: number}} World coordinates
     */
    screenToWorld: function (screenX, screenY) {
      if (!this._canvasRect) {
        this._canvasRect = this._canvas ? this._canvas.getBoundingClientRect() : null;
      }
      if (!this._canvasRect) return { x: screenX, y: screenY };

      var state = window.SimState;
      var zoom = state ? state.zoomLevel : 1;
      var panX = state ? state.panOffsetX : 0;
      var panY = state ? state.panOffsetY : 0;

      return {
        x: (screenX - this._canvasRect.left - panX) / zoom,
        y: (screenY - this._canvasRect.top - panY) / zoom
      };
    },

    /**
     * Convert world coordinates to screen coordinates
     * @param {number} worldX - X position in world
     * @param {number} worldY - Y position in world
     * @returns {{x: number, y: number}} Screen coordinates
     */
    worldToScreen: function (worldX, worldY) {
      if (!this._canvasRect) {
        this._canvasRect = this._canvas ? this._canvas.getBoundingClientRect() : null;
      }
      if (!this._canvasRect) return { x: worldX, y: worldY };

      var state = window.SimState;
      var zoom = state ? state.zoomLevel : 1;
      var panX = state ? state.panOffsetX : 0;
      var panY = state ? state.panOffsetY : 0;

      return {
        x: worldX * zoom + panX + this._canvasRect.left,
        y: worldY * zoom + panY + this._canvasRect.top
      };
    },

    /* ======================================================================
       Snap to Grid
       ====================================================================== */

    /**
     * Snap a position to the nearest grid point
     * Only snaps if snapEnabled is true in SimState
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {{x: number, y: number}} Snapped coordinates
     */
    snapPosition: function (x, y) {
      var state = window.SimState;
      if (!state || !state.snapEnabled) return { x: x, y: y };

      var gs = state.gridSize || 20;
      return {
        x: Math.round(x / gs) * gs,
        y: Math.round(y / gs) * gs
      };
    },

    /* ======================================================================
       Visual Transform
       ====================================================================== */

    /**
     * Apply the current zoom and pan transform to all components
     * Updates the CSS transform on every placed component and terminal
     */
    applyTransform: function () {
      if (!this._canvas) return;

      var state = window.SimState;
      var zoom = state ? state.zoomLevel : 1;
      var panX = state ? state.panOffsetX : 0;
      var panY = state ? state.panOffsetY : 0;
      var t = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';

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

    /**
     * Apply transform to a single element
     * Used when a new component is added
     * @param {HTMLElement} el - The element to transform
     */
    applyTransformToElement: function (el) {
      if (!el) return;

      var state = window.SimState;
      var zoom = state ? state.zoomLevel : 1;
      var panX = state ? state.panOffsetX : 0;
      var panY = state ? state.panOffsetY : 0;
      el.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
    },

    /* ======================================================================
       Zoom Controls
       ====================================================================== */

    /**
     * Zoom in by one step
     */
    zoomIn: function () {
      var state = window.SimState;
      if (!state) return;
      state.zoomLevel = Math.min(5, state.zoomLevel + 0.2);
      this.applyTransform();
    },

    /**
     * Zoom out by one step
     */
    zoomOut: function () {
      var state = window.SimState;
      if (!state) return;
      state.zoomLevel = Math.max(0.2, state.zoomLevel - 0.2);
      this.applyTransform();
    },

    /**
     * Zoom to fit all components in the viewport
     */
    zoomToFit: function () {
      var state = window.SimState;
      if (!state || state.components.length === 0) {
        if (state) {
          state.zoomLevel = 1;
          state.panOffsetX = 0;
          state.panOffsetY = 0;
        }
        this.applyTransform();
        return;
      }

      if (!this._canvas) return;

      var cw = this._canvas.clientWidth;
      var ch = this._canvas.clientHeight;

      var minX = Infinity, minY = Infinity;
      var maxX = -Infinity, maxY = -Infinity;

      for (var i = 0; i < state.components.length; i++) {
        var c = state.components[i];
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
        var right = c.x + (c.el ? c.el.offsetWidth : 100);
        var bottom = c.y + (c.el ? c.el.offsetHeight : 60);
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      }

      var contentW = maxX - minX + 80;
      var contentH = maxY - minY + 80;

      state.zoomLevel = Math.min(2, Math.max(0.3, Math.min(cw / contentW, ch / contentH)));
      state.panOffsetX = (cw / 2) - (minX + contentW / 2) * state.zoomLevel;
      state.panOffsetY = (ch / 2) - (minY + contentH / 2) * state.zoomLevel;

      this.applyTransform();
    },

    /**
     * Reset zoom and pan to default
     */
    resetView: function () {
      var state = window.SimState;
      if (!state) return;
      state.zoomLevel = 1;
      state.panOffsetX = 0;
      state.panOffsetY = 0;
      this.applyTransform();
    },

    /* ======================================================================
       Pan Controls
       ====================================================================== */

    /**
     * Pan by a delta amount
     * @param {number} dx - Delta X in screen pixels
     * @param {number} dy - Delta Y in screen pixels
     */
    panBy: function (dx, dy) {
      var state = window.SimState;
      if (!state) return;
      state.panOffsetX += dx;
      state.panOffsetY += dy;
      this.applyTransform();
    },

    /* ======================================================================
       Grid Controls
       ====================================================================== */

    /**
     * Toggle snap to grid
     */
    toggleSnap: function () {
      var state = window.SimState;
      if (!state) return;
      state.snapEnabled = !state.snapEnabled;
      this._updateStatusBar();

      // Update button visual
      var btn = document.getElementById('simBtnSnap');
      if (btn) {
        if (state.snapEnabled) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    },

    /**
     * Cycle through available grid sizes
     */
    cycleGridSize: function () {
      var state = window.SimState;
      if (!state) return;

      this._gridIndex = (this._gridIndex + 1) % this._gridSizes.length;
      state.gridSize = this._gridSizes[this._gridIndex];

      this._updateGridPattern();
      this._updateStatusBar();

      var btn = document.getElementById('simBtnGridSize');
      if (btn) btn.textContent = state.gridSize + 'px';
    },

    /**
     * Get current grid size
     * @returns {number}
     */
    getGridSize: function () {
      var state = window.SimState;
      return state ? state.gridSize : 20;
    },

    /**
     * Check if snap is enabled
     * @returns {boolean}
     */
    isSnapEnabled: function () {
      var state = window.SimState;
      return state ? state.snapEnabled : true;
    },

    /**
     * Update the SVG grid pattern to match current grid size
     * @private
     */
    _updateGridPattern: function () {
      var state = window.SimState;
      var gs = state ? state.gridSize : 20;

      var pattern = document.getElementById('gridPattern');
      if (!pattern) return;

      pattern.setAttribute('width', gs);
      pattern.setAttribute('height', gs);

      var paths = pattern.querySelectorAll('path');
      if (paths.length >= 2) {
        paths[0].setAttribute('d', 'M ' + gs + ' 0 L 0 0 0 ' + gs);
        paths[1].setAttribute('d', 'M ' + (gs * 5) + ' 0 L 0 0 0 ' + (gs * 5));
      }
    },

    /* ======================================================================
       Placeholder Management
       ====================================================================== */

    /**
     * Show or hide the canvas placeholder
     * @param {boolean} show - True to show placeholder
     */
    showPlaceholder: function (show) {
      var placeholder = document.getElementById('canvasPlaceholder');
      if (placeholder) {
        placeholder.style.display = show ? '' : 'none';
      }
    },

    /* ======================================================================
       Status Bar Updates
       ====================================================================== */

    /**
     * Update the status bar with current view information
     * @private
     */
    _updateStatusBar: function () {
      var state = window.SimState;
      if (!state) return;

      var zoomEl = document.getElementById('simStatusZoom');
      var snapEl = document.getElementById('simStatusSnap');
      var gridEl = document.getElementById('simStatusGrid');

      if (zoomEl) zoomEl.textContent = 'تكبير: ' + Math.round(state.zoomLevel * 100) + '%';
      if (snapEl) snapEl.textContent = state.snapEnabled ? '✅ التصاق' : '❌ حر';
      if (gridEl) gridEl.textContent = 'شبكة: ' + state.gridSize + 'px';
    },

    /**
     * Update component count in status bar
     * @param {number} count
     */
    updateComponentCount: function (count) {
      var el = document.getElementById('simStatusComponents');
      if (el) el.textContent = 'العناصر: ' + count;
    },

    /**
     * Update wire count in status bar
     * @param {number} count
     */
    updateConnectionCount: function (count) {
      var el = document.getElementById('simStatusConnections');
      if (el) el.textContent = 'التوصيلات: ' + count;
    },

    /**
     * Update position display in status bar
     * @param {number} x - World X
     * @param {number} y - World Y
     */
    updatePositionInfo: function (x, y) {
      var el = document.getElementById('simStatusPosition');
      if (el) el.textContent = 'x: ' + Math.round(x) + ', y: ' + Math.round(y);
    },

    /* ======================================================================
       Getters
       ====================================================================== */

    /**
     * Get the canvas DOM element
     * @returns {HTMLElement}
     */
    getCanvas: function () {
      return this._canvas;
    }
  };

})();
