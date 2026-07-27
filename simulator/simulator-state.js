/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-state.js - Central State Manager
   
   Responsibility:
   - Single source of truth for all simulator data
   - All modules read/write through this state
   - Manages components, wires, selection, view, history
   - Provides getSnapshot/restoreSnapshot for undo/redo
   - No DOM access, no events, no rendering
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimState - The central state manager for the simulator
   * All data flows through this object
   */
  window.SimState = {

    /* ======================================================================
       Persistent State (saved/restored with projects)
       ====================================================================== */

    /** @type {Array} All placed components on the canvas */
    components: [],

    /** @type {Array} All wire connections between components */
    wires: [],

    /** @type {number} Auto-incrementing ID counter for components */
    componentIdCounter: 0,

    /** @type {number} Auto-incrementing ID counter for wires */
    wireIdCounter: 0,

    /* ======================================================================
       View State
       ====================================================================== */

    /** @type {number} Current zoom level (1 = 100%) */
    zoomLevel: 1,

    /** @type {number} Pan offset X in screen pixels */
    panOffsetX: 0,

    /** @type {number} Pan offset Y in screen pixels */
    panOffsetY: 0,

    /** @type {number} Grid size in pixels */
    gridSize: 20,

    /** @type {boolean} Whether snap-to-grid is enabled */
    snapEnabled: true,

    /* ======================================================================
       Selection State
       ====================================================================== */

    /** @type {Array<number>} IDs of currently selected components */
    selection: [],

    /** @type {number|null} Index of selected wire in wires array, or null */
    selectedWireIndex: null,

    /* ======================================================================
       Simulation State
       ====================================================================== */

    /** @type {boolean} Whether simulation is currently active */
    simulationActive: false,

    /* ======================================================================
       Transient State (temporary, not saved in history or projects)
       ====================================================================== */

    /** @type {Object|null} Active drag operation { compId, startX, startY, origX, origY } */
    dragTarget: null,

    /** @type {Object|null} Active wire creation { compId, termIdx } */
    wireStart: null,

    /* ======================================================================
       Initialization
       ====================================================================== */

    /**
     * Reset all state to initial values
     * Called when starting a new project or clearing the canvas
     */
    reset: function () {
      this.components = [];
      this.wires = [];
      this.componentIdCounter = 0;
      this.wireIdCounter = 0;
      this.zoomLevel = 1;
      this.panOffsetX = 0;
      this.panOffsetY = 0;
      this.gridSize = 20;
      this.snapEnabled = true;
      this.selection = [];
      this.selectedWireIndex = null;
      this.simulationActive = false;
      this.dragTarget = null;
      this.wireStart = null;
    },

    /* ======================================================================
       Component Management
       ====================================================================== */

    /**
     * Add a component to the state
     * @param {string} compId - Component definition ID (e.g., 'battery')
     * @param {number} x - X position in world coordinates
     * @param {number} y - Y position in world coordinates
     * @param {HTMLElement} el - DOM element reference
     * @returns {Object} The created component object
     */
    addComponent: function (compId, x, y, el) {
      var id = ++this.componentIdCounter;

      var component = {
        id: id,
        compId: compId,
        x: x,
        y: y,
        el: el,
        rotation: 0,
        properties: {},
        compState: {
          active: false,
          energized: false,
          closed: false,
          pressed: false,
          tripped: false,
          timerElapsed: false
        }
      };

      this.components.push(component);
      return component;
    },

    /**
     * Remove a component by ID
     * Also removes all wires connected to this component
     * @param {number} id - Component ID to remove
     * @returns {boolean} True if component was found and removed
     */
    removeComponent: function (id) {
      var index = this._findComponentIndex(id);
      if (index === -1) return false;

      // Remove the component
      this.components.splice(index, 1);

      // Remove all connected wires
      this.wires = this.wires.filter(function (wire) {
        return wire.fromCompId !== id && wire.toCompId !== id;
      });

      // Remove from selection
      this.selection = this.selection.filter(function (selId) {
        return selId !== id;
      });

      return true;
    },

    /**
     * Get a component by ID
     * @param {number} id - Component ID
     * @returns {Object|null} The component or null
     */
    getComponent: function (id) {
      var index = this._findComponentIndex(id);
      return index !== -1 ? this.components[index] : null;
    },

    /**
     * Update a component's position
     * @param {number} id - Component ID
     * @param {number} x - New X position
     * @param {number} y - New Y position
     */
    updateComponentPosition: function (id, x, y) {
      var comp = this.getComponent(id);
      if (comp) {
        comp.x = x;
        comp.y = y;
      }
    },

    /**
     * Find component index in the array
     * @private
     * @param {number} id - Component ID
     * @returns {number} Index or -1 if not found
     */
    _findComponentIndex: function (id) {
      for (var i = 0; i < this.components.length; i++) {
        if (this.components[i].id === id) return i;
      }
      return -1;
    },

    /**
     * Get all components
     * @returns {Array} Copy of components array
     */
    getComponents: function () {
      return this.components;
    },

    /**
     * Get the number of placed components
     * @returns {number} Component count
     */
    getComponentCount: function () {
      return this.components.length;
    },

    /* ======================================================================
       Wire Management
       ====================================================================== */

    /**
     * Add a wire connection between two terminals
     * @param {number} fromCompId - Source component ID
     * @param {number} fromTerminal - Source terminal index
     * @param {number} toCompId - Target component ID
     * @param {number} toTerminal - Target terminal index
     * @returns {Object} The created wire object
     */
    addWire: function (fromCompId, fromTerminal, toCompId, toTerminal) {
      // Check for duplicate
      var exists = this._findWire(fromCompId, fromTerminal, toCompId, toTerminal);
      if (exists) return null;

      var id = ++this.wireIdCounter;

      var wire = {
        id: id,
        fromCompId: fromCompId,
        fromTerminal: fromTerminal,
        toCompId: toCompId,
        toTerminal: toTerminal
      };

      this.wires.push(wire);
      return wire;
    },

    /**
     * Remove a wire by ID
     * @param {number} id - Wire ID
     * @returns {boolean} True if removed
     */
    removeWire: function (id) {
      for (var i = 0; i < this.wires.length; i++) {
        if (this.wires[i].id === id) {
          this.wires.splice(i, 1);
          if (this.selectedWireIndex === i) this.selectedWireIndex = null;
          return true;
        }
      }
      return false;
    },

    /**
     * Remove a wire by connection details
     * @param {number} fromCompId
     * @param {number} fromTerminal
     * @param {number} toCompId
     * @param {number} toTerminal
     * @returns {boolean} True if removed
     */
    removeWireByConnection: function (fromCompId, fromTerminal, toCompId, toTerminal) {
      for (var i = 0; i < this.wires.length; i++) {
        var w = this.wires[i];
        if ((w.fromCompId === fromCompId && w.fromTerminal === fromTerminal &&
             w.toCompId === toCompId && w.toTerminal === toTerminal) ||
            (w.fromCompId === toCompId && w.fromTerminal === toTerminal &&
             w.toCompId === fromCompId && w.toTerminal === fromTerminal)) {
          this.wires.splice(i, 1);
          if (this.selectedWireIndex === i) this.selectedWireIndex = null;
          return true;
        }
      }
      return false;
    },

    /**
     * Remove all wires connected to a component
     * @param {number} compId - Component ID
     */
    removeWiresForComponent: function (compId) {
      this.wires = this.wires.filter(function (wire) {
        return wire.fromCompId !== compId && wire.toCompId !== compId;
      });
    },

    /**
     * Find a wire by connection details
     * @private
     * @returns {Object|null} Wire object or null
     */
    _findWire: function (fromCompId, fromTerminal, toCompId, toTerminal) {
      for (var i = 0; i < this.wires.length; i++) {
        var w = this.wires[i];
        if ((w.fromCompId === fromCompId && w.fromTerminal === fromTerminal &&
             w.toCompId === toCompId && w.toTerminal === toTerminal) ||
            (w.fromCompId === toCompId && w.fromTerminal === toTerminal &&
             w.toCompId === fromCompId && w.toTerminal === fromTerminal)) {
          return w;
        }
      }
      return null;
    },

    /**
     * Get all wires
     * @returns {Array} Copy of wires array
     */
    getWires: function () {
      return this.wires;
    },

    /**
     * Get wire count
     * @returns {number} Number of wires
     */
    getWireCount: function () {
      return this.wires.length;
    },

    /* ======================================================================
       Selection Management
       ====================================================================== */

    /**
     * Select a component (replaces current selection unless multi)
     * @param {number} id - Component ID
     * @param {boolean} [multi=false] - If true, adds to existing selection
     */
    selectComponent: function (id, multi) {
      if (!multi) {
        this.selection = [];
        this.selectedWireIndex = null;
      }

      var idx = this.selection.indexOf(id);
      if (idx !== -1 && multi) {
        this.selection.splice(idx, 1);
      } else if (idx === -1) {
        this.selection.push(id);
      }
    },

    /**
     * Select a wire by index
     * @param {number} index - Wire index in wires array
     */
    selectWire: function (index) {
      this.selection = [];
      this.selectedWireIndex = index;
    },

    /**
     * Clear all selections
     */
    clearSelection: function () {
      this.selection = [];
      this.selectedWireIndex = null;
    },

    /**
     * Get selected component IDs
     * @returns {Array<number>}
     */
    getSelectedIds: function () {
      return this.selection.slice();
    },

    /**
     * Check if a component is selected
     * @param {number} id - Component ID
     * @returns {boolean}
     */
    isSelected: function (id) {
      return this.selection.indexOf(id) !== -1;
    },

    /**
     * Get selected wire index
     * @returns {number|null}
     */
    getSelectedWireIndex: function () {
      return this.selectedWireIndex;
    },

    /**
     * Get selection count
     * @returns {number}
     */
    getSelectionCount: function () {
      return this.selection.length;
    },

    /* ======================================================================
       View State Management
       ====================================================================== */

    /**
     * Set zoom level
     * @param {number} level - Zoom level (0.2 to 5)
     */
    setZoom: function (level) {
      this.zoomLevel = Math.max(0.2, Math.min(5, level));
    },

    /**
     * Set pan offset
     * @param {number} x - Pan X
     * @param {number} y - Pan Y
     */
    setPan: function (x, y) {
      this.panOffsetX = x;
      this.panOffsetY = y;
    },

    /**
     * Toggle snap to grid
     * @returns {boolean} New snap state
     */
    toggleSnap: function () {
      this.snapEnabled = !this.snapEnabled;
      return this.snapEnabled;
    },

    /**
     * Set grid size
     * @param {number} size - Grid size in pixels
     */
    setGridSize: function (size) {
      this.gridSize = Math.max(5, Math.min(100, size));
    },

    /* ======================================================================
       Transient State Management
       ====================================================================== */

    /**
     * Set drag target
     * @param {Object} target - { compId, startX, startY, origX, origY }
     */
    setDragTarget: function (target) {
      this.dragTarget = target;
    },

    /**
     * Clear drag target
     */
    clearDragTarget: function () {
      this.dragTarget = null;
    },

    /**
     * Check if currently dragging
     * @returns {boolean}
     */
    isDragging: function () {
      return this.dragTarget !== null;
    },

    /**
     * Set wire start
     * @param {Object} start - { compId, termIdx }
     */
    setWireStart: function (start) {
      this.wireStart = start;
    },

    /**
     * Clear wire start
     */
    clearWireStart: function () {
      this.wireStart = null;
    },

    /**
     * Check if currently creating a wire
     * @returns {boolean}
     */
    isCreatingWire: function () {
      return this.wireStart !== null;
    },

    /* ======================================================================
       Simulation State
       ====================================================================== */

    /**
     * Set simulation active state
     * @param {boolean} active
     */
    setSimulationActive: function (active) {
      this.simulationActive = active;
    },

    /**
     * Reset all component states (de-energize everything)
     */
    resetComponentStates: function () {
      for (var i = 0; i < this.components.length; i++) {
        this.components[i].compState.active = false;
        this.components[i].compState.energized = false;
        this.components[i].compState.timerElapsed = false;
      }
    },

    /* ======================================================================
       History / Snapshot
       ====================================================================== */

    /**
     * Create a serializable snapshot of the current state
     * Excludes transient state and DOM references
     * @returns {Object} Snapshot object
     */
    getSnapshot: function () {
      return {
        components: this.components.map(function (c) {
          return {
            id: c.id,
            compId: c.compId,
            x: c.x,
            y: c.y,
            rotation: c.rotation,
            properties: window.SimUtils ? window.SimUtils.clone(c.properties) : c.properties
          };
        }),
        wires: window.SimUtils ? window.SimUtils.clone(this.wires) : this.wires.slice(),
        componentIdCounter: this.componentIdCounter,
        wireIdCounter: this.wireIdCounter,
        zoomLevel: this.zoomLevel,
        panOffsetX: this.panOffsetX,
        panOffsetY: this.panOffsetY,
        gridSize: this.gridSize,
        snapEnabled: this.snapEnabled
      };
    },

    /**
     * Restore state from a snapshot
     * Clears current state and replaces with snapshot data
     * @param {Object} snapshot - Snapshot object from getSnapshot()
     */
    restoreSnapshot: function (snapshot) {
      if (!snapshot) return;

      this.components = snapshot.components.map(function (c) {
        return {
          id: c.id,
          compId: c.compId,
          x: c.x,
          y: c.y,
          el: null, // Will be recreated by the renderer
          rotation: c.rotation || 0,
          properties: c.properties || {},
          compState: {
            active: false,
            energized: false,
            closed: false,
            pressed: false,
            tripped: false,
            timerElapsed: false
          }
        };
      });

      this.wires = snapshot.wires || [];
      this.componentIdCounter = snapshot.componentIdCounter || 0;
      this.wireIdCounter = snapshot.wireIdCounter || 0;
      this.zoomLevel = snapshot.zoomLevel || 1;
      this.panOffsetX = snapshot.panOffsetX || 0;
      this.panOffsetY = snapshot.panOffsetY || 0;
      this.gridSize = snapshot.gridSize || 20;
      this.snapEnabled = snapshot.snapEnabled !== undefined ? snapshot.snapEnabled : true;

      this.selection = [];
      this.selectedWireIndex = null;
      this.simulationActive = false;
      this.dragTarget = null;
      this.wireStart = null;
    },

    /* ======================================================================
       Terminal Position Helper
       ====================================================================== */

    /**
     * Get the world position of a specific terminal on a component
     * @param {Object} component - The component object
     * @param {number} terminalIndex - Which terminal
     * @returns {{x: number, y: number}} Terminal position in world coords
     */
    getTerminalWorldPosition: function (component, terminalIndex) {
      if (!component || !component.el) return { x: component.x, y: component.y };

      var def = window.findComponentDef(component.compId);
      var terminalCount = def ? def.terminals : 2;
      var positions = window.getTerminalPositions(terminalCount);
      var pos = positions[terminalIndex] || positions[0];

      return {
        x: component.x + (pos.x / 100) * component.el.offsetWidth,
        y: component.y + (pos.y / 100) * component.el.offsetHeight
      };
    }
  };

})();
