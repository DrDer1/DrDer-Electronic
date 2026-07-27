/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-properties.js - Properties Panel
   
   Responsibility:
   - Show and edit properties of a selected component
   - Update component data in SimState when properties change
   - No event handling beyond panel buttons
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimProperties - Manages the properties panel
   */
  window.SimProperties = {

    /** @type {HTMLElement} The properties panel element */
    _panel: null,

    /** @type {HTMLElement} The content area of the panel */
    _content: null,

    /** @type {Object|null} The currently displayed component */
    _currentComponent: null,

    /** @type {Function|null} Callback when a property changes */
    _onPropertyChanged: null,

    /* ======================================================================
       Initialization
       ====================================================================== */

    /**
     * Initialize the properties panel
     */
    init: function () {
      this._panel = document.getElementById('simProperties');
      this._content = document.getElementById('propertiesContent');
      this._currentComponent = null;

      // Close button
      var closeBtn = document.getElementById('btnCloseProperties');
      if (closeBtn) {
        var self = this;
        closeBtn.addEventListener('click', function () {
          self.hide();
        });
      }
    },

    /* ======================================================================
       Show / Hide
       ====================================================================== */

    /**
     * Show properties for a component
     * @param {Object} component - The component to show properties for
     */
    show: function (component) {
      if (!component || !this._panel || !this._content) return;

      this._currentComponent = component;
      this._panel.style.display = '';

      var def = window.findComponentDef(component.compId);
      if (!def) {
        this._content.innerHTML = '<p class="sim-props-empty">تعريف العنصر غير موجود</p>';
        return;
      }

      this._renderProperties(component, def);
    },

    /**
     * Hide the properties panel
     */
    hide: function () {
      if (this._panel) {
        this._panel.style.display = 'none';
      }
      this._currentComponent = null;

      if (this._content) {
        this._content.innerHTML = '<p class="sim-props-empty">اختر عنصراً لعرض خصائصه</p>';
      }
    },

    /**
     * Toggle the properties panel
     * @param {Object} [component] - Component to show (if opening)
     */
    toggle: function (component) {
      if (this._panel && this._panel.style.display !== 'none') {
        this.hide();
      } else if (component) {
        this.show(component);
      }
    },

    /* ======================================================================
       Render Properties
       ====================================================================== */

    /**
     * Render all properties for a component
     * @private
     * @param {Object} comp - Component object
     * @param {Object} def - Component definition
     */
    _renderProperties: function (comp, def) {
      var html = '';

      // Basic info
      html += '<div class="sim-props-group">';
      html += '<h4>🔧 معلومات أساسية</h4>';
      html += '<div class="sim-props-row"><label>النوع:</label><span>' + def.icon + ' ' + def.name + '</span></div>';
      html += '<div class="sim-props-row"><label>المعرف:</label><span>' + comp.id + '</span></div>';
      html += '<div class="sim-props-row"><label>الفئة:</label><span>' + this._getTypeName(def.type) + '</span></div>';
      html += '</div>';

      // Position
      html += '<div class="sim-props-group">';
      html += '<h4>📐 الموقع</h4>';
      html += '<div class="sim-props-row"><label>X:</label><input type="number" class="sim-props-input" id="propX" value="' + Math.round(comp.x) + '" step="1"></div>';
      html += '<div class="sim-props-row"><label>Y:</label><input type="number" class="sim-props-input" id="propY" value="' + Math.round(comp.y) + '" step="1"></div>';
      html += '</div>';

      // Electrical properties
      if (def.voltage !== undefined || def.current !== undefined || def.power !== undefined || def.frequency !== undefined) {
        html += '<div class="sim-props-group"><h4>⚡ الخصائص الكهربائية</h4>';

        if (def.voltage !== undefined) {
          var v = (comp.properties && comp.properties.voltage !== undefined) ? comp.properties.voltage : def.voltage;
          html += '<div class="sim-props-row"><label>الجهد (V):</label><input type="number" class="sim-props-input" id="propVoltage" value="' + v + '" step="0.1" min="0"></div>';
        }
        if (def.current !== undefined) {
          var c = (comp.properties && comp.properties.current !== undefined) ? comp.properties.current : def.current;
          html += '<div class="sim-props-row"><label>التيار (A):</label><input type="number" class="sim-props-input" id="propCurrent" value="' + c + '" step="0.1" min="0"></div>';
        }
        if (def.power !== undefined) {
          var p = (comp.properties && comp.properties.power !== undefined) ? comp.properties.power : def.power;
          html += '<div class="sim-props-row"><label>القدرة (W):</label><input type="number" class="sim-props-input" id="propPower" value="' + p + '" step="1" min="0"></div>';
        }
        if (def.frequency !== undefined) {
          var f = (comp.properties && comp.properties.frequency !== undefined) ? comp.properties.frequency : def.frequency;
          html += '<div class="sim-props-row"><label>التردد (Hz):</label><input type="number" class="sim-props-input" id="propFrequency" value="' + f + '" step="1" min="0"></div>';
        }

        html += '</div>';
      }

      // Passive component value
      if (def.type === 'passive' && def.value !== undefined) {
        html += '<div class="sim-props-group"><h4>📏 القيمة</h4>';
        var val = (comp.properties && comp.properties.value !== undefined) ? comp.properties.value : def.value;
        html += '<div class="sim-props-row"><label>' + (def.unit || '') + ':</label><input type="number" class="sim-props-input" id="propValue" value="' + val + '" step="0.1" min="0"></div>';
        html += '</div>';
      }

      // Protection current
      if (def.type === 'protection' && def.current !== undefined) {
        html += '<div class="sim-props-group"><h4>🛡️ الحماية</h4>';
        var pc = (comp.properties && comp.properties.current !== undefined) ? comp.properties.current : def.current;
        html += '<div class="sim-props-row"><label>تيار الفصل (A):</label><input type="number" class="sim-props-input" id="propCurrent" value="' + pc + '" step="1" min="1"></div>';
        html += '</div>';
      }

      // Relay/Contactor coil voltage
      if ((def.type === 'relay' || def.type === 'contactor') && def.coilV !== undefined) {
        html += '<div class="sim-props-group"><h4>🔀 الملف</h4>';
        var cv = (comp.properties && comp.properties.coilV !== undefined) ? comp.properties.coilV : def.coilV;
        html += '<div class="sim-props-row"><label>جهد الملف (V):</label><input type="number" class="sim-props-input" id="propCoilV" value="' + cv + '" step="1" min="0"></div>';
        html += '</div>';
      }

      // Timer delay
      if (def.delay !== undefined) {
        html += '<div class="sim-props-group"><h4>⏱️ المؤقت</h4>';
        var d = (comp.properties && comp.properties.delay !== undefined) ? comp.properties.delay : def.delay;
        html += '<div class="sim-props-row"><label>التأخير (ثانية):</label><input type="number" class="sim-props-input" id="propDelay" value="' + d + '" step="0.5" min="0"></div>';
        html += '</div>';
      }

      // Rotation
      html += '<div class="sim-props-group"><h4>🔄 التدوير</h4>';
      html += '<div class="sim-props-row"><label>الزاوية:</label><select class="sim-props-select" id="propRotation">';
      var rotations = [0, 90, 180, 270];
      var currentRot = comp.rotation || 0;
      for (var r = 0; r < rotations.length; r++) {
        html += '<option value="' + rotations[r] + '"' + (currentRot === rotations[r] ? ' selected' : '') + '>' + rotations[r] + '°</option>';
      }
      html += '</select></div></div>';

      // State
      html += '<div class="sim-props-group"><h4>📊 الحالة</h4>';
      var isActive = comp.compState && comp.compState.active;
      html += '<div class="sim-props-row"><label>نشط:</label><span style="color:' + (isActive ? 'var(--success)' : 'var(--text-muted)') + '">' + (isActive ? '✅ يعمل' : '❌ متوقف') + '</span></div>';
      html += '</div>';

      // Delete button
      html += '<button class="btn btn-danger btn-sm btn-block" id="btnDeleteProp" style="margin-top:8px;">🗑️ حذف العنصر</button>';

      this._content.innerHTML = html;
      this._bindEvents(comp);
    },

    /**
     * Bind input change events
     * @private
     * @param {Object} comp - Component object
     */
    _bindEvents: function (comp) {
      var self = this;

      // Position
      this._bindInput('propX', function (val) {
        comp.x = Math.max(0, val);
        if (comp.el) comp.el.style.left = comp.x + 'px';
        self._notifyChange(comp, 'x', comp.x);
      });

      this._bindInput('propY', function (val) {
        comp.y = Math.max(0, val);
        if (comp.el) comp.el.style.top = comp.y + 'px';
        self._notifyChange(comp, 'y', comp.y);
      });

      // Voltage
      this._bindInput('propVoltage', function (val) {
        if (!comp.properties) comp.properties = {};
        comp.properties.voltage = val;
        self._notifyChange(comp, 'voltage', val);
      });

      // Current
      this._bindInput('propCurrent', function (val) {
        if (!comp.properties) comp.properties = {};
        comp.properties.current = val;
        self._notifyChange(comp, 'current', val);
      });

      // Power
      this._bindInput('propPower', function (val) {
        if (!comp.properties) comp.properties = {};
        comp.properties.power = val;
        self._notifyChange(comp, 'power', val);
      });

      // Frequency
      this._bindInput('propFrequency', function (val) {
        if (!comp.properties) comp.properties = {};
        comp.properties.frequency = val;
        self._notifyChange(comp, 'frequency', val);
      });

      // Value
      this._bindInput('propValue', function (val) {
        if (!comp.properties) comp.properties = {};
        comp.properties.value = val;
        self._notifyChange(comp, 'value', val);
      });

      // Coil voltage
      this._bindInput('propCoilV', function (val) {
        if (!comp.properties) comp.properties = {};
        comp.properties.coilV = val;
        self._notifyChange(comp, 'coilV', val);
      });

      // Delay
      this._bindInput('propDelay', function (val) {
        if (!comp.properties) comp.properties = {};
        comp.properties.delay = val;
        self._notifyChange(comp, 'delay', val);
      });

      // Rotation
      var rotSelect = document.getElementById('propRotation');
      if (rotSelect) {
        rotSelect.addEventListener('change', function () {
          comp.rotation = parseInt(this.value) || 0;
          if (comp.el) {
            comp.el.style.transform = 'rotate(' + comp.rotation + 'deg)';
            // Re-apply canvas transform on top of rotation
            if (window.SimCanvas) {
              var t = 'translate(' + (window.SimState ? window.SimState.panOffsetX : 0) + 'px, ' +
                      (window.SimState ? window.SimState.panOffsetY : 0) + 'px) scale(' +
                      (window.SimState ? window.SimState.zoomLevel : 1) + ') rotate(' + comp.rotation + 'deg)';
              comp.el.style.transform = t;
            }
          }
          self._notifyChange(comp, 'rotation', comp.rotation);
        });
      }

      // Delete button
      var deleteBtn = document.getElementById('btnDeleteProp');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
          self._notifyChange(comp, 'delete', null);
        });
      }
    },

    /**
     * Helper to bind an input's change event
     * @private
     * @param {string} id - Input element ID
     * @param {Function} callback - Called with parsed number value
     */
    _bindInput: function (id, callback) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        var val = parseFloat(this.value);
        if (!isNaN(val)) callback(val);
      });
    },

    /**
     * Get Arabic type name
     * @private
     * @param {string} type - Component type
     * @returns {string}
     */
    _getTypeName: function (type) {
      var names = {
        'source': 'مصدر طاقة',
        'protection': 'حماية',
        'switch': 'مفتاح',
        'relay': 'ريليه',
        'contactor': 'كونتاكتور',
        'motor': 'محرك',
        'load': 'حمل',
        'passive': 'عنصر سلبي',
        'semiconductor': 'شبه موصل',
        'ic': 'دائرة متكاملة',
        'logic': 'بوابة منطقية',
        'measurement': 'جهاز قياس',
        'transformer': 'محول',
        'terminal': 'طرف توصيل',
        'board': 'لوحة'
      };
      return names[type] || type;
    },

    /**
     * Notify property change callback
     * @private
     * @param {Object} comp - Component
     * @param {string} property - Property name
     * @param {*} value - New value
     */
    _notifyChange: function (comp, property, value) {
      if (this._onPropertyChanged) {
        this._onPropertyChanged(comp, property, value);
      }

      // Redraw wires when position changes
      if (property === 'x' || property === 'y') {
        if (window.SimWires) {
          window.SimWires.drawAllWires(window.SimState ? window.SimState.simulationActive : false);
        }
      }
    },

    /**
     * Register callback for property changes
     * @param {Function} cb - Callback(component, property, value)
     */
    onPropertyChanged: function (cb) {
      this._onPropertyChanged = cb;
    },

    /**
     * Get the currently displayed component
     * @returns {Object|null}
     */
    getCurrentComponent: function () {
      return this._currentComponent;
    }
  };

})();
