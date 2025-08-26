/**
 * Simple Helper Functions
 * Common utilities without overengineering
 */
const helpers = {
  // ===== DOM HELPERS =====
  
  /**
   * Quick DOM selectors
   */
  $: (selector, context = document) => context.querySelector(selector),
  $$: (selector, context = document) => Array.from(context.querySelectorAll(selector)),

  /**
   * Show/hide elements simply
   */
  show: (element) => {
    if (element) element.style.display = '';
  },

  hide: (element) => {
    if (element) element.style.display = 'none';
  },

  toggle: (element) => {
    if (element) {
      element.style.display = element.style.display === 'none' ? '' : 'none';
    }
  },

  // ===== PERFORMANCE HELPERS =====

  /**
   * Simple debounce - prevents too many calls
   */
  debounce: (func, wait) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  /**
   * Simple throttle - limits call frequency
   */
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // ===== DATE HELPERS =====

  /**
   * Format date simply
   */
  formatDate: (date, format = 'short') => {
    if (!date) return '';
    
    const d = new Date(date);
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString();
      case 'long':
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return d.toLocaleTimeString();
      default:
        return d.toLocaleDateString();
    }
  },

  /**
   * Get relative time (simple)
   */
  timeAgo: (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  },

  // ===== STRING HELPERS =====

  /**
   * Truncate text
   */
  truncate: (text, length = 100) => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  },

  /**
   * Capitalize first letter
   */
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // ===== ERROR HELPERS =====

  /**
   * Simple error display
   */
  showError: (message) => {
    console.error('❌ Error:', message);
    // You can replace this with a nicer notification later
    alert(message);
  },

  /**
   * Simple success message
   */
  showSuccess: (message) => {
    console.log('✅ Success:', message);
    // You can replace this with a nicer notification later
    alert(message);
  },

  // ===== VALIDATION HELPERS =====

  /**
   * Simple validation
   */
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isEmpty: (value) => {
    return value === null || value === undefined || value.toString().trim() === '';
  },

  // ===== ARRAY HELPERS =====

  /**
   * Remove item from array
   */
  removeFromArray: (array, item) => {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }
    return array;
  },

  /**
   * Group array by property
   */
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key] || 'undefined';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  // ===== STORAGE HELPERS =====

  /**
   * Simple localStorage wrapper
   */
  storage: {
    get: (key) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },

    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  },

  // ===== ASYNC HELPERS =====

  /**
   * Simple retry function
   */
  retry: async (fn, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Retry ${i + 1}/${retries} failed, trying again...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  },

  /**
   * Simple delay
   */
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Make it globally available
window.helpers = helpers;

console.log("✅ Simple helpers loaded");
