const db = require('../config/database');

// Generate transaction code
// Format: PKP-YYYYMMDD-XXXX (pickup) atau DLV-YYYYMMDD-XXXX (delivery)
const generateTransactionCode = async (deliveryType) => {
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
    sequence = lastSeq + 1;
  }
  
  return `${prefix}-${dateStr}-${sequence.toString().padStart(4, '0')}`;
};

// Kasir request approval untuk edit transaksi
exports.requestEditApproval = async (req, res) => {
  try {
    const { transaction_id, reason } = req.body;
    
    // Check if kasir
    if (req.user.role !== 'kasir') {
      return res.status(403).json({ message: 'Hanya kasir yang perlu approval' });
    }
    
    // Check if transaction exists
    const tx = await db.pool.query('SELECT * FROM transactions WHERE id = $1', [transaction_id]);
    if (tx.rows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }
    
    // Create approval request
    const result = await db.pool.query(
      `INSERT INTO transaction_approvals (transaction_id, action_type, requested_by, reason, status) 
       VALUES ($1, 'edit', $2, $3, 'pending') RETURNING *`,
      [transaction_id, req.user.id, reason]
    );
    
    res.json({ 
      message: 'Request approval berhasil dikirim ke admin', 
      data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Kasir request approval untuk delete transaksi
exports.requestDeleteApproval = async (req, res) => {
  try {
    const { transaction_id, reason } = req.body;
    
    // Check if kasir
    if (req.user.role !== 'kasir') {
      return res.status(403).json({ message: 'Hanya kasir yang perlu approval' });
    }
    
    // Check if transaction exists
    const tx = await db.pool.query('SELECT * FROM transactions WHERE id = $1', [transaction_id]);
    if (tx.rows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }
    
    // Create approval request
    const result = await db.pool.query(
      `INSERT INTO transaction_approvals (transaction_id, action_type, requested_by, reason, status) 
       VALUES ($1, 'delete', $2, $3, 'pending') RETURNING *`,
      [transaction_id, req.user.id, reason]
    );
    
    res.json({ 
      message: 'Request approval berhasil dikirim ke admin', 
      data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin approve/reject approval request
exports.processApproval = async (req, res) => {
  try {
    const { approval_id, status, admin_note } = req.body; // status: 'approved' atau 'rejected'
    
    // Check if admin atau superadmin
    if (!['admin', 'branch_admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Hanya admin yang bisa approve' });
    }
    
    // Get approval request
    const approval = await db.pool.query(
      'SELECT * FROM transaction_approvals WHERE id = $1',
      [approval_id]
    );
    
    if (approval.rows.length === 0) {
      return res.status(404).json({ message: 'Approval request tidak ditemukan' });
    }
    
    const approvalData = approval.rows[0];
    
    if (approvalData.status !== 'pending') {
      return res.status(400).json({ message: 'Approval sudah diproses sebelumnya' });
    }
    
    // Update approval status
    await db.pool.query(
      `UPDATE transaction_approvals 
       SET status = $1, approved_by = $2, updated_at = CURRENT_TIMESTAMP, reason = COALESCE($3, reason)
       WHERE id = $4`,
      [status, req.user.id, admin_note, approval_id]
    );
    
    // Jika approved dan action adalah delete, hapus transaksi
    if (status === 'approved' && approvalData.action_type === 'delete') {
      await db.pool.query('DELETE FROM transactions WHERE id = $1', [approvalData.transaction_id]);
    }
    
    res.json({ 
      message: `Approval ${status === 'approved' ? 'disetujui' : 'ditolak'}`,
      data: { approval_id, status }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get pending approvals (untuk admin)
exports.getPendingApprovals = async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT 
        ta.*,
        t.transaction_code,
        t.total_amount,
        u.name as requested_by_name
       FROM transaction_approvals ta
       LEFT JOIN transactions t ON ta.transaction_id = t.id
       LEFT JOIN users u ON ta.requested_by = u.id
       WHERE ta.status = 'pending'
       ORDER BY ta.created_at DESC`
    );
    
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get approval history
exports.getApprovalHistory = async (req, res) => {
  try {
    const { transaction_id } = req.params;
    
    const result = await db.pool.query(
      `SELECT 
        ta.*,
        requester.name as requested_by_name,
        approver.name as approved_by_name
       FROM transaction_approvals ta
       LEFT JOIN users requester ON ta.requested_by = requester.id
       LEFT JOIN users approver ON ta.approved_by = approver.id
       WHERE ta.transaction_id = $1
       ORDER BY ta.created_at DESC`,
      [transaction_id]
    );
    
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { 
  generateTransactionCode,
  requestEditApproval, 
  requestDeleteApproval, 
  processApproval,
  getPendingApprovals,
  getApprovalHistory
};
