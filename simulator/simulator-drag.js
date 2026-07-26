/* ==========================================================================
   DrDer Electronic - Simulator Drag & Drop v5.0
   Fixed: Snap only on drop, not during drag
   ========================================================================== */
(function () {
  'use strict';

  window.SimDrag = {
    _state: null,
    _canvas: null,
    _dragging: null,
    _dragStartX: 0,
    _dragStartY: 0,
    _dragCompStartX: 0,
    _dragCompStartY: 0,
    _onDragStart: null,
    _onDragMove: null,
    _onDragEnd: null,

    /**
     * Initialize drag system
     * @param {Object} state - Simulator state
     * @param {HTMLElement} canvas - Canvas element
     */
    init: function (state, canvas) {
      this._state = state;
      this._canvas = canvas;
    },

    /**
     * Start dragging a component
     * @param {Object} component - Component to drag
     * @param {number} clientX - Mouse X position
     * @param {number} clientY - Mouse Y position
     */
    startDrag: function (component, clientX, clientY) {
      if (!component || !component.el) return;

      this._dragging = {
        id: component.id,
        el: component.el,
        component: component
      };

      this._dragStartX = clientX;
      this._dragStartY = clientY;
      this._dragCompStartX = component.x;
      this._dragCompStartY = component.y;

      component.el.style.zIndex = '20';
      component.el.style.cursor = 'grabbing';

      if (this._onDragStart) {
        this._onDragStart(component);
      }
    },

    /**
     * Move component during drag
     * @param {number} clientX - Mouse X position
     * @param {number} clientY - Mouse Y position
     * @param {Object} canvasModule - SimCanvas module
     * @param {Object} selectionModule - SimSelection module
     */
    dragMove: function (clientX, clientY, canvasModule, selectionModule) {
      if (!this._dragging) return;

      var zoomLevel = canvasModule && canvasModule.getZoomLevel ? canvasModule.getZoomLevel() : 1;
      var dx = (clientX - this._dragStartX) / zoomLevel;
      var dy = (clientY - this._dragStartY) / zoomLevel;

      // حركة حرة بدون Snap أثناء السحب
      var newX = this._dragCompStartX + dx;
      var newY = this._dragCompStartY + dy;

      // منع الخروج من canvas
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      var moveDx = newX - this._dragCompStartX;
      var moveDy = newY - this._dragCompStartY;

      // تحديد العناصر المراد تحريكها
      var idsToMove = [];
      if (selectionModule && selectionModule.isSelected && selectionModule.isSelected(this._dragging.id)) {
        idsToMove = selectionModule.getSelectedIds ? selectionModule.getSelectedIds() : [];
      }
      if (idsToMove.length === 0) {
        idsToMove.push(this._dragging.id);
      }

      var comps = this._state.placedComponents;
      var self = this;

      idsToMove.forEach(function (id) {
        var comp = null;
        for (var i = 0; i < comps.length; i++) {
          if (comps[i].id === id) { comp = comps[i]; break; }
        }
        if (!comp || !comp.el) return;

        if (id === self._dragging.id) {
          comp.x = newX;
          comp.y = newY;
        } else {
          comp.x += moveDx;
          comp.y += moveDy;
        }

        comp.el.style.left = comp.x + 'px';
        comp.el.style.top = comp.y + 'px';
      });

      if (this._onDragMove) {
        this._onDragMove(idsToMove);
      }
    },

    /**
     * End dragging and snap to grid
     * @returns {boolean} Whether component actually moved
     */
    endDrag: function (canvasModule) {
      if (!this._dragging) return false;

      var comp = this._dragging.component;
      var el = this._dragging.el;

      el.style.zIndex = '10';
      el.style.cursor = 'grab';

      // تطبيق Snap عند الإفلات فقط
      if (canvasModule && canvasModule.isSnapEnabled && canvasModule.isSnapEnabled()) {
        var snapped = canvasModule.snapPosition(comp.x, comp.y);
        comp.x = snapped.x;
        comp.y = snapped.y;
        el.style.left = comp.x + 'px';
        el.style.top = comp.y + 'px';
      }

      var dx = Math.abs(comp.x - this._dragCompStartX);
      var dy = Math.abs(comp.y - this._dragCompStartY);
      var moved = dx > 1 || dy > 1;

      this._dragging = null;

      if (this._onDragEnd) {
        this._onDragEnd(moved);
      }

      return moved;
    },

    /**
     * Check if currently dragging
     * @returns {boolean}
     */
    isDragging: function () {
      return this._dragging !== null;
    },

    /**
     * Get currently dragged component
     * @returns {Object|null}
     */
    getDraggedComponent: function () {
      return this._dragging ? this._dragging.component : null;
    },

    /**
     * Register callbacks
     */
    onDragStart: function (cb) { this._onDragStart = cb; },
    onDragMove: function (cb) { this._onDragMove = cb; },
    onDragEnd: function (cb) { this._onDragEnd = cb; },

    /**
     * Clear drag state
     */
    clear: function () {
      this._dragging = null;
    }
  };
})();
