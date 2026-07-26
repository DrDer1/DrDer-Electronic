/* ==========================================================================
   DrDer Electronic - Simulation Engine v4.0
   Core engine that coordinates all simulator modules
   ========================================================================== */
(function () {
  'use strict';

  window.SimEngine = {
    _state: null,
    _simulationActive: false,
    _onStateChange: null,

    /* ========================================================================
       Initialize
       ======================================================================== */
    init: function (state) {
      this._state = state;
      this._simulationActive = false;
    },

    /* ========================================================================
       Run simulation
       ======================================================================== */
    run: function () {
      if (!this._state || this._state.placedComponents.length === 0) {
        return { success: false, message: '⚠️ لا توجد عناصر في الدائرة' };
      }

      var validation = window.SimValidation.validate(
        this._state.placedComponents,
        window.SimWires.getConnections()
      );

      if (!validation.valid) {
        return {
          success: false,
          message: '⚠️ ' + validation.issues.join(' | '),
          issues: validation.issues,
          warnings: validation.warnings
        };
      }

      window.SimPower.resetAll(this._state.placedComponents);

      var result = window.SimPower.simulate(
        this._state.placedComponents,
        window.SimWires.getConnections()
      );

      window.SimPower.applyVisualFeedback(this._state.placedComponents, result.conducting);

      window.SimWires.drawAllWires(true);

      this._simulationActive = true;

      if (this._onStateChange) {
        this._onStateChange({ active: true, result: result });
      }

      var message = '⚡ تم تشغيل الدائرة بنجاح!';
      if (validation.warnings && validation.warnings.length > 0) {
        message += ' (مع ' + validation.warnings.length + ' ملاحظات)';
      }

      return {
        success: true,
        message: message,
        conducting: result.conducting,
        voltageMap: result.voltageMap,
        warnings: validation.warnings
      };
    },

    /* ========================================================================
       Stop simulation
       ======================================================================== */
    stop: function () {
      if (!this._state) {
        return { success: false, message: '⚠️ لا توجد حالة للمحاكاة' };
      }

      window.SimPower.resetAll(this._state.placedComponents);
      window.SimPower.clearVisualFeedback(this._state.placedComponents);
      window.SimWires.drawAllWires(false);

      this._simulationActive = false;

      if (this._onStateChange) {
        this._onStateChange({ active: false, result: null });
      }

      return { success: true, message: '⏹️ تم إيقاف المحاكاة' };
    },

    /* ========================================================================
       Toggle simulation
       ======================================================================== */
    toggle: function () {
      return this._simulationActive ? this.stop() : this.run();
    },

    /* ========================================================================
       Check if simulation is active
       ======================================================================== */
    isActive: function () {
      return this._simulationActive;
    },

    /* ========================================================================
       Toggle a switch component
       ======================================================================== */
    toggleSwitch: function (componentId) {
      if (!this._state) return;

      var comp = this._getComponentById(componentId);
      if (!comp) return;

      var def = window.findComponentDef(comp.compId);
      if (!def || def.type !== 'switch') return;

      if (!comp.compState) comp.compState = {};
      comp.compState.closed = !comp.compState.closed;

      if (comp.el) {
        if (comp.compState.closed) {
          comp.el.style.borderColor = '#3fb950';
        } else {
          comp.el.style.borderColor = def.color || 'var(--accent)';
        }
      }

      if (this._simulationActive) {
        this.run();
      }
    },

    /* ========================================================================
       Push a button (momentary)
       ======================================================================== */
    pushButton: function (componentId) {
      if (!this._state) return;

      var comp = this._getComponentById(componentId);
      if (!comp) return;

      var def = window.findComponentDef(comp.compId);
      if (!def) return;
      if (def.subtype !== 'push_no' && def.subtype !== 'push_nc' && def.subtype !== 'emergency') return;

      if (!comp.compState) comp.compState = {};
      comp.compState.pressed = true;

      if (comp.el) {
        comp.el.style.borderColor = '#3fb950';
      }

      if (this._simulationActive) {
        this.run();
      }

      var self = this;
      setTimeout(function () {
        comp.compState.pressed = false;
        if (comp.el) {
          comp.el.style.borderColor = def.color || 'var(--accent)';
        }
        if (self._simulationActive) {
          self.run();
        }
      }, 500);
    },

    /* ========================================================================
       Get component by ID
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
       Get current state snapshot for undo
       ======================================================================== */
    getStateSnapshot: function () {
      if (!this._state) return { comps: [], conns: [], cid: 0 };

      var comps = [];
      for (var i = 0; i < this._state.placedComponents.length; i++) {
        var c = this._state.placedComponents[i];
        comps.push({
          id: c.id,
          compId: c.compId,
          x: c.x,
          y: c.y,
          properties: window.SimUtils ? window.SimUtils.clone(c.properties) : c.properties,
          rotation: c.rotation || 0
        });
      }

      return {
        comps: comps,
        conns: window.SimUtils ? window.SimUtils.clone(window.SimWires.getConnections()) : window.SimWires.getConnections(),
        cid: this._state.componentIdCounter
      };
    },

    /* ========================================================================
       Restore state from snapshot
       ======================================================================== */
    restoreSnapshot: function (snapshot) {
      if (!snapshot || !this._state) return;

      var canvas = document.getElementById('simCanvas');

      this._state.placedComponents = [];
      this._state.componentIdCounter = snapshot.cid || 0;
      window.SimWires.clearAll();

      for (var i = 0; i < snapshot.comps.length; i++) {
        var cd = snapshot.comps[i];
        var def = window.findComponentDef(cd.compId);
        if (!def) continue;

        var id = cd.id;
        var el = document.createElement('div');
        el.className = 'sim-component';
        el.id = 'comp-' + id;
        el.dataset.componentId = id;
        el.dataset.compType = cd.compId;
        el.style.left = cd.x + 'px';
        el.style.top = cd.y + 'px';

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'sim-comp-delete';
        deleteBtn.title = 'حذف';
        deleteBtn.textContent = '✕';
        el.appendChild(deleteBtn);

        var icon = document.createElement('span');
        icon.className = 'sim-comp-icon';
        icon.textContent = def.icon;
        el.appendChild(icon);

        var label = document.createElement('span');
        label.className = 'sim-comp-label';
        label.textContent = def.name;
        el.appendChild(label);

        var badge = document.createElement('span');
        badge.className = 'sim-comp-badge';
        badge.textContent = id;
        el.appendChild(badge);

        if (cd.rotation) {
          el.style.transform = 'rotate(' + cd.rotation + 'deg)';
        }

        var positions = window.getTerminalPositions(def.terminals || 2);
        for (var j = 0; j < positions.length; j++) {
          var pos = positions[j];
          var term = document.createElement('div');
          term.className = 'sim-terminal';
          term.style.left = pos.x + '%';
          term.style.top = pos.y + '%';
          term.dataset.componentId = id;
          term.dataset.terminalIndex = j;
          el.appendChild(term);
        }

        if (canvas) canvas.appendChild(el);

        this._state.placedComponents.push({
          id: id,
          compId: cd.compId,
          el: el,
          x: cd.x,
          y: cd.y,
          properties: cd.properties ? window.SimUtils.clone(cd.properties) : {},
          rotation: cd.rotation || 0,
          compState: { active: false, energized: false, closed: false }
        });
      }

      this._state.componentIdCounter = snapshot.cid || 0;
      window.SimWires.setConnections(snapshot.conns);
      window.SimWires.drawAllWires(false);
    },

    /* ========================================================================
       Callback for state changes
       ======================================================================== */
    onStateChange: function (cb) {
      this._onStateChange = cb;
    }
  };
})();
