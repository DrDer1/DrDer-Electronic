/* ==========================================================================
   DrDer Electronic - Simulator UI
   Manages the simulator user interface, toolbars, panels, and feedback
   ========================================================================== */
(function () {
  'use strict';

  window.SimUI = {
    _feedbackTimer: null,

    /* ========================================================================
       Initialize UI
       ======================================================================== */
    init() {
      this._setupToolbarButtons();
      this._setupDragDrop();
    },

    /* ========================================================================
       Setup toolbar button handlers
       ======================================================================== */
    _setupToolbarButtons() {
      document.getElementById('simBtnUndo')?.addEventListener('click', () => {
        if (window.SimHistory.canUndo()) {
          window.SimHistory.undo(
            () => window.SimEngine.getStateSnapshot(),
            (snapshot) => window.SimEngine.restoreSnapshot(snapshot)
          );
          this._updateAll();
        }
      });

      document.getElementById('simBtnRedo')?.addEventListener('click', () => {
        if (window.SimHistory.canRedo()) {
          window.SimHistory.redo(
            () => window.SimEngine.getStateSnapshot(),
            (snapshot) => window.SimEngine.restoreSnapshot(snapshot)
          );
          this._updateAll();
        }
      });

      document.getElementById('simBtnRun')?.addEventListener('click', () => {
        const result = window.SimEngine.run();
        this.showFeedback(result.message, result.success ? 'success' : 'error');
      });

      document.getElementById('simBtnStop')?.addEventListener('click', () => {
        const result = window.SimEngine.stop();
        this.showFeedback(result.message, 'info');
      });

      document.getElementById('simBtnValidate')?.addEventListener('click', () => {
        const validation = window.SimValidation.validate(
          window.SimEngine._state.placedComponents,
          window.SimWires.getConnections()
        );

        if (validation.valid) {
          this.showFeedback('✅ الدائرة صحيحة! ' + (validation.warnings.length > 0 ? 'مع بعض الملاحظات.' : ''),
                           'success');
        } else {
          this.showFeedback('⚠️ ' + validation.issues.join(' | '), 'error');
        }

        if (validation.warnings.length > 0) {
          setTimeout(() => {
            this.showFeedback('💡 ' + validation.warnings.join(' | '), 'warning');
          }, 2000);
        }
      });

      document.getElementById('simBtnZoomIn')?.addEventListener('click', () => window.SimCanvas.zoomIn());
      document.getElementById('simBtnZoomOut')?.addEventListener('click', () => window.SimCanvas.zoomOut());
      document.getElementById('simBtnZoomFit')?.addEventListener('click', () => {
        window.SimCanvas.zoomToFit(window.SimEngine._state.placedComponents);
      });

      document.getElementById('simBtnSnap')?.addEventListener('click', () => window.SimCanvas.toggleSnap());
      document.getElementById('simBtnGridSize')?.addEventListener('click', () => window.SimCanvas.cycleGridSize());

      document.getElementById('simBtnCopy')?.addEventListener('click', () => this._copySelection());
      document.getElementById('simBtnPaste')?.addEventListener('click', () => this._pasteSelection());
      document.getElementById('simBtnDelete')?.addEventListener('click', () => this._deleteSelection());
      document.getElementById('simBtnClearAll')?.addEventListener('click', () => this._clearAll());

      document.getElementById('simBtnSave')?.addEventListener('click', () => this._saveProject());
      document.getElementById('simBtnLoad')?.addEventListener('click', () => this._loadProject());
      document.getElementById('simBtnExport')?.addEventListener('click', () => this._exportProject());
      document.getElementById('simBtnImport')?.addEventListener('click', () => this._importProject());

      document.getElementById('simBtnProps')?.addEventListener('click', () => {
        const selectedIds = window.SimSelection.getSelectedIds();
        if (selectedIds.length === 1) {
          const comp = window.SimEngine._state.placedComponents.find(c => c.id === selectedIds[0]);
          if (comp) window.SimProperties.toggle(comp);
        }
      });

      document.getElementById('btnCloseProperties')?.addEventListener('click', () => {
        window.SimProperties.hide();
      });
    },

    /* ========================================================================
       Setup drag and drop from library to canvas
       ======================================================================== */
    _setupDragDrop() {
      const canvas = document.getElementById('simCanvas');
      if (!canvas) return;

      canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const compId = e.dataTransfer.getData('text/plain');
        if (compId) {
          const world = window.SimCanvas.screenToWorld(e.clientX, e.clientY);
          const snapped = window.SimCanvas.snapPosition(world.x, world.y);
          this._addComponent(compId, Math.max(0, snapped.x), Math.max(0, snapped.y));
        }
      });
    },

    /* ========================================================================
       Add a component to the canvas
       ======================================================================== */
    _addComponent(compId, x, y) {
      const def = window.findComponentDef(compId);
      if (!def) return;

      const state = window.SimEngine._state;
      const id = ++state.componentIdCounter;

      const el = document.createElement('div');
      el.className = 'sim-component';
      el.id = `comp-${id}`;
      el.dataset.componentId = id;
      el.dataset.compType = compId;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', def.name);
      el.setAttribute('tabindex', '0');

      el.innerHTML = `
        <span class="sim-comp-icon">${def.icon}</span>
        <span class="sim-comp-label">${def.name}</span>
        <span class="sim-comp-badge">${id}</span>
        <button class="sim-comp-delete" title="حذف">✕</button>
      `;

      // Delete button
      el.querySelector('.sim-comp-delete').addEventListener('click', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        this._deleteComponent(id);
      });

      // Mouse events
      el.addEventListener('mousedown', (ev) => {
        if (ev.button !== 0) return;
        if (ev.target.closest('.sim-terminal')) return;
        if (ev.target.closest('.sim-comp-delete')) return;

        ev.preventDefault();
        ev.stopPropagation();

        const comp = state.placedComponents.find(c => c.id === id);
        if (comp) {
          window.SimDrag.startDrag(comp, ev.clientX, ev.clientY);
        }
      });

      el.addEventListener('click', (ev) => {
        if (!window.SimDrag.isDragging()) {
          ev.stopPropagation();
          window.SimSelection.selectComponent(id, ev.ctrlKey || ev.metaKey, state.placedComponents);

          if (window.SimSelection.getSelectedCount() === 1) {
            const comp = state.placedComponents.find(c => c.id === id);
            if (comp) window.SimProperties.show(comp);
          }
        }
      });

      el.addEventListener('dblclick', (ev) => {
        ev.stopPropagation();
        const comp = state.placedComponents.find(c => c.id === id);
        if (comp) {
          // Toggle switch on double click
          const def = window.findComponentDef(comp.compId);
          if (def && def.type === 'switch') {
            window.SimEngine.toggleSwitch(id);
          }
        }
      });

      // Add terminals
      const positions = window.getTerminalPositions(def.terminals || 2);
      positions.forEach((pos, i) => {
        const term = document.createElement('div');
        term.className = 'sim-terminal';
        term.style.left = `${pos.x}%`;
        term.style.top = `${pos.y}%`;
        term.style.transform = 'translate(-50%,-50%)';
        term.dataset.componentId = id;
        term.dataset.terminalIndex = i;
        term.setAttribute('aria-label', `طرف ${i + 1}`);
        term.title = `طرف ${i + 1}`;

        term.addEventListener('mousedown', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          window.SimWires.startConnection(id, i, ev.clientX, ev.clientY);
        });

        el.appendChild(term);
      });

      document.getElementById('simCanvas')?.appendChild(el);

      // Apply canvas transform
      window.SimCanvas.applyTransformToElement(el);

      state.placedComponents.push({
        id, compId, el, x, y,
        properties: SimUtils.clone(def),
        rotation: 0,
        compState: { active: false, energized: false, closed: false }
      });

      window.SimCanvas.showPlaceholder(false);
      this._updateCounts();
    },

    /* ========================================================================
       Delete a component
       ======================================================================== */
    _deleteComponent(id) {
      const state = window.SimEngine._state;
      const comp = state.placedComponents.find(c => c.id === id);

      if (comp && comp.el) {
        comp.el.remove();
      }

      state.placedComponents = state.placedComponents.filter(c => c.id !== id);
      window.SimWires.deleteConnectionsForComponent(id);
      window.SimSelection.removeComponent(id, state.placedComponents);
      window.SimWires.drawAllWires(window.SimEngine.isActive());

      if (state.placedComponents.length === 0) {
        window.SimCanvas.showPlaceholder(true);
      }

      window.SimProperties.hide();
      this._updateCounts();
    },

    /* ========================================================================
       Copy selected components
       ======================================================================== */
    _copySelection() {
      const selectedIds = window.SimSelection.getSelectedIds();
      if (selectedIds.length === 0) return;

      const state = window.SimEngine._state;
      const clipboard = selectedIds.map(id => {
        const comp = state.placedComponents.find(c => c.id === id);
        return comp ? { compId: comp.compId, x: comp.x, y: comp.y } : null;
      }).filter(Boolean);

      this._clipboard = clipboard;
      this.showFeedback(`📋 تم نسخ ${clipboard.length} عناصر`, 'info');
    },

    /* ========================================================================
       Paste copied components
       ======================================================================== */
    _pasteSelection() {
      if (!this._clipboard || this._clipboard.length === 0) return;

      window.SimHistory.push(window.SimEngine.getStateSnapshot());
      window.SimSelection.clearAll(window.SimEngine._state.placedComponents);

      const offset = window.SimCanvas.getGridSize() * 2;
      this._clipboard.forEach(item => {
        this._addComponent(item.compId, item.x + offset, item.y + offset);
      });

      this.showFeedback(`📄 تم لصق ${this._clipboard.length} عناصر`, 'success');
    },

    /* ========================================================================
       Delete selected components
       ======================================================================== */
    _deleteSelection() {
      const selectedIds = window.SimSelection.getSelectedIds();
      if (selectedIds.length === 0) return;

      window.SimHistory.push(window.SimEngine.getStateSnapshot());

      const ids = [...selectedIds];
      ids.forEach(id => this._deleteComponent(id));

      this.showFeedback(`🗑️ تم حذف ${ids.length} عناصر`, 'info');
    },

    /* ========================================================================
       Clear all
       ======================================================================== */
    _clearAll() {
      const state = window.SimEngine._state;
      if (state.placedComponents.length === 0) return;

      window.SimHistory.push(window.SimEngine.getStateSnapshot());

      const canvas = document.getElementById('simCanvas');
      if (canvas) {
        canvas.querySelectorAll('.sim-component').forEach(el => el.remove());
      }

      state.placedComponents = [];
      window.SimWires.clearAll();
      window.SimSelection.clearAll();
      window.SimProperties.hide();
      window.SimCanvas.showPlaceholder(true);
      window.SimEngine.stop();
      this._updateCounts();
      this.showFeedback('🗑️ تم مسح جميع العناصر', 'info');
    },

    /* ========================================================================
       Save project
       ======================================================================== */
    _saveProject() {
      const name = prompt('📁 أدخل اسم المشروع:');
      if (!name) return;

      const result = window.SimProject.save(name, window.SimEngine._state, window.SimWires);
      this.showFeedback(result.message, result.success ? 'success' : 'error');
    },

    /* ========================================================================
       Load project
       ======================================================================== */
    _loadProject() {
      const projects = window.SimProject.getAll();

      if (projects.length === 0) {
        this.showFeedback('⚠️ لا توجد مشاريع محفوظة', 'warning');
        return;
      }

      const list = projects.map((p, i) =>
        `${i + 1}. ${p.name} (${new Date(p.updatedAt).toLocaleDateString('ar')})`
      ).join('\n');

      const choice = prompt(`📂 اختر رقم المشروع:\n\n${list}`);

      if (!choice) return;

      const index = parseInt(choice) - 1;
      if (isNaN(index) || index < 0 || index >= projects.length) {
        this.showFeedback('⚠️ رقم غير صالح', 'error');
        return;
      }

      const result = window.SimProject.load(projects[index].id);
      if (result.success) {
        window.SimEngine.restoreSnapshot(result.project.data);
        this._updateAll();
        this.showFeedback(`✅ تم تحميل المشروع: ${result.project.name}`, 'success');
      } else {
        this.showFeedback(result.message, 'error');
      }
    },

    /* ========================================================================
       Export project
       ======================================================================== */
    _exportProject() {
      const name = prompt('📥 اسم ملف التصدير:', 'مشروع_DrDer');
      if (!name) return;

      const result = window.SimProject.exportToJSON(
        window.SimEngine._state,
        window.SimWires,
        name
      );
      this.showFeedback(result.message, 'success');
    },

    /* ========================================================================
       Import project
       ======================================================================== */
    _importProject() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const result = await window.SimProject.importFromJSON(file);

        if (result.success) {
          window.SimEngine.restoreSnapshot(result.project.data);
          this._updateAll();
          this.showFeedback(`✅ تم استيراد المشروع: ${result.project.name || 'بدون اسم'}`, 'success');
        } else {
          this.showFeedback(result.message, 'error');
        }
      };

      input.click();
    },

    /* ========================================================================
       Update all UI elements
       ======================================================================== */
    _updateAll() {
      this._updateCounts();
      window.SimWires.drawAllWires(window.SimEngine.isActive());
      window.SimCanvas.showPlaceholder(
        window.SimEngine._state.placedComponents.length === 0
      );
    },

    /* ========================================================================
       Update component and connection counts
       ======================================================================== */
    _updateCounts() {
      const state = window.SimEngine._state;
      window.SimCanvas.updateComponentCount(state.placedComponents.length);
      window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
    },

    /* ========================================================================
       Show feedback message
       ======================================================================== */
    showFeedback(message, type) {
      const fb = document.getElementById('simFeedbackMsg');
      if (!fb) return;

      fb.textContent = message;
      fb.className = 'sim-feedback-msg';
      if (type) fb.classList.add(type);
      fb.style.display = 'block';

      clearTimeout(this._feedbackTimer);
      this._feedbackTimer = setTimeout(() => {
        fb.style.display = 'none';
      }, 3500);
    }
  };
})();
