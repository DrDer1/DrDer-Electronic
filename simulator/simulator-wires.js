/* ==========================================================================
   DrDer Electronic - Simulator Wires
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
    init(state, canvasModule) {
      this._state = state;
      this._canvasModule = canvasModule;
      this._connections = [];
      this._tempConnection = null;
      this._svgWires = document.getElementById('canvasWiresSvg');
    },

    /* ========================================================================
       Start creating a connection
       ======================================================================== */
    startConnection(componentId, terminalIndex, clientX, clientY) {
      const world = this._canvasModule.screenToWorld(clientX, clientY);

      this._tempConnection = {
        fromCompId: componentId,
        fromTerminal: terminalIndex,
        startX: world.x,
        startY: world.y,
        currentX: world.x,
        currentY: world.y
      };
    },

    /* ========================================================================
       Update temp wire position
       ======================================================================== */
    updateTempWire(clientX, clientY) {
      if (!this._tempConnection) return;

      const world = this._canvasModule.screenToWorld(clientX, clientY);
      this._tempConnection.currentX = world.x;
      this._tempConnection.currentY = world.y;

      this._drawTempWire();
    },

    /* ========================================================================
       Draw temporary wire
       ======================================================================== */
    _drawTempWire() {
      if (!this._svgWires || !this._tempConnection) return;

      let g = document.getElementById('simTempWireGroup');
      if (!g) {
        g = SimUtils.createSVGElement('g', { id: 'simTempWireGroup' });
        this._svgWires.appendChild(g);
      }

      const fromComp = this._state.placedComponents.find(c => c.id === this._tempConnection.fromCompId);
      if (!fromComp || !fromComp.el) return;

      const termPos = this._getTerminalWorldPos(fromComp, this._tempConnection.fromTerminal);
      const x1 = termPos.x;
      const y1 = termPos.y;
      const x2 = this._tempConnection.currentX;
      const y2 = this._tempConnection.currentY;

      g.innerHTML = `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
              stroke="var(--accent)" stroke-width="2" stroke-dasharray="8,4" opacity="0.8"/>
      `;
    },

    /* ========================================================================
       Finish creating a connection
       ======================================================================== */
    finishConnection(clientX, clientY) {
      this._removeTempWire();

      if (!this._tempConnection) return null;

      const world = this._canvasModule.screenToWorld(clientX, clientY);
      const fromCompId = this._tempConnection.fromCompId;
      const fromTerminal = this._tempConnection.fromTerminal;

      this._tempConnection = null;

      const bestTerminal = this._findNearestTerminal(world.x, world.y, fromCompId);
      if (!bestTerminal) return null;

      const exists = this._connections.some(c =>
        (c.fromCompId === fromCompId && c.toCompId === bestTerminal.componentId &&
         c.fromTerminal === fromTerminal && c.toTerminal === bestTerminal.terminalIndex) ||
        (c.fromCompId === bestTerminal.componentId && c.toCompId === fromCompId &&
         c.fromTerminal === bestTerminal.terminalIndex && c.toTerminal === fromTerminal)
      );

      if (exists) return { success: false, message: '⚠️ هذان الطرفان متصلان بالفعل' };

      const connection = {
        fromCompId,
        fromTerminal,
        toCompId: bestTerminal.componentId,
        toTerminal: bestTerminal.terminalIndex,
        color: '#d2991d'
      };

      this._connections.push(connection);

      if (this._onConnectionCreated) {
        this._onConnectionCreated(connection);
      }

      return { success: true, connection };
    },

    /* ========================================================================
       Find nearest terminal
       ======================================================================== */
    _findNearestTerminal(wx, wy, excludeCompId) {
      const canvas = this._canvasModule.getCanvas();
      if (!canvas) return null;

      let best = null;
      let bestDist = 40 / (this._canvasModule.getZoomLevel() || 1);

      canvas.querySelectorAll('.sim-terminal').forEach(term => {
        const compId = parseInt(term.dataset.componentId);
        if (compId === excludeCompId) return;

        const comp = this._state.placedComponents.find(c => c.id === compId);
        if (!comp || !comp.el) return;

        const terminalIndex = parseInt(term.dataset.terminalIndex);
        const pos = this._getTerminalWorldPos(comp, terminalIndex);
        const dist = SimUtils.distance(wx, wy, pos.x, pos.y);

        if (dist < bestDist) {
          bestDist = dist;
          best = { componentId: compId, terminalIndex };
        }
      });

      return best;
    },

    /* ========================================================================
       Get terminal world position
       ======================================================================== */
    _getTerminalWorldPos(comp, terminalIndex) {
      const def = window.findComponentDef(comp.compId);
      const positions = window.getTerminalPositions(def ? def.terminals : 2);
      const pos = positions[terminalIndex] || positions[0];

      return {
        x: comp.x + (pos.x / 100) * comp.el.offsetWidth,
        y: comp.y + (pos.y / 100) * comp.el.offsetHeight
      };
    },

    /* ========================================================================
       Remove temp wire
       ======================================================================== */
    _removeTempWire() {
      const g = document.getElementById('simTempWireGroup');
      if (g) g.remove();
    },

    /* ========================================================================
       Cancel connection
       ======================================================================== */
    cancelConnection() {
      this._tempConnection = null;
      this._removeTempWire();
    },

    /* ========================================================================
       Check if creating connection
       ======================================================================== */
    isConnecting() {
      return this._tempConnection !== null;
    },

    /* ========================================================================
       Draw all wires
       ======================================================================== */
    drawAllWires(simulationActive) {
      if (!this._svgWires) return;

      this._svgWires.querySelectorAll('.sim-wire-path').forEach(el => el.remove());

      this._connections.forEach((conn, index) => {
        const fromComp = this._state.placedComponents.find(c => c.id === conn.fromCompId);
        const toComp = this._state.placedComponents.find(c => c.id === conn.toCompId);

        if (!fromComp || !toComp || !fromComp.el || !toComp.el) return;

        const fromPos = this._getTerminalWorldPos(fromComp, conn.fromTerminal);
        const toPos = this._getTerminalWorldPos(toComp, conn.toTerminal);

        const x1 = fromPos.x, y1 = fromPos.y;
        const x2 = toPos.x, y2 = toPos.y;
        const midX = (x1 + x2) / 2;

        const path = SimUtils.createSVGElement('path', {
          d: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
          fill: 'none',
          stroke: simulationActive ? '#3fb950' : (conn.color || '#d2991d'),
          'stroke-width': '2.5',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'data-connection-index': index,
          class: 'sim-wire-path'
        });

        path.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.SimSelection) {
            window.SimSelection.selectWire(path);
          }
        });

        path.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this._deleteWire(index);
        });

        this._svgWires.appendChild(path);
      });
    },

    /* ========================================================================
       Delete a wire
       ======================================================================== */
    _deleteWire(index) {
      if (index >= 0 && index < this._connections.length) {
        const conn = this._connections[index];
        this._connections.splice(index, 1);

        if (this._onConnectionRemoved) {
          this._onConnectionRemoved(conn);
        }
      }
    },

    deleteSelectedWire() {
      const selectedWire = window.SimSelection ? window.SimSelection.getSelectedWire() : null;
      if (!selectedWire) return false;

      const index = parseInt(selectedWire.dataset.connectionIndex);
      if (!isNaN(index)) {
        this._deleteWire(index);
        if (window.SimSelection) window.SimSelection.clearWireSelection();
        return true;
      }

      return false;
    },

    /* ========================================================================
       Delete connections for a component
       ======================================================================== */
    deleteConnectionsForComponent(componentId) {
      this._connections = this._connections.filter(c =>
        c.fromCompId !== componentId && c.toCompId !== componentId
      );
    },

    /* ========================================================================
       Getters
       ======================================================================== */
    getConnections() {
      return [...this._connections];
    },

    setConnections(connections) {
      this._connections = [...connections];
    },

    getConnectionCount() {
      return this._connections.length;
    },

    /* ========================================================================
       Callbacks
       ======================================================================== */
    onConnectionCreated(cb) { this._onConnectionCreated = cb; },
    onConnectionRemoved(cb) { this._onConnectionRemoved = cb; },

    /* ========================================================================
       Clear all
       ======================================================================== */
    clearAll() {
      this._connections = [];
      this._tempConnection = null;
      this._removeTempWire();
      if (this._svgWires) {
        this._svgWires.querySelectorAll('.sim-wire-path, #simTempWireGroup').forEach(el => el.remove());
      }
    }
  };
})();
