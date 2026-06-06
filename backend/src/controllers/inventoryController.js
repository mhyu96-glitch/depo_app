const db = require('../config/database');

const getInventoryColumns = async (client = db.pool) => {
  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory'
  `);
  return new Set(result.rows.map(row => row.column_name));
};

const syncProductsToInventory = async (client, columns, branchId = null) => {
  try {
    await client.query('SELECT id FROM products LIMIT 1');
  } catch (_) {
    return;
  }

  const stockColumn = columns.has('current') ? 'current' : (columns.has('current_stock') ? 'current_stock' : null);
  const insertColumns = [];
  const selectValues = [];

  if (columns.has('branch_id')) {
    insertColumns.push('branch_id');
    selectValues.push('p.branch_id');
  }

  insertColumns.push('name');
  selectValues.push('p.name');

  if (columns.has('unit')) {
    insertColumns.push('unit');
    selectValues.push(`'pcs'`);
  }

  if (stockColumn) {
    insertColumns.push(stockColumn);
    selectValues.push('0');
  }

  if (columns.has('min_stock')) {
    insertColumns.push('min_stock');
    selectValues.push('10');
  }

  if (columns.has('type')) {
    insertColumns.push('type');
    selectValues.push(`'supply'`);
  }

  if (columns.has('capacity')) {
    insertColumns.push('capacity');
    selectValues.push('0');
  }

  const params = [];
  let productFilter = "WHERE COALESCE(p.is_active, true) = true";
  if (branchId && columns.has('branch_id')) {
    params.push(branchId);
    productFilter += ` AND (p.branch_id = $${params.length} OR p.branch_id IS NULL)`;
  }

  const branchMatch = columns.has('branch_id')
    ? 'i.branch_id IS NOT DISTINCT FROM p.branch_id'
    : '1=1';

  await client.query(
    `INSERT INTO inventory (${insertColumns.join(', ')})
     SELECT ${selectValues.join(', ')}
     FROM products p
     ${productFilter}
       AND NOT EXISTS (
         SELECT 1
         FROM inventory i
         WHERE i.name = p.name AND ${branchMatch}
       )`,
    params
  );
};

exports.getAll = async (req, res) => {
  try {
    let { branch_id } = req.query;
    const columns = await getInventoryColumns();
    const stockColumn = columns.has('current') ? 'current' : 'current_stock';
    const typeSelect = columns.has('type') ? 'type' : `'supply'`;
    const capacitySelect = columns.has('capacity') ? 'capacity' : stockColumn;
    const minStockSelect = columns.has('min_stock') ? 'min_stock' : '0';
    
    // Branch filtering: branch_admin hanya lihat inventory cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }

    await syncProductsToInventory(db.pool, columns, branch_id);
    
    let query = `
      SELECT *,
        ${stockColumn} as current,
        ${capacitySelect} as capacity,
        ${minStockSelect} as min_stock,
        ${typeSelect} as type
      FROM inventory
      WHERE 1=1
    `;
    const params = [];
    
    if (branch_id) {
      params.push(branch_id);
      query += ` AND branch_id = $${params.length}`;
    }
    
    query += ` ORDER BY ${columns.has('type') ? 'type' : 'name'}, name`;
    
    const { rows } = await db.pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    let { branch_id } = req.query;
    
    // Branch filtering: branch_admin hanya lihat logs cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    let query = `
      SELECT l.*, i.name as item_name,
        CASE WHEN l.change_amount >= 0 THEN 'in' ELSE 'out' END as type,
        ABS(l.change_amount) as qty,
        l.reason as note,
        l.created_at as date
      FROM inventory_logs l 
      JOIN inventory i ON l.inventory_id = i.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (branch_id) {
      params.push(branch_id);
      query += ` AND i.branch_id = $${params.length}`;
    }
    
    query += ' ORDER BY l.created_at DESC LIMIT 50';
    
    const { rows } = await db.pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id, type, qty, note } = req.body;
    const parsedQty = Number(qty);
    if (!id) return res.status(400).json({ message: 'Pilih barang terlebih dahulu' });
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ message: 'Jumlah stok harus lebih dari 0' });
    }

    const change_amount = type === 'in' ? parsedQty : -parsedQty;
    const client = await db.getConnection();
    try {
      await client.query('BEGIN');
      const columns = await getInventoryColumns(client);
      const stockColumn = columns.has('current') ? 'current' : 'current_stock';
      
      // Cek apakah inventory item ini milik cabang user (untuk branch_admin)
      if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
        const checkResult = await client.query(
          'SELECT branch_id FROM inventory WHERE id = $1',
          [id]
        );
        if (checkResult.rows.length === 0 || Number(checkResult.rows[0].branch_id) !== Number(req.user.branch_id)) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Akses ditolak: item inventory bukan milik cabang Anda' });
        }
      }
      
      // Update stock
      await client.query(
        `UPDATE inventory SET ${stockColumn} = ${stockColumn} + $1 WHERE id = $2`,
        [change_amount, id]
      );
      
      // Log to inventory_logs
      await client.query(
        'INSERT INTO inventory_logs (inventory_id, user_id, change_amount, reason) VALUES ($1, $2, $3, $4)',
        [id, req.user?.id || null, change_amount, note || null]
      );
      
      await client.query('COMMIT');
      
      // Fetch updated item
      const itemRes = await db.pool.query(
        `SELECT *, ${stockColumn} as current FROM inventory WHERE id = $1`,
        [id]
      );
      res.json({ data: itemRes.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
