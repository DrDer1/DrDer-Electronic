/* ==========================================================================
   DrDer Electronic - Simulator UI v4.1
   Fixed: Toolbar buttons, feedback, project management
   ========================================================================== */
(function () {
  'use strict';

  window.SimUI = {
    _feedbackTimer: null,
    _clipboard: [],

    init: function () {
      this._setupToolbarButtons();
    },

    _bind: function (id, event, handler) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener(event, handler);
      } else {
        console.warn('SimUI: Element not found:', id);
      }
    },

    _setupToolbarButtons: function () {
      var self = this;

      this._bind('simBtnUndo', 'click', function () {
        if (!window.SimHistory || !window.SimEngine) return;
        if (window.SimHistory.canUndo()) {
          window.SimHistory.undo(
            function () { return window.SimEngine.getStateSnapshot(); },
            function (snapshot) { window.SimEngine.restoreSnapshot(snapshot); }
          );
          self._updateAll();
        }
      });

      this._bind('simBtnRedo', 'click', function () {
        if (!window.SimHistory || !window.SimEngine) return;
        if (window.SimHistory.canRedo()) {
          window.SimHistory.redo(
            function () { return window.SimEngine.getStateSnapshot(); },
            function (snapshot) { window.SimEngine.restoreSnapshot(snapshot); }
          );
          self._updateAll();
        }
      });

      this._bind('simBtnRun', 'click', function () {
        if (!window.SimEngine) return;
        var result = window.SimEngine.run();
        self.showFeedback(result.message, result.success ? 'success' : 'error');
      });

      this._bind('simBtnStop', 'click', function () {
        if (!window.SimEngine) return;
        var result = window.SimEngine.stop();
        self.showFeedback(result.message, 'info');
      });

      this._bind('simBtnValidate', 'click', function () {
        if (!window.SimEngine || !window.SimValidation || !window.SimWires) return;
        var state = window.SimGetState ? window.SimGetState() : window.SimEngine._state;
        if (!state) return;
        var validation = window.SimValidation.validate(state.placedComponents, window.SimWires.getConnections());
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

      this._bind('simBtnZoomIn', 'click', function () {
        if (window.SimCanvas) window.SimCanvas.zoomIn();
      });

      this._bind('simBtnZoomOut', 'click', function () {
        if (window.SimCanvas) window.SimCanvas.zoomOut();
      });

      this._bind('simBtnZoomFit', 'click', function () {
        var state = window.SimGetState ? window.SimGetState() : (window.SimEngine ? window.SimEngine._state : null);
        if (window.SimCanvas && state) {
          window.SimCanvas.zoomToFit(state.placedComponents);
        }
      });

      this._bind('simBtnSnap', 'click', function () {
        if (window.SimCanvas) window.SimCanvas.toggleSnap();
      });

      this._bind('simBtnGridSize', 'click', function () {
        if (window.SimCanvas) window.SimCanvas.cycleGridSize();
      });

      this._bind('simBtnCopy', 'click', function () { self.copySelection(); });
      this._bind('simBtnPaste', 'click', function () { self.pasteSelection(); });

      this._bind('simBtnDelete', 'click', function () {
        if (!window.SimSelection) return;
        var selectedIds = window.SimSelection.getSelectedIds();
        if (selectedIds.length === 0) return;
        if (window.SimHistory) window.SimHistory.push(window.SimEngine.getStateSnapshot());
        for (var i = 0; i < selectedIds.length; i++) {
          if (window.SimDeleteComponent) window.SimDeleteComponent(selectedIds[i]);
        }
        self.showFeedback('🗑️ تم حذف ' + selectedIds.length + ' عناصر', 'info');
      });

      this._bind('simBtnClearAll', 'click', function () {
        var state = window.SimGetState ? window.SimGetState() : (window.SimEngine ? window.SimEngine._state : null);
        if (!state || state.placedComponents.length === 0) return;
        if (!confirm('هل أنت متأكد من مسح جميع العناصر؟')) return;
        if (window.SimHistory) window.SimHistory.push(window.SimEngine.getStateSnapshot());
        self._clearAll();
      });

      this._bind('simBtnSave', 'click', function () { self._saveProject(); });
      this._bind('simBtnLoad', 'click', function () { self._loadProject(); });
      this._bind('simBtnExport', 'click', function () { self._exportProject(); });
      this._bind('simBtnImport', 'click', function () { self._importProject(); });

      this._bind('simBtnProps', 'click', function () {
        if (!window.SimSelection || !window.SimProperties) return;
        var selectedIds = window.SimSelection.getSelectedIds();
        if (selectedIds.length === 1) {
          var state = window.SimGetState ? window.SimGetState() : (window.SimEngine ? window.SimEngine._state : null);
          if (!state) return;
          for (var i = 0; i < state.placedComponents.length; i++) {
            if (state.placedComponents[i].id === selectedIds[0]) {
              window.SimProperties.toggle(state.placedComponents[i]);
              break;
            }
          }
        }
      });
    },

    copySelection: function () {
      if (!window.SimSelection) return;
      var selectedIds = window.SimSelection.getSelectedIds();
      if (selectedIds.length === 0) return;
      var state = window.SimGetState ? window.SimGetState() : (window.SimEngine ? window.SimEngine._state : null);
      if (!state) return;
      this._clipboard = [];
      for (var i = 0; i < selectedIds.length; i++) {
        for (var j = 0; j < state.placedComponents.length; j++) {
          if (state.placedComponents[j].id === selectedIds[i]) {
            var comp = state.placedComponents[j];
            this._clipboard.push({ compId: comp.compId, x: comp.x, y: comp.y });
            break;
          }
        }
      }
      this.showFeedback('📋 تم نسخ ' + this._clipboard.length + ' عناصر', 'info');
    },

    pasteSelection: function () {
      if (!this._clipboard || this._clipboard.length === 0) return;
      if (!window.SimAddComponent || !window.SimCanvas) return;
      if (window.SimHistory) window.SimHistory.push(window.SimEngine.getStateSnapshot());
      if (window.SimSelection) window.SimSelection.clearAll(
        window.SimGetState ? window.SimGetState().placedComponents : []
      );
      var offset = window.SimCanvas.getGridSize() * 2;
      for (var i = 0; i < this._clipboard.length; i++) {
        var item = this._clipboard[i];
        window.SimAddComponent(item.compId, item.x + offset, item.y + offset);
      }
      this.showFeedback('📄 تم لصق ' + this._clipboard.length + ' عناصر', 'success');
    },

    _clearAll: function () {
      var state = window.SimGetState ? window.SimGetState() : (window.SimEngine ? window.SimEngine._state : null);
      if (!state) return;
      var canvas = document.getElementById('simCanvas');
      if (canvas) {
        var components = canvas.querySelectorAll('.sim-component');
        for (var i = 0; i < components.length; i++) {
          components[i].remove();
        }
      }
      state.placedComponents = [];
      if (window.SimWires) window.SimWires.clearAll();
      if (window.SimSelection) window.SimSelection.clearAll();
      if (window.SimProperties) window.SimProperties.hide();
      if (window.SimCanvas) {
        window.SimCanvas.showPlaceholder(true);
        window.SimCanvas.updateComponentCount(0);
        window.SimCanvas.updateConnectionCount(0);
      }
      if (window.SimEngine) window.SimEngine.stop();
      this.showFeedback('🗑️ تم مسح جميع العناصر', 'info');
    },

    _saveProject: function () {
      if (!window.SimProject || !window.SimEngine) return;
      var name = prompt('📁 أدخل اسم المشروع:');
      if (!name) return;
      var result = window.SimProject.save(name, window.SimEngine._state, window.SimWires);
      this.showFeedback(result.message, result.success ? 'success' : 'error');
    },

    _loadProject: function () {
      if (!window.SimProject || !window.SimEngine) return;
      var projects = window.SimProject.getAll();
      if (projects.length === 0) {
        this.showFeedback('⚠️ لا توجد مشاريع محفوظة', 'warning');
        return;
      }
      var list = '';
      for (var i = 0; i < projects.length; i++) {
        list += (i + 1) + '. ' + projects[i].name + '\n';
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

    _exportProject: function () {
      if (!window.SimProject || !window.SimEngine) return;
      var name = prompt('📥 اسم ملف التصدير:', 'مشروع_DrDer');
      if (!name) return;
      var result = window.SimProject.exportToJSON(window.SimEngine._state, window.SimWires, name);
      this.showFeedback(result.message, 'success');
    },

    _importProject: function () {
      if (!window.SimProject || !window.SimEngine) return;
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
            self.showFeedback('✅ تم استيراد المشروع', 'success');
          } else {
            self.showFeedback(result.message, 'error');
          }
        });
      };
      input.click();
    },

    _updateAll: function () {
      var state = window.SimGetState ? window.SimGetState() : (window.SimEngine ? window.SimEngine._state : null);
      if (!state) return;
      if (window.SimCanvas) {
        window.SimCanvas.updateComponentCount(state.placedComponents.length);
        window.SimCanvas.updateConnectionCount(window.SimWires ? window.SimWires.getConnectionCount() : 0);
        window.SimCanvas.showPlaceholder(state.placedComponents.length === 0);
      }
      if (window.SimWires) {
        window.SimWires.drawAllWires(window.SimEngine ? window.SimEngine.isActive() : false);
      }
    },

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
