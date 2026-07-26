/* ==========================================================================
   DrDer Electronic - Circuit Validation
   Checks circuit correctness, finds issues, validates connections
   ========================================================================== */
(function () {
  'use strict';

  window.SimValidation = {
    /* ========================================================================
       Validate the entire circuit
       Returns { valid: boolean, issues: string[], warnings: string[] }
       ======================================================================== */
    validate(placedComponents, connections) {
      const issues = [];
      const warnings = [];

      if (placedComponents.length === 0) {
        issues.push('لا توجد أي عناصر في الدائرة');
        return { valid: false, issues, warnings };
      }

      // Check for power source
      const hasSource = this._hasPowerSource(placedComponents);
      if (!hasSource) {
        issues.push('لا يوجد مصدر طاقة. أضف بطارية أو مصدر تغذية.');
      }

      // Check for load
      const hasLoad = this._hasLoad(placedComponents);
      if (!hasLoad) {
        issues.push('لا يوجد حمل في الدائرة. أضف لمبة، محرك، أو أي حمل آخر.');
      }

      // Check connections
      if (connections.length === 0 && placedComponents.length > 1) {
        warnings.push('لا توجد توصيلات بين العناصر');
      }

      // Check for unconnected components
      const connectedIds = new Set();
      connections.forEach(c => {
        connectedIds.add(c.fromCompId);
        connectedIds.add(c.toCompId);
      });

      const unconnected = placedComponents.filter(c => !connectedIds.has(c.id));
      if (unconnected.length > 0 && placedComponents.length > 1) {
        warnings.push(`هناك ${unconnected.length} عناصر غير موصولة بالدائرة`);
      }

      // Check for short circuits
      const hasShort = this._detectShortCircuit(placedComponents, connections);
      if (hasShort) {
        issues.push('⚠️ تم اكتشاف قصر كهربائي محتمل في الدائرة');
      }

      // Check for open circuits
      if (connections.length > 0 && hasSource && hasLoad) {
        const hasOpenCircuit = this._detectOpenCircuit(placedComponents, connections);
        if (hasOpenCircuit) {
          warnings.push('قد تكون هناك دائرة مفتوحة - تحقق من توصيل جميع العناصر');
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        warnings
      };
    },

    /* ========================================================================
       Check if any power source exists
       ======================================================================== */
    _hasPowerSource(components) {
      const sourceTypes = ['battery', 'dc_supply', 'dc_supply_adj', 'ac_supply_1ph',
                           'ac_supply_3ph', 'generator_dc', 'generator_ac',
                           'solar_panel', 'power_supply'];
      return components.some(c => {
        const def = window.findComponentDef(c.compId);
        return def && sourceTypes.includes(def.subtype);
      });
    },

    /* ========================================================================
       Check if any load exists
       ======================================================================== */
    _hasLoad(components) {
      const loadTypes = ['lamp', 'led', 'rgb_led', 'indicator', 'buzzer',
                         'dc_motor', 'ac_1ph', 'ac_3ph', 'servo', 'stepper',
                         'resistor', 'pot', 'ldr', 'ntc', 'ptc',
                         'capacitor', 'capacitor_polar', 'capacitor_var',
                         'inductor', 'choke',
                         'diode', 'zener', 'schottky', 'bridge',
                         'npn', 'pnp', 'mosfet_n', 'mosfet_p', 'igbt', 'triac', 'scr',
                         '555', 'opamp', 'regulator',
                         'relay_spdt', 'relay_dpdt', 'timer_on', 'timer_off',
                         'contactor_3p', 'contactor_4p',
                         'voltmeter', 'ammeter', 'multimeter', 'scope', 'wattmeter'];
      return components.some(c => {
        const def = window.findComponentDef(c.compId);
        return def && loadTypes.includes(def.subtype);
      });
    },

    /* ========================================================================
       Detect potential short circuits
       ======================================================================== */
    _detectShortCircuit(components, connections) {
      const sources = components.filter(c => {
        const def = window.findComponentDef(c.compId);
        return def && (def.subtype === 'battery' || def.subtype === 'dc' || def.subtype === 'dc_adj');
      });

      for (const source of sources) {
        const sourceTerminals = this._getConnectedTerminals(source.id, connections);

        // Check if positive and negative terminals are directly connected
        const def = window.findComponentDef(source.compId);
        const terminalCount = def ? def.terminals : 2;

        for (let i = 0; i < terminalCount; i++) {
          for (let j = i + 1; j < terminalCount; j++) {
            if (this._areTerminalsConnected(source.id, i, source.id, j, connections, components)) {
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
    _detectOpenCircuit(components, connections) {
      const sources = components.filter(c => {
        const def = window.findComponentDef(c.compId);
        return def && (def.type === 'source');
      });

      const loads = components.filter(c => {
        const def = window.findComponentDef(c.compId);
        return def && (def.type === 'load' || def.type === 'motor' || def.type === 'passive');
      });

      if (sources.length === 0 || loads.length === 0) return false;

      const visited = new Set();

      const dfs = (compId) => {
        if (visited.has(compId)) return;
        visited.add(compId);

        connections.forEach(conn => {
          if (conn.fromCompId === compId) dfs(conn.toCompId);
          if (conn.toCompId === compId) dfs(conn.fromCompId);
        });
      };

      sources.forEach(s => dfs(s.id));

      return !loads.every(l => visited.has(l.id));
    },

    /* ========================================================================
       Get connected terminals for a component
       ======================================================================== */
    _getConnectedTerminals(compId, connections) {
      const terminals = [];
      connections.forEach(conn => {
        if (conn.fromCompId === compId) terminals.push(conn.fromTerminal);
        if (conn.toCompId === compId) terminals.push(conn.toTerminal);
      });
      return terminals;
    },

    /* ========================================================================
       Check if two terminals are connected (directly or through path)
       ======================================================================== */
    _areTerminalsConnected(fromCompId, fromTerm, toCompId, toTerm, connections, components) {
      const visited = new Set();

      const dfs = (compId, fromTerminal) => {
        const key = `${compId}-${fromTerminal}`;
        if (visited.has(key)) return false;
        visited.add(key);

        if (compId === toCompId) {
          const terminals = this._getConnectedTerminals(compId, connections);
          if (terminals.includes(toTerm)) return true;
        }

        for (const conn of connections) {
          if (conn.fromCompId === compId && conn.fromTerminal !== fromTerminal) {
            const comp = components.find(c => c.id === conn.toCompId);
            if (comp) {
              const def = window.findComponentDef(comp.compId);
              // Only trace through passive and closed components
              if (def && (def.type === 'passive' || def.type === 'terminal' ||
                  def.type === 'protection' || def.type === 'contactor' ||
                  (def.type === 'switch' && comp.compState && comp.compState.closed))) {
                if (dfs(conn.toCompId, conn.toTerminal)) return true;
              }
            }
          }
          if (conn.toCompId === compId && conn.toTerminal !== fromTerminal) {
            const comp = components.find(c => c.id === conn.fromCompId);
            if (comp) {
              const def = window.findComponentDef(comp.compId);
              if (def && (def.type === 'passive' || def.type === 'terminal' ||
                  def.type === 'protection' || def.type === 'contactor' ||
                  (def.type === 'switch' && comp.compState && comp.compState.closed))) {
                if (dfs(conn.fromCompId, conn.fromTerminal)) return true;
              }
            }
          }
        }

        return false;
      };

      return dfs(fromCompId, fromTerm);
    }
  };
})();
