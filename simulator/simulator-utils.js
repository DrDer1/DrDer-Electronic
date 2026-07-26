/* ==========================================================================
   DrDer Electronic - Simulator Utilities v4.0
   Shared helper functions used across all simulator modules
   ========================================================================== */
(function () {
  'use strict';

  window.SimUtils = {
    /**
     * Generate unique ID using timestamp and random string
     * @returns {string} Unique identifier
     */
    generateId() {
      return 'sim_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    },

    /**
     * Clamp a value between min and max
     * @param {number} val - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    },

    /**
     * Snap value to nearest grid point
     * @param {number} val - Value to snap
     * @param {number} gridSize - Grid size in pixels
     * @returns {number} Snapped value
     */
    snapToGrid(val, gridSize) {
      return Math.round(val / gridSize) * gridSize;
    },

    /**
     * Calculate distance between two points
     * @param {number} x1 - First point x
     * @param {number} y1 - First point y
     * @param {number} x2 - Second point x
     * @param {number} y2 - Second point y
     * @returns {number} Distance
     */
    distance(x1, y1, x2, y2) {
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * Calculate angle between two points in degrees
     * @param {number} x1 - First point x
     * @param {number} y1 - First point y
     * @param {number} x2 - Second point x
     * @param {number} y2 - Second point y
     * @returns {number} Angle in degrees
     */
    angle(x1, y1, x2, y2) {
      return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    },

    /**
     * Calculate midpoint between two points
     * @param {number} x1 - First point x
     * @param {number} y1 - First point y
     * @param {number} x2 - Second point x
     * @param {number} y2 - Second point y
     * @returns {Object} Midpoint {x, y}
     */
    midpoint(x1, y1, x2, y2) {
      return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    },

    /**
     * Deep clone an object (handles Date, Array, Object)
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    clone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj);
      if (Array.isArray(obj)) return obj.map(item => this.clone(item));
      const cloned = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = this.clone(obj[key]);
        }
      }
      return cloned;
    },

    /**
     * Create a debounced version of a function
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(fn, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    /**
     * Create a throttled version of a function
     * @param {Function} fn - Function to throttle
     * @param {number} limit - Minimum time between calls in ms
     * @returns {Function} Throttled function
     */
    throttle(fn, limit) {
      let inThrottle;
      let lastResult;
      return function (...args) {
        if (!inThrottle) {
          lastResult = fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => { inThrottle = false; }, limit);
        }
        return lastResult;
      };
    },

    /**
     * Convert degrees to radians
     * @param {number} deg - Angle in degrees
     * @returns {number} Angle in radians
     */
    degToRad(deg) {
      return deg * (Math.PI / 180);
    },

    /**
     * Convert radians to degrees
     * @param {number} rad - Angle in radians
     * @returns {number} Angle in degrees
     */
    radToDeg(rad) {
      return rad * (180 / Math.PI);
    },

    /**
     * Create an SVG element with attributes
     * @param {string} tag - SVG tag name
     * @param {Object} attrs - Attributes to set
     * @returns {SVGElement} Created SVG element
     */
    createSVGElement(tag, attrs) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
          el.setAttribute(key, value);
        });
      }
      return el;
    },

    /**
     * Create an HTML element with attributes and optional children
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Attributes to set
     * @param {string|Node|Array} children - Child content
     * @returns {HTMLElement} Created HTML element
     */
    createElement(tag, attrs, children) {
      const el = document.createElement(tag);
      if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
          if (key === 'class' || key === 'className') {
            el.className = value;
          } else if (key === 'style' && typeof value === 'string') {
            el.style.cssText = value;
          } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
          } else {
            el.setAttribute(key, String(value));
          }
        });
      }
      if (typeof children === 'string') {
        el.innerHTML = children;
      } else if (children instanceof Node) {
        el.appendChild(children);
      } else if (Array.isArray(children)) {
        children.forEach(child => {
          if (child instanceof Node) {
            el.appendChild(child);
          } else if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
          }
        });
      }
      return el;
    },

    /**
     * Format a number with units
     * @param {number} value - Value to format
     * @param {string} unit - Unit symbol
     * @param {number} precision - Decimal places
     * @returns {string} Formatted string
     */
    formatValue(value, unit, precision) {
      const p = precision !== undefined ? precision : 2;
      if (value === null || value === undefined) return '—';
      if (value >= 1e6) return (value / 1e6).toFixed(p) + ' M' + unit;
      if (value >= 1e3) return (value / 1e3).toFixed(p) + ' k' + unit;
      if (value < 1 && value > 0) {
        if (value < 1e-6) return (value * 1e9).toFixed(p) + ' n' + unit;
        if (value < 1e-3) return (value * 1e6).toFixed(p) + ' µ' + unit;
        if (value < 1) return (value * 1e3).toFixed(p) + ' m' + unit;
      }
      return value.toFixed(p) + ' ' + unit;
    },

    /**
     * Safe JSON parse with fallback
     * @param {string} str - JSON string to parse
     * @param {*} fallback - Fallback value if parsing fails
     * @returns {*} Parsed object or fallback
     */
    safeJSONParse(str, fallback) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return fallback !== undefined ? fallback : null;
      }
    },

    /**
     * Check if running as installed PWA
     * @returns {boolean} True if running as PWA
     */
    isPWA() {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (navigator.standalone) ||
             document.referrer.includes('android-app://');
    },

    /**
     * Get element position relative to another element
     * @param {HTMLElement} el - Element to get position of
     * @param {HTMLElement} parent - Reference parent element
     * @returns {Object} Position {x, y, width, height}
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
    },

    /**
     * Check if a value is a valid number
     * @param {*} val - Value to check
     * @returns {boolean} True if valid number
     */
    isValidNumber(val) {
      return typeof val === 'number' && !isNaN(val) && isFinite(val);
    },

    /**
     * Parse a value to number safely
     * @param {*} val - Value to parse
     * @param {number} fallback - Fallback if invalid
     * @returns {number} Parsed number or fallback
     */
    parseNumber(val, fallback) {
      const num = parseFloat(val);
      return this.isValidNumber(num) ? num : (fallback !== undefined ? fallback : 0);
    }
  };
})();
