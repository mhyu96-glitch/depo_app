/**
 * Depo Foundation Utilities
 * Specialized for data validation, formatting, and persistent state management.
 */

export const foundation = {
  // Validation Logic
  validate: {
    whatsapp: (phone) => {
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length >= 10 && cleaned.length <= 15;
    },
    currency: (amount) => {
      const num = Number(amount);
      return !isNaN(num) && num >= 0;
    },
    required: (val) => val !== null && val !== undefined && val.toString().trim() !== '',
  },

  // Formatting Logic (Consistent across app)
  format: {
    idr: (n) => new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(n || 0),
    
    date: (d) => d ? new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : '-',
    
    compactNumber: (n) => new Intl.NumberFormat('id-ID', { 
      notation: 'compact', 
      maximumFractionDigits: 1 
    }).format(n || 0),
  },

  // Secure Storage Helper
  storage: {
    set: (key, val) => localStorage.setItem(`depo_${key}`, JSON.stringify(val)),
    get: (key) => {
      try {
        const val = localStorage.getItem(`depo_${key}`);
        return val ? JSON.parse(val) : null;
      } catch { return null; }
    },
    remove: (key) => localStorage.removeItem(`depo_${key}`),
    clear: () => {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('depo_')) localStorage.removeItem(k);
      });
    }
  }
};
