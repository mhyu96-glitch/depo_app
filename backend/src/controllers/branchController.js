const db = require('../config/database');

const DUMMY_BRANCHES = [
  { id: 1, name: 'Depo Pusat', address: 'Jl. Utama No. 1', phone: '021111111' },
  { id: 2, name: 'Cabang Ahmad Yani', address: 'Jl. Ahmad Yani No. 12', phone: '021222222' },
  { id: 3, name: 'Cabang Sudirman', address: 'Jl. Sudirman Kav 5', phone: '021333333' },
];

exports.getAll = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ data: DUMMY_BRANCHES });
  try {
    const result = await db.pool.query('SELECT * FROM branches ORDER BY name');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ message: 'Created (Demo)', data: { id: 99, ...req.body } });
  try {
    const { name, code, address, phone } = req.body;
    const result = await db.pool.query(
      'INSERT INTO branches (name, code, address, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, address, phone]
    );
    res.json({ message: 'Cabang berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ message: 'Updated (Demo)' });
  try {
    const { name, code, address, phone } = req.body;
    await db.pool.query('UPDATE branches SET name=$1, code=$2, address=$3, phone=$4 WHERE id=$5', [name, code, address, phone, req.params.id]);
    res.json({ message: 'Cabang diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ message: 'Deleted (Demo)' });
  try {
    await db.pool.query('DELETE FROM branches WHERE id=$1', [req.params.id]);
    res.json({ message: 'Cabang dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
