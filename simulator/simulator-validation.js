/* ==========================================================================
   DrDer Electronic - Circuit Validation v4.0
   Checks circuit correctness, finds issues, validates connections
   ========================================================================== */
(function () {
  'use strict';

  window.SimValidation = {
    /* ========================================================================
       Validate the entire circuit
       @param {Array} placedComponents - All placed components
       @param {Array} connections - All wire connections
       @returns {Object} { valid, issues, warnings }
       ======================================================================== */
    validate: function (placedComponents, connections) {
      var issues = [];
      var warnings = [];

      if (!placedComponents || placedComponents.length === 0) {
        issues.push('لا توجد أي عناصر في الدائرة');
        return { valid: false, issues: issues, warnings: warnings };
      }

      if (!connections) connections = [];

      var hasSource = this._hasPowerSource(placedComponents);
      if (!hasSource) {
        issues.push('لا يوجد مصدر طاقة. أضف بطارية أو مصدر تغذية.');
      }

      var hasLoad = this._hasLoad(placedComponents);
      if (!hasLoad) {
        issues.push('لا يوجد حمل في الدائرة. أضف لمبة، محرك، أو أي حمل آخر.');
      }

      if (connections.length === 0 && placedComponents.length > 1) {
        warnings.push('لا توجد توصيلات بين العناصر');
      }

      var connectedIds = {};
      for (var i = 0; i < connections.length; i++) {
        connectedIds[connections[i].fromCompId] = true;
        connectedIds[connections[i].toCompId] = true;
      }

      var unconnectedCount = 0;
      for (var j = 0; j < placedComponents.length; j++) {
        if (!connectedIds[placedComponents[j].id]) {
          unconnectedCount++;
        }
      }

      if (unconnectedCount > 0 && placedComponents.length > 1) {
        warnings.push('هناك ' + unconnectedCount + ' عناصر غير موصولة بالدائرة');
      }

      if (connections.length > 0 && hasSource && hasLoad) {
        var shortResult = this._detectShortCircuit(placedComponents, connections);
        if (shortResult) {
          issues.push('⚠️ تم اكتشاف قصر كهربائي محتمل في الدائرة');
        }

        var openResult = this._detectOpenCircuit(placedComponents, connections);
        if (openResult) {
          warnings.push('قد تكون هناك دائرة مفتوحة - تحقق من توصيل جميع العناصر');
        }
      }

      return {
        valid: issues.length === 0,
        issues: issues,
        warnings: warnings
      };
    },

    /* ========================================================================
       Check if any power source exists
       ======================================================================== */
    _hasPowerSource: function (components) {
      var sourceIds = [
        'battery', 'battery_9v', 'battery_liion',
        'dc_supply', 'dc_supply_adj',
        'ac_supply_1ph', 'ac_supply_3ph',
        'generator_dc', 'generator_ac',
        'solar_panel', 'power_supply'
      ];

      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (def && sourceIds.indexOf(def.id) !== -1) {
          return true;
        }
      }
      return false;
    },

    /* ========================================================================
       Check if any load exists
       ======================================================================== */
    _hasLoad: function (components) {
      var loadTypes = [
        'lamp', 'led', 'rgb_led', 'indicator', 'buzzer',
        'dc_motor', 'ac_1ph', 'ac_3ph', 'servo', 'stepper',
        'resistor', 'pot', 'ldr', 'ntc', 'ptc',
        'capacitor', 'capacitor_polar', 'capacitor_var',
        'inductor', 'choke',
        'diode', 'zener', 'schottky', 'bridge',
        'npn', 'pnp', 'mosfet_n', 'mosfet_p', 'igbt', 'triac', 'scr',
        '555', 'opamp', 'regulator',
        'relay_spdt', 'relay_dpdt', 'timer_on', 'timer_off',
        'contactor_3p', 'contactor_4p',
        'voltmeter', 'ammeter', 'multimeter', 'scope', 'wattmeter'
      ];

      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (def && loadTypes.indexOf(def.subtype) !== -1) {
          return true;
        }
      }
      return false;
    },

    /* ========================================================================
       Detect potential short circuits
       ======================================================================== */
    _detectShortCircuit: function (components, connections) {
      if (!connections || connections.length === 0) return false;

      var sources = [];
      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (def && (def.subtype === 'battery' || def.subtype === 'dc' || def.subtype === 'dc_adj')) {
          sources.push(components[i]);
        }
      }

      for (var s = 0; s < sources.length; s++) {
        var source = sources[s];
        var def = window.findComponentDef(source.compId);
        var terminalCount = def ? (def.terminals || 2) : 2;

        for (var t1 = 0; t1 < terminalCount; t1++) {
          for (var t2 = t1 + 1; t2 < terminalCount; t2++) {
            if (this._areTerminalsConnected(source.id, t1, source.id, t2, connections, components, 0)) {
              return true;
            }
          }
        }
      }

      return false;
    },

    /* ========================================================================
       Detect open circuits
       ======================================================================== */
    _detectOpenCircuit: function (components, connections) {
      if (!connections || connections.length === 0) return false;

      var sources = [];
      var loads = [];

      for (var i = 0; i < components.length; i++) {
        var def = window.findComponentDef(components[i].compId);
        if (!def) continue;
        if (def.type === 'source') sources.push(components[i]);
        if (def.type === 'load' || def.type === 'motor' || def.type === 'passive' ||
            def.type === 'relay' || def.type === 'contactor') {
          loads.push(components[i]);
        }
      }

      if (sources.length === 0 || loads.length === 0) return false;

      var visited = {};

      var dfs = function (compId) {
        if (visited[compId]) return;
        visited[compId] = true;

        for (var i = 0; i < connections.length; i++) {
          var conn = connections[i];
          if (conn.fromCompId === compId) dfs(conn.toCompId);
          if (conn.toCompId === compId) dfs(conn.fromCompId);
        }
      };

      for (var s = 0; s < sources.length; s++) {
        dfs(sources[s].id);
      }

      for (var l = 0; l < loads.length; l++) {
        if (!visited[loads[l].id]) return true;
      }

      return false;
    },

    /* ========================================================================
       Check if two terminals are connected through any path
       ======================================================================== */
    _areTerminalsConnected: function (fromCompId, fromTerm, toCompId, toTerm, connections, components, depth) {
      if (depth > 50) return false;

      var key = fromCompId + '-' + fromTerm;
      if (this._visitedKeys && this._visitedKeys[key]) return false;
      if (!this._visitedKeys) this._visitedKeys = {};
      this._visitedKeys[key] = true;

      if (fromCompId === toCompId) {
        for (var i = 0; i < connections.length; i++) {
          var c = connections[i];
          if ((c.fromCompId === fromCompId && c.fromTerminal === toTerm) ||
              (c.toCompId === fromCompId && c.toTerminal === toTerm)) {
            return true;
          }
        }
      }

      var comp = null;
      for (var j = 0; j < components.length; j++) {
        if (components[j].id === fromCompId) {
          comp = components[j];
          break;
        }
      }
      if (!comp) return false;

      var def = window.findComponentDef(comp.compId);
      if (!def) return false;

      if (def.type === 'switch') {
        if (def.subtype === 'push_no' || def.subtype === 'limit_no' || def.subtype === 'float') {
          if (!comp.compState || !comp.compState.closed) return false;
        }
        if (def.subtype === 'push_nc' || def.subtype === 'limit_nc' || def.subtype === 'emergency') {
          if (comp.compState && comp.compState.pressed) return false;
        }
      }
      if (def.type === 'protection') {
        if (comp.compState && comp.compState.tripped) return false;
      }

      for (var k = 0; k < connections.length; k++) {
        var conn = connections[k];
        if (conn.fromCompId === fromCompId && conn.fromTerminal !== fromTerm) {
          if (this._areTerminalsConnected(conn.toCompId, conn.toTerminal, toCompId, toTerm, connections, components, depth + 1)) {
            return true;
          }
        }
        if (conn.toCompId === fromCompId && conn.toTerminal !== fromTerm) {
          if (this._areTerminalsConnected(conn.fromCompId, conn.fromTerminal, toCompId, toTerm, connections, components, depth + 1)) {
            return true;
          }
        }
      }

      return false;
    },

    /* ========================================================================
       Reset visited keys before new search
       ======================================================================== */
    _resetVisited: function () {
      this._visitedKeys = {};
    }
  };
})();
