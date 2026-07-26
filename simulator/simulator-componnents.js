/* ==========================================================================
   DrDer Electronic - Component Library v4.0
   Hundreds of electronic and electrical components
   Organized by categories with full specifications
   ========================================================================== */
(function () {
  'use strict';

  window.SIM_COMPONENTS = {
    power_sources: {
      name: 'مصادر الطاقة',
      icon: '🔋',
      items: [
        { id: 'battery', name: 'بطارية 12V', icon: '🔋', type: 'source', subtype: 'battery', voltage: 12, current: 5, terminals: 2 },
        { id: 'battery_9v', name: 'بطارية 9V', icon: '🔋', type: 'source', subtype: 'battery', voltage: 9, current: 1, terminals: 2 },
        { id: 'battery_liion', name: 'بطارية ليثيوم', icon: '🔋', type: 'source', subtype: 'battery', voltage: 3.7, current: 3, terminals: 2 },
        { id: 'dc_supply', name: 'مصدر DC 24V', icon: '⎓', type: 'source', subtype: 'dc', voltage: 24, current: 10, terminals: 2 },
        { id: 'dc_supply_adj', name: 'مصدر DC متغير', icon: '⎓', type: 'source', subtype: 'dc_adj', voltage: 12, minV: 0, maxV: 30, current: 5, terminals: 2 },
        { id: 'ac_supply_1ph', name: 'مصدر AC 220V', icon: '∿', type: 'source', subtype: 'ac_1ph', voltage: 220, frequency: 50, current: 16, terminals: 2 },
        { id: 'ac_supply_3ph', name: 'مصدر AC ثلاثي', icon: '⚡', type: 'source', subtype: 'ac_3ph', voltage: 380, frequency: 50, current: 32, terminals: 4 },
        { id: 'generator_dc', name: 'مولد DC', icon: '🔌', type: 'source', subtype: 'generator_dc', voltage: 24, power: 500, terminals: 2 },
        { id: 'generator_ac', name: 'مولد AC', icon: '⚙️', type: 'source', subtype: 'generator_ac', voltage: 220, power: 3000, frequency: 50, terminals: 3 },
        { id: 'solar_panel', name: 'لوح شمسي', icon: '☀️', type: 'source', subtype: 'solar', voltage: 24, power: 300, terminals: 2 },
        { id: 'power_supply', name: 'مزود طاقة', icon: '🔌', type: 'source', subtype: 'psu', inputV: 220, outputV: 24, current: 5, terminals: 4 }
      ]
    },
    protection: {
      name: 'الحماية',
      icon: '🛡️',
      items: [
        { id: 'fuse', name: 'فيوز', icon: '🔗', type: 'protection', subtype: 'fuse', current: 10, terminals: 2 },
        { id: 'mcb_1p', name: 'MCB أحادي', icon: '🔒', type: 'protection', subtype: 'mcb', current: 16, poles: 1, curve: 'C', terminals: 2 },
        { id: 'mcb_3p', name: 'MCB ثلاثي', icon: '🔒', type: 'protection', subtype: 'mcb', current: 32, poles: 3, curve: 'C', terminals: 6 },
        { id: 'mccb', name: 'MCCB', icon: '🔐', type: 'protection', subtype: 'mccb', current: 100, poles: 3, terminals: 6 },
        { id: 'rccb', name: 'RCCB', icon: '🛡️', type: 'protection', subtype: 'rccb', current: 40, leakage: 30, terminals: 4 },
        { id: 'rcbo', name: 'RCBO', icon: '⚡', type: 'protection', subtype: 'rcbo', current: 16, leakage: 30, terminals: 4 },
        { id: 'spd', name: 'SPD', icon: '🌩️', type: 'protection', subtype: 'spd', voltage: 275, terminals: 3 },
        { id: 'overload_relay', name: 'Overload Relay', icon: '🔴', type: 'protection', subtype: 'overload', current: 10, terminals: 3 },
        { id: 'elcb', name: 'ELCB', icon: '🔰', type: 'protection', subtype: 'elcb', current: 63, terminals: 4 }
      ]
    },
    switches: {
      name: 'المفاتيح',
      icon: '🔘',
      items: [
        { id: 'switch_spst', name: 'SPST', icon: '🔘', type: 'switch', subtype: 'spst', terminals: 2 },
        { id: 'switch_spdt', name: 'SPDT', icon: '🔀', type: 'switch', subtype: 'spdt', terminals: 3 },
        { id: 'switch_dpdt', name: 'DPDT', icon: '🔀', type: 'switch', subtype: 'dpdt', terminals: 6 },
        { id: 'push_no', name: 'Push NO', icon: '🟢', type: 'switch', subtype: 'push_no', color: '#3fb950', terminals: 2 },
        { id: 'push_nc', name: 'Push NC', icon: '🔴', type: 'switch', subtype: 'push_nc', color: '#f85149', terminals: 2 },
        { id: 'selector_2', name: 'Selector 2 وضع', icon: '🎛️', type: 'switch', subtype: 'selector', positions: 2, terminals: 3 },
        { id: 'selector_3', name: 'Selector 3 وضع', icon: '🎛️', type: 'switch', subtype: 'selector', positions: 3, terminals: 4 },
        { id: 'emergency_stop', name: 'طوارئ', icon: '⛔', type: 'switch', subtype: 'emergency', color: '#f85149', terminals: 2 },
        { id: 'limit_switch_no', name: 'Limit NO', icon: '↔️', type: 'switch', subtype: 'limit_no', terminals: 2 },
        { id: 'limit_switch_nc', name: 'Limit NC', icon: '↔️', type: 'switch', subtype: 'limit_nc', terminals: 2 },
        { id: 'float_switch', name: 'Float Switch', icon: '🔄', type: 'switch', subtype: 'float', terminals: 2 },
        { id: 'pressure_switch', name: 'Pressure Switch', icon: '💨', type: 'switch', subtype: 'pressure', terminals: 2 },
        { id: 'foot_switch', name: 'Foot Switch', icon: '🦶', type: 'switch', subtype: 'foot', terminals: 2 }
      ]
    },
    relays: {
      name: 'الريليهات',
      icon: '🔀',
      items: [
        { id: 'relay_spdt', name: 'Relay SPDT', icon: '🔀', type: 'relay', subtype: 'relay_spdt', coilV: 24, terminals: 5 },
        { id: 'relay_dpdt', name: 'Relay DPDT', icon: '🔀', type: 'relay', subtype: 'relay_dpdt', coilV: 24, terminals: 8 },
        { id: 'timer_on_delay', name: 'Timer ON Delay', icon: '⏱️', type: 'relay', subtype: 'timer_on', coilV: 24, delay: 5, terminals: 6 },
        { id: 'timer_off_delay', name: 'Timer OFF Delay', icon: '⏲️', type: 'relay', subtype: 'timer_off', coilV: 24, delay: 5, terminals: 6 },
        { id: 'timer_cyclic', name: 'Timer Cyclic', icon: '🔄', type: 'relay', subtype: 'timer_cyclic', coilV: 24, onTime: 2, offTime: 2, terminals: 4 },
        { id: 'ssr', name: 'Solid State Relay', icon: '⚡', type: 'relay', subtype: 'ssr', coilV: 5, loadV: 220, loadI: 10, terminals: 4 }
      ]
    },
    contactors: {
      name: 'الكونتاكتورات',
      icon: '🔌',
      items: [
        { id: 'contactor_3p', name: 'Contactor 3P', icon: '🔌', type: 'contactor', subtype: 'contactor_3p', coilV: 220, powerContacts: 3, auxNo: 1, auxNc: 1, terminals: 10 },
        { id: 'contactor_4p', name: 'Contactor 4P', icon: '🔌', type: 'contactor', subtype: 'contactor_4p', coilV: 220, powerContacts: 4, auxNo: 1, terminals: 11 },
        { id: 'aux_contact_no', name: 'Aux NO', icon: '➕', type: 'contactor', subtype: 'aux_no', terminals: 2 },
        { id: 'aux_contact_nc', name: 'Aux NC', icon: '➖', type: 'contactor', subtype: 'aux_nc', terminals: 2 }
      ]
    },
    motors: {
      name: 'المحركات',
      icon: '⚙️',
      items: [
        { id: 'dc_motor', name: 'DC Motor', icon: '⚙️', type: 'motor', subtype: 'dc', voltage: 12, power: 10, speed: 3000, terminals: 2 },
        { id: 'ac_motor_1ph', name: 'AC Motor 1Ph', icon: '⚙️', type: 'motor', subtype: 'ac_1ph', voltage: 220, power: 750, speed: 1450, terminals: 3 },
        { id: 'ac_motor_3ph', name: 'AC Motor 3Ph', icon: '⚙️', type: 'motor', subtype: 'ac_3ph', voltage: 380, power: 3000, speed: 1450, terminals: 3 },
        { id: 'servo_motor', name: 'Servo Motor', icon: '🎯', type: 'motor', subtype: 'servo', voltage: 24, torque: 2, terminals: 3 },
        { id: 'stepper_motor', name: 'Stepper Motor', icon: '🔄', type: 'motor', subtype: 'stepper', voltage: 12, steps: 200, terminals: 4 }
      ]
    },
    lighting: {
      name: 'الإضاءة',
      icon: '💡',
      items: [
        { id: 'lamp', name: 'لمبة', icon: '💡', type: 'load', subtype: 'lamp', voltage: 220, power: 60, terminals: 2 },
        { id: 'led_red', name: 'LED أحمر', icon: '🔴', type: 'load', subtype: 'led', color: '#ff0000', vf: 2, current: 0.02, terminals: 2 },
        { id: 'led_green', name: 'LED أخضر', icon: '🟢', type: 'load', subtype: 'led', color: '#00ff00', vf: 2.2, current: 0.02, terminals: 2 },
        { id: 'led_blue', name: 'LED أزرق', icon: '🔵', type: 'load', subtype: 'led', color: '#0066ff', vf: 3, current: 0.02, terminals: 2 },
        { id: 'rgb_led', name: 'RGB LED', icon: '🌈', type: 'load', subtype: 'rgb_led', vf: 3, current: 0.02, terminals: 4 },
        { id: 'indicator_green', name: 'مؤشر أخضر', icon: '🟢', type: 'load', subtype: 'indicator', voltage: 220, terminals: 2 },
        { id: 'indicator_red', name: 'مؤشر أحمر', icon: '🔴', type: 'load', subtype: 'indicator', voltage: 220, terminals: 2 },
        { id: 'buzzer', name: 'طنان', icon: '🔔', type: 'load', subtype: 'buzzer', voltage: 12, terminals: 2 }
      ]
    },
    resistors: {
      name: 'المقاومات',
      icon: '⚡',
      items: [
        { id: 'resistor_100', name: '100Ω', icon: '⚡', type: 'passive', subtype: 'resistor', value: 100, unit: 'Ω', power: 0.25, terminals: 2 },
        { id: 'resistor_1k', name: '1kΩ', icon: '⚡', type: 'passive', subtype: 'resistor', value: 1000, unit: 'Ω', power: 0.25, terminals: 2 },
        { id: 'resistor_10k', name: '10kΩ', icon: '⚡', type: 'passive', subtype: 'resistor', value: 10000, unit: 'Ω', power: 0.25, terminals: 2 },
        { id: 'potentiometer', name: 'مقياس جهد', icon: '🎚️', type: 'passive', subtype: 'pot', value: 10000, unit: 'Ω', terminals: 3 },
        { id: 'ldr', name: 'LDR', icon: '☀️', type: 'passive', subtype: 'ldr', darkR: 1000000, lightR: 1000, terminals: 2 },
        { id: 'ntc', name: 'NTC', icon: '🌡️', type: 'passive', subtype: 'ntc', value: 10000, beta: 3950, terminals: 2 }
      ]
    },
    capacitors: {
      name: 'المكثفات',
      icon: '🔲',
      items: [
        { id: 'capacitor_ceramic', name: 'سيراميك 0.1µF', icon: '🔲', type: 'passive', subtype: 'capacitor', value: 0.1, unit: 'µF', voltage: 50, terminals: 2 },
        { id: 'capacitor_electrolytic', name: 'كيميائي 100µF', icon: '🔲', type: 'passive', subtype: 'capacitor_polar', value: 100, unit: 'µF', voltage: 25, terminals: 2 },
        { id: 'capacitor_1000uf', name: 'كيميائي 1000µF', icon: '🔲', type: 'passive', subtype: 'capacitor_polar', value: 1000, unit: 'µF', voltage: 16, terminals: 2 }
      ]
    },
    inductors: {
      name: 'الملفات',
      icon: '🧲',
      items: [
        { id: 'inductor_10mh', name: 'ملف 10mH', icon: '🧲', type: 'passive', subtype: 'inductor', value: 10, unit: 'mH', terminals: 2 },
        { id: 'inductor_100mh', name: 'ملف 100mH', icon: '🧲', type: 'passive', subtype: 'inductor', value: 100, unit: 'mH', terminals: 2 }
      ]
    },
    diodes: {
      name: 'الدايودات',
      icon: '🔻',
      items: [
        { id: 'diode', name: 'Diode', icon: '🔻', type: 'semiconductor', subtype: 'diode', vf: 0.7, maxI: 1, terminals: 2 },
        { id: 'zener', name: 'Zener 5.1V', icon: '🔻', type: 'semiconductor', subtype: 'zener', vz: 5.1, maxI: 0.5, terminals: 2 },
        { id: 'schottky', name: 'Schottky', icon: '🔻', type: 'semiconductor', subtype: 'schottky', vf: 0.3, maxI: 1, terminals: 2 },
        { id: 'bridge_rectifier', name: 'Bridge Rectifier', icon: '🔶', type: 'semiconductor', subtype: 'bridge', maxI: 2, maxV: 100, terminals: 4 }
      ]
    },
    transistors: {
      name: 'الترانزستورات',
      icon: '🔶',
      items: [
        { id: 'npn', name: 'NPN', icon: '🔶', type: 'semiconductor', subtype: 'npn', beta: 100, vce: 40, ic: 0.5, terminals: 3 },
        { id: 'pnp', name: 'PNP', icon: '🔶', type: 'semiconductor', subtype: 'pnp', beta: 100, vce: 40, ic: 0.5, terminals: 3 },
        { id: 'mosfet_n', name: 'MOSFET N', icon: '🔷', type: 'semiconductor', subtype: 'mosfet_n', vgs: 10, id: 5, terminals: 3 },
        { id: 'mosfet_p', name: 'MOSFET P', icon: '🔷', type: 'semiconductor', subtype: 'mosfet_p', vgs: -10, id: 3, terminals: 3 }
      ]
    },
    ics: {
      name: 'الدوائر المتكاملة',
      icon: '📟',
      items: [
        { id: 'ic_555', name: '555 Timer', icon: '⏱️', type: 'ic', subtype: '555', pins: 8, terminals: 8 },
        { id: 'ic_741', name: '741 OpAmp', icon: '📊', type: 'ic', subtype: 'opamp', pins: 8, terminals: 8 },
        { id: 'ic_lm317', name: 'LM317', icon: '⚡', type: 'ic', subtype: 'regulator', pins: 3, terminals: 3 }
      ]
    },
    logic_gates: {
      name: 'البوابات المنطقية',
      icon: '🚪',
      items: [
        { id: 'gate_and', name: 'AND', icon: '&', type: 'logic', subtype: 'and', inputs: 2, terminals: 3 },
        { id: 'gate_or', name: 'OR', icon: '∨', type: 'logic', subtype: 'or', inputs: 2, terminals: 3 },
        { id: 'gate_not', name: 'NOT', icon: '¬', type: 'logic', subtype: 'not', inputs: 1, terminals: 2 },
        { id: 'gate_nand', name: 'NAND', icon: '⊼', type: 'logic', subtype: 'nand', inputs: 2, terminals: 3 },
        { id: 'gate_nor', name: 'NOR', icon: '⊽', type: 'logic', subtype: 'nor', inputs: 2, terminals: 3 },
        { id: 'gate_xor', name: 'XOR', icon: '⊕', type: 'logic', subtype: 'xor', inputs: 2, terminals: 3 }
      ]
    },
    measurement: {
      name: 'أجهزة القياس',
      icon: '📏',
      items: [
        { id: 'voltmeter', name: 'فولتميتر', icon: '📊', type: 'measurement', subtype: 'voltmeter', range: 1000, terminals: 2 },
        { id: 'ammeter', name: 'أميتر', icon: '📊', type: 'measurement', subtype: 'ammeter', range: 10, terminals: 2 },
        { id: 'multimeter', name: 'ملتيميتر', icon: '📟', type: 'measurement', subtype: 'multimeter', terminals: 2 },
        { id: 'wattmeter', name: 'واطميتر', icon: '💪', type: 'measurement', subtype: 'wattmeter', terminals: 4 }
      ]
    },
    transformers: {
      name: 'المحولات',
      icon: '🔃',
      items: [
        { id: 'transformer_stepdown', name: 'محول خافض', icon: '🔃', type: 'transformer', subtype: 'stepdown', primaryV: 220, secondaryV: 24, power: 500, terminals: 4 },
        { id: 'transformer_stepup', name: 'محول رافع', icon: '🔃', type: 'transformer', subtype: 'stepup', primaryV: 24, secondaryV: 220, power: 200, terminals: 4 },
        { id: 'ct', name: 'Current Transformer', icon: '📐', type: 'transformer', subtype: 'ct', ratio: '100/5', terminals: 4 }
      ]
    },
    terminals_connectors: {
      name: 'التوصيلات',
      icon: '🔗',
      items: [
        { id: 'terminal_block', name: 'طرف توصيل', icon: '🔗', type: 'terminal', subtype: 'terminal', terminals: 2 },
        { id: 'junction', name: 'نقطة توصيل', icon: '●', type: 'terminal', subtype: 'junction', terminals: 1 },
        { id: 'ground', name: 'أرضي', icon: '⏚', type: 'terminal', subtype: 'ground', terminals: 1 },
        { id: 'connector', name: 'موصل', icon: '🔌', type: 'terminal', subtype: 'connector', terminals: 2 }
      ]
    },
    boards: {
      name: 'اللوحات',
      icon: '📋',
      items: [
        { id: 'breadboard', name: 'Breadboard', icon: '📋', type: 'board', subtype: 'breadboard', rows: 30, terminals: 0 },
        { id: 'control_panel', name: 'لوحة تحكم', icon: '🎛️', type: 'board', subtype: 'control_panel', width: 600, height: 400, terminals: 0 }
      ]
    }
  };

  /**
   * Get all components as flat array
   * @returns {Array} All component definitions
   */
  window.getAllComponents = function () {
    const all = [];
    Object.values(window.SIM_COMPONENTS).forEach(function (category) {
      if (category && category.items) {
        all.push.apply(all, category.items);
      }
    });
    return all;
  };

  /**
   * Find component definition by ID
   * @param {string} compId - Component ID to find
   * @returns {Object|null} Component definition or null
   */
  window.findComponentDef = function (compId) {
    if (!compId) return null;
    const all = window.getAllComponents();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === compId) return all[i];
    }
    return null;
  };

  /**
   * Get terminal positions for a component based on terminal count
   * @param {number} terminalCount - Number of terminals
   * @returns {Array} Array of {x, y} positions in percentage
   */
  window.getTerminalPositions = function (terminalCount) {
    if (!terminalCount || terminalCount === 0) return [];
    if (terminalCount === 1) return [{ x: 50, y: 50 }];
    if (terminalCount === 2) return [{ x: 0, y: 50 }, { x: 100, y: 50 }];
    if (terminalCount === 3) return [{ x: 0, y: 30 }, { x: 100, y: 30 }, { x: 50, y: 85 }];
    if (terminalCount === 4) return [{ x: 0, y: 25 }, { x: 100, y: 25 }, { x: 0, y: 75 }, { x: 100, y: 75 }];
    if (terminalCount === 5) return [{ x: 0, y: 20 }, { x: 100, y: 20 }, { x: 0, y: 50 }, { x: 100, y: 50 }, { x: 0, y: 80 }];
    if (terminalCount === 6) return [{ x: 0, y: 15 }, { x: 100, y: 15 }, { x: 0, y: 42 }, { x: 100, y: 42 }, { x: 0, y: 70 }, { x: 100, y: 70 }];
    if (terminalCount === 8) {
      var p = [];
      for (var i = 0; i < 4; i++) { p.push({ x: 0, y: 10 + i * 25 }); p.push({ x: 100, y: 10 + i * 25 }); }
      return p;
    }
    if (terminalCount === 10) {
      var p10 = [];
      for (var j = 0; j < 5; j++) { p10.push({ x: 0, y: 7 + j * 20 }); p10.push({ x: 100, y: 7 + j * 20 }); }
      return p10;
    }
    if (terminalCount === 11) {
      var p11 = [];
      for (var k = 0; k < 5; k++) { p11.push({ x: 0, y: 7 + k * 20 }); p11.push({ x: 100, y: 7 + k * 20 }); }
      p11.push({ x: 50, y: 90 });
      return p11;
    }
    var positions = [];
    for (var m = 0; m < terminalCount; m++) {
      positions.push({
        x: m % 2 === 0 ? 0 : 100,
        y: 10 + Math.floor(m / 2) * (80 / Math.max(1, Math.ceil(terminalCount / 2) - 1))
      });
    }
    return positions;
  };
})();
