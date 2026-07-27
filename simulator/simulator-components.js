/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-components.js - Component Library
   
   Responsibility:
   - Define all electronic/electrical components with their properties
   - Provide lookup functions for components
   - No DOM manipulation, no events, no state
   - Pure data definitions only
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SIM_COMPONENTS - Complete component library
   * Organized by categories
   * Each component has:
   *   id        - Unique identifier
   *   name      - Arabic display name
   *   icon      - Emoji icon for UI
   *   type      - Component type (source, load, switch, etc.)
   *   subtype   - Specific subtype
   *   terminals - Number of connection points
   *   voltage   - Rated voltage (if applicable)
   *   current   - Rated current (if applicable)
   *   power     - Rated power (if applicable)
   *   Additional type-specific properties
   */
  window.SIM_COMPONENTS = {

    /* ======================================================================
       Power Sources - مصادر الطاقة
       ====================================================================== */
    power_sources: {
      name: 'مصادر الطاقة',
      icon: '🔋',
      items: [
        { id: 'battery',       name: 'بطارية 12V',        icon: '🔋', type: 'source', subtype: 'battery',     voltage: 12,  current: 5,   terminals: 2 },
        { id: 'battery_9v',    name: 'بطارية 9V',         icon: '🔋', type: 'source', subtype: 'battery',     voltage: 9,   current: 1,   terminals: 2 },
        { id: 'dc_supply',     name: 'مصدر DC',           icon: '⎓',  type: 'source', subtype: 'dc',          voltage: 24,  current: 10,  terminals: 2 },
        { id: 'ac_supply_1ph', name: 'مصدر AC أحادي',     icon: '∿',  type: 'source', subtype: 'ac_1ph',      voltage: 220, current: 16,  terminals: 2, frequency: 50 },
        { id: 'ac_supply_3ph', name: 'مصدر AC ثلاثي',     icon: '⚡', type: 'source', subtype: 'ac_3ph',      voltage: 380, current: 32,  terminals: 4, frequency: 50 },
        { id: 'generator',     name: 'مولد',              icon: '⚙️', type: 'source', subtype: 'generator',   voltage: 220, power: 3000,  terminals: 3 },
        { id: 'solar_panel',   name: 'لوح شمسي',          icon: '☀️', type: 'source', subtype: 'solar',       voltage: 24,  power: 300,   terminals: 2 }
      ]
    },

    /* ======================================================================
       Protection Devices - الحماية
       ====================================================================== */
    protection: {
      name: 'الحماية',
      icon: '🛡️',
      items: [
        { id: 'fuse',         name: 'فيوز',            icon: '🔗', type: 'protection', subtype: 'fuse',     current: 10,  terminals: 2 },
        { id: 'mcb',          name: 'MCB',              icon: '🔒', type: 'protection', subtype: 'mcb',      current: 16,  terminals: 2 },
        { id: 'mccb',         name: 'MCCB',             icon: '🔐', type: 'protection', subtype: 'mccb',     current: 100, terminals: 3 },
        { id: 'rccb',         name: 'RCCB',             icon: '🛡️', type: 'protection', subtype: 'rccb',     current: 40,  terminals: 4 },
        { id: 'rcbo',         name: 'RCBO',             icon: '⚡', type: 'protection', subtype: 'rcbo',     current: 16,  terminals: 4 },
        { id: 'overload',     name: 'Overload Relay',   icon: '🔴', type: 'protection', subtype: 'overload', current: 10,  terminals: 3 }
      ]
    },

    /* ======================================================================
       Switches - المفاتيح
       ====================================================================== */
    switches: {
      name: 'المفاتيح',
      icon: '🔘',
      items: [
        { id: 'switch_spst',     name: 'مفتاح SPST',       icon: '🔘', type: 'switch', subtype: 'spst',       terminals: 2 },
        { id: 'switch_spdt',     name: 'مفتاح SPDT',       icon: '🔀', type: 'switch', subtype: 'spdt',       terminals: 3 },
        { id: 'push_no',         name: 'Push Button NO',   icon: '🟢', type: 'switch', subtype: 'push_no',    terminals: 2 },
        { id: 'push_nc',         name: 'Push Button NC',   icon: '🔴', type: 'switch', subtype: 'push_nc',    terminals: 2 },
        { id: 'emergency_stop',  name: 'Emergency Stop',   icon: '⛔', type: 'switch', subtype: 'emergency',  terminals: 2 },
        { id: 'limit_switch',    name: 'Limit Switch',     icon: '↔️', type: 'switch', subtype: 'limit',      terminals: 2 },
        { id: 'selector_2',      name: 'Selector Switch',  icon: '🎛️', type: 'switch', subtype: 'selector',   terminals: 3 }
      ]
    },

    /* ======================================================================
       Relays and Contactors - الريليهات والكونتاكتورات
       ====================================================================== */
    relays: {
      name: 'الريليهات والكونتاكتورات',
      icon: '🔀',
      items: [
        { id: 'relay',        name: 'Relay',           icon: '🔀', type: 'relay',    subtype: 'relay',      coilV: 24,  terminals: 5 },
        { id: 'contactor',    name: 'Contactor',       icon: '🔌', type: 'contactor',subtype: 'contactor',  coilV: 220, terminals: 6 },
        { id: 'timer_on',     name: 'Timer ON Delay',  icon: '⏱️', type: 'relay',    subtype: 'timer_on',   coilV: 24,  terminals: 4, delay: 5 },
        { id: 'timer_off',    name: 'Timer OFF Delay', icon: '⏲️', type: 'relay',    subtype: 'timer_off',  coilV: 24,  terminals: 4, delay: 5 },
        { id: 'ssr',          name: 'Solid State Relay',icon:'⚡', type: 'relay',    subtype: 'ssr',        coilV: 5,   terminals: 4 }
      ]
    },

    /* ======================================================================
       Motors - المحركات
       ====================================================================== */
    motors: {
      name: 'المحركات',
      icon: '⚙️',
      items: [
        { id: 'dc_motor',     name: 'DC Motor',        icon: '⚙️', type: 'motor', subtype: 'dc',       voltage: 12,  power: 10,   terminals: 2 },
        { id: 'ac_motor_1ph', name: 'AC Motor 1 Phase',icon: '⚙️', type: 'motor', subtype: 'ac_1ph',   voltage: 220, power: 750,  terminals: 2 },
        { id: 'ac_motor_3ph', name: 'AC Motor 3 Phase',icon: '⚙️', type: 'motor', subtype: 'ac_3ph',   voltage: 380, power: 3000, terminals: 3 }
      ]
    },

    /* ======================================================================
       Lighting - الإضاءة والمؤشرات
       ====================================================================== */
    lighting: {
      name: 'الإضاءة والمؤشرات',
      icon: '💡',
      items: [
        { id: 'lamp',           name: 'لمبة',           icon: '💡', type: 'load', subtype: 'lamp',      voltage: 220, power: 60,  terminals: 2 },
        { id: 'led_red',        name: 'LED أحمر',       icon: '🔴', type: 'load', subtype: 'led',       vf: 2.0,      current: 0.02, terminals: 2 },
        { id: 'led_green',      name: 'LED أخضر',       icon: '🟢', type: 'load', subtype: 'led',       vf: 2.2,      current: 0.02, terminals: 2 },
        { id: 'indicator_green',name: 'مؤشر أخضر',      icon: '🟢', type: 'load', subtype: 'indicator', voltage: 220, terminals: 2 },
        { id: 'indicator_red',  name: 'مؤشر أحمر',      icon: '🔴', type: 'load', subtype: 'indicator', voltage: 220, terminals: 2 },
        { id: 'buzzer',         name: 'طنان',           icon: '🔔', type: 'load', subtype: 'buzzer',    voltage: 12,  terminals: 2 }
      ]
    },

    /* ======================================================================
       Resistors - المقاومات
       ====================================================================== */
    resistors: {
      name: 'المقاومات',
      icon: '⚡',
      items: [
        { id: 'resistor_100',  name: 'مقاومة 100Ω',    icon: '⚡', type: 'passive', subtype: 'resistor', value: 100,    unit: 'Ω', terminals: 2 },
        { id: 'resistor_1k',   name: 'مقاومة 1kΩ',     icon: '⚡', type: 'passive', subtype: 'resistor', value: 1000,   unit: 'Ω', terminals: 2 },
        { id: 'resistor_10k',  name: 'مقاومة 10kΩ',    icon: '⚡', type: 'passive', subtype: 'resistor', value: 10000,  unit: 'Ω', terminals: 2 },
        { id: 'potentiometer', name: 'مقياس جهد',      icon: '🎚️', type: 'passive', subtype: 'pot',      value: 10000,  unit: 'Ω', terminals: 3 },
        { id: 'ldr',           name: 'LDR مقاومة ضوئية',icon:'☀️', type: 'passive', subtype: 'ldr',      value: 10000,  unit: 'Ω', terminals: 2 }
      ]
    },

    /* ======================================================================
       Capacitors - المكثفات
       ====================================================================== */
    capacitors: {
      name: 'المكثفات',
      icon: '🔲',
      items: [
        { id: 'capacitor_ceramic',  name: 'مكثف سيراميك',     icon: '🔲', type: 'passive', subtype: 'capacitor', value: 0.1,  unit: 'µF', terminals: 2 },
        { id: 'capacitor_electro',  name: 'مكثف كيميائي',     icon: '🔲', type: 'passive', subtype: 'capacitor', value: 100,  unit: 'µF', terminals: 2 },
        { id: 'capacitor_1000uf',   name: 'مكثف 1000µF',      icon: '🔲', type: 'passive', subtype: 'capacitor', value: 1000, unit: 'µF', terminals: 2 }
      ]
    },

    /* ======================================================================
       Inductors - الملفات
       ====================================================================== */
    inductors: {
      name: 'الملفات',
      icon: '🧲',
      items: [
        { id: 'inductor_10mh',  name: 'ملف 10mH',  icon: '🧲', type: 'passive', subtype: 'inductor', value: 10,  unit: 'mH', terminals: 2 },
        { id: 'inductor_100mh', name: 'ملف 100mH', icon: '🧲', type: 'passive', subtype: 'inductor', value: 100, unit: 'mH', terminals: 2 }
      ]
    },

    /* ======================================================================
       Diodes - الدايودات
       ====================================================================== */
    diodes: {
      name: 'الدايودات',
      icon: '🔻',
      items: [
        { id: 'diode',            name: 'Diode',            icon: '🔻', type: 'semiconductor', subtype: 'diode',  vf: 0.7, terminals: 2 },
        { id: 'zener',            name: 'Zener 5.1V',      icon: '🔻', type: 'semiconductor', subtype: 'zener',  vz: 5.1, terminals: 2 },
        { id: 'bridge_rectifier', name: 'Bridge Rectifier', icon: '🔶', type: 'semiconductor', subtype: 'bridge', terminals: 4 }
      ]
    },

    /* ======================================================================
       Transistors - الترانزستورات
       ====================================================================== */
    transistors: {
      name: 'الترانزستورات',
      icon: '🔶',
      items: [
        { id: 'npn',     name: 'NPN ترانزستور', icon: '🔶', type: 'semiconductor', subtype: 'npn',     terminals: 3 },
        { id: 'pnp',     name: 'PNP ترانزستور', icon: '🔶', type: 'semiconductor', subtype: 'pnp',     terminals: 3 },
        { id: 'mosfet_n',name: 'MOSFET N',       icon: '🔷', type: 'semiconductor', subtype: 'mosfet_n',terminals: 3 }
      ]
    },

    /* ======================================================================
       Integrated Circuits - الدوائر المتكاملة
       ====================================================================== */
    ics: {
      name: 'الدوائر المتكاملة',
      icon: '📟',
      items: [
        { id: 'ic_555', name: '555 Timer',  icon: '⏱️', type: 'ic', subtype: '555',    terminals: 8 },
        { id: 'ic_741', name: '741 Op-Amp', icon: '📊', type: 'ic', subtype: 'opamp',  terminals: 8 }
      ]
    },

    /* ======================================================================
       Logic Gates - البوابات المنطقية
       ====================================================================== */
    logic_gates: {
      name: 'البوابات المنطقية',
      icon: '🚪',
      items: [
        { id: 'gate_and',  name: 'AND',  icon: '&',  type: 'logic', subtype: 'and',  terminals: 3 },
        { id: 'gate_or',   name: 'OR',   icon: '∨',  type: 'logic', subtype: 'or',   terminals: 3 },
        { id: 'gate_not',  name: 'NOT',  icon: '¬',  type: 'logic', subtype: 'not',  terminals: 2 },
        { id: 'gate_nand', name: 'NAND', icon: '⊼',  type: 'logic', subtype: 'nand', terminals: 3 },
        { id: 'gate_nor',  name: 'NOR',  icon: '⊽',  type: 'logic', subtype: 'nor',  terminals: 3 },
        { id: 'gate_xor',  name: 'XOR',  icon: '⊕',  type: 'logic', subtype: 'xor',  terminals: 3 }
      ]
    },

    /* ======================================================================
       Measurement - أجهزة القياس
       ====================================================================== */
    measurement: {
      name: 'أجهزة القياس',
      icon: '📏',
      items: [
        { id: 'voltmeter',  name: 'فولتميتر',  icon: '📊', type: 'measurement', subtype: 'voltmeter',  terminals: 2 },
        { id: 'ammeter',    name: 'أميتر',      icon: '📊', type: 'measurement', subtype: 'ammeter',    terminals: 2 },
        { id: 'multimeter', name: 'ملتيميتر',   icon: '📟', type: 'measurement', subtype: 'multimeter', terminals: 2 }
      ]
    },

    /* ======================================================================
       Transformers - المحولات
       ====================================================================== */
    transformers: {
      name: 'المحولات',
      icon: '🔃',
      items: [
        { id: 'transformer_stepdown', name: 'محول خافض', icon: '🔃', type: 'transformer', subtype: 'stepdown', primaryV: 220, secondaryV: 24, terminals: 4 },
        { id: 'transformer_stepup',   name: 'محول رافع', icon: '🔃', type: 'transformer', subtype: 'stepup',   primaryV: 24,  secondaryV: 220,terminals: 4 }
      ]
    },

    /* ======================================================================
       Terminals & Connectors - أطراف التوصيل
       ====================================================================== */
    terminals_connectors: {
      name: 'أطراف التوصيل',
      icon: '🔗',
      items: [
        { id: 'terminal',  name: 'طرف توصيل',    icon: '🔗', type: 'terminal', subtype: 'terminal',  terminals: 2 },
        { id: 'junction',  name: 'نقطة توصيل',   icon: '●',  type: 'terminal', subtype: 'junction',  terminals: 1 },
        { id: 'ground',    name: 'أرضي',         icon: '⏚', type: 'terminal', subtype: 'ground',    terminals: 1 }
      ]
    },

    /* ======================================================================
       Boards - اللوحات
       ====================================================================== */
    boards: {
      name: 'اللوحات',
      icon: '📋',
      items: [
        { id: 'breadboard',     name: 'Breadboard',    icon: '📋', type: 'board', subtype: 'breadboard',     terminals: 0 },
        { id: 'control_panel',  name: 'لوحة تحكم',     icon: '🎛️', type: 'board', subtype: 'control_panel',  terminals: 0 }
      ]
    }
  };

  /* ======================================================================
     Public API
     ====================================================================== */

  /**
   * Get all components as a flat array
   * Iterates through all categories and collects all items
   * @returns {Array} Flat array of all component definitions
   */
  window.getAllComponents = function () {
    var all = [];
    var categories = window.SIM_COMPONENTS;

    for (var catKey in categories) {
      if (!Object.prototype.hasOwnProperty.call(categories, catKey)) continue;
      var category = categories[catKey];
      if (!category || !category.items) continue;

      for (var i = 0; i < category.items.length; i++) {
        all.push(category.items[i]);
      }
    }

    return all;
  };

  /**
   * Find a component definition by its ID
   * @param {string} compId - The component ID to find
   * @returns {Object|null} Component definition or null if not found
   */
  window.findComponentDef = function (compId) {
    if (!compId) return null;

    var all = window.getAllComponents();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === compId) {
        return all[i];
      }
    }

    return null;
  };

  /**
   * Get terminal positions for a given number of terminals
   * Returns array of {x, y} objects with values in percentage (0-100)
   * These define where connection points appear on the component
   * @param {number} terminalCount - Number of terminals
   * @returns {Array<{x: number, y: number}>} Terminal positions in percentage
   */
  window.getTerminalPositions = function (terminalCount) {
    if (!terminalCount || terminalCount <= 0) return [];
    if (terminalCount === 1) return [{ x: 50, y: 50 }];
    if (terminalCount === 2) return [{ x: 0, y: 50 }, { x: 100, y: 50 }];
    if (terminalCount === 3) return [{ x: 0, y: 30 }, { x: 100, y: 30 }, { x: 50, y: 85 }];
    if (terminalCount === 4) return [{ x: 0, y: 25 }, { x: 100, y: 25 }, { x: 0, y: 75 }, { x: 100, y: 75 }];
    if (terminalCount === 5) return [{ x: 0, y: 20 }, { x: 100, y: 20 }, { x: 0, y: 50 }, { x: 100, y: 50 }, { x: 50, y: 85 }];
    if (terminalCount === 6) return [{ x: 0, y: 15 }, { x: 100, y: 15 }, { x: 0, y: 42 }, { x: 100, y: 42 }, { x: 0, y: 70 }, { x: 100, y: 70 }];
    if (terminalCount === 8) {
      var p = [];
      for (var i = 0; i < 4; i++) { p.push({ x: 0, y: 10 + i * 26 }); p.push({ x: 100, y: 10 + i * 26 }); }
      return p;
    }

    // Generic distribution for any count
    var positions = [];
    for (var j = 0; j < terminalCount; j++) {
      positions.push({
        x: j % 2 === 0 ? 0 : 100,
        y: 10 + Math.floor(j / 2) * (80 / Math.max(1, Math.ceil(terminalCount / 2) - 1))
      });
    }
    return positions;
  };

  /**
   * Get all category names with their icons
   * @returns {Array<{key: string, name: string, icon: string, count: number}>}
   */
  window.getCategories = function () {
    var categories = window.SIM_COMPONENTS;
    var result = [];

    for (var catKey in categories) {
      if (!Object.prototype.hasOwnProperty.call(categories, catKey)) continue;
      var cat = categories[catKey];
      result.push({
        key: catKey,
        name: cat.name,
        icon: cat.icon,
        count: cat.items ? cat.items.length : 0
      });
    }

    return result;
  };

})();
