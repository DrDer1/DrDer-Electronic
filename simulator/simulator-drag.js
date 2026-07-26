/* ==========================================================================
   DrDer Electronic - Simulator Drag & Drop
   Handles dragging components on the canvas
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

    /* ========================================================================
       Initialize
       ======================================================================== */
    init(state, canvas) {
      this._state = state;
      this._canvas = canvas;
    },

    /* ========================================================================
       Start dragging a component
       ======================================================================== */
    startDrag(component, clientX, clientY) {
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

    /* ========================================================================
       Move during drag
       ======================================================================== */
    dragMove(clientX, clientY, canvasModule, selectionModule) {
      if (!this._dragging) return;

      const dx = (clientX - this._dragStartX) / (canvasModule.getZoomLevel() || 1);
      const dy = (clientY - this._dragStartY) / (canvasModule.getZoomLevel() || 1);

      let newX = this._dragCompStartX + dx;
      let newY = this._dragCompStartY + dy;

      const snapped = canvasModule.snapPosition(newX, newY);
      newX = Math.max(0, snapped.x);
      newY = Math.max(0, snapped.y);

      const moveDx = newX - this._dragCompStartX;
      const moveDy = newY - this._dragCompStartY;

      const idsToMove = [];
      if (selectionModule && selectionModule.isSelected(this._dragging.id)) {
        idsToMove.push(...selectionModule.getSelectedIds());
      } else {
        idsToMove.push(this._dragging.id);
      }

      const comps = this._state.placedComponents;

      idsToMove.forEach(id => {
        const comp = comps.find(c => c.id === id);
        if (!comp || !comp.el) return;

        if (id === this._dragging.id) {
          comp.x = newX;
          comp.y = newY;
        } else {
          comp.x += moveDx;
          comp.y += moveDy;
        }

        comp.el.style.left = `${comp.x}px`;
        comp.el.style.top = `${comp.y}px`;
      });

      if (this._onDragMove) {
        this._onDragMove(idsToMove);
      }
    },

    /* ========================================================================
       End drag
       ======================================================================== */
    endDrag() {
      if (!this._dragging) return false;

      const comp = this._dragging.component;

      this._dragging.el.style.zIndex = '10';
      this._dragging.el.style.cursor = 'move';

      const dx = Math.abs(comp.x - this._dragCompStartX);
      const dy = Math.abs(comp.y - this._dragCompStartY);

      const moved = dx > 1 || dy > 1;

      this._dragging = null;

      if (this._onDragEnd) {
        this._onDragEnd(moved);
      }

      return moved;
    },

    /* ========================================================================
       Check if currently dragging
       ======================================================================== */
    isDragging() {
      return this._dragging !== null;
    },

    getDraggedComponent() {
      return this._dragging ? this._dragging.component : null;
    },

    /* ========================================================================
       Event callbacks
       ======================================================================== */
    onDragStart(cb) { this._onDragStart = cb; },
    onDragMove(cb) { this._onDragMove = cb; },
    onDragEnd(cb) { this._onDragEnd = cb; },

    /* ========================================================================
       Clear
       ======================================================================== */
    clear() {
      this._dragging = null;
    }
  };
})();
