/* ==========================================================================
   DrDer Electronic - Power Flow Simulation v4.1
   Fixed: Timer handling, race condition, synchronous flow
   ========================================================================== */
(function () {
  'use strict';

  window.SimPower = {
    _pendingTimers: [],

    simulate: function (placedComponents, connections) {
      var conducting = {};
      var visited = {};
      var voltageMap = {};
      this._pendingTimers = [];

      var sources = [];
      for (var i = 0; i < placedComponents.length; i++) {
        var def = window.findComponentDef(placedComponents[i].compId);
        if (def && def.type === 'source') {
          sources.push(placedComponents[i]);
        }
      }

      if (sources.length === 0) {
        return { conducting: conducting, voltageMap: voltageMap };
      }

      for (var s = 0; s < sources.length; s++) {
        var source = sources[s];
        var sourceDef = window.findComponentDef(source.compId);
        var voltage = (source.properties && source.properties.voltage) || (sourceDef ? sourceDef.voltage : 12);
        var terminalCount = sourceDef ? (sourceDef.terminals || 2) : 2;

        for (var t = 0; t < terminalCount; t++) {
          this._dfsPower(source.id, t, voltage, placedComponents, connections, conducting, visited, voltageMap);
        }
      }

      this._processPendingTimers();

      return { conducting: conducting, voltageMap: voltageMap };
    },

    _dfsPower: function (compId, fromTerminal, incomingVoltage, placedComponents, connections, conducting, visited, voltageMap) {
      var key = compId + '-' + fromTerminal;
      if (visited[key]) return;
      visited[key] = true;

      var comp = null;
      for (var i = 0; i < placedComponents.length; i++) {
        if (placedComponents[i].id === compId) {
          comp = placedComponents[i];
          break;
        }
      }
      if (!comp) return;

      var def = window.findComponentDef(comp.compId);
      if (!def) return;

      var voltage = incomingVoltage;
      var allowsThrough = true;

      if (!comp.compState) comp.compState = {};

      switch (def.type) {
        case 'source':
          voltage = (comp.properties && comp.properties.voltage) || def.voltage || 12;
          allowsThrough = true;
          break;

        case 'switch':
          if (def.subtype === 'push_no' || def.subtype === 'limit_no' || def.subtype === 'float' || def.subtype === 'foot') {
            allowsThrough = comp.compState.closed || comp.compState.pressed || false;
          } else if (def.subtype === 'push_nc' || def.subtype === 'limit_nc' || def.subtype === 'emergency') {
            allowsThrough = !(comp.compState.pressed || comp.compState.activated || false);
          } else if (def.subtype === 'spst' || def.subtype === 'spdt' || def.subtype === 'dpdt') {
            allowsThrough = comp.compState.closed || false;
          } else {
            allowsThrough = comp.compState.closed || false;
          }
          break;

        case 'protection':
          allowsThrough = !comp.compState.tripped;
          break;

        case 'relay':
          if (def.subtype === 'timer_on') {
            if (comp.compState.timerElapsed) {
              allowsThrough = true;
            } else {
              var self = this;
              var delay = ((comp.properties && comp.properties.delay) || def.delay || 5) * 1000;
              this._pendingTimers.push({
                comp: comp,
                type: 'timer_on',
                delay: delay,
                startTime: Date.now()
              });
              allowsThrough = false;
            }
          } else if (def.subtype === 'timer_off') {
            if (comp.compState.timerElapsed) {
              allowsThrough = false;
            } else {
              allowsThrough = true;
            }
          } else if (def.subtype === 'timer_cyclic') {
            allowsThrough = comp.compState.timerOutput || false;
          } else {
            allowsThrough = comp.compState.energized || false;
          }
          break;

        case 'contactor':
          allowsThrough = comp.compState.energized || false;
          break;

        case 'semiconductor':
          if (def.subtype === 'diode' || def.subtype === 'zener' || def.subtype === 'schottky') {
            allowsThrough = fromTerminal === 0;
            if (allowsThrough) {
              var vf = def.vf || 0.7;
              voltage = Math.max(0, incomingVoltage - vf);
            }
          } else {
            allowsThrough = comp.compState.active || false;
          }
          break;

        case 'motor':
          conducting[compId] = true;
          comp.compState.active = true;
          allowsThrough = true;
          break;

        case 'load':
          conducting[compId] = true;
          comp.compState.active = true;
          allowsThrough = true;
          if (def.subtype === 'led' || def.subtype === 'rgb_led') {
            voltage = Math.max(0, incomingVoltage - (def.vf || 2));
          }
          break;

        case 'passive':
          allowsThrough = true;
          break;

        case 'ic':
        case 'logic':
        case 'digital':
          allowsThrough = comp.compState.output || false;
          break;

        case 'measurement':
          allowsThrough = true;
          break;

        case 'transformer':
          voltage = def.secondaryV || def.primaryV || 220;
          allowsThrough = true;
          break;

        case 'terminal':
        case 'board':
          allowsThrough = true;
          break;

        default:
          allowsThrough = true;
      }

      if (allowsThrough) {
        conducting[compId] = true;
        voltageMap[compId] = voltage;
        comp.compState.energized = true;

        for (var c = 0; c < connections.length; c++) {
          var conn = connections[c];
          if (conn.fromCompId === compId && conn.fromTerminal !== fromTerminal) {
            this._dfsPower(conn.toCompId, conn.toTerminal, voltage, placedComponents, connections, conducting, visited, voltageMap);
          }
          if (conn.toCompId === compId && conn.toTerminal !== fromTerminal) {
            this._dfsPower(conn.fromCompId, conn.fromTerminal, voltage, placedComponents, connections, conducting, visited, voltageMap);
          }
        }
      }
    },

    _processPendingTimers: function () {
      var now = Date.now();
      for (var i = 0; i < this._pendingTimers.length; i++) {
        var timer = this._pendingTimers[i];
        if (timer.type === 'timer_on') {
          if (now - timer.startTime >= timer.delay) {
            timer.comp.compState.timerElapsed = true;
          }
        }
      }
      this._pendingTimers = [];
    },

    resetAll: function (placedComponents) {
      for (var i = 0; i < placedComponents.length; i++) {
        var comp = placedComponents[i];
        if (!comp.compState) comp.compState = {};
        comp.compState.active = false;
        comp.compState.energized = false;
        comp.compState.timerStarted = false;
        comp.compState.timerElapsed = false;
        comp.compState.output = false;
        comp.compState.timerOutput = false;
        comp.compState.activated = false;
        if (comp.el) {
          comp.el.classList.remove('simulating', 'energized', 'fault');
        }
      }
      this._pendingTimers = [];
    },

    applyVisualFeedback: function (placedComponents, conducting) {
      for (var i = 0; i < placedComponents.length; i++) {
        var comp = placedComponents[i];
        if (!comp.el) continue;
        var def = window.findComponentDef(comp.compId);
        if (conducting[comp.id]) {
          if (def && (def.type === 'load' || def.type === 'motor')) {
            comp.el.classList.add('simulating');
          } else if (def && (def.type === 'relay' || def.type === 'contactor')) {
            comp.el.classList.add('energized');
          }
        }
      }
    },

    clearVisualFeedback: function (placedComponents) {
      for (var i = 0; i < placedComponents.length; i++) {
        if (placedComponents[i].el) {
          placedComponents[i].el.classList.remove('simulating', 'energized', 'fault');
        }
      }
    }
  };
})();
