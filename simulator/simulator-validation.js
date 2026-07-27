/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-validation.js - Circuit Validator
   
   Responsibility:
   - Validate circuit before simulation
   - Detect: missing source, missing load, unconnected components,
     short circuits, open circuits
   - No DOM access, pure data validation
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimValidation - Circuit validation logic
   * All functions are pure: input components+wires, output results
   */
  window.SimValidation = {

    /**
     * Validate the entire circuit
     * @param {Array} components - All placed components
     * @param {Array} wires - All wire connections
     * @returns {Object} { valid: boolean, issues: string[], warnings: string[] }
     */
    validate: function (components, wires) {
      var issues = [];
      var warnings = [];

      if (!components || components.length === 0) {
        issues.push('لا توجد أي عناصر في الدائرة');
        return { valid: false, issues: issues, warnings: warnings };
      }

      if (!wires) wires = [];

      // Check for power source
      if (!this._hasPowerSource(components)) {
        issues.push('لا يوجد مصدر طاقة. أضف بطارية أو مصدر تغذية.');
      }

      // Check for load
      if (!this._hasLoad(components)) {
        issues.push('لا يوجد حمل في الدائرة. أضف لمبة، محرك، أو أي حمل آخر.');
      }

      // Check for connections
      if (wires.length === 0 && components.length > 1) {
        warnings.push('لا توجد توصيلات بين العناصر');
      }

      // Find unconnected components
      var connectedIds = this._getConnectedIds(wires);
      var unconnected = [];

      for (var i = 0; i < components.length; i++) {
        if (!connectedIds[components[i].id]) {
          unconnected.push(components[i].id);
        }
      }

      if (unconnected.length > 0 && components.length > 1) {
        warnings.push('هناك ' + unconnected.length + ' عناصر غير موصولة بالدائرة');
      }

      // Check for short circuits (if we have connections)
      if (wires.length >= 2) {
        var hasShort = this._detectShortCircuit(components, wires);
        if (hasShort) {
          issues.push('⚠️ تم اكتشاف قصر كهربائي محتمل في الدائرة');
        }
      }

      // Check for open circuits (if we have source + load + connections)
      var hasSource = this._hasPowerSource(components);
      var hasLoad = this._hasLoad(components);

      if (hasSource && hasLoad && wires.length > 0) {
        var hasOpen = this._detectOpenCircuit(components, wires);
        if (hasOpen) {
          warnings.push('قد تكون هناك دائرة مفتوحة - تحقق من توصيل جميع العناصر');
        }
      }

      return {
        valid: issues.length === 0,
        issues: issues,
        warnings: warnings
      };
    },

    /* ======================================================================
       Power Source Detection
       ====================================================================== */

    /**
     * Check if any power source exists in the circuit
     * @private
     * @param {Array} components
     * @returns {boolean}
     */
    _hasPowerSource: function (components) {
      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (def && def.type === 'source') {
          return true;
        }
      }
      return false;
    },

    /* ======================================================================
       Load Detection
       ====================================================================== */

    /**
     * Check if any load exists in the circuit
     * @private
     * @param {Array} components
     * @returns {boolean}
     */
    _hasLoad: function (components) {
      var loadTypes = ['load', 'motor', 'relay', 'contactor', 'passive', 'semiconductor', 'ic', 'logic'];

      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (def && loadTypes.indexOf(def.type) !== -1) {
          return true;
        }
      }
      return false;
    },

    /* ======================================================================
       Connected Components
       ====================================================================== */

    /**
     * Build a set of all component IDs that have at least one wire
     * @private
     * @param {Array} wires
     * @returns {Object} Hash map of connected IDs
     */
    _getConnectedIds: function (wires) {
      var ids = {};

      for (var i = 0; i < wires.length; i++) {
        ids[wires[i].fromCompId] = true;
        ids[wires[i].toCompId] = true;
      }

      return ids;
    },

    /* ======================================================================
       Short Circuit Detection
       ====================================================================== */

    /**
     * Detect potential short circuits
     * A short circuit occurs when two terminals of the same source
     * are connected through a path with no load
     * @private
     * @param {Array} components
     * @param {Array} wires
     * @returns {boolean}
     */
    _detectShortCircuit: function (components, wires) {
      // Find all DC sources (batteries, DC supplies)
      var dcSources = [];

      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (def && (def.subtype === 'battery' || def.subtype === 'dc')) {
          dcSources.push(components[i]);
        }
      }

      // Build adjacency graph
      var graph = this._buildGraph(components, wires);

      // For each DC source with 2 terminals, check if terminals are connected
      // through a path that has no load
      for (var s = 0; s < dcSources.length; s++) {
        var source = dcSources[s];
        var def = window.findComponentDef(source.compId);
        if (def && def.terminals === 2) {
          // Check if terminal 0 and terminal 1 are connected
          if (this._areTerminalsConnected(source.id, 0, source.id, 1, graph, components, {})) {
            return true;
          }
        }
      }

      return false;
    },

    /* ======================================================================
       Open Circuit Detection
       ====================================================================== */

    /**
     * Detect open circuits
     * An open circuit exists if there are loads not reachable from any source
     * @private
     * @param {Array} components
     * @param {Array} wires
     * @returns {boolean}
     */
    _detectOpenCircuit: function (components, wires) {
      var sources = [];
      var loads = [];

      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (def && def.type === 'source') {
          sources.push(components[i]);
        }
        if (def && (def.type === 'load' || def.type === 'motor')) {
          loads.push(components[i]);
        }
      }

      if (sources.length === 0 || loads.length === 0) return false;

      var graph = this._buildGraph(components, wires);
      var visited = {};

      // DFS from all sources
      for (var s = 0; s < sources.length; s++) {
        this._dfs(sources[s].id, graph, visited);
      }

      // Check if any load is not visited
      for (var l = 0; l < loads.length; l++) {
        if (!visited[loads[l].id]) return true;
      }

      return false;
    },

    /* ======================================================================
       Graph Helpers
       ====================================================================== */

    /**
     * Build adjacency graph from wires
     * @private
     * @param {Array} components
     * @param {Array} wires
     * @returns {Object} Adjacency list
     */
    _buildGraph: function (components, wires) {
      var graph = {};

      for (var i = 0; i < components.length; i++) {
        graph[components[i].id] = [];
      }

      for (var w = 0; w < wires.length; w++) {
        var wire = wires[w];
        if (!graph[wire.fromCompId]) graph[wire.fromCompId] = [];
        if (!graph[wire.toCompId]) graph[wire.toCompId] = [];

        if (graph[wire.fromCompId].indexOf(wire.toCompId) === -1) {
          graph[wire.fromCompId].push(wire.toCompId);
        }
        if (graph[wire.toCompId].indexOf(wire.fromCompId) === -1) {
          graph[wire.toCompId].push(wire.fromCompId);
        }
      }

      return graph;
    },

    /**
     * Depth-First Search
     * @private
     * @param {number} nodeId - Starting node
     * @param {Object} graph - Adjacency list
     * @param {Object} visited - Visited nodes hash
     */
    _dfs: function (nodeId, graph, visited) {
      if (visited[nodeId]) return;
      visited[nodeId] = true;

      var neighbors = graph[nodeId];
      if (!neighbors) return;

      for (var i = 0; i < neighbors.length; i++) {
        this._dfs(neighbors[i], graph, visited);
      }
    },

    /**
     * Check if two terminals are connected through any path
     * Used for short circuit detection
     * @private
     * @param {number} fromCompId - Start component
     * @param {number} fromTerm - Start terminal
     * @param {number} toCompId - Target component
     * @param {number} toTerm - Target terminal
     * @param {Object} graph - Adjacency graph
     * @param {Array} components - All components
     * @param {Object} visited - Visited hash
     * @returns {boolean}
     */
    _areTerminalsConnected: function (fromCompId, fromTerm, toCompId, toTerm, graph, components, visited) {
      var key = fromCompId + '-' + fromTerm;
      if (visited[key]) return false;
      visited[key] = true;

      if (fromCompId === toCompId && fromTerm !== toTerm) {
        return true;
      }

      var neighbors = graph[fromCompId] || [];

      for (var i = 0; i < neighbors.length; i++) {
        if (this._areTerminalsConnected(neighbors[i], 0, toCompId, toTerm, graph, components, visited)) {
          return true;
        }
      }

      return false;
    }
  };

})();
