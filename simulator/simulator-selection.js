/* ==========================================================================
   DrDer Electronic - Simulator Selection
   Handles component and wire selection
   ========================================================================== */
(function () {
  'use strict';

  window.SimSelection = {
    _selectedComponents: [],
    _selectedWire: null,
    _onSelectionChange: null,

    /* ========================================================================
       Initialize
       ======================================================================== */
    init() {
      this._selectedComponents = [];
      this._selectedWire = null;
    },

    /* ========================================================================
       Select a component
       ======================================================================== */
    selectComponent(id, addToSelection, components) {
      if (!addToSelection) {
        this.clearComponentSelection();
      }

      const comp = components.find(c => c.id === id);
      if (!comp) return;

      if (addToSelection && this._selectedComponents.includes(id)) {
        this._selectedComponents = this._selectedComponents.filter(sid => sid !== id);
        if (comp.el) comp.el.classList.remove('selected');
      } else {
        if (!this._selectedComponents.includes(id)) {
          this._selectedComponents.push(id);
        }
        if (comp.el) comp.el.classList.add('selected');
      }

      this.clearWireSelection();

      if (this._onSelectionChange) {
        this._onSelectionChange(this._selectedComponents, this._selectedWire);
      }
    },

    /* ========================================================================
       Select a wire
       ======================================================================== */
    selectWire(wireEl) {
      this.clearComponentSelection();
      this.clearWireSelection();

      if (wireEl) {
        wireEl.classList.add('selected');
        this._selectedWire = wireEl;
      }

      if (this._onSelectionChange) {
        this._onSelectionChange(this._selectedComponents, this._selectedWire);
      }
    },

    /* ========================================================================
       Clear selections
       ======================================================================== */
    clearComponentSelection(components) {
      this._selectedComponents.forEach(id => {
        if (components) {
          const comp = components.find(c => c.id === id);
          if (comp && comp.el) comp.el.classList.remove('selected');
        }
      });
      this._selectedComponents = [];
    },

    clearWireSelection() {
      if (this._selectedWire) {
        this._selectedWire.classList.remove('selected');
        this._selectedWire = null;
      }
    },

    clearAll(components) {
      this.clearComponentSelection(components);
      this.clearWireSelection();

      if (this._onSelectionChange) {
        this._onSelectionChange([], null);
      }
    },

    /* ========================================================================
       Getters
       ======================================================================== */
    getSelectedIds() {
      return [...this._selectedComponents];
    },

    getSelectedWire() {
      return this._selectedWire;
    },

    isSelected(id) {
      return this._selectedComponents.includes(id);
    },

    hasSelection() {
      return this._selectedComponents.length > 0 || this._selectedWire !== null;
    },

    getSelectedCount() {
      return this._selectedComponents.length;
    },

    /* ========================================================================
       Remove from selection
       ======================================================================== */
    removeComponent(id, components) {
      this._selectedComponents = this._selectedComponents.filter(sid => sid !== id);
      const comp = components ? components.find(c => c.id === id) : null;
      if (comp && comp.el) comp.el.classList.remove('selected');

      if (this._onSelectionChange) {
        this._onSelectionChange(this._selectedComponents, this._selectedWire);
      }
    },

    /* ========================================================================
       Select all
       ======================================================================== */
    selectAll(components) {
      this.clearComponentSelection();
      this.clearWireSelection();

      components.forEach(comp => {
        this._selectedComponents.push(comp.id);
        if (comp.el) comp.el.classList.add('selected');
      });

      if (this._onSelectionChange) {
        this._onSelectionChange(this._selectedComponents, this._selectedWire);
      }
    },

    /* ========================================================================
       Callback
       ======================================================================== */
    onSelectionChange(cb) {
      this._onSelectionChange = cb;
    }
  };
})();
