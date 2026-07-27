/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-history.js - Undo/Redo Manager
   
   Responsibility:
   - Maintain a stack of state snapshots
   - Support undo and redo operations
   - No DOM access, no events, pure data management
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimHistory - Manages undo and redo functionality
   * Stores snapshots of SimState
   */
  window.SimHistory = {

    /** @type {Array<string>} Stack of JSON-stringified state snapshots */
    _undoStack: [],

    /** @type {Array<string>} Stack of JSON-stringified state snapshots for redo */
    _redoStack: [],

    /** @type {number} Maximum number of undo steps */
    _maxUndo: 100,

    /* ======================================================================
       Initialization
       ====================================================================== */

    /**
     * Initialize the history manager
     * Clears all existing history
     */
    init: function () {
      this._undoStack = [];
      this._redoStack = [];
      this._updateButtons();
    },

    /* ======================================================================
       Push State
       ====================================================================== */

    /**
     * Push a snapshot of the current state onto the undo stack
     * Called before any state-modifying operation
     * @param {Object} snapshot - State snapshot from SimState.getSnapshot()
     */
    push: function (snapshot) {
      if (!snapshot) return;

      var json = JSON.stringify(snapshot);
      this._undoStack.push(json);

      // Limit stack size
      if (this._undoStack.length > this._maxUndo) {
        this._undoStack.shift();
      }

      // Clear redo stack when new action is performed
      this._redoStack = [];

      this._updateButtons();
    },

    /* ======================================================================
       Undo
       ====================================================================== */

    /**
     * Undo the last operation
     * Moves current state to redo stack and restores previous state
     * @param {Function} getCurrentSnapshot - Function that returns current state snapshot
     * @param {Function} restoreSnapshot - Function that restores a snapshot
     * @returns {boolean} True if undo was performed
     */
    undo: function (getCurrentSnapshot, restoreSnapshot) {
      if (this._undoStack.length === 0) return false;

      // Save current state to redo stack
      var currentSnapshot = getCurrentSnapshot();
      if (currentSnapshot) {
        this._redoStack.push(JSON.stringify(currentSnapshot));
      }

      // Restore previous state
      var prevJson = this._undoStack.pop();
      var prevSnapshot = window.SimUtils ? window.SimUtils.safeJSONParse(prevJson) : JSON.parse(prevJson);

      if (prevSnapshot) {
        restoreSnapshot(prevSnapshot);
      }

      this._updateButtons();
      return true;
    },

    /* ======================================================================
       Redo
       ====================================================================== */

    /**
     * Redo the last undone operation
     * Moves current state to undo stack and restores state from redo stack
     * @param {Function} getCurrentSnapshot - Function that returns current state snapshot
     * @param {Function} restoreSnapshot - Function that restores a snapshot
     * @returns {boolean} True if redo was performed
     */
    redo: function (getCurrentSnapshot, restoreSnapshot) {
      if (this._redoStack.length === 0) return false;

      // Save current state to undo stack
      var currentSnapshot = getCurrentSnapshot();
      if (currentSnapshot) {
        this._undoStack.push(JSON.stringify(currentSnapshot));
      }

      // Restore state from redo stack
      var nextJson = this._redoStack.pop();
      var nextSnapshot = window.SimUtils ? window.SimUtils.safeJSONParse(nextJson) : JSON.parse(nextJson);

      if (nextSnapshot) {
        restoreSnapshot(nextSnapshot);
      }

      this._updateButtons();
      return true;
    },

    /* ======================================================================
       State Queries
       ====================================================================== */

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo: function () {
      return this._undoStack.length > 0;
    },

    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo: function () {
      return this._redoStack.length > 0;
    },

    /**
     * Get the number of undo steps available
     * @returns {number}
     */
    getUndoCount: function () {
      return this._undoStack.length;
    },

    /**
     * Get the number of redo steps available
     * @returns {number}
     */
    getRedoCount: function () {
      return this._redoStack.length;
    },

    /* ======================================================================
       Clear
       ====================================================================== */

    /**
     * Clear all history
     */
    clear: function () {
      this._undoStack = [];
      this._redoStack = [];
      this._updateButtons();
    },

    /* ======================================================================
       UI Update
       ====================================================================== */

    /**
     * Update the undo/redo button states in the toolbar
     * @private
     */
    _updateButtons: function () {
      var btnUndo = document.getElementById('simBtnUndo');
      var btnRedo = document.getElementById('simBtnRedo');

      if (btnUndo) {
        btnUndo.disabled = !this.canUndo();
        btnUndo.style.opacity = this.canUndo() ? '1' : '0.3';
      }

      if (btnRedo) {
        btnRedo.disabled = !this.canRedo();
        btnRedo.style.opacity = this.canRedo() ? '1' : '0.3';
      }
    }
  };

})();
