/**
 * Generate voucher code from block name + house number
 * "Blok A" + "01" => "BLA01"
 * "Jalan Merdeka" + "15" => "JLM15"
 */
const generateVoucherCode = (blockName, houseNumber) => {
  if (!blockName || !houseNumber) return null;
  const skip = new Set(['di','dan','atau','ke','the','a','an','no','nomor']);
  const words = blockName.trim().split(/\s+/);
  const initials = words
    .filter(w => !skip.has(w.toLowerCase()) && w.length > 0)
    .map(w => w[0].toUpperCase())
    .join('');
  const num = String(houseNumber).replace(/\D/g, '').padStart(2, '0');
  return `${initials}${num}`;
};

const ensureUniqueCode = async (db, baseCode, excludeId = null) => {
  let code = baseCode;
  let counter = 1;
  while (true) {
    const sql = excludeId
      ? 'SELECT id FROM customers WHERE voucher_code = ? AND id != ? LIMIT 1'
      : 'SELECT id FROM customers WHERE voucher_code = ? LIMIT 1';
    const params = excludeId ? [code, excludeId] : [code];
    const [rows] = await db.execute(sql, params);
    if (!rows.length) break;
    code = `${baseCode}${counter++}`;
  }
  return code;
};

module.exports = { generateVoucherCode, ensureUniqueCode };
