const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { date, branch_id } = req.query;
    let query = 'SELECT a.*, c.name as courier_name FROM attendance a JOIN couriers c ON a.courier_id = c.id WHERE 1=1';
    const params = [];
    if (date) {
      params.push(date);
      query += ` AND a.date = $${params.length}`;
    }
    if (branch_id) {
      params.push(branch_id);
      query += ` AND a.branch_id = $${params.length}`;
    }
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getTodayPresent = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const result = await db.pool.query(
      'SELECT a.*, c.name as courier_name FROM attendance a JOIN couriers c ON a.courier_id = c.id WHERE a.date = CURRENT_DATE AND a.branch_id = $1',
      [branch_id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { courier_id, branch_id, notes } = req.body;
    const date = new Date().toISOString().split('T')[0];
    const checkExist = await db.pool.query('SELECT id FROM attendance WHERE courier_id = $1 AND date = $2', [courier_id, date]);
    if (checkExist.rows.length > 0) return res.status(400).json({ message: 'Kurir sudah absen hari ini' });
    
    const result = await db.pool.query(
      'INSERT INTO attendance (courier_id, branch_id, date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [courier_id, branch_id, date, notes || null]
    );
    res.json({ message: 'Absensi berhasil', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.pool.query('DELETE FROM attendance WHERE id = $1', [req.params.id]);
    res.json({ message: 'Absensi dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
