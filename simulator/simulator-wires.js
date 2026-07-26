/* ==========================================================================
   DrDer Electronic - Simulator Wires v4.0
   Manages wire connections between components
   ========================================================================== */
(function () {
  'use strict';

  window.SimWires = {
    _connections: [],
    _tempConnection: null,
    _svgWires: null,
    _canvasModule: null,
    _state: null,
    _onConnectionCreated: null,
    _onConnectionRemoved: null,

    /* ========================================================================
       Initialize
       ======================================================================== */
    init: function (state, canvasModule) {
      this._state = state;
      this._canvasModule = canvasModule;
      this._connections = [];
      this._tempConnection = null;
      this._svgWires = document.getElementById('canvasWiresSvg');
    },

    /* ========================================================================
       Start creating a connection from a terminal
       ======================================================================== */
    startConnection: function (componentId, terminalIndex, clientX, clientY) {
      if (!this._canvasModule) return;

      var world = this._canvasModule.screenToWorld(clientX, clientY);

      this._tempConnection = {
        fromCompId: componentId,
        fromTerminal: terminalIndex,
        currentX: world.x,
        currentY: world.y
      };
    },

    /* ========================================================================
       Update temporary wire position while dragging
       ======================================================================== */
    updateTempWire: function (clientX, clientY) {
      if (!this._tempConnection || !this._canvasModule) return;

      var world = this._canvasModule.screenToWorld(clientX, clientY);
      this._tempConnection.currentX = world.x;
      this._tempConnection.currentY = world.y;

      this._drawTempWire();
    },

    /* ========================================================================
       Draw the temporary wire on SVG
       ======================================================================== */
    _drawTempWire: function () {
      if (!this._svgWires || !this._tempConnection) return;

      var g = document.getElementById('simTempWireGroup');
      if (!g) {
        g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = 'simTempWireGroup';
        this._svgWires.appendChild(g);
      }

      var fromComp = this._getComponentById(this._tempConnection.fromCompId);
      if (!fromComp || !fromComp.el) return;

      var termPos = this._getTerminalWorldPos(fromComp, this._tempConnection.fromTerminal);
      var x1 = termPos.x;
      var y1 = termPos.y;
      var x2 = this._tempConnection.currentX;
      var y2 = this._tempConnection.currentY;

      g.innerHTML = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
        '" stroke="var(--accent)" stroke-width="2" stroke-dasharray="8,4" opacity="0.8"/>';
    },

    /* ========================================================================
       Finish creating a connection
       ======================================================================== */
    finishConnection: function (clientX, clientY) {
      this._removeTempWire();

      if (!this._tempConnection) return null;

      if (!this._canvasModule) {
        this._tempConnection = null;
        return null;
      }

      var world = this._canvasModule.screenToWorld(clientX, clientY);
      var fromCompId = this._tempConnection.fromCompId;
      var fromTerminal = this._tempConnection.fromTerminal;

      this._tempConnection = null;

      var bestTerminal = this._findNearestTerminal(world.x, world.y, fromCompId);
      if (!bestTerminal) return null;

      var exists = this._connectionExists(fromCompId, fromTerminal, bestTerminal.componentId, bestTerminal.terminalIndex);
      if (exists) {
        return { success: false, message: '⚠️ هذان الطرفان متصلان بالفعل' };
      }

      var connection = {
        fromCompId: fromCompId,
        fromTerminal: fromTerminal,
        toCompId: bestTerminal.componentId,
        toTerminal: bestTerminal.terminalIndex,
        color: '#d2991d'
      };

      this._connections.push(connection);

      if (this._onConnectionCreated) {
        this._onConnectionCreated(connection);
      }

      return { success: true, connection: connection };
    },

    /* ========================================================================
       Check if connection already exists
       ======================================================================== */
    _connectionExists: function (fromId, fromTerm, toId, toTerm) {
      for (var i = 0; i < this._connections.length; i++) {
        var c = this._connections[i];
        if ((c.fromCompId === fromId && c.toCompId === toId &&
             c.fromTerminal === fromTerm && c.toTerminal === toTerm) ||
            (c.fromCompId === toId && c.toCompId === fromId &&
             c.fromTerminal === toTerm && c.toTerminal === fromTerm)) {
          return true;
        }
      }
      return false;
    },

    /* ========================================================================
       Find nearest terminal to a world position
       ======================================================================== */
    _findNearestTerminal: function (wx, wy, excludeCompId) {
      var canvas = this._canvasModule ? this._canvasModule.getCanvas() : null;
      if (!canvas) return null;

      var best = null;
      var bestDist = 40 / (this._canvasModule.getZoomLevel() || 1);
      var terminals = canvas.querySelectorAll('.sim-terminal');

      for (var i = 0; i < terminals.length; i++) {
        var term = terminals[i];
        var compId = parseInt(term.dataset.componentId);
        if (compId === excludeCompId) continue;

        var comp = this._getComponentById(compId);
        if (!comp || !comp.el) continue;

        var terminalIndex = parseInt(term.dataset.terminalIndex);
        var pos = this._getTerminalWorldPos(comp, terminalIndex);
        var dist = Math.sqrt((wx - pos.x) * (wx - pos.x) + (wy - pos.y) * (wy - pos.y));

        if (dist < bestDist) {
          bestDist = dist;
          best = { componentId: compId, terminalIndex: terminalIndex };
        }
      }

      return best;
    },

    /* ========================================================================
       Get terminal position in world coordinates
       ======================================================================== */
    _getTerminalWorldPos: function (comp, terminalIndex) {
      var def = window.findComponentDef(comp.compId);
      var terminalCount = def ? def.terminals : 2;
      var positions = window.getTerminalPositions(terminalCount);
      var pos = positions[terminalIndex] || positions[0];

      return {
        x: comp.x + (pos.x / 100) * comp.el.offsetWidth,
        y: comp.y + (pos.y / 100) * comp.el.offsetHeight
      };
    },

    /* ========================================================================
       Get component by ID from state
       ======================================================================== */
    _getComponentById: function (id) {
      if (!this._state || !this._state.placedComponents) return null;
      for (var i = 0; i < this._state.placedComponents.length; i++) {
        if (this._state.placedComponents[i].id === id) {
          return this._state.placedComponents[i];
        }
      }
      return null;
    },

    /* ========================================================================
       Remove temporary wire
       ======================================================================== */
    _removeTempWire: function () {
      var g = document.getElementById('simTempWireGroup');
      if (g) g.remove();
    },

    /* ========================================================================
       Cancel current connection
       ======================================================================== */
    cancelConnection: function () {
      this._tempConnection = null;
      this._removeTempWire();
    },

    /* ========================================================================
       Check if currently creating a connection
       ======================================================================== */
    isConnecting: function () {
      return this._tempConnection !== null;
    },

    /* ========================================================================
       Draw all wires on SVG
       ======================================================================== */
    drawAllWires: function (simulationActive) {
      if (!this._svgWires) return;

      var existingWires = this._svgWires.querySelectorAll('.sim-wire-path');
      for (var i = 0; i < existingWires.length; i++) {
        existingWires[i].remove();
      }

      var self = this;
      this._connections.forEach(function (conn, index) {
        var fromComp = self._getComponentById(conn.fromCompId);
        var toComp = self._getComponentById(conn.toCompId);

        if (!fromComp || !toComp || !fromComp.el || !toComp.el) return;

        var fromPos = self._getTerminalWorldPos(fromComp, conn.fromTerminal);
        var toPos = self._getTerminalWorldPos(toComp, conn.toTerminal);

        var x1 = fromPos.x, y1 = fromPos.y;
        var x2 = toPos.x, y2 = toPos.y;
        var midX = (x1 + x2) / 2;

        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + midX + ' ' + y1 + ', ' + midX + ' ' + y2 + ', ' + x2 + ' ' + y2);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', simulationActive ? '#3fb950' : (conn.color || '#d2991d'));
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('data-connection-index', index);
        path.classList.add('sim-wire-path');

        path.addEventListener('click', function (e) {
          e.stopPropagation();
          if (window.SimSelection) {
            window.SimSelection.selectWire(path);
          }
        });

        path.addEventListener('dblclick', function (e) {
          e.stopPropagation();
          self.deleteWireByIndex(index);
        });

        self._svgWires.appendChild(path);
      });
    },

    /* ========================================================================
       Delete a wire by index
       ======================================================================== */
    deleteWireByIndex: function (index) {
      if (index >= 0 && index < this._connections.length) {
        var conn = this._connections[index];
        this._connections.splice(index, 1);

        if (this._onConnectionRemoved) {
          this._onConnectionRemoved(conn);
        }
      }
    },

    /* ========================================================================
       Delete selected wire
       ======================================================================== */
    deleteSelectedWire: function () {
      if (!window.SimSelection) return false;

      var selectedWire = window.SimSelection.getSelectedWire();
      if (!selectedWire) return false;

      var index = parseInt(selectedWire.dataset.connectionIndex);
      if (!isNaN(index)) {
        this.deleteWireByIndex(index);
        window.SimSelection.clearWireSelection();
        return true;
      }

      return false;
    },

    /* ========================================================================
       Delete all connections for a component
       ======================================================================== */
    deleteConnectionsForComponent: function (componentId) {
      this._connections = this._connections.filter(function (c) {
        return c.fromCompId !== componentId && c.toCompId !== componentId;
      });
    },

    /* ========================================================================
       Getters and Setters
       ======================================================================== */
    getConnections: function () {
      return this._connections.slice();
    },

    setConnections: function (connections) {
      this._connections = connections ? connections.slice() : [];
    },

    getConnectionCount: function () {
      return this._connections.length;
    },

    /* ========================================================================
       Callbacks
       ======================================================================== */
    onConnectionCreated: function (cb) { this._onConnectionCreated = cb; },
    onConnectionRemoved: function (cb) { this._onConnectionRemoved = cb; },

    /* ========================================================================
       Clear all wires
       ======================================================================== */
    clearAll: function () {
      this._connections = [];
      this._tempConnection = null;
      this._removeTempWire();

      if (this._svgWires) {
        var wires = this._svgWires.querySelectorAll('.sim-wire-path');
        for (var i = 0; i < wires.length; i++) {
          wires[i].remove();
        }
        var tempGroup = document.getElementById('simTempWireGroup');
        if (tempGroup) tempGroup.remove();
      }
    }
  };
})();
