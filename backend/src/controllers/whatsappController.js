const axios = require('axios');
const db = require('../config/database');

// ============================================================
// WhatsApp Template Messages
// ============================================================

const TEMPLATES = {
  receipt: (data) => `╔══════════════════════╗
  *🧾 KWITANSI DEPO*
╚══════════════════════╝

Terima kasih atas kepercayaan Anda! 🙏

📋 *Invoice:* ${data.invoice_number}
👤 *Nama:* ${data.customer_name}
📦 *Item:* ${data.item}
💵 *Total:* Rp ${Number(data.total_amount).toLocaleString('id-ID')}
💳 *Pembayaran:* ${data.payment_method.toUpperCase()}
📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${data.tier && data.tier !== 'Silver' ? `⭐ *Status Member:* ${data.tier}\n` : ''}
${data.is_free_gallon ? '🎁 *SELAMAT! Anda mendapat 1 GALON GRATIS!*\n' : ''}
_Depo - Air Bersih Terpercaya_
_Untuk pertanyaan: ${data.store_phone || ''}_ `,

  loyaltyReminder: (data) => `🎉 *SELAMAT ${data.name.toUpperCase()}!*

Anda telah mencapai *${data.loyalty_count} pembelian* dan berhak mendapatkan:

🆓 *1 GALON GRATIS!*

Kunjungi depo kami dan tunjukkan pesan ini kepada kasir untuk mengklaim hadiah Anda.

Kode Voucher Anda: *${data.voucher_code}*

_Berlaku 30 hari sejak pesan ini dikirim_
_Depo - Menghargai Setia Anda_ 💙`,

  churnRetarget: (data) => `Halo *${data.name}* 👋

Kami kangen kamu! 😊

Sudah *${data.days_inactive} hari* sejak terakhir kamu berbelanja di Depo.

🎁 *Spesial untuk kamu:*
Dapatkan diskon *10% untuk pembelian berikutnya!*
Cukup sebut kode: *KANGEN-${data.voucher_code}*

Stok air bersih segar kami siap melayani kamu kembali! 🌊

_Depo - Selalu Ada untuk Keluarga Anda_`,

  maintenanceAlert: (admin_phone, data) => `⚠️ *ALERT SISTEM DEPO*

Asset *${data.name}* di *${data.branch_name}* perlu segera diganti!

📊 *Penggunaan:* ${data.percent}%
🔧 *Status:* URGENT CHANGE

Mohon segera lakukan penggantian untuk menjaga kualitas air.

_Auto-notification by Depo System_`,
};

// ============================================================
// Send WhatsApp Message via Fonnte API
// ============================================================

const sendWhatsApp = async (phone, message, customer_id = null, message_type = 'manual') => {
  try {
    // Log to DB
    await db.pool.query(
      'INSERT INTO whatsapp_logs (customer_id, phone, message_type, message_body, status) VALUES ($1, $2, $3, $4, $5)',
      [customer_id, phone, message_type, message, 'sending']
    );

    if (!process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_API_KEY === 'your_whatsapp_api_key_here') {
      console.log(`[WA DEMO] To: ${phone}\n${message}\n`);
      await db.pool.query(
        `UPDATE whatsapp_logs SET status='sent', sent_at=NOW() WHERE id = (SELECT id FROM whatsapp_logs WHERE phone = $1 ORDER BY created_at DESC LIMIT 1)`,
        [phone]
      );
      return { success: true, demo: true };
    }

    const res = await axios.post(
      process.env.WHATSAPP_API_URL || 'https://api.fonnte.com/send',
      { target: phone, message, countryCode: '62' },
      { headers: { Authorization: process.env.WHATSAPP_API_KEY } }
    );

    // Update log status
    await db.pool.query(
      `UPDATE whatsapp_logs SET status='sent', sent_at=NOW() WHERE id = (SELECT id FROM whatsapp_logs WHERE phone = $1 ORDER BY created_at DESC LIMIT 1)`,
      [phone]
    );

    return { success: true, data: res.data };
  } catch (err) {
    console.error('[WhatsApp Error]', err.message);
    return { success: false, error: err.message };
  }
};

// ============================================================
// API Controllers
// ============================================================

exports.sendReceipt = async (req, res) => {
  const { phone, customer_name, invoice_number, item, total_amount, payment_method, tier, is_free_gallon, customer_id } = req.body;
  const result = await sendWhatsApp(
    phone,
    TEMPLATES.receipt({ customer_name, invoice_number, item, total_amount, payment_method, tier, is_free_gallon }),
    customer_id,
    'receipt'
  );
  res.json(result);
};

exports.sendLoyaltyReward = async (req, res) => {
  const { phone, name, loyalty_count, voucher_code, customer_id } = req.body;
  const result = await sendWhatsApp(phone, TEMPLATES.loyaltyReminder({ name, loyalty_count, voucher_code }), customer_id, 'loyalty');
  res.json(result);
};

// Auto-blast churn risk customers
exports.blastChurnRetarget = async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const { rows } = await db.pool.query(
      `SELECT id, name, whatsapp, voucher_code, 
       EXTRACT(DAY FROM NOW() - last_purchase_at)::int as days_inactive
       FROM customers WHERE last_purchase_at < $1 AND whatsapp IS NOT NULL`,
      [cutoff]
    );

    const results = [];
    for (const c of rows) {
      const r = await sendWhatsApp(c.whatsapp, TEMPLATES.churnRetarget(c), c.id, 'churn_retarget');
      results.push({ customer: c.name, phone: c.whatsapp, ...r });
    }

    res.json({ success: true, sent_count: results.length, results });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { rows } = await db.pool.query(
      `SELECT w.*, c.name as customer FROM whatsapp_logs w 
       LEFT JOIN customers c ON w.customer_id = c.id 
       ORDER BY w.created_at DESC LIMIT 100`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// Export template builder for use by other controllers
exports.sendWhatsApp = sendWhatsApp;
exports.TEMPLATES = TEMPLATES;
