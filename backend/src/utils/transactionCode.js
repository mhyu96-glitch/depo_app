const db = require('../config/database');

/**
 * Generate unique transaction code
 * Format: 
 * - PKP-YYYYMMDD-XXXX (pickup/beli langsung)
 * - DLV-YYYYMMDD-XXXX (delivery/diantar)
 */
const generateTransactionCode = async (deliveryType = 'pickup') => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, ''); // YYYYMMDD
    const prefix = deliveryType === 'delivery' ? 'DLV' : 'PKP';
    
    // Get last transaction today dengan prefix yang sama
    const result = await db.pool.query(
      `SELECT transaction_code FROM transactions 
       WHERE transaction_code LIKE $1 
       ORDER BY transaction_code DESC LIMIT 1`,
      [`${prefix}-${dateStr}-%`]
    );
    
    let sequence = 1;
    if (result.rows.length > 0) {
      const lastCode = result.rows[0].transaction_code;
      const lastSeq = parseInt(lastCode.split('-')[2]);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
    
    return `${prefix}-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  } catch (err) {
    // Fallback jika error
    const timestamp = Date.now();
    return `TRX-${timestamp}`;
  }
};

/**
 * Parse transaction code to get info
 */
const parseTransactionCode = (code) => {
  if (!code) return null;
  
  const parts = code.split('-');
  if (parts.length !== 3) return null;
  
  const [prefix, dateStr, seqStr] = parts;
  
  return {
    type: prefix === 'DLV' ? 'delivery' : 'pickup',
    date: dateStr,
    sequence: parseInt(seqStr),
    prefix
  };
};

module.exports = {
  generateTransactionCode,
  parseTransactionCode
};
