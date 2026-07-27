/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-events.js - Unified Event Manager
   
   Responsibility:
   - ALL pointer events in ONE place
   - Long press (500ms) to start drag or wire
   - Short press for selection
   - Pan with middle button or Alt+Click
   ========================================================================== */

(function () {
  'use strict';

  window.SimEvents = {

    _canvas: null,

    /* ===== Long Press Timers ===== */
    _longPressTimer: null,
    _longPressThreshold: 500, // 500ms for long press

    /* ===== Pan State ===== */
    _isPanning: false,
    _panStartX: 0,
    _panStartY: 0,

    /* ===== Drag State ===== */
    _isDragging: false,
    _drag: null,
    _dragStarted: false, // True after long press triggers drag

    /* ===== Wire State ===== */
    _isWiring: false,
    _wire: null,
    _wireStarted: false, // True after long press triggers wire

    /* ===== Pointer Tracking ===== */
    _pointerDownTime: 0,
    _pointerDownX: 0,
    _pointerDownY: 0,
    _pointerMoved: false,
    _moveThreshold: 5, // pixels - ignore tiny movements

    /* ===== Bound Handlers ===== */
    _boundPointerDown: null,
    _boundPointerMove: null,
    _boundPointerUp: null,
    _boundKeyDown: null,

    /* ======================================================================
       Initialization
       ====================================================================== */

    init: function (canvasId) {
      this._canvas = document.getElementById(canvasId);
      if (!this._canvas) {
        console.error('SimEvents: Canvas "' + canvasId + '" not found');
        return;
      }

      var self = this;

      this._boundPointerDown = function (e) { self._onPointerDown(e); };
      this._boundPointerMove = function (e) { self._onPointerMove(e); };
      this._boundPointerUp = function (e) { self._onPointerUp(e); };

      this._canvas.addEventListener('pointerdown', this._boundPointerDown);
      this._canvas.addEventListener('pointermove', this._boundPointerMove);
      this._canvas.addEventListener('pointerup', this._boundPointerUp);
      this._canvas.addEventListener('pointerleave', this._boundPointerUp);
      this._canvas.addEventListener('pointercancel', this._boundPointerUp);

      this._canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });

      this._canvas.addEventListener('wheel', function (e) {
        self._onWheel(e);
      }, { passive: false });

      this._boundKeyDown = function (e) { self._onKeyDown(e); };
      document.addEventListener('keydown', this._boundKeyDown);
    },

    destroy: function () {
      if (this._canvas) {
        if (this._boundPointerDown) this._canvas.removeEventListener('pointerdown', this._boundPointerDown);
        if (this._boundPointerMove) this._canvas.removeEventListener('pointermove', this._boundPointerMove);
        if (this._boundPointerUp) {
          this._canvas.removeEventListener('pointerup', this._boundPointerUp);
          this._canvas.removeEventListener('pointerleave', this._boundPointerUp);
          this._canvas.removeEventListener('pointercancel', this._boundPointerUp);
        }
      }
      if (this._boundKeyDown) {
        document.removeEventListener('keydown', this._boundKeyDown);
      }
      this._clearLongPressTimer();
    },

    /* ======================================================================
       Pointer Down
       ====================================================================== */

    _onPointerDown: function (e) {
      if (window.SimCanvas && window.SimCanvas._canvasRect) {
        window.SimCanvas._canvasRect = this._canvas.getBoundingClientRect();
      }

      // Record pointer position and time
      this._pointerDownTime = Date.now();
      this._pointerDownX = e.clientX;
      this._pointerDownY = e.clientY;
      this._pointerMoved = false;

      // --- PAN: Middle button or Alt+Left click ---
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        this._clearLongPressTimer();
        this._isPanning = true;

        var state = window.SimState;
        this._panStartX = e.clientX - (state ? state.panOffsetX : 0);
        this._panStartY = e.clientY - (state ? state.panOffsetY : 0);

        this._canvas.style.cursor = 'grabbing';
        this._canvas.setPointerCapture(e.pointerId);
        return;
      }

      if (e.button !== 0) return;

      // --- Check target ---
      var terminal = e.target.closest('.sim-terminal');
      var componentEl = e.target.closest('.sim-component');
      var deleteBtn = e.target.closest('.sim-comp-delete');

      // Click on delete button - handle immediately
      if (deleteBtn) {
        this._clearLongPressTimer();
        return;
      }

      // Click on terminal - prepare for long press wire
      if (terminal) {
        e.preventDefault();
        e.stopPropagation();

        var compId = parseInt(terminal.getAttribute('data-component-id'));
        var termIdx = parseInt(terminal.getAttribute('data-terminal-index'));

        if (!isNaN(compId) && !isNaN(termIdx)) {
          this._canvas.setPointerCapture(e.pointerId);

          // Start long press timer for wire
          var self = this;
          this._clearLongPressTimer();
          this._longPressTimer = setTimeout(function () {
            self._startWire(compId, termIdx, e);
          }, this._longPressThreshold);
        }
        return;
      }

      // Click on component - prepare for long press drag OR short press select
      if (componentEl) {
        e.preventDefault();

        var cId = parseInt(componentEl.getAttribute('data-component-id'));
        if (!isNaN(cId)) {
          this._canvas.setPointerCapture(e.pointerId);

          // Start long press timer for drag
          var self = this;
          this._clearLongPressTimer();
          this._longPressTimer = setTimeout(function () {
            self._startDrag(cId, componentEl, e);
          }, this._longPressThreshold);
        }
        return;
      }

      // Click on empty space - clear selection immediately
      if (e.target === this._canvas ||
          e.target.closest('.canvas-placeholder') ||
          e.target.id === 'canvasGridSvg') {

        this._clearLongPressTimer();

        if (window.SimState) {
          window.SimState.clearSelection();
        }
        if (window.SimSelection) {
          window.SimSelection.clearAll(window.SimState ? window.SimState.getComponents() : []);
        }
        if (window.SimProperties) {
          window.SimProperties.hide();
        }
      }
    },

    /* ======================================================================
       Start Drag (called after long press on component)
       ====================================================================== */

    _startDrag: function (compId, componentEl, e) {
      this._isDragging = true;
      this._dragStarted = true;

      var comp = window.SimState ? window.SimState.getComponent(compId) : null;
      var left = comp ? comp.x : parseInt(componentEl.style.left) || 0;
      var top = comp ? comp.y : parseInt(componentEl.style.top) || 0;

      this._drag = {
        compId: compId,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: left,
        startTop: top
      };

      // Set drag target in state
      if (window.SimState) {
        window.SimState.setDragTarget({
          compId: compId,
          startX: e.clientX,
          startY: e.clientY,
          origX: left,
          origY: top
        });
      }

      // Visual feedback
      componentEl.style.zIndex = '20';
      componentEl.style.cursor = 'grabbing';
      componentEl.style.borderColor = '#ffffff';

      // Select component
      if (window.SimState) {
        window.SimState.selectComponent(compId, e.ctrlKey || e.metaKey);
      }
      if (window.SimSelection) {
        window.SimSelection.selectComponent(compId, e.ctrlKey || e.metaKey, window.SimState.getComponents());
      }

      // Vibrate on mobile for haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }

      // Show properties if single selection
      if (window.SimState && window.SimState.getSelectionCount() === 1) {
        if (window.SimProperties) {
          window.SimProperties.show(comp);
        }
      }
    },

    /* ======================================================================
       Start Wire (called after long press on terminal)
       ====================================================================== */

    _startWire: function (compId, termIdx, e) {
      this._isWiring = true;
      this._wireStarted = true;

      this._wire = { compId: compId, termIdx: termIdx };

      // Set wire start in state
      if (window.SimState) {
        window.SimState.setWireStart({ compId: compId, termIdx: termIdx });
      }

      // Start drawing temp wire
      if (window.SimWires) {
        window.SimWires.startConnection(compId, termIdx, e.clientX, e.clientY);
      }

      // Vibrate on mobile for haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    },

    /* ======================================================================
       Clear Long Press Timer
       ====================================================================== */

    _clearLongPressTimer: function () {
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }
    },

    /* ======================================================================
       Pointer Move
       ====================================================================== */

    _onPointerMove: function (e) {
      // Track if pointer moved significantly
      var dx = Math.abs(e.clientX - this._pointerDownX);
      var dy = Math.abs(e.clientY - this._pointerDownY);
      if (dx > this._moveThreshold || dy > this._moveThreshold) {
        this._pointerMoved = true;
      }

      // Cancel long press if pointer moved too much
      if (this._pointerMoved && !this._dragStarted && !this._wireStarted) {
        this._clearLongPressTimer();
      }

      // Update position display
      if (window.SimCanvas) {
        var world = window.SimCanvas.screenToWorld(e.clientX, e.clientY);
        window.SimCanvas.updatePositionInfo(world.x, world.y);
      }

      // --- PANNING ---
      if (this._isPanning) {
        var state = window.SimState;
        if (state) {
          state.panOffsetX = e.clientX - this._panStartX;
          state.panOffsetY = e.clientY - this._panStartY;
        }
        if (window.SimCanvas) {
          window.SimCanvas.applyTransform();
        }
        return;
      }

      // --- DRAGGING ---
      if (this._isDragging && this._drag) {
        var zoom = window.SimState ? window.SimState.zoomLevel : 1;
        var dragDx = (e.clientX - this._drag.startX) / zoom;
        var dragDy = (e.clientY - this._drag.startY) / zoom;

        var newX = this._drag.startLeft + dragDx;
        var newY = this._drag.startTop + dragDy;

        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        var comp = window.SimState ? window.SimState.getComponent(this._drag.compId) : null;
        if (comp) {
          comp.x = newX;
          comp.y = newY;
          if (comp.el) {
            comp.el.style.left = newX + 'px';
            comp.el.style.top = newY + 'px';
          }
        }

        if (window.SimWires) {
          window.SimWires.drawAllWires(window.SimState ? window.SimState.simulationActive : false);
        }
        return;
      }

      // --- WIRING ---
      if (this._isWiring && this._wire) {
        if (window.SimWires) {
          window.SimWires.updateTempWire(e.clientX, e.clientY);
        }
        return;
      }
    },

    /* ======================================================================
       Pointer Up
       ====================================================================== */

    _onPointerUp: function (e) {
      this._clearLongPressTimer();

      // --- END PANNING ---
      if (this._isPanning) {
        this._isPanning = false;
        this._canvas.style.cursor = '';
        return;
      }

      // --- END DRAGGING ---
      if (this._isDragging && this._drag) {
        this._isDragging = false;
        this._dragStarted = false;

        var comp = window.SimState ? window.SimState.getComponent(this._drag.compId) : null;
        if (comp && comp.el) {
          comp.el.style.zIndex = '10';
          comp.el.style.cursor = 'grab';
          comp.el.style.borderColor = '#00e5ff';

          // Apply snap ONLY on drop
          if (window.SimCanvas && window.SimCanvas.isSnapEnabled()) {
            var snapped = window.SimCanvas.snapPosition(comp.x, comp.y);
            comp.x = snapped.x;
            comp.y = snapped.y;
            comp.el.style.left = comp.x + 'px';
            comp.el.style.top = comp.y + 'px';
          }

          var movedX = Math.abs(comp.x - this._drag.startLeft);
          var movedY = Math.abs(comp.y - this._drag.startTop);

          if (movedX > 1 || movedY > 1) {
            if (window.SimHistory) {
              window.SimHistory.push(window.SimState.getSnapshot());
            }
          }
        }

        if (window.SimWires) {
          window.SimWires.drawAllWires(window.SimState ? window.SimState.simulationActive : false);
        }

        if (window.SimState) {
          window.SimState.clearDragTarget();
        }

        this._drag = null;
        return;
      }

      // --- END WIRING ---
      if (this._isWiring && this._wire) {
        this._isWiring = false;
        this._wireStarted = false;

        if (window.SimHistory && window.SimState) {
          window.SimHistory.push(window.SimState.getSnapshot());
        }

        if (window.SimWires) {
          var result = window.SimWires.finishConnection(e.clientX, e.clientY);

          if (result && result.success) {
            window.SimWires.drawAllWires(window.SimState ? window.SimState.simulationActive : false);

            if (window.SimCanvas) {
              window.SimCanvas.updateConnectionCount(window.SimState ? window.SimState.getWireCount() : 0);
            }

            if (window.SimUI) {
              window.SimUI.showFeedback('✅ تم التوصيل', 'success');
            }
          }
        }

        if (window.SimState) {
          window.SimState.clearWireStart();
        }

        this._wire = null;
        return;
      }

      // --- SHORT PRESS on component (no drag started) = select ---
      var elapsed = Date.now() - this._pointerDownTime;
      if (!this._pointerMoved && elapsed < this._longPressThreshold) {
        var componentEl = e.target.closest('.sim-component');
        if (componentEl) {
          var cId = parseInt(componentEl.getAttribute('data-component-id'));
          if (!isNaN(cId) && window.SimState && window.SimSelection) {
            // Just select/deselect without drag
            window.SimSelection.selectComponent(cId, e.ctrlKey || e.metaKey, window.SimState.getComponents());

            var comp = window.SimState.getComponent(cId);
            if (window.SimState.getSelectionCount() === 1 && comp) {
              if (window.SimProperties) {
                window.SimProperties.show(comp);
              }
            } else {
              if (window.SimProperties) {
                window.SimProperties.hide();
              }
            }
          }
        }
      }
    },

    /* ======================================================================
       Wheel Handler (Zoom)
       ====================================================================== */

    _onWheel: function (e) {
      e.preventDefault();

      var state = window.SimState;
      if (!state) return;

      var canvasRect = this._canvas.getBoundingClientRect();
      var delta = e.deltaY > 0 ? -0.08 : 0.08;
      var newZoom = Math.max(0.2, Math.min(5, state.zoomLevel + delta));

      var mx = e.clientX - canvasRect.left;
      var my = e.clientY - canvasRect.top;
      var wx = (mx - state.panOffsetX) / state.zoomLevel;
      var wy = (my - state.panOffsetY) / state.zoomLevel;

      state.zoomLevel = newZoom;
      state.panOffsetX = mx - wx * state.zoomLevel;
      state.panOffsetY = my - wy * state.zoomLevel;

      if (window.SimCanvas) {
        window.SimCanvas.applyTransform();
      }
    },

    /* ======================================================================
       Keyboard Handler
       ====================================================================== */

    _onKeyDown: function (e) {
      var tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      var ctrl = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (window.SimHistory && window.SimHistory.canUndo()) {
          window.SimHistory.undo(
            function () { return window.SimState.getSnapshot(); },
            function (snapshot) {
              window.SimState.restoreSnapshot(snapshot);
              window.SimUI.rebuildAll();
            }
          );
        }
        return;
      }

      // Redo: Ctrl+Y
      if ((ctrl && e.key === 'y') || (ctrl && e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        if (window.SimHistory && window.SimHistory.canRedo()) {
          window.SimHistory.redo(
            function () { return window.SimState.getSnapshot(); },
            function (snapshot) {
              window.SimState.restoreSnapshot(snapshot);
              window.SimUI.rebuildAll();
            }
          );
        }
        return;
      }

      // Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (window.SimState) {
          var ids = window.SimState.getSelectedIds();
          if (ids.length > 0) {
            e.preventDefault();
            if (window.SimHistory) {
              window.SimHistory.push(window.SimState.getSnapshot());
            }
            for (var i = 0; i < ids.length; i++) {
              window.SimUI.deleteComponent(ids[i]);
            }
          }
        }
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        if (window.SimState) {
          window.SimState.clearSelection();
        }
        if (window.SimSelection) {
          window.SimSelection.clearAll(window.SimState ? window.SimState.getComponents() : []);
        }
        if (window.SimProperties) {
          window.SimProperties.hide();
        }
        if (this._isWiring) {
          this._isWiring = false;
          this._wireStarted = false;
          this._wire = null;
          if (window.SimWires) {
            window.SimWires.cancelConnection();
          }
          if (window.SimState) {
            window.SimState.clearWireStart();
          }
        }
        return;
      }
    }
  };

})();
