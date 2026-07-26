/* ==========================================================================
   DrDer Electronic - Simulation Engine
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
    init(state) {
      this._state = state;
      this._simulationActive = false;
    },

    /* ========================================================================
       Run simulation
       ======================================================================== */
    run() {
      if (this._state.placedComponents.length === 0) {
        return { success: false, message: '⚠️ لا توجد عناصر في الدائرة' };
      }

      // Validate first
      const validation = window.SimValidation.validate(
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

      // Reset previous states
      window.SimPower.resetAll(this._state.placedComponents);

      // Run power simulation
      const result = window.SimPower.simulate(
        this._state.placedComponents,
        window.SimWires.getConnections()
      );

      // Apply visual feedback
      window.SimPower.applyVisualFeedback(this._state.placedComponents, result.conducting);

      // Redraw wires with active state
      window.SimWires.drawAllWires(true);

      this._simulationActive = true;

      if (this._onStateChange) {
        this._onStateChange({ active: true, result });
      }

      return {
        success: true,
        message: '⚡ تم تشغيل الدائرة بنجاح!',
        conducting: result.conducting,
        voltageMap: result.voltageMap,
        warnings: validation.warnings
      };
    },

    /* ========================================================================
       Stop simulation
       ======================================================================== */
    stop() {
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
    toggle() {
      return this._simulationActive ? this.stop() : this.run();
    },

    /* ========================================================================
       Check if simulation is active
       ======================================================================== */
    isActive() {
      return this._simulationActive;
    },

    /* ========================================================================
       Toggle a switch component
       ======================================================================== */
    toggleSwitch(componentId) {
      const comp = this._state.placedComponents.find(c => c.id === componentId);
      if (!comp) return;

      const def = window.findComponentDef(comp.compId);
      if (!def || def.type !== 'switch') return;

      comp.compState = comp.compState || {};
      comp.compState.closed = !comp.compState.closed;

      // Update visual
      if (comp.el) {
        if (comp.compState.closed) {
          comp.el.style.borderColor = '#3fb950';
        } else {
          comp.el.style.borderColor = def.color || 'var(--accent)';
        }
      }

      // If simulation active, re-run
      if (this._simulationActive) {
        this.run();
      }
    },

    /* ========================================================================
       Push a button (momentary)
       ======================================================================== */
    pushButton(componentId) {
      const comp = this._state.placedComponents.find(c => c.id === componentId);
      if (!comp) return;

      const def = window.findComponentDef(comp.compId);
      if (!def || (def.subtype !== 'push_no' && def.subtype !== 'push_nc' && def.subtype !== 'emergency')) return;

      comp.compState = comp.compState || {};
      comp.compState.pressed = true;

      if (comp.el) {
        comp.el.style.borderColor = '#3fb950';
      }

      if (this._simulationActive) {
        this.run();
      }

      // Release after delay
      setTimeout(() => {
        comp.compState.pressed = false;
        if (comp.el) {
          comp.el.style.borderColor = def.color || 'var(--accent)';
        }
        if (this._simulationActive) {
          this.run();
        }
      }, 500);
    },

    /* ========================================================================
       Get current state snapshot for undo
       ======================================================================== */
    getStateSnapshot() {
      return {
        comps: this._state.placedComponents.map(c => ({
          id: c.id, compId: c.compId, x: c.x, y: c.y,
          properties: SimUtils.clone(c.properties),
          rotation: c.rotation || 0
        })),
        conns: SimUtils.clone(window.SimWires.getConnections()),
        cid: this._state.componentIdCounter
      };
    },

    /* ========================================================================
       Restore state from snapshot
       ======================================================================== */
    restoreSnapshot(snapshot) {
      this._state.placedComponents = [];
      this._state.componentIdCounter = snapshot.cid;
      window.SimWires.clearAll();

      snapshot.comps.forEach(cd => {
        const def = window.findComponentDef(cd.compId);
        if (!def) return;

        const id = cd.id;
        const el = document.createElement('div');
        el.className = 'sim-component';
        el.id = `comp-${id}`;
        el.dataset.componentId = id;
        el.dataset.compType = cd.compId;
        el.style.left = `${cd.x}px`;
        el.style.top = `${cd.y}px`;
        el.innerHTML = `
          <span class="sim-comp-icon">${def.icon}</span>
          <span class="sim-comp-label">${def.name}</span>
          <span class="sim-comp-badge">${id}</span>
          <button class="sim-comp-delete" title="حذف">✕</button>
        `;

        if (cd.rotation) {
          el.style.transform = `rotate(${cd.rotation}deg)`;
        }

        // Add terminals
        const positions = window.getTerminalPositions(def.terminals || 2);
        positions.forEach((pos, i) => {
          const term = document.createElement('div');
          term.className = 'sim-terminal';
          term.style.left = `${pos.x}%`;
          term.style.top = `${pos.y}%`;
          term.dataset.componentId = id;
          term.dataset.terminalIndex = i;
          el.appendChild(term);
        });

        document.getElementById('simCanvas')?.appendChild(el);

        this._state.placedComponents.push({
          id, compId: cd.compId, el, x: cd.x, y: cd.y,
          properties: SimUtils.clone(cd.properties || {}),
          rotation: cd.rotation || 0,
          compState: { active: false, energized: false }
        });
      });

      this._state.componentIdCounter = snapshot.cid;
      window.SimWires.setConnections(snapshot.conns);
      window.SimWires.drawAllWires(false);
    },

    /* ========================================================================
       Callback
       ======================================================================== */
    onStateChange(cb) {
      this._onStateChange = cb;
    }
  };
})();
