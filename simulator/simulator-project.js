/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-project.js - Project Manager
   
   Responsibility:
   - Save and load projects to localStorage
   - Export and import projects as JSON files
   - No DOM access beyond file input creation
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimProject - Manages project persistence
   */
  window.SimProject = {

    /** @type {string} localStorage key */
    _storageKey: 'drder-sim-projects',

    /** @type {number} Maximum saved projects */
    _maxProjects: 20,

    /* ======================================================================
       Save Project
       ====================================================================== */

    /**
     * Save the current project to localStorage
     * @param {string} name - Project name
     * @returns {Object} { success, message, project }
     */
    save: function (name) {
      if (!name || !name.trim()) {
        return { success: false, message: '⚠️ الرجاء إدخال اسم للمشروع' };
      }

      var state = window.SimState;
      if (!state) {
        return { success: false, message: '⚠️ حالة النظام غير متاحة' };
      }

      var snapshot = state.getSnapshot();

      var project = {
        id: this._generateId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '2.0',
        data: snapshot
      };

      try {
        var projects = this.getAll();

        // Update if project with same ID exists
        var existingIndex = -1;
        for (var i = 0; i < projects.length; i++) {
          if (projects[i].id === project.id) {
            existingIndex = i;
            break;
          }
        }

        if (existingIndex !== -1) {
          project.createdAt = projects[existingIndex].createdAt;
          projects[existingIndex] = project;
        } else {
          projects.unshift(project);
        }

        // Limit number of saved projects
        if (projects.length > this._maxProjects) {
          projects = projects.slice(0, this._maxProjects);
        }

        localStorage.setItem(this._storageKey, JSON.stringify(projects));

        return { success: true, message: '✅ تم حفظ المشروع بنجاح', project: project };
      } catch (e) {
        return { success: false, message: '❌ فشل الحفظ. قد يكون التخزين ممتلئاً.' };
      }
    },

    /* ======================================================================
       Load Project
       ====================================================================== */

    /**
     * Load a project by ID
     * @param {string} projectId - Project ID
     * @returns {Object} { success, message, project }
     */
    load: function (projectId) {
      var projects = this.getAll();

      for (var i = 0; i < projects.length; i++) {
        if (projects[i].id === projectId) {
          return { success: true, message: '✅ تم تحميل المشروع', project: projects[i] };
        }
      }

      return { success: false, message: '⚠️ المشروع غير موجود' };
    },

    /* ======================================================================
       Delete Project
       ====================================================================== */

    /**
     * Delete a saved project
     * @param {string} projectId - Project ID
     * @returns {Object} { success, message }
     */
    delete: function (projectId) {
      var projects = this.getAll();
      var filtered = [];

      for (var i = 0; i < projects.length; i++) {
        if (projects[i].id !== projectId) {
          filtered.push(projects[i]);
        }
      }

      if (filtered.length === projects.length) {
        return { success: false, message: '⚠️ المشروع غير موجود' };
      }

      try {
        localStorage.setItem(this._storageKey, JSON.stringify(filtered));
        return { success: true, message: '🗑️ تم حذف المشروع' };
      } catch (e) {
        return { success: false, message: '❌ فشل حذف المشروع' };
      }
    },

    /* ======================================================================
       Get All Projects
       ====================================================================== */

    /**
     * Get all saved projects
     * @returns {Array} Array of project objects
     */
    getAll: function () {
      try {
        var data = localStorage.getItem(this._storageKey);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    },

    /* ======================================================================
       Export Project
       ====================================================================== */

    /**
     * Export the current project as a downloadable JSON file
     * @param {string} [name] - Project name for the file
     * @returns {Object} { success, message }
     */
    exportToJSON: function (name) {
      var state = window.SimState;
      if (!state) {
        return { success: false, message: '⚠️ حالة النظام غير متاحة' };
      }

      var snapshot = state.getSnapshot();

      var project = {
        name: name || 'مشروع بدون اسم',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        data: snapshot
      };

      var json = JSON.stringify(project, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.href = url;
      a.download = this._sanitizeFileName(name || 'مشروع') + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, message: '📥 تم تصدير المشروع بنجاح' };
    },

    /* ======================================================================
       Import Project
       ====================================================================== */

    /**
     * Import a project from a JSON file
     * @param {File} file - The JSON file to import
     * @returns {Promise} Resolves with { success, message, project }
     */
    importFromJSON: function (file) {
      var self = this;
      return new Promise(function (resolve) {
        if (!file) {
          resolve({ success: false, message: '⚠️ لم يتم اختيار ملف' });
          return;
        }

        var reader = new FileReader();

        reader.onload = function (e) {
          try {
            var project = JSON.parse(e.target.result);

            // Validate project structure
            if (!project.data || !project.data.components) {
              resolve({ success: false, message: '⚠️ ملف JSON غير صالح - بنية المشروع غير مكتملة' });
              return;
            }

            // Check version compatibility
            if (project.version && project.version !== '2.0') {
              console.warn('Project version mismatch: ' + project.version);
            }

            resolve({ success: true, message: '✅ تم قراءة المشروع بنجاح', project: project });
          } catch (err) {
            resolve({ success: false, message: '⚠️ فشل قراءة الملف. تأكد من أنه ملف JSON صالح.' });
          }
        };

        reader.onerror = function () {
          resolve({ success: false, message: '❌ فشل قراءة الملف' });
        };

        reader.readAsText(file);
      });
    },

    /* ======================================================================
       Storage Info
       ====================================================================== */

    /**
     * Get information about stored projects
     * @returns {Object} { projectCount, maxProjects, totalSizeKB }
     */
    getStorageInfo: function () {
      var projects = this.getAll();
      var totalSize = 0;

      try {
        var data = localStorage.getItem(this._storageKey);
        if (data) {
          totalSize = new Blob([data]).size;
        }
      } catch (e) {}

      return {
        projectCount: projects.length,
        maxProjects: this._maxProjects,
        totalSizeKB: (totalSize / 1024).toFixed(1)
      };
    },

    /* ======================================================================
       Helpers
       ====================================================================== */

    /**
     * Generate a unique ID for a project
     * @private
     * @returns {string}
     */
    _generateId: function () {
      return 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    },

    /**
     * Sanitize a file name (remove special characters)
     * @private
     * @param {string} name - File name
     * @returns {string} Sanitized file name
     */
    _sanitizeFileName: function (name) {
      return name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s_-]/g, '').replace(/\s+/g, '_') || 'project';
    }
  };

})();
