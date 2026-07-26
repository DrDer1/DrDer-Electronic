/* ==========================================================================
   DrDer Electronic - Power Flow Simulation
   Calculates voltage and current distribution in the circuit
   ========================================================================== */
(function () {
  'use strict';

  window.SimPower = {
    /* ========================================================================
       Simulate power flow through the circuit
       Returns Set of component IDs that are energized
       ======================================================================== */
    simulate(placedComponents, connections) {
      const conducting = new Set();
      const visited = new Set();
      const voltageMap = new Map();

      // Find all power sources
      const sources = placedComponents.filter(c => {
        const def = window.findComponentDef(c.compId);
        return def && def.type === 'source';
      });

      if (sources.length === 0) return { conducting, voltageMap };

      // Start DFS from each source terminal
      sources.forEach(source => {
        const def = window.findComponentDef(source.compId);
        const voltage = source.properties?.voltage || def.voltage || 12;
        const terminalCount = def ? def.terminals : 2;

        for (let i = 0; i < terminalCount; i++) {
          this._dfsPower(source.id, i, voltage, placedComponents, connections, conducting, visited, voltageMap);
        }
      });

      return { conducting, voltageMap };
    },

    /* ========================================================================
       DFS to propagate power
       ======================================================================== */
    _dfsPower(compId, fromTerminal, incomingVoltage, placedComponents, connections,
              conducting, visited, voltageMap) {

      const key = `${compId}-${fromTerminal}`;
      if (visited.has(key)) return;
      visited.add(key);

      const comp = placedComponents.find(c => c.id === compId);
      if (!comp) return;

      const def = window.findComponentDef(comp.compId);
      if (!def) return;

      // Check if component blocks current
      let voltage = incomingVoltage;
      let allowsThrough = true;

      switch (def.type) {
        case 'source':
          voltage = comp.properties?.voltage || def.voltage || 12;
          allowsThrough = true;
          break;

        case 'switch':
          if (def.subtype === 'push_no' || def.subtype === 'limit_no' || def.subtype === 'float') {
            allowsThrough = comp.compState?.closed || comp.compState?.pressed || false;
          } else if (def.subtype === 'push_nc' || def.subtype === 'limit_nc' || def.subtype === 'emergency') {
            allowsThrough = !(comp.compState?.pressed || comp.compState?.activated || false);
          } else if (def.subtype === 'spst') {
            allowsThrough = comp.compState?.closed || false;
          } else {
            allowsThrough = comp.compState?.closed || false;
          }
          break;

        case 'protection':
          allowsThrough = !(comp.compState?.tripped || false);
          break;

        case 'relay':
          if (def.subtype === 'timer_on') {
            if (comp.compState?.timerStarted && comp.compState?.timerElapsed) {
              allowsThrough = true;
            } else if (!comp.compState?.timerStarted) {
              comp.compState = comp.compState || {};
              comp.compState.timerStarted = Date.now();
              const delay = (comp.properties?.delay || def.delay || 5) * 1000;
              allowsThrough = false;
              setTimeout(() => {
                comp.compState.timerElapsed = true;
              }, delay);
            } else {
              allowsThrough = false;
            }
          } else if (def.subtype === 'timer_off') {
            allowsThrough = !(comp.compState?.timerElapsed || false);
          } else {
            allowsThrough = comp.compState?.energized || false;
          }
          break;

        case 'contactor':
          allowsThrough = comp.compState?.energized || false;
          break;

        case 'semiconductor':
          if (def.subtype === 'diode' || def.subtype === 'zener' || def.subtype === 'schottky') {
            // Diode allows current in one direction
            allowsThrough = fromTerminal === 0;
            if (allowsThrough) {
              const vf = def.vf || 0.7;
              voltage = Math.max(0, incomingVoltage - vf);
            }
          } else {
            allowsThrough = comp.compState?.active || false;
          }
          break;

        case 'motor':
          conducting.add(compId);
          comp.compState = comp.compState || {};
          comp.compState.active = true;
          allowsThrough = true;
          break;

        case 'load':
          conducting.add(compId);
          comp.compState = comp.compState || {};
          comp.compState.active = true;
          allowsThrough = true;

          // LED voltage drop
          if (def.subtype === 'led' || def.subtype === 'rgb_led') {
            voltage = Math.max(0, incomingVoltage - (def.vf || 2));
          }
          break;

        case 'passive':
          allowsThrough = true;
          break;

        case 'ic':
          allowsThrough = true;
          break;

        case 'logic':
          allowsThrough = comp.compState?.output || false;
          break;

        case 'measurement':
          allowsThrough = true;
          break;

        case 'transformer':
          voltage = def.secondaryV || def.primaryV || 220;
          allowsThrough = true;
          break;

        case 'terminal':
          allowsThrough = true;
          break;

        default:
          allowsThrough = true;
      }

      if (allowsThrough) {
        conducting.add(compId);
        voltageMap.set(compId, voltage);

        // Mark component as energized
        comp.compState = comp.compState || {};
        comp.compState.energized = true;

        // Propagate to connected components
        connections.forEach(conn => {
          if (conn.fromCompId === compId && conn.fromTerminal !== fromTerminal) {
            this._dfsPower(conn.toCompId, conn.toTerminal, voltage, placedComponents,
                          connections, conducting, visited, voltageMap);
          }
          if (conn.toCompId === compId && conn.toTerminal !== fromTerminal) {
            this._dfsPower(conn.fromCompId, conn.fromTerminal, voltage, placedComponents,
                          connections, conducting, visited, voltageMap);
          }
        });
      }
    },

    /* ========================================================================
       Reset all component states
       ======================================================================== */
    resetAll(placedComponents) {
      placedComponents.forEach(comp => {
        comp.compState = comp.compState || {};
        comp.compState.active = false;
        comp.compState.energized = false;
        comp.compState.timerStarted = false;
        comp.compState.timerElapsed = false;
        comp.compState.output = false;

        if (comp.el) {
          comp.el.classList.remove('simulating', 'energized', 'fault');
        }
      });
    },

    /* ========================================================================
       Apply visual feedback based on simulation result
       ======================================================================== */
    applyVisualFeedback(placedComponents, conducting) {
      placedComponents.forEach(comp => {
        if (!comp.el) return;

        const def = window.findComponentDef(comp.compId);

        if (conducting.has(comp.id)) {
          if (def && (def.type === 'load' || def.type === 'motor')) {
            comp.el.classList.add('simulating');
          } else if (def && (def.type === 'relay' || def.type === 'contactor')) {
            comp.el.classList.add('energized');
          }
        }
      });
    },

    /* ========================================================================
       Clear visual feedback
       ======================================================================== */
    clearVisualFeedback(placedComponents) {
      placedComponents.forEach(comp => {
        if (comp.el) {
          comp.el.classList.remove('simulating', 'energized', 'fault');
        }
      });
    }
  };
})();
