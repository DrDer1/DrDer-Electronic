/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-selection.js - Selection Manager
   
   Responsibility:
   - Manage visual selection of components and wires
   - Add/remove CSS classes for selected state
   - Support single and multi-select
   - No event handling (called by SimEvents)
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimSelection - Manages visual selection state
   * Works alongside SimState.selection for data
   */
  window.SimSelection = {

    /**
     * Initialize the selection manager
     */
    init: function () {
      // Nothing to initialize - stateless module
    },

    /* ======================================================================
       Component Selection
       ====================================================================== */

    /**
     * Select a component visually and in state
     * @param {number} id - Component ID
     * @param {boolean} [multi=false] - If true, add to existing selection
     * @param {Array} [components] - Components array from state
     */
    selectComponent: function (id, multi, components) {
      var state = window.SimState;
      if (!state) return;

      if (!multi) {
        this.clearAll(components || state.getComponents());
      }

      // Update state
      state.selectComponent(id, multi);

      // Update visual
      var comp = state.getComponent(id);
      if (comp && comp.el) {
        if (state.isSelected(id)) {
          comp.el.classList.add('selected');
        } else {
          comp.el.classList.remove('selected');
        }
      }

      // Deselect wire
      this._deselectAllWires();
    },

    /**
     * Select a wire visually and in state
     * @param {HTMLElement} wireEl - The wire SVG path element
     */
    selectWire: function (wireEl) {
      var state = window.SimState;
      if (!state) return;

      // Deselect all components
      var comps = state.getComponents();
      for (var i = 0; i < comps.length; i++) {
        if (comps[i].el) comps[i].el.classList.remove('selected');
      }
      state.clearSelection();

      // Deselect all wires
      this._deselectAllWires();

      // Select this wire
      if (wireEl) {
        wireEl.classList.add('selected');
        wireEl.setAttribute('stroke-width', '4');
        wireEl.setAttribute('stroke', '#58a6ff');
      }
    },

    /**
     * Deselect all wires visually
     * @private
     */
    _deselectAllWires: function () {
      var wires = document.querySelectorAll('.sim-wire-path');
      for (var i = 0; i < wires.length; i++) {
        wires[i].classList.remove('selected');
        wires[i].setAttribute('stroke-width', '2.5');
        if (!wires[i].classList.contains('selected')) {
          wires[i].setAttribute('stroke', '#d2991d');
        }
      }
    },

    /* ======================================================================
       Clear Selection
       ====================================================================== */

    /**
     * Clear all selection (components and wires)
     * @param {Array} [components] - Components array from state
     */
    clearAll: function (components) {
      var state = window.SimState;
      if (state) state.clearSelection();

      // Deselect components visually
      var comps = components || (state ? state.getComponents() : []);
      for (var i = 0; i < comps.length; i++) {
        if (comps[i].el) comps[i].el.classList.remove('selected');
      }

      // Deselect wires visually
      this._deselectAllWires();
    },

    /**
     * Remove a component from selection (used when component is deleted)
     * @param {number} id - Component ID to remove
     * @param {Array} [components] - Components array from state
     */
    removeComponent: function (id, components) {
      var state = window.SimState;
      if (!state) return;

      var comps = components || state.getComponents();
      for (var i = 0; i < comps.length; i++) {
        if (comps[i].id === id && comps[i].el) {
          comps[i].el.classList.remove('selected');
          break;
        }
      }
    },

    /* ======================================================================
       Query Selection
       ====================================================================== */

    /**
     * Get IDs of currently selected components
     * @returns {Array<number>}
     */
    getSelectedIds: function () {
      var state = window.SimState;
      return state ? state.getSelectedIds() : [];
    },

    /**
     * Check if a component is selected
     * @param {number} id - Component ID
     * @returns {boolean}
     */
    isSelected: function (id) {
      var state = window.SimState;
      return state ? state.isSelected(id) : false;
    },

    /**
     * Get the number of selected components
     * @returns {number}
     */
    getSelectedCount: function () {
      var state = window.SimState;
      return state ? state.getSelectionCount() : 0;
    },

    /**
     * Get the currently selected wire element
     * @returns {HTMLElement|null}
     */
    getSelectedWire: function () {
      return document.querySelector('.sim-wire-path.selected');
    },

    /* ======================================================================
       Select All
       ====================================================================== */

    /**
     * Select all components on the canvas
     * @param {Array} [components] - Components array from state
     */
    selectAll: function (components) {
      var state = window.SimState;
      if (!state) return;

      var comps = components || state.getComponents();
      state.selection = [];

      for (var i = 0; i < comps.length; i++) {
        state.selection.push(comps[i].id);
        if (comps[i].el) comps[i].el.classList.add('selected');
      }

      this._deselectAllWires();
    }
  };

})();
