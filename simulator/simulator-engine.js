/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-engine.js - Simulation Engine
   
   Responsibility:
   - Build a graph from components and wires
   - Run BFS/DFS to simulate power flow
   - Determine which components are energized
   - No DOM access, no rendering, pure logic
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimEngine - The simulation engine
   * Operates entirely on data from SimState
   */
  window.SimEngine = {

    /**
     * Run the simulation
     * Validates the circuit, then simulates power flow
     * @returns {Object} Result { success, message, conducting, warnings }
     */
    run: function () {
      var state = window.SimState;
      if (!state) return { success: false, message: '⚠️ حالة النظام غير متاحة' };

      var components = state.getComponents();
      var wires = state.getWires();

      if (components.length === 0) {
        return { success: false, message: '⚠️ لا توجد عناصر في الدائرة' };
      }

      // Validate
      var validation = window.SimValidation ? window.SimValidation.validate(components, wires) : { valid: true, issues: [], warnings: [] };
      if (!validation.valid) {
        return {
          success: false,
          message: '⚠️ ' + validation.issues.join(' | '),
          issues: validation.issues,
          warnings: validation.warnings
        };
      }

      // Reset all component states
      state.resetComponentStates();

      // Build graph
      var graph = this._buildGraph(components, wires);

      // Find all source nodes
      var sources = this._findSources(components);

      if (sources.length === 0) {
        return { success: false, message: '⚠️ لا يوجد مصدر طاقة في الدائرة' };
      }

      // Run BFS from each source to find energized components
      var conducting = {};
      var visited = {};

      for (var s = 0; s < sources.length; s++) {
        var source = sources[s];
        this._bfs(source.id, graph, components, conducting, visited);
      }

      // Apply results to component states
      this._applyResults(components, conducting);

      // Update simulation state
      state.setSimulationActive(true);

      var loadCount = 0;
      for (var id in conducting) {
        if (conducting.hasOwnProperty(id)) {
          var comp = state.getComponent(parseInt(id));
          if (comp) {
            var def = window.findComponentDef(comp.compId);
            if (def && (def.type === 'load' || def.type === 'motor' || def.type === 'lighting')) {
              loadCount++;
            }
          }
        }
      }

      return {
        success: true,
        message: '⚡ تم تشغيل الدائرة بنجاح! (' + loadCount + ' أحمال نشطة)',
        conducting: conducting,
        warnings: validation.warnings
      };
    },

    /**
     * Stop the simulation and reset all states
     * @returns {Object} Result { success, message }
     */
    stop: function () {
      var state = window.SimState;
      if (!state) return { success: false, message: '⚠️ حالة النظام غير متاحة' };

      state.resetComponentStates();
      state.setSimulationActive(false);

      return { success: true, message: '⏹️ تم إيقاف المحاكاة' };
    },

    /**
     * Toggle simulation on/off
     * @returns {Object} Result
     */
    toggle: function () {
      var state = window.SimState;
      return state && state.simulationActive ? this.stop() : this.run();
    },

    /**
     * Check if simulation is active
     * @returns {boolean}
     */
    isActive: function () {
      var state = window.SimState;
      return state ? state.simulationActive : false;
    },

    /* ======================================================================
       Graph Building
       ====================================================================== */

    /**
     * Build an adjacency graph from components and wires
     * Each node is a component ID
     * Each edge is a connection between terminals
     * @private
     * @param {Array} components - All components
     * @param {Array} wires - All wires
     * @returns {Object} Adjacency list { compId: [neighborId, ...] }
     */
    _buildGraph: function (components, wires) {
      var graph = {};

      // Initialize all nodes
      for (var i = 0; i < components.length; i++) {
        graph[components[i].id] = [];
      }

      // Add edges from wires
      for (var w = 0; w < wires.length; w++) {
        var wire = wires[w];
        if (!graph[wire.fromCompId]) graph[wire.fromCompId] = [];
        if (!graph[wire.toCompId]) graph[wire.toCompId] = [];

        graph[wire.fromCompId].push(wire.toCompId);
        graph[wire.toCompId].push(wire.fromCompId);
      }

      return graph;
    },

    /**
     * Find all power source components
     * @private
     * @param {Array} components - All components
     * @returns {Array} Array of source components
     */
    _findSources: function (components) {
      var sources = [];
      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (def && def.type === 'source') {
          sources.push(components[i]);
        }
      }
      return sources;
    },

    /* ======================================================================
       BFS Traversal
       ====================================================================== */

    /**
     * Breadth-First Search from a source to find all energized components
     * Respects switch states, protection states, and component conductivity
     * @private
     * @param {number} startId - Starting component ID
     * @param {Object} graph - Adjacency graph
     * @param {Array} components - All components
     * @param {Object} conducting - Output: set of energized component IDs
     * @param {Object} visited - Internal: visited nodes
     */
    _bfs: function (startId, graph, components, conducting, visited) {
      var queue = [startId];
      visited[startId] = true;
      conducting[startId] = true;

      while (queue.length > 0) {
        var currentId = queue.shift();
        var neighbors = graph[currentId];

        if (!neighbors) continue;

        for (var n = 0; n < neighbors.length; n++) {
          var neighborId = neighbors[n];

          if (visited[neighborId]) continue;

          // Check if current component allows flow through
          var currentComp = this._getComponentById(components, currentId);
          if (currentComp && !this._allowsFlow(currentComp, currentId, neighborId)) {
            continue;
          }

          visited[neighborId] = true;
          conducting[neighborId] = true;
          queue.push(neighborId);
        }
      }
    },

    /**
     * Check if a component allows current to flow through it
     * @private
     * @param {Object} comp - The component
     * @param {number} fromId - Source component ID (unused, kept for future)
     * @param {number} toId - Target component ID (unused, kept for future)
     * @returns {boolean} True if current can flow
     */
    _allowsFlow: function (comp, fromId, toId) {
      var def = window.findComponentDef(comp.compId);
      if (!def) return true;

      // Source: always allows flow out
      if (def.type === 'source') return true;

      // Switch: depends on state
      if (def.type === 'switch') {
        if (def.subtype === 'push_no' || def.subtype === 'limit' || def.subtype === 'spst') {
          return comp.compState && comp.compState.closed;
        }
        if (def.subtype === 'push_nc' || def.subtype === 'emergency') {
          return !(comp.compState && comp.compState.pressed);
        }
        if (def.subtype === 'spdt' || def.subtype === 'selector') {
          return comp.compState && comp.compState.closed;
        }
        return comp.compState && comp.compState.closed;
      }

      // Protection: allows flow unless tripped
      if (def.type === 'protection') {
        return !(comp.compState && comp.compState.tripped);
      }

      // Relay/Contactor: allows flow if energized
      if (def.type === 'relay' || def.type === 'contactor') {
        if (def.subtype === 'timer_on') {
          return comp.compState && comp.compState.timerElapsed;
        }
        if (def.subtype === 'timer_off') {
          return !(comp.compState && comp.compState.timerElapsed);
        }
        return comp.compState && comp.compState.energized;
      }

      // Semiconductor: diode allows one direction
      if (def.type === 'semiconductor') {
        if (def.subtype === 'diode' || def.subtype === 'zener') {
          return true; // Simplified: always allows in forward direction
        }
        return true;
      }

      // Loads, motors, passive, measurement, transformers, terminals: allow flow
      return true;
    },

    /**
     * Get component by ID from array
     * @private
     * @param {Array} components - Components array
     * @param {number} id - Component ID
     * @returns {Object|null}
     */
    _getComponentById: function (components, id) {
      for (var i = 0; i < components.length; i++) {
        if (components[i].id === id) return components[i];
      }
      return null;
    },

    /* ======================================================================
       Apply Results
       ====================================================================== */

    /**
     * Apply simulation results to component states
     * @private
     * @param {Array} components - All components
     * @param {Object} conducting - Set of energized component IDs
     */
    _applyResults: function (components, conducting) {
      for (var i = 0; i < components.length; i++) {
        var comp = components[i];
        var def = window.findComponentDef(comp.compId);

        if (conducting[comp.id]) {
          comp.compState.energized = true;

          // Loads and motors become active
          if (def && (def.type === 'load' || def.type === 'motor')) {
            comp.compState.active = true;
          }

          // Relays and contactors energize
          if (def && (def.type === 'relay' || def.type === 'contactor')) {
            comp.compState.energized = true;
          }

          // LEDs and lamps glow
          if (def && (def.subtype === 'led' || def.subtype === 'lamp' || def.subtype === 'indicator')) {
            comp.compState.active = true;
          }
        }
      }
    },

    /* ======================================================================
       Toggle Switch
       ====================================================================== */

    /**
     * Toggle a switch component (open/close)
     * @param {number} compId - Component ID
     */
    toggleSwitch: function (compId) {
      var state = window.SimState;
      if (!state) return;

      var comp = state.getComponent(compId);
      if (!comp) return;

      var def = window.findComponentDef(comp.compId);
      if (!def || def.type !== 'switch') return;

      if (!comp.compState) comp.compState = {};
      comp.compState.closed = !comp.compState.closed;

      // Visual feedback
      if (comp.el) {
        comp.el.style.borderColor = comp.compState.closed ? '#3fb950' : (def.color || '#00e5ff');
      }

      // Re-run if simulation active
      if (state.simulationActive) {
        this.run();
      }
    },

    /**
     * Push a momentary button (press and release after delay)
     * @param {number} compId - Component ID
     */
    pushButton: function (compId) {
      var state = window.SimState;
      if (!state) return;

      var comp = state.getComponent(compId);
      if (!comp) return;

      var def = window.findComponentDef(comp.compId);
      if (!def) return;
      if (def.subtype !== 'push_no' && def.subtype !== 'push_nc' && def.subtype !== 'emergency') return;

      if (!comp.compState) comp.compState = {};
      comp.compState.pressed = true;

      if (comp.el) comp.el.style.borderColor = '#3fb950';

      if (state.simulationActive) this.run();

      var self = this;
      setTimeout(function () {
        comp.compState.pressed = false;
        if (comp.el) comp.el.style.borderColor = def.color || '#00e5ff';
        if (state.simulationActive) self.run();
      }, 500);
    }
  };

})();
