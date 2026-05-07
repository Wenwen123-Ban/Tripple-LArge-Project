/**
 * Storage utility functions for safe localStorage access
 */

const storage = {
  /**
   * Get value from localStorage with safe JSON parsing
   * @param {string} key - The localStorage key
   * @returns {any} Parsed value or null if not found or error
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (err) {
      console.error(`Error reading from localStorage key "${key}":`, err);
      return null;
    }
  },

  /**
   * Set value in localStorage with safe JSON stringification
   * @param {string} key - The localStorage key
   * @param {any} value - The value to store
   * @returns {boolean} True if successful, false otherwise
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Error writing to localStorage key "${key}":`, err);
      return false;
    }
  },

  /**
   * Remove value from localStorage
   * @param {string} key - The localStorage key
   * @returns {boolean} True if successful, false otherwise
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`Error removing localStorage key "${key}":`, err);
      return false;
    }
  },

  /**
   * Clear all localStorage
   * @returns {boolean} True if successful, false otherwise
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (err) {
      console.error('Error clearing localStorage:', err);
      return false;
    }
  }
};

export { storage };
