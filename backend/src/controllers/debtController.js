const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await db.pool.query(
      `SELECT t.id, t.customer_id, c.name as customer_name, c.whatsapp as customer_whatsapp,
       t.total_amount as total_debt, COALESCE(dp.paid,0) as paid_amount,
       t.total_amount - COALESCE(dp.paid,0) as remaining,
       t.invoice_number, t.created_at,
       CASE WHEN t.created_at < NOW() - INTERVAL '30 days' THEN 'overdue'
            WHEN COALESCE(dp.paid,0) > 0 THEN 'partial' ELSE 'active' END as status,
       b.name as branch_name
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN branches b ON t.branch_id = b.id
       LEFT JOIN (SELECT transaction_id, SUM(amount) as paid FROM debt_payments GROUP BY transaction_id) dp ON dp.transaction_id = t.id
       WHERE t.payment_status IN ('unpaid','partial')
       ORDER BY t.created_at DESC`
    );
    const summary = {
      total_receivable: rows.reduce((a, d) => a + parseFloat(d.remaining || 0), 0),
      overdue_count: rows.filter(d => d.status === 'overdue').length,
      active_count: rows.filter(d => d.status === 'active').length,
    };
    res.json({ data: rows, summary });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const client = await db.getConnection();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO debt_payments (transaction_id, amount, note, paid_by) VALUES ($1,$2,$3,$4)',
        [req.params.id, amount, note, req.user.id]
      );
      const totalPaid = await client.query('SELECT SUM(amount) as paid FROM debt_payments WHERE transaction_id=$1', [req.params.id]);
      const txRes = await client.query('SELECT total_amount FROM transactions WHERE id=$1', [req.params.id]);
      const remaining = txRes.rows[0].total_amount - totalPaid.rows[0].paid;
      const newStatus = remaining <= 0 ? 'paid' : 'partial';
      await client.query('UPDATE transactions SET payment_status=$1 WHERE id=$2', [newStatus, req.params.id]);
      await client.query('COMMIT');
      res.json({ success: true, remaining, status: newStatus });
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.sendReminder = async (req, res) => {
  try {
    const txRes = await db.pool.query(
      `SELECT t.*, c.name as customer_name, c.whatsapp FROM transactions t 
       LEFT JOIN customers c ON t.customer_id = c.id WHERE t.id = $1`,
      [req.params.id]
    );
    if (!txRes.rows[0] || !txRes.rows[0].whatsapp) {
      return res.json({ success: false, message: 'Customer tidak memiliki nomor WhatsApp' });
    }
    const whatsappController = require('./whatsappController');
    const customer = txRes.rows[0];
    const message = `Halo *${customer.customer_name}* 👋\n\nIni adalah pengingat untuk tagihan Anda:\n📋 Invoice: ${customer.invoice_number}\n💵 Total: Rp ${Number(customer.total_amount).toLocaleString('id-ID')}\n\nMohon segera melakukan pembayaran. Terima kasih! 🙏\n\n_Depo Air Minum_`;
    await whatsappController.sendWhatsApp(customer.whatsapp, message, customer.customer_id, 'debt_reminder');
    res.json({ success: true, message: 'Pengingat hutang terkirim' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
