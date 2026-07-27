/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-events.js - Unified Event Manager
   
   Responsibility:
   - ALL pointer events in ONE place (pointerdown, pointermove, pointerup)
   - ALL keyboard events in ONE place
   - Delegates to drag, wire, selection, and canvas modules
   - No other file registers event listeners
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimEvents - The single event manager for the entire simulator
   * All user input flows through this module
   */
  window.SimEvents = {

    /** @type {HTMLElement} The canvas element */
    _canvas: null,

    /** @type {boolean} Is panning with middle button or Alt+Click */
    _isPanning: false,

    /** @type {number} Pan start X */
    _panStartX: 0,

    /** @type {number} Pan start Y */
    _panStartY: 0,

    /** @type {boolean} Is currently dragging a component */
    _isDragging: false,

    /** @type {Object} Drag state { compId, startX, startY, startLeft, startTop } */
    _drag: null,

    /** @type {boolean} Is currently creating a wire */
    _isWiring: false,

    /** @type {Object} Wire state { compId, termIdx } */
    _wire: null,

    /** @type {Function} Bound pointerdown handler for removal */
    _boundPointerDown: null,

    /** @type {Function} Bound pointermove handler for removal */
    _boundPointerMove: null,

    /** @type {Function} Bound pointerup handler for removal */
    _boundPointerUp: null,

    /** @type {Function} Bound keydown handler for removal */
    _boundKeyDown: null,

    /* ======================================================================
       Initialization
       ====================================================================== */

    /**
     * Initialize the event manager
     * Registers all event listeners on the canvas
     * @param {string} canvasId - ID of the canvas element
     */
    init: function (canvasId) {
      this._canvas = document.getElementById(canvasId);
      if (!this._canvas) {
        console.error('SimEvents: Canvas "' + canvasId + '" not found');
        return;
      }

      var self = this;

      // Pointer Events (work on mouse, touch, pen)
      this._boundPointerDown = function (e) { self._onPointerDown(e); };
      this._boundPointerMove = function (e) { self._onPointerMove(e); };
      this._boundPointerUp = function (e) { self._onPointerUp(e); };

      this._canvas.addEventListener('pointerdown', this._boundPointerDown);
      this._canvas.addEventListener('pointermove', this._boundPointerMove);
      this._canvas.addEventListener('pointerup', this._boundPointerUp);
      this._canvas.addEventListener('pointerleave', this._boundPointerUp);
      this._canvas.addEventListener('pointercancel', this._boundPointerUp);

      // Prevent context menu on long press (mobile)
      this._canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });

      // Wheel for zoom
      this._canvas.addEventListener('wheel', function (e) {
        self._onWheel(e);
      }, { passive: false });

      // Keyboard
      this._boundKeyDown = function (e) { self._onKeyDown(e); };
      document.addEventListener('keydown', this._boundKeyDown);
    },

    /**
     * Remove all event listeners (called when leaving simulator page)
     */
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
    },

    /* ======================================================================
       Pointer Down Handler
       ====================================================================== */

    /**
     * Handle pointerdown event
     * Determines what the user is trying to do:
     *   - Pan (middle button or Alt+Click)
     *   - Start wire (click on terminal)
     *   - Start drag (click on component)
     *   - Select nothing (click on empty space)
     * @private
     * @param {PointerEvent} e
     */
    _onPointerDown: function (e) {
      // Update canvas rect
      if (window.SimCanvas && window.SimCanvas._canvasRect) {
        window.SimCanvas._canvasRect = this._canvas.getBoundingClientRect();
      }

      // --- PAN: Middle button or Alt+Left click ---
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        this._isPanning = true;

        var state = window.SimState;
        this._panStartX = e.clientX - (state ? state.panOffsetX : 0);
        this._panStartY = e.clientY - (state ? state.panOffsetY : 0);

        this._canvas.style.cursor = 'grabbing';
        this._canvas.setPointerCapture(e.pointerId);
        return;
      }

      // Left click only for other actions
      if (e.button !== 0) return;

      // --- WIRE: Click on a terminal ---
      var terminal = e.target.closest('.sim-terminal');
      if (terminal) {
        e.preventDefault();
        e.stopPropagation();

        var compId = parseInt(terminal.getAttribute('data-component-id'));
        var termIdx = parseInt(terminal.getAttribute('data-terminal-index'));

        if (!isNaN(compId) && !isNaN(termIdx)) {
          this._isWiring = true;
          this._wire = { compId: compId, termIdx: termIdx };

          // Set wire start in state
          if (window.SimState) {
            window.SimState.setWireStart({ compId: compId, termIdx: termIdx });
          }

          // Start drawing temp wire
          if (window.SimWires) {
            window.SimWires.startConnection(compId, termIdx, e.clientX, e.clientY);
          }
        }

        this._canvas.setPointerCapture(e.pointerId);
        return;
      }

      // --- DRAG: Click on a component ---
      var componentEl = e.target.closest('.sim-component');
      if (componentEl) {
        // Don't drag if clicking delete button
        if (e.target.closest('.sim-comp-delete')) return;

        e.preventDefault();

        var cId = parseInt(componentEl.getAttribute('data-component-id'));
        if (!isNaN(cId)) {
          this._isDragging = true;

          var comp = window.SimState ? window.SimState.getComponent(cId) : null;
          var left = comp ? comp.x : parseInt(componentEl.style.left) || 0;
          var top = comp ? comp.y : parseInt(componentEl.style.top) || 0;

          this._drag = {
            compId: cId,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: left,
            startTop: top
          };

          // Set drag target in state
          if (window.SimState) {
            window.SimState.setDragTarget({
              compId: cId,
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
            window.SimState.selectComponent(cId, e.ctrlKey || e.metaKey);
          }
          if (window.SimSelection) {
            window.SimSelection.selectComponent(cId, e.ctrlKey || e.metaKey, window.SimState.getComponents());
          }

          // Show properties if single selection
          if (window.SimState && window.SimState.getSelectionCount() === 1) {
            if (window.SimProperties) {
              window.SimProperties.show(comp);
            }
          }
        }

        this._canvas.setPointerCapture(e.pointerId);
        return;
      }

      // --- EMPTY SPACE: Clear selection ---
      if (e.target === this._canvas ||
          e.target.closest('.canvas-placeholder') ||
          e.target.id === 'canvasGridSvg') {

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
       Pointer Move Handler
       ====================================================================== */

    /**
     * Handle pointermove event
     * Three possible states:
     *   1. Panning - move the view
     *   2. Dragging - move the component
     *   3. Wiring - update temp wire
     * @private
     * @param {PointerEvent} e
     */
    _onPointerMove: function (e) {
      // Update position display in status bar
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
        var dx = (e.clientX - this._drag.startX) / zoom;
        var dy = (e.clientY - this._drag.startY) / zoom;

        // Free movement - NO snap during drag
        var newX = this._drag.startLeft + dx;
        var newY = this._drag.startTop + dy;

        // Clamp to canvas
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        // Update component position
        var comp = window.SimState ? window.SimState.getComponent(this._drag.compId) : null;
        if (comp) {
          comp.x = newX;
          comp.y = newY;
          if (comp.el) {
            comp.el.style.left = newX + 'px';
            comp.el.style.top = newY + 'px';
          }
        }

        // Redraw wires
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
       Pointer Up Handler
       ====================================================================== */

    /**
     * Handle pointerup event
     * Finishes the current action (pan, drag, or wire)
     * @private
     * @param {PointerEvent} e
     */
    _onPointerUp: function (e) {
      // --- END PANNING ---
      if (this._isPanning) {
        this._isPanning = false;
        this._canvas.style.cursor = '';
        return;
      }

      // --- END DRAGGING ---
      if (this._isDragging && this._drag) {
        this._isDragging = false;

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

          // Check if actually moved
          var movedX = Math.abs(comp.x - this._drag.startLeft);
          var movedY = Math.abs(comp.y - this._drag.startTop);

          if (movedX > 1 || movedY > 1) {
            // Save to history
            if (window.SimHistory) {
              window.SimHistory.push(window.SimState.getSnapshot());
            }
          }
        }

        // Redraw wires after snap
        if (window.SimWires) {
          window.SimWires.drawAllWires(window.SimState ? window.SimState.simulationActive : false);
        }

        // Clear drag state
        if (window.SimState) {
          window.SimState.clearDragTarget();
        }

        this._drag = null;
        return;
      }

      // --- END WIRING ---
      if (this._isWiring && this._wire) {
        this._isWiring = false;

        // Save state before finishing wire
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

        // Clear wire state
        if (window.SimState) {
          window.SimState.clearWireStart();
        }

        this._wire = null;
        return;
      }
    },

    /* ======================================================================
       Wheel Handler (Zoom)
       ====================================================================== */

    /**
     * Handle wheel event for zooming
     * Zooms toward the cursor position
     * @private
     * @param {WheelEvent} e
     */
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

    /**
     * Handle keyboard events
     * Ctrl+Z = Undo
     * Ctrl+Y = Redo
     * Delete/Backspace = Delete selected
     * Escape = Clear selection
     * @private
     * @param {KeyboardEvent} e
     */
    _onKeyDown: function (e) {
      // Don't handle if user is typing in an input
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

      // Redo: Ctrl+Y or Ctrl+Shift+Z
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
        // Cancel wire
        if (this._isWiring) {
          this._isWiring = false;
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
