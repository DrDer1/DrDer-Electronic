/* ==========================================================================
   DrDer Electronic - Simulator Utilities
   Shared helper functions used across all simulator modules
   ========================================================================== */
(function () {
  'use strict';

  window.SimUtils = {
    /**
     * Generate unique ID
     */
    generateId() {
      return 'sim_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    },

    /**
     * Clamp value between min and max
     */
    clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    },

    /**
     * Snap value to grid
     */
    snapToGrid(val, gridSize) {
      return Math.round(val / gridSize) * gridSize;
    },

    /**
     * Distance between two points
     */
    distance(x1, y1, x2, y2) {
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * Angle between two points in degrees
     */
    angle(x1, y1, x2, y2) {
      return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    },

    /**
     * Midpoint between two points
     */
    midpoint(x1, y1, x2, y2) {
      return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    },

    /**
     * Deep clone an object
     */
    clone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj);
      if (obj instanceof Array) return obj.map(item => this.clone(item));
      if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) cloned[key] = this.clone(obj[key]);
        }
        return cloned;
      }
      return obj;
    },

    /**
     * Debounce function
     */
    debounce(fn, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    /**
     * Throttle function
     */
    throttle(fn, limit) {
      let inThrottle;
      return function (...args) {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Convert degrees to radians
     */
    degToRad(deg) {
      return deg * (Math.PI / 180);
    },

    /**
     * Convert radians to degrees
     */
    radToDeg(rad) {
      return rad * (180 / Math.PI);
    },

    /**
     * Create SVG element with attributes
     */
    createSVGElement(tag, attrs = {}) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
      return el;
    },

    /**
     * Create HTML element with attributes and optional children
     */
    createElement(tag, attrs = {}, children = null) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') el.className = value;
        else if (key === 'style' && typeof value === 'string') el.style.cssText = value;
        else if (key.startsWith('on') && typeof value === 'function') {
          el.addEventListener(key.slice(2).toLowerCase(), value);
        }
        else el.setAttribute(key, String(value));
      });
      if (typeof children === 'string') el.innerHTML = children;
      else if (children instanceof Node) el.appendChild(children);
      else if (Array.isArray(children)) {
        children.forEach(child => {
          if (child instanceof Node) el.appendChild(child);
          else if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        });
      }
      return el;
    },

    /**
     * Format number with units
     */
    formatValue(value, unit, precision = 2) {
      if (value === null || value === undefined) return '—';
      if (value >= 1e6) return (value / 1e6).toFixed(precision) + ' M' + unit;
      if (value >= 1e3) return (value / 1e3).toFixed(precision) + ' k' + unit;
      if (value < 1 && value > 0) {
        if (value < 1e-6) return (value * 1e9).toFixed(precision) + ' n' + unit;
        if (value < 1e-3) return (value * 1e6).toFixed(precision) + ' µ' + unit;
        if (value < 1) return (value * 1e3).toFixed(precision) + ' m' + unit;
      }
      return value.toFixed(precision) + ' ' + unit;
    },

    /**
     * Safe JSON parse
     */
    safeJSONParse(str, fallback = null) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return fallback;
      }
    },

    /**
     * Check if running as PWA
     */
    isPWA() {
      return window.matchMedia('(display-mode: standalone)').matches ||
             navigator.standalone ||
             document.referrer.includes('android-app://');
    },

    /**
     * Get element position relative to another element
     */
    getRelativePosition(el, parent) {
      const elRect = el.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      return {
        x: elRect.left - parentRect.left,
        y: elRect.top - parentRect.top,
        width: elRect.width,
        height: elRect.height,
      };
    }
  };
})();
