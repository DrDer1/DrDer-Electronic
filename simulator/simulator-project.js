/* ==========================================================================
   DrDer Electronic - Simulator Project Management
   Save, Load, Export, Import projects
   ========================================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'drder-sim-projects';
  const MAX_SAVED_PROJECTS = 20;

  window.SimProject = {
    /* ========================================================================
       Save current project to localStorage
       ======================================================================== */
    save(name, state, wiresModule) {
      if (!name || !name.trim()) {
        return { success: false, message: '⚠️ الرجاء إدخال اسم للمشروع' };
      }

      const project = {
        id: SimUtils.generateId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
          comps: state.placedComponents.map(c => ({
            id: c.id, compId: c.compId, x: c.x, y: c.y,
            properties: SimUtils.clone(c.properties),
            rotation: c.rotation || 0
          })),
          conns: SimUtils.clone(wiresModule.getConnections()),
          cid: state.componentIdCounter,
          zoom: window.SimCanvas.getZoomLevel()
        }
      };

      const projects = this.getAll();
      projects.unshift(project);

      if (projects.length > MAX_SAVED_PROJECTS) {
        projects.splice(MAX_SAVED_PROJECTS);
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return { success: true, message: '✅ تم حفظ المشروع بنجاح', project };
      } catch (e) {
        return { success: false, message: '❌ فشل الحفظ. قد يكون التخزين ممتلئاً.' };
      }
    },

    /* ========================================================================
       Load a project by ID
       ======================================================================== */
    load(projectId) {
      const projects = this.getAll();
      const project = projects.find(p => p.id === projectId);

      if (!project) {
        return { success: false, message: '⚠️ المشروع غير موجود' };
      }

      return { success: true, project };
    },

    /* ========================================================================
       Delete a project
       ======================================================================== */
    delete(projectId) {
      let projects = this.getAll();
      projects = projects.filter(p => p.id !== projectId);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return { success: true, message: '🗑️ تم حذف المشروع' };
      } catch (e) {
        return { success: false, message: '❌ فشل حذف المشروع' };
      }
    },

    /* ========================================================================
       Get all saved projects
       ======================================================================== */
    getAll() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    },

    /* ========================================================================
       Export project as JSON file
       ======================================================================== */
    exportToJSON(state, wiresModule, projectName) {
      const project = {
        name: projectName || 'مشروع بدون اسم',
        version: '4.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          comps: state.placedComponents.map(c => ({
            id: c.id, compId: c.compId, x: c.x, y: c.y,
            properties: SimUtils.clone(c.properties),
            rotation: c.rotation || 0
          })),
          conns: SimUtils.clone(wiresModule.getConnections()),
          cid: state.componentIdCounter
        }
      };

      const json = JSON.stringify(project, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, message: '📥 تم تصدير المشروع بنجاح' };
    },

    /* ========================================================================
       Import project from JSON file
       ======================================================================== */
    importFromJSON(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const project = JSON.parse(e.target.result);

            if (!project.data || !project.data.comps) {
              resolve({ success: false, message: '⚠️ ملف JSON غير صالح' });
              return;
            }

            resolve({ success: true, project });
          } catch (err) {
            resolve({ success: false, message: '⚠️ فشل قراءة الملف. تأكد من أنه ملف JSON صالح.' });
          }
        };

        reader.onerror = () => {
          resolve({ success: false, message: '❌ فشل قراءة الملف' });
        };

        reader.readAsText(file);
      });
    },

    /* ========================================================================
       Get storage usage info
       ======================================================================== */
    getStorageInfo() {
      const projects = this.getAll();
      let totalSize = 0;

      try {
        totalSize = new Blob([localStorage.getItem(STORAGE_KEY) || '']).size;
      } catch (e) {}

      return {
        projectCount: projects.length,
        maxProjects: MAX_SAVED_PROJECTS,
        totalSizeKB: (totalSize / 1024).toFixed(1)
      };
    }
  };
})();
