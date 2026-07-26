/* ==========================================================================
   DrDer Electronic - Simulator History (Undo/Redo)
   ========================================================================== */
(function () {
  'use strict';

  const MAX_UNDO = 100;

  window.SimHistory = {
    _undoStack: [],
    _redoStack: [],

    /**
     * Push current state to undo stack
     */
    push(state) {
      this._undoStack.push(JSON.stringify(state));
      if (this._undoStack.length > MAX_UNDO) this._undoStack.shift();
      this._redoStack = [];
      this._updateButtons();
    },

    /**
     * Undo
     */
    undo(getCurrentState, restoreState) {
      if (this._undoStack.length === 0) return false;
      const currentState = JSON.stringify(getCurrentState());
      this._redoStack.push(currentState);
      const prevState = JSON.parse(this._undoStack.pop());
      restoreState(prevState);
      this._updateButtons();
      return true;
    },

    /**
     * Redo
     */
    redo(getCurrentState, restoreState) {
      if (this._redoStack.length === 0) return false;
      const currentState = JSON.stringify(getCurrentState());
      this._undoStack.push(currentState);
      const nextState = JSON.parse(this._redoStack.pop());
      restoreState(nextState);
      this._updateButtons();
      return true;
    },

    /**
     * Check if undo available
     */
    canUndo() {
      return this._undoStack.length > 0;
    },

    /**
     * Check if redo available
     */
    canRedo() {
      return this._redoStack.length > 0;
    },

    /**
     * Clear all history
     */
    clear() {
      this._undoStack = [];
      this._redoStack = [];
      this._updateButtons();
    },

    /**
     * Update UI buttons
     */
    _updateButtons() {
      const btnUndo = document.getElementById('simBtnUndo');
      const btnRedo = document.getElementById('simBtnRedo');
      if (btnUndo) btnUndo.disabled = !this.canUndo();
      if (btnRedo) btnRedo.disabled = !this.canRedo();
    }
  };
})();
