/* ==========================================================================
   DrDer Electronic Simulator 2.0
   simulator-utils.js - Pure utility functions
   
   Responsibility:
   - Provide shared helper functions used by all other modules
   - No dependencies on any other simulator module
   - No DOM access, no state, no events
   - All functions are pure or have no side effects on the system
   ========================================================================== */

(function () {
  'use strict';

  /**
   * SimUtils namespace attached to window for global access
   * All functions are stateless and can be called independently
   */
  window.SimUtils = {

    /**
     * Generate a unique identifier string
     * Uses timestamp + random string for uniqueness
     * @returns {string} Unique ID like "sim_a1b2c3d4"
     */
    generateId: function () {
      return 'sim_' + Date.now().toString(36) + '_' +
        Math.random().toString(36).substring(2, 8);
    },

    /**
     * Clamp a number between minimum and maximum values
     * @param {number} value - The value to clamp
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @returns {number} Clamped value
     */
    clamp: function (value, min, max) {
      if (value < min) return min;
      if (value > max) return max;
      return value;
    },

    /**
     * Snap a value to the nearest grid point
     * @param {number} value - The value to snap
     * @param {number} gridSize - Grid size in pixels
     * @returns {number} Snapped value
     */
    snapToGrid: function (value, gridSize) {
      if (!gridSize || gridSize <= 0) return value;
      return Math.round(value / gridSize) * gridSize;
    },

    /**
     * Calculate Euclidean distance between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Distance in pixels
     */
    distance: function (x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Calculate the midpoint between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {{x: number, y: number}} Midpoint coordinates
     */
    midpoint: function (x1, y1, x2, y2) {
      return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2
      };
    },

    /**
     * Calculate the angle between two points in degrees
     * @param {number} x1 - Start point X
     * @param {number} y1 - Start point Y
     * @param {number} x2 - End point X
     * @param {number} y2 - End point Y
     * @returns {number} Angle in degrees (0-360)
     */
    angle: function (x1, y1, x2, y2) {
      var radians = Math.atan2(y2 - y1, x2 - x1);
      var degrees = radians * (180 / Math.PI);
      return (degrees + 360) % 360;
    },

    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    degToRad: function (degrees) {
      return degrees * (Math.PI / 180);
    },

    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    radToDeg: function (radians) {
      return radians * (180 / Math.PI);
    },

    /**
     * Deep clone an object or array
     * Handles Date objects, Arrays, and plain Objects
     * @param {*} obj - The object to clone
     * @returns {*} Deep cloned copy
     */
    clone: function (obj) {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (Array.isArray(obj)) {
        var arrCopy = [];
        for (var i = 0; i < obj.length; i++) {
          arrCopy[i] = this.clone(obj[i]);
        }
        return arrCopy;
      }
      var objCopy = {};
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          objCopy[key] = this.clone(obj[key]);
        }
      }
      return objCopy;
    },

    /**
     * Create a debounced version of a function
     * The function is only called after the specified delay
     * since the last invocation
     * @param {Function} fn - The function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function (fn, delay) {
      var timer = null;
      return function () {
        var context = this;
        var args = arguments;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay);
      };
    },

    /**
     * Create a throttled version of a function
     * The function is called at most once per specified interval
     * @param {Function} fn - The function to throttle
     * @param {number} limit - Minimum time between calls in ms
     * @returns {Function} Throttled function
     */
    throttle: function (fn, limit) {
      var inThrottle = false;
      var lastArgs = null;
      var lastContext = null;

      return function () {
        if (!inThrottle) {
          fn.apply(this, arguments);
          inThrottle = true;
          var self = this;
          setTimeout(function () {
            inThrottle = false;
          }, limit);
        }
      };
    },

    /**
     * Safely parse a JSON string
     * Returns fallback value if parsing fails
     * @param {string} str - JSON string to parse
     * @param {*} fallback - Value to return on failure
     * @returns {*} Parsed object or fallback
     */
    safeJSONParse: function (str, fallback) {
      if (!str || typeof str !== 'string') return fallback;
      try {
        return JSON.parse(str);
      } catch (e) {
        return fallback;
      }
    },

    /**
     * Format a numeric value with optional unit
     * @param {number|null|undefined} value - The value to format
     * @param {string} unit - Unit symbol (e.g., 'V', 'A', 'Ω')
     * @param {number} [precision=2] - Number of decimal places
     * @returns {string} Formatted string like "12.50 V"
     */
    formatValue: function (value, unit, precision) {
      if (value === null || value === undefined || isNaN(value)) return '—';
      var p = (precision !== undefined) ? precision : 2;
      var absValue = Math.abs(value);

      if (absValue >= 1e6) return (value / 1e6).toFixed(p) + ' M' + (unit || '');
      if (absValue >= 1e3) return (value / 1e3).toFixed(p) + ' k' + (unit || '');
      if (absValue > 0 && absValue < 1e-3) return (value * 1e6).toFixed(p) + ' µ' + (unit || '');
      if (absValue > 0 && absValue < 1) return (value * 1e3).toFixed(p) + ' m' + (unit || '');

      return value.toFixed(p) + (unit ? ' ' + unit : '');
    },

    /**
     * Create an HTML element with attributes and optional children
     * @param {string} tag - HTML tag name
     * @param {Object} [attrs={}] - Attributes to set on the element
     * @param {string|Node|Array} [children] - Child content
     * @returns {HTMLElement} The created element
     */
    createElement: function (tag, attrs, children) {
      var el = document.createElement(tag);

      if (attrs) {
        for (var key in attrs) {
          if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
          var value = attrs[key];

          if (key === 'class' || key === 'className') {
            el.className = value;
          } else if (key === 'style' && typeof value === 'string') {
            el.style.cssText = value;
          } else if (key === 'html') {
            el.innerHTML = value;
          } else if (key === 'text') {
            el.textContent = value;
          } else if (key.substring(0, 2) === 'on' && typeof value === 'function') {
            el.addEventListener(key.substring(2).toLowerCase(), value);
          } else {
            el.setAttribute(key, String(value));
          }
        }
      }

      if (children !== undefined) {
        if (typeof children === 'string') {
          el.innerHTML = children;
        } else if (children instanceof Node) {
          el.appendChild(children);
        } else if (Array.isArray(children)) {
          for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child instanceof Node) {
              el.appendChild(child);
            } else if (typeof child === 'string') {
              el.appendChild(document.createTextNode(child));
            }
          }
        }
      }

      return el;
    },

    /**
     * Create an SVG element with attributes
     * @param {string} tag - SVG tag name
     * @param {Object} [attrs={}] - Attributes to set
     * @returns {SVGElement} The created SVG element
     */
    createSVGElement: function (tag, attrs) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      if (attrs) {
        for (var key in attrs) {
          if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
          el.setAttribute(key, String(attrs[key]));
        }
      }
      return el;
    },

    /**
     * Remove all child nodes from an element
     * @param {HTMLElement} element - The element to clear
     */
    clearElement: function (element) {
      if (!element) return;
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    },

    /**
     * Check if a value is a valid finite number
     * @param {*} value - Value to check
     * @returns {boolean} True if value is a valid number
     */
    isValidNumber: function (value) {
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },

    /**
     * Parse a value to a number safely, returning fallback if invalid
     * @param {*} value - Value to parse
     * @param {number} [fallback=0] - Default value if parsing fails
     * @returns {number} Parsed number or fallback
     */
    toNumber: function (value, fallback) {
      if (fallback === undefined) fallback = 0;
      if (typeof value === 'number' && !isNaN(value)) return value;
      var num = parseFloat(value);
      return isNaN(num) ? fallback : num;
    },

    /**
     * Check if running as an installed PWA
     * @returns {boolean} True if running in standalone mode
     */
    isPWA: function () {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator.standalone) return true;
      if (document.referrer.indexOf('android-app://') !== -1) return true;
      return false;
    },

    /**
     * Get a value from an object using a dot-notation path
     * @param {Object} obj - The object to traverse
     * @param {string} path - Dot-notation path like "a.b.c"
     * @param {*} [fallback] - Value to return if path not found
     * @returns {*} The value at the path or fallback
     */
    getByPath: function (obj, path, fallback) {
      if (!obj || !path) return fallback;
      var parts = path.split('.');
      var current = obj;
      for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return fallback;
        current = current[parts[i]];
      }
      return current !== undefined ? current : fallback;
    },

    /**
     * Simple event emitter mixin
     * Can be used to add pub/sub capabilities to any object
     * @returns {Object} Emitter object with on/off/emit methods
     */
    createEmitter: function () {
      var listeners = {};

      return {
        /**
         * Register an event listener
         * @param {string} event - Event name
         * @param {Function} callback - Function to call
         */
        on: function (event, callback) {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(callback);
        },

        /**
         * Remove an event listener
         * @param {string} event - Event name
         * @param {Function} callback - Function to remove
         */
        off: function (event, callback) {
          if (!listeners[event]) return;
          listeners[event] = listeners[event].filter(function (cb) {
            return cb !== callback;
          });
        },

        /**
         * Emit an event, calling all registered listeners
         * @param {string} event - Event name
         * @param {...*} args - Arguments to pass to listeners
         */
        emit: function (event) {
          if (!listeners[event]) return;
          var args = Array.prototype.slice.call(arguments, 1);
          for (var i = 0; i < listeners[event].length; i++) {
            listeners[event][i].apply(null, args);
          }
        }
      };
    }
  };

})();
