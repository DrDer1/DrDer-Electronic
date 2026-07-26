/* ==========================================================================
   DrDer Electronic - Simulator UI v4.0
   Manages toolbar buttons, drag-drop, copy-paste, save-load
   ========================================================================== */
(function () {
  'use strict';

  window.SimUI = {
    _feedbackTimer: null,
    _clipboard: [],

    /* ========================================================================
       Initialize
       ======================================================================== */
    init: function () {
      this._setupToolbarButtons();
      this._setupDragDrop();
    },

    /* ========================================================================
       Setup all toolbar button handlers
       ======================================================================== */
    _setupToolbarButtons: function () {
      var self = this;

      this._bind('simBtnUndo', 'click', function () {
        if (window.SimHistory.canUndo()) {
          window.SimHistory.undo(
            function () { return window.SimEngine.getStateSnapshot(); },
            function (snapshot) { window.SimEngine.restoreSnapshot(snapshot); }
          );
          self._updateAll();
        }
      });

      this._bind('simBtnRedo', 'click', function () {
        if (window.SimHistory.canRedo()) {
          window.SimHistory.redo(
            function () { return window.SimEngine.getStateSnapshot(); },
            function (snapshot) { window.SimEngine.restoreSnapshot(snapshot); }
          );
          self._updateAll();
        }
      });

      this._bind('simBtnRun', 'click', function () {
        var result = window.SimEngine.run();
        self.showFeedback(result.message, result.success ? 'success' : 'error');
      });

      this._bind('simBtnStop', 'click', function () {
        var result = window.SimEngine.stop();
        self.showFeedback(result.message, 'info');
      });

      this._bind('simBtnValidate', 'click', function () {
        var validation = window.SimValidation.validate(
          window.SimEngine._state.placedComponents,
          window.SimWires.getConnections()
        );

        if (validation.valid) {
          var msg = '✅ الدائرة صحيحة!';
          if (validation.warnings && validation.warnings.length > 0) {
            msg += ' (مع ' + validation.warnings.length + ' ملاحظات)';
          }
          self.showFeedback(msg, 'success');
        } else {
          self.showFeedback('⚠️ ' + validation.issues.join(' | '), 'error');
        }

        if (validation.warnings && validation.warnings.length > 0) {
          setTimeout(function () {
            self.showFeedback('💡 ' + validation.warnings.join(' | '), 'warning');
          }, 2000);
        }
      });

      this._bind('simBtnZoomIn', 'click', function () { window.SimCanvas.zoomIn(); });
      this._bind('simBtnZoomOut', 'click', function () { window.SimCanvas.zoomOut(); });

      this._bind('simBtnZoomFit', 'click', function () {
        window.SimCanvas.zoomToFit(window.SimEngine._state.placedComponents);
      });

      this._bind('simBtnSnap', 'click', function () { window.SimCanvas.toggleSnap(); });
      this._bind('simBtnGridSize', 'click', function () { window.SimCanvas.cycleGridSize(); });

      this._bind('simBtnCopy', 'click', function () { self.copySelection(); });
      this._bind('simBtnPaste', 'click', function () { self.pasteSelection(); });

      this._bind('simBtnDelete', 'click', function () {
        var selectedIds = window.SimSelection.getSelectedIds();
        if (selectedIds.length === 0) return;
        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        for (var i = 0; i < selectedIds.length; i++) {
          if (window.SimDeleteComponent) {
            window.SimDeleteComponent(selectedIds[i]);
          }
        }
        self.showFeedback('🗑️ تم حذف ' + selectedIds.length + ' عناصر', 'info');
      });

      this._bind('simBtnClearAll', 'click', function () {
        var state = window.SimEngine._state;
        if (!state || state.placedComponents.length === 0) return;
        if (!confirm('هل أنت متأكد من مسح جميع العناصر؟')) return;

        window.SimHistory.push(window.SimEngine.getStateSnapshot());
        self._clearAll();
      });

      this._bind('simBtnSave', 'click', function () { self._saveProject(); });
      this._bind('simBtnLoad', 'click', function () { self._loadProject(); });
      this._bind('simBtnExport', 'click', function () { self._exportProject(); });
      this._bind('simBtnImport', 'click', function () { self._importProject(); });

      this._bind('simBtnProps', 'click', function () {
        var selectedIds = window.SimSelection.getSelectedIds();
        if (selectedIds.length === 1) {
          var state = window.SimEngine._state;
          if (!state) return;
          var comp = null;
          for (var i = 0; i < state.placedComponents.length; i++) {
            if (state.placedComponents[i].id === selectedIds[0]) {
              comp = state.placedComponents[i];
              break;
            }
          }
          if (comp) window.SimProperties.toggle(comp);
        }
      });

      this._bind('btnCloseProperties', 'click', function () {
        window.SimProperties.hide();
      });
    },

    /* ========================================================================
       Helper to bind event safely
       ======================================================================== */
    _bind: function (id, event, handler) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener(event, handler);
      }
    },

    /* ========================================================================
       Setup drag and drop from library to canvas
       ======================================================================== */
    _setupDragDrop: function () {
      var canvas = document.getElementById('simCanvas');
      if (!canvas) return;

      var self = this;

      canvas.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      canvas.addEventListener('drop', function (e) {
        e.preventDefault();
        var compId = e.dataTransfer.getData('text/plain');
        if (compId && window.SimAddComponent) {
          var world = window.SimCanvas.screenToWorld(e.clientX, e.clientY);
          var snapped = window.SimCanvas.snapPosition(world.x, world.y);
          window.SimHistory.push(window.SimEngine.getStateSnapshot());
          window.SimAddComponent(compId, Math.max(0, snapped.x), Math.max(0, snapped.y));
        }
      });
    },

    /* ========================================================================
       Copy selected components to clipboard
       ======================================================================== */
    copySelection: function () {
      var selectedIds = window.SimSelection.getSelectedIds();
      if (selectedIds.length === 0) return;

      var state = window.SimEngine._state;
      if (!state) return;

      this._clipboard = [];
      for (var i = 0; i < selectedIds.length; i++) {
        var comp = null;
        for (var j = 0; j < state.placedComponents.length; j++) {
          if (state.placedComponents[j].id === selectedIds[i]) {
            comp = state.placedComponents[j];
            break;
          }
        }
        if (comp) {
          this._clipboard.push({ compId: comp.compId, x: comp.x, y: comp.y });
        }
      }

      this.showFeedback('📋 تم نسخ ' + this._clipboard.length + ' عناصر', 'info');
    },

    /* ========================================================================
       Paste components from clipboard
       ======================================================================== */
    pasteSelection: function () {
      if (!this._clipboard || this._clipboard.length === 0) return;
      if (!window.SimAddComponent) return;

      window.SimHistory.push(window.SimEngine.getStateSnapshot());
      window.SimSelection.clearAll(window.SimEngine._state ? window.SimEngine._state.placedComponents : []);

      var offset = window.SimCanvas.getGridSize() * 2;

      for (var i = 0; i < this._clipboard.length; i++) {
        var item = this._clipboard[i];
        window.SimAddComponent(item.compId, item.x + offset, item.y + offset);
      }

      this.showFeedback('📄 تم لصق ' + this._clipboard.length + ' عناصر', 'success');
    },

    /* ========================================================================
       Clear all components
       ======================================================================== */
    _clearAll: function () {
      var state = window.SimEngine._state;
      if (!state) return;

      var canvas = document.getElementById('simCanvas');
      if (canvas) {
        var components = canvas.querySelectorAll('.sim-component');
        for (var i = 0; i < components.length; i++) {
          components[i].remove();
        }
      }

      state.placedComponents = [];
      window.SimWires.clearAll();
      window.SimSelection.clearAll();
      window.SimProperties.hide();
      window.SimCanvas.showPlaceholder(true);
      window.SimEngine.stop();
      window.SimCanvas.updateComponentCount(0);
      window.SimCanvas.updateConnectionCount(0);
      this.showFeedback('🗑️ تم مسح جميع العناصر', 'info');
    },

    /* ========================================================================
       Save project
       ======================================================================== */
    _saveProject: function () {
      var name = prompt('📁 أدخل اسم المشروع:');
      if (!name) return;

      var result = window.SimProject.save(name, window.SimEngine._state, window.SimWires);
      this.showFeedback(result.message, result.success ? 'success' : 'error');
    },

    /* ========================================================================
       Load project
       ======================================================================== */
    _loadProject: function () {
      var projects = window.SimProject.getAll();

      if (projects.length === 0) {
        this.showFeedback('⚠️ لا توجد مشاريع محفوظة', 'warning');
        return;
      }

      var list = '';
      for (var i = 0; i < projects.length; i++) {
        var p = projects[i];
        list += (i + 1) + '. ' + p.name + ' (' + new Date(p.updatedAt).toLocaleDateString('ar') + ')\n';
      }

      var choice = prompt('📂 اختر رقم المشروع:\n\n' + list);
      if (!choice) return;

      var index = parseInt(choice) - 1;
      if (isNaN(index) || index < 0 || index >= projects.length) {
        this.showFeedback('⚠️ رقم غير صالح', 'error');
        return;
      }

      var result = window.SimProject.load(projects[index].id);
      if (result.success) {
        window.SimEngine.restoreSnapshot(result.project.data);
        this._updateAll();
        this.showFeedback('✅ تم تحميل المشروع: ' + result.project.name, 'success');
      } else {
        this.showFeedback(result.message, 'error');
      }
    },

    /* ========================================================================
       Export project as JSON
       ======================================================================== */
    _exportProject: function () {
      var name = prompt('📥 اسم ملف التصدير:', 'مشروع_DrDer');
      if (!name) return;

      var result = window.SimProject.exportToJSON(
        window.SimEngine._state,
        window.SimWires,
        name
      );
      this.showFeedback(result.message, 'success');
    },

    /* ========================================================================
       Import project from JSON
       ======================================================================== */
    _importProject: function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      var self = this;

      input.onchange = function (e) {
        var file = e.target.files[0];
        if (!file) return;

        window.SimProject.importFromJSON(file).then(function (result) {
          if (result.success) {
            window.SimEngine.restoreSnapshot(result.project.data);
            self._updateAll();
            self.showFeedback('✅ تم استيراد المشروع: ' + (result.project.name || 'بدون اسم'), 'success');
          } else {
            self.showFeedback(result.message, 'error');
          }
        });
      };

      input.click();
    },

    /* ========================================================================
       Update all UI elements
       ======================================================================== */
    _updateAll: function () {
      var state = window.SimEngine._state;
      if (!state) return;

      window.SimCanvas.updateComponentCount(state.placedComponents.length);
      window.SimCanvas.updateConnectionCount(window.SimWires.getConnectionCount());
      window.SimWires.drawAllWires(window.SimEngine.isActive());
      window.SimCanvas.showPlaceholder(state.placedComponents.length === 0);
    },

    /* ========================================================================
       Show feedback message
       ======================================================================== */
    showFeedback: function (message, type) {
      var fb = document.getElementById('simFeedbackMsg');
      if (!fb) return;

      fb.textContent = message;
      fb.className = 'sim-feedback-msg';
      if (type) fb.classList.add(type);
      fb.style.display = 'block';

      clearTimeout(this._feedbackTimer);
      var self = this;
      this._feedbackTimer = setTimeout(function () {
        fb.style.display = 'none';
      }, 3500);
    }
  };
})();
