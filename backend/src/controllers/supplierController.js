const db = require('../config/database');

exports.getSuppliers = async (req, res) => {
  try {
    const { rows } = await db.pool.query(`
      SELECT *,
        contact_name as contact,
        payment_terms_days as terms
      FROM suppliers
      ORDER BY name ASC
    `);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createSupplier = async (req, res) => {
  try {
    const { name, contact, phone, address, category, terms } = req.body;
    const { rows } = await db.pool.query(
      'INSERT INTO suppliers (name, contact_name, phone, address, category, payment_terms_days) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, contact, phone, address, category, terms || 30]
    );
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { name, contact, phone, address, category, terms } = req.body;
    const { rows } = await db.pool.query(
      'UPDATE suppliers SET name=$1, contact_name=$2, phone=$3, address=$4, category=$5, payment_terms_days=$6 WHERE id=$7 RETURNING *',
      [name, contact, phone, address, category, terms, req.params.id]
    );
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const { rows } = await db.pool.query(
      `SELECT po.*, po.items_description as items, s.name as supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       ORDER BY po.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createPO = async (req, res) => {
  try {
    const { supplier_id, items, total_amount, due_date, notes } = req.body;
    const po_number = 'PO-' + Date.now();
    const { rows } = await db.pool.query(
      'INSERT INTO purchase_orders (supplier_id, po_number, items_description, total_amount, due_date, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [supplier_id, po_number, items, total_amount, due_date, notes]
    );
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const { rows } = await db.pool.query(
      'UPDATE purchase_orders SET status=$1, payment_status=$2 WHERE id=$3 RETURNING *',
      [status, payment_status, req.params.id]
    );
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
