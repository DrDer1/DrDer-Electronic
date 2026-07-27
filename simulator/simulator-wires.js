/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-wires.js - Wire Manager
   
   Responsibility:
   - Create and manage wire connections between component terminals
   - Draw temporary wire during creation
   - Draw all permanent wires as SVG paths
   - Remove wires
   - No event handling, no state management (reads from SimState)
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimWires - Manages all wire drawing and connections
   */
  window.SimWires = {

    /** @type {SVGElement} The SVG element for drawing wires */
    _svg: null,

    /** @type {Object|null} Temporary connection being created */
    _tempConnection: null,

    /* ======================================================================
       Initialization
       ====================================================================== */

    /**
     * Initialize the wire manager
     * Finds the wires SVG element
     */
    init: function () {
      this._svg = document.getElementById('canvasWiresSvg');
      this._tempConnection = null;

      if (!this._svg) {
        console.warn('SimWires: canvasWiresSvg element not found');
      }
    },

    /* ======================================================================
       Temporary Wire (during creation)
       ====================================================================== */

    /**
     * Start creating a wire from a terminal
     * @param {number} compId - Source component ID
     * @param {number} termIdx - Source terminal index
     * @param {number} clientX - Starting mouse X position
     * @param {number} clientY - Starting mouse Y position
     */
    startConnection: function (compId, termIdx, clientX, clientY) {
      var world = window.SimCanvas ? window.SimCanvas.screenToWorld(clientX, clientY) : { x: clientX, y: clientY };

      this._tempConnection = {
        fromCompId: compId,
        fromTerminal: termIdx,
        startX: world.x,
        startY: world.y,
        currentX: world.x,
        currentY: world.y
      };

      this._drawTempWire();
    },

    /**
     * Update the temporary wire as the mouse moves
     * @param {number} clientX - Current mouse X
     * @param {number} clientY - Current mouse Y
     */
    updateTempWire: function (clientX, clientY) {
      if (!this._tempConnection) return;

      var world = window.SimCanvas ? window.SimCanvas.screenToWorld(clientX, clientY) : { x: clientX, y: clientY };
      this._tempConnection.currentX = world.x;
      this._tempConnection.currentY = world.y;

      this._drawTempWire();
    },

    /**
     * Draw the temporary wire on the SVG
     * Uses a dashed line from the source terminal to current mouse position
     * @private
     */
    _drawTempWire: function () {
      if (!this._svg || !this._tempConnection) return;

      // Get or create temp wire group
      var g = document.getElementById('simTempWireGroup');
      if (!g) {
        g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = 'simTempWireGroup';
        this._svg.appendChild(g);
      }

      // Calculate start position from component terminal
      var state = window.SimState;
      var fromComp = state ? state.getComponent(this._tempConnection.fromCompId) : null;
      var x1, y1;

      if (fromComp && fromComp.el) {
        var termPos = state.getTerminalWorldPosition(fromComp, this._tempConnection.fromTerminal);
        x1 = termPos.x;
        y1 = termPos.y;
      } else {
        x1 = this._tempConnection.startX;
        y1 = this._tempConnection.startY;
      }

      var x2 = this._tempConnection.currentX;
      var y2 = this._tempConnection.currentY;

      g.innerHTML = '<line x1="' + x1 + '" y1="' + y1 +
        '" x2="' + x2 + '" y2="' + y2 +
        '" stroke="#00e5ff" stroke-width="2" stroke-dasharray="8,4" opacity="0.8"/>';
    },

    /**
     * Remove the temporary wire
     * @private
     */
    _removeTempWire: function () {
      var g = document.getElementById('simTempWireGroup');
      if (g) g.remove();
      this._tempConnection = null;
    },

    /**
     * Cancel the current wire creation
     */
    cancelConnection: function () {
      this._removeTempWire();
    },

    /**
     * Check if a wire is currently being created
     * @returns {boolean}
     */
    isConnecting: function () {
      return this._tempConnection !== null;
    },

    /* ======================================================================
       Finish Connection
       ====================================================================== */

    /**
     * Finish creating a connection
     * Finds the nearest terminal and creates a permanent wire
     * @param {number} clientX - Mouse X at release
     * @param {number} clientY - Mouse Y at release
     * @returns {Object|null} Result { success, message, wire } or null
     */
    finishConnection: function (clientX, clientY) {
      if (!this._tempConnection) return null;

      var fromCompId = this._tempConnection.fromCompId;
      var fromTerminal = this._tempConnection.fromTerminal;

      this._removeTempWire();

      // Find nearest terminal
      var world = window.SimCanvas ? window.SimCanvas.screenToWorld(clientX, clientY) : { x: clientX, y: clientY };
      var nearest = this._findNearestTerminal(world.x, world.y, fromCompId);

      if (!nearest) {
        return { success: false, message: '⚠️ لم يتم العثور على طرف توصيل قريب' };
      }

      // Check for duplicate
      var state = window.SimState;
      if (state) {
        var existing = state._findWire(fromCompId, fromTerminal, nearest.compId, nearest.termIdx);
        if (existing) {
          return { success: false, message: '⚠️ هذان الطرفان متصلان بالفعل' };
        }

        // Add wire to state
        var wire = state.addWire(fromCompId, fromTerminal, nearest.compId, nearest.termIdx);
        if (!wire) {
          return { success: false, message: '⚠️ فشل إنشاء التوصيل' };
        }

        return { success: true, wire: wire };
      }

      return { success: false, message: '⚠️ حالة النظام غير متاحة' };
    },

    /**
     * Find the nearest terminal to a world position
     * Searches all terminals except those on the source component
     * @private
     * @param {number} wx - World X
     * @param {number} wy - World Y
     * @param {number} excludeCompId - Component to exclude from search
     * @returns {Object|null} { compId, termIdx } or null
     */
    _findNearestTerminal: function (wx, wy, excludeCompId) {
      var state = window.SimState;
      if (!state) return null;

      var best = null;
      var bestDist = 60; // Search radius in world pixels

      var components = state.getComponents();
      for (var i = 0; i < components.length; i++) {
        var comp = components[i];
        if (comp.id === excludeCompId) continue;
        if (!comp.el) continue;

        var def = window.findComponentDef(comp.compId);
        var terminalCount = def ? def.terminals : 2;
        var positions = window.getTerminalPositions(terminalCount);

        for (var j = 0; j < positions.length; j++) {
          var pos = state.getTerminalWorldPosition(comp, j);
          var dist = window.SimUtils ? window.SimUtils.distance(wx, wy, pos.x, pos.y) :
            Math.sqrt((wx - pos.x) * (wx - pos.x) + (wy - pos.y) * (wy - pos.y));

          if (dist < bestDist) {
            bestDist = dist;
            best = { compId: comp.id, termIdx: j };
          }
        }
      }

      return best;
    },

    /* ======================================================================
       Draw All Wires
       ====================================================================== */

    /**
     * Draw all permanent wires on the SVG
     * Uses Bezier curves for smooth connections
     * @param {boolean} [simulationActive=false] - Whether to color wires green
     */
    drawAllWires: function (simulationActive) {
      if (!this._svg) return;

      // Remove all existing wire paths
      var existingWires = this._svg.querySelectorAll('.sim-wire-path');
      for (var i = 0; i < existingWires.length; i++) {
        existingWires[i].remove();
      }

      var state = window.SimState;
      if (!state) return;

      var wires = state.getWires();
      for (var w = 0; w < wires.length; w++) {
        var wire = wires[w];
        var fromComp = state.getComponent(wire.fromCompId);
        var toComp = state.getComponent(wire.toCompId);

        if (!fromComp || !toComp || !fromComp.el || !toComp.el) continue;

        var fromPos = state.getTerminalWorldPosition(fromComp, wire.fromTerminal);
        var toPos = state.getTerminalWorldPosition(toComp, wire.toTerminal);

        var x1 = fromPos.x;
        var y1 = fromPos.y;
        var x2 = toPos.x;
        var y2 = toPos.y;

        // Create curved path
        var midX = (x1 + x2) / 2;
        var pathD = 'M ' + x1 + ' ' + y1 + ' C ' + midX + ' ' + y1 + ', ' + midX + ' ' + y2 + ', ' + x2 + ' ' + y2;

        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', simulationActive ? '#3fb950' : '#d2991d');
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('data-wire-id', wire.id);
        path.classList.add('sim-wire-path');

        // Hover effect
        path.style.cursor = 'pointer';
        path.style.pointerEvents = 'stroke';
        path.addEventListener('mouseenter', function () {
          this.setAttribute('stroke-width', '4');
        });
        path.addEventListener('mouseleave', function () {
          if (!this.classList.contains('selected')) {
            this.setAttribute('stroke-width', '2.5');
          }
        });

        // Click to select
        path.addEventListener('click', function (e) {
          e.stopPropagation();
          var wireId = parseInt(this.getAttribute('data-wire-id'));
          if (!isNaN(wireId) && window.SimState) {
            // Find wire index
            var allWires = window.SimState.getWires();
            for (var wi = 0; wi < allWires.length; wi++) {
              if (allWires[wi].id === wireId) {
                window.SimState.selectWire(wi);
                break;
              }
            }
            // Visual selection
            document.querySelectorAll('.sim-wire-path').forEach(function (wp) {
              wp.classList.remove('selected');
              wp.setAttribute('stroke-width', '2.5');
            });
            this.classList.add('selected');
            this.setAttribute('stroke-width', '4');
            this.setAttribute('stroke', '#58a6ff');
          }
        });

        // Double click to delete
        path.addEventListener('dblclick', function (e) {
          e.stopPropagation();
          var wireId = parseInt(this.getAttribute('data-wire-id'));
          if (!isNaN(wireId) && window.SimState) {
            if (window.SimHistory) {
              window.SimHistory.push(window.SimState.getSnapshot());
            }
            window.SimState.removeWire(wireId);
            if (window.SimWires) {
              window.SimWires.drawAllWires(window.SimState.simulationActive);
            }
            if (window.SimCanvas) {
              window.SimCanvas.updateConnectionCount(window.SimState.getWireCount());
            }
          }
        });

        this._svg.appendChild(path);
      }
    },

    /* ======================================================================
       Wire Removal
       ====================================================================== */

    /**
     * Delete the currently selected wire
     * @returns {boolean} True if a wire was deleted
     */
    deleteSelectedWire: function () {
      var state = window.SimState;
      if (!state) return false;

      var idx = state.getSelectedWireIndex();
      if (idx === null) return false;

      var wires = state.getWires();
      if (idx >= 0 && idx < wires.length) {
        state.removeWire(wires[idx].id);
        this.drawAllWires(state.simulationActive);
        return true;
      }

      return false;
    },

    /**
     * Clear all wires and temporary state
     */
    clearAll: function () {
      this._removeTempWire();

      if (this._svg) {
        var allPaths = this._svg.querySelectorAll('.sim-wire-path');
        for (var i = 0; i < allPaths.length; i++) {
          allPaths[i].remove();
        }
        var tempGroup = document.getElementById('simTempWireGroup');
        if (tempGroup) tempGroup.remove();
      }
    }
  };

})();
