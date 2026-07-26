/* ==========================================================================
   DrDer Electronic - Simulator Properties Panel
   Shows and edits properties of selected components
   ========================================================================== */
(function () {
  'use strict';

  window.SimProperties = {
    _panel: null,
    _content: null,
    _currentComponent: null,
    _state: null,
    _onPropertyChanged: null,

    /* ========================================================================
       Initialize
       ======================================================================== */
    init(state) {
      this._state = state;
      this._panel = document.getElementById('simProperties');
      this._content = document.getElementById('propertiesContent');
      this._setupEvents();
    },

    _setupEvents() {
      document.getElementById('btnCloseProperties')?.addEventListener('click', () => {
        this.hide();
      });
    },

    /* ========================================================================
       Show properties for a component
       ======================================================================== */
    show(component) {
      if (!component || !this._panel || !this._content) return;

      this._currentComponent = component;
      this._panel.style.display = '';

      const def = window.findComponentDef(component.compId);
      if (!def) return;

      let html = '';

      // Basic info
      html += `
        <div class="sim-props-group">
          <h4>🔧 معلومات أساسية</h4>
          <div class="sim-props-row"><label>النوع:</label><span>${def.icon} ${def.name}</span></div>
          <div class="sim-props-row"><label>المعرف:</label><span>${component.id}</span></div>
          <div class="sim-props-row"><label>الفئة:</label><span>${def.type}</span></div>
        </div>
      `;

      // Position
      html += `
        <div class="sim-props-group">
          <h4>📐 الموقع</h4>
          <div class="sim-props-row">
            <label>X:</label>
            <input type="number" class="sim-props-input" id="propX" value="${Math.round(component.x)}" step="1">
          </div>
          <div class="sim-props-row">
            <label>Y:</label>
            <input type="number" class="sim-props-input" id="propY" value="${Math.round(component.y)}" step="1">
          </div>
        </div>
      `;

      // Electrical properties
      const hasElectrical = def.voltage || def.current || def.power || def.frequency;
      if (hasElectrical) {
        html += '<div class="sim-props-group"><h4>⚡ الخصائص الكهربائية</h4>';
        if (def.voltage !== undefined) {
          html += `
            <div class="sim-props-row">
              <label>الجهد (V):</label>
              <input type="number" class="sim-props-input" id="propVoltage" value="${component.properties?.voltage || def.voltage}" step="0.1" min="0">
            </div>
          `;
        }
        if (def.current !== undefined) {
          html += `
            <div class="sim-props-row">
              <label>التيار (A):</label>
              <input type="number" class="sim-props-input" id="propCurrent" value="${component.properties?.current || def.current}" step="0.1" min="0">
            </div>
          `;
        }
        if (def.power !== undefined) {
          html += `
            <div class="sim-props-row">
              <label>القدرة (W):</label>
              <input type="number" class="sim-props-input" id="propPower" value="${component.properties?.power || def.power}" step="1" min="0">
            </div>
          `;
        }
        if (def.frequency !== undefined) {
          html += `
            <div class="sim-props-row">
              <label>التردد (Hz):</label>
              <input type="number" class="sim-props-input" id="propFrequency" value="${component.properties?.frequency || def.frequency}" step="1" min="0">
            </div>
          `;
        }
        html += '</div>';
      }

      // Component-specific properties
      if (def.type === 'passive') {
        html += '<div class="sim-props-group"><h4>📏 القيمة</h4>';
        if (def.subtype === 'resistor' || def.subtype === 'pot' || def.subtype === 'ldr' || def.subtype === 'ntc' || def.subtype === 'ptc') {
          html += `
            <div class="sim-props-row">
              <label>المقاومة (${def.unit || 'Ω'}):</label>
              <input type="number" class="sim-props-input" id="propValue" value="${component.properties?.value || def.value}" step="1" min="0">
            </div>
          `;
        }
        if (def.subtype === 'capacitor' || def.subtype === 'capacitor_polar') {
          html += `
            <div class="sim-props-row">
              <label>السعة (${def.unit || 'µF'}):</label>
              <input type="number" class="sim-props-input" id="propValue" value="${component.properties?.value || def.value}" step="0.1" min="0">
            </div>
          `;
        }
        if (def.subtype === 'inductor') {
          html += `
            <div class="sim-props-row">
              <label>المحاثة (${def.unit || 'mH'}):</label>
              <input type="number" class="sim-props-input" id="propValue" value="${component.properties?.value || def.value}" step="0.1" min="0">
            </div>
          `;
        }
        html += '</div>';
      }

      // Protection
      if (def.type === 'protection') {
        html += '<div class="sim-props-group"><h4>🛡️ الحماية</h4>';
        if (def.current !== undefined) {
          html += `
            <div class="sim-props-row">
              <label>تيار الفصل (A):</label>
              <input type="number" class="sim-props-input" id="propCurrent" value="${component.properties?.current || def.current}" step="1" min="1">
            </div>
          `;
        }
        html += '</div>';
      }

      // Motor properties
      if (def.type === 'motor') {
        html += '<div class="sim-props-group"><h4>⚙️ المحرك</h4>';
        if (def.speed !== undefined) {
          html += `
            <div class="sim-props-row">
              <label>السرعة (RPM):</label>
              <input type="number" class="sim-props-input" id="propSpeed" value="${component.properties?.speed || def.speed}" step="100" min="0">
            </div>
          `;
        }
        html += '</div>';
      }

      // Timer properties
      if (def.type === 'relay' && (def.subtype === 'timer_on' || def.subtype === 'timer_off')) {
        html += '<div class="sim-props-group"><h4>⏱️ المؤقت</h4>';
        html += `
          <div class="sim-props-row">
            <label>التأخير (ثانية):</label>
            <input type="number" class="sim-props-input" id="propDelay" value="${component.properties?.delay || def.delay || 5}" step="0.5" min="0">
          </div>
        `;
        html += '</div>';
      }

      // Rotation
      html += `
        <div class="sim-props-group">
          <h4>🔄 التدوير</h4>
          <div class="sim-props-row">
            <label>الزاوية:</label>
            <select class="sim-props-select" id="propRotation">
              <option value="0" ${(component.rotation || 0) === 0 ? 'selected' : ''}>0°</option>
              <option value="90" ${component.rotation === 90 ? 'selected' : ''}>90°</option>
              <option value="180" ${component.rotation === 180 ? 'selected' : ''}>180°</option>
              <option value="270" ${component.rotation === 270 ? 'selected' : ''}>270°</option>
            </select>
          </div>
        </div>
      `;

      // State
      html += `
        <div class="sim-props-group">
          <h4>📊 الحالة</h4>
          <div class="sim-props-row">
            <label>نشط:</label>
            <span style="color:${component.compState?.active ? 'var(--success)' : 'var(--text-muted)'}">
              ${component.compState?.active ? '✅ يعمل' : '❌ متوقف'}
            </span>
          </div>
        </div>
      `;

      // Delete button
      html += `
        <button class="btn btn-danger btn-sm btn-block" id="btnDeleteProp" style="margin-top:8px;">
          🗑️ حذف العنصر
        </button>
      `;

      this._content.innerHTML = html;
      this._bindInputEvents(component);
    },

    /* ========================================================================
       Bind input change events
       ======================================================================== */
    _bindInputEvents(component) {
      // Position
      document.getElementById('propX')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        component.x = Math.max(0, val);
        if (component.el) component.el.style.left = `${component.x}px`;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'x', component.x);
      });

      document.getElementById('propY')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        component.y = Math.max(0, val);
        if (component.el) component.el.style.top = `${component.y}px`;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'y', component.y);
      });

      // Electrical properties
      document.getElementById('propVoltage')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        if (!component.properties) component.properties = {};
        component.properties.voltage = val;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'voltage', val);
      });

      document.getElementById('propCurrent')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        if (!component.properties) component.properties = {};
        component.properties.current = val;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'current', val);
      });

      document.getElementById('propPower')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        if (!component.properties) component.properties = {};
        component.properties.power = val;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'power', val);
      });

      document.getElementById('propFrequency')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        if (!component.properties) component.properties = {};
        component.properties.frequency = val;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'frequency', val);
      });

      document.getElementById('propValue')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        if (!component.properties) component.properties = {};
        component.properties.value = val;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'value', val);
      });

      document.getElementById('propSpeed')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        if (!component.properties) component.properties = {};
        component.properties.speed = val;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'speed', val);
      });

      document.getElementById('propDelay')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        if (!component.properties) component.properties = {};
        component.properties.delay = val;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'delay', val);
      });

      document.getElementById('propRotation')?.addEventListener('change', (e) => {
        const val = parseInt(e.target.value) || 0;
        component.rotation = val;
        if (component.el) component.el.style.transform = `rotate(${val}deg)`;
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'rotation', val);
      });

      // Delete
      document.getElementById('btnDeleteProp')?.addEventListener('click', () => {
        if (this._onPropertyChanged) this._onPropertyChanged(component, 'delete', null);
      });
    },

    /* ========================================================================
       Hide panel
       ======================================================================== */
    hide() {
      if (this._panel) {
        this._panel.style.display = 'none';
      }
      this._currentComponent = null;

      if (this._content) {
        this._content.innerHTML = '<p class="sim-props-empty">اختر عنصراً لعرض خصائصه</p>';
      }
    },

    /* ========================================================================
       Toggle panel
       ======================================================================== */
    toggle(component) {
      if (this._panel && this._panel.style.display !== 'none') {
        this.hide();
      } else if (component) {
        this.show(component);
      }
    },

    /* ========================================================================
       Get current component
       ======================================================================== */
    getCurrentComponent() {
      return this._currentComponent;
    },

    /* ========================================================================
       Callback
       ======================================================================== */
    onPropertyChanged(cb) {
      this._onPropertyChanged = cb;
    }
  };
})();
