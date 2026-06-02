import { useState, useEffect } from 'react';
import api from '../api';
import {
  MessageSquare, Send, Users, Zap, RefreshCw,
  CheckCircle, Clock, AlertCircle, Phone,
  Gift, TrendingDown, Loader2, X, Info
} from 'lucide-react';

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

const TABS = [
  { id: 'blast', label: 'Anti-Churn Blast', icon: TrendingDown },
  { id: 'logs', label: 'Log Pesan', icon: Clock },
  { id: 'templates', label: 'Template Pesan', icon: MessageSquare },
];

const TEMPLATES = [
  {
    id: 'receipt',
    name: 'Kwitansi Digital',
    trigger: 'Otomatis setelah transaksi',
    preview: '🧾 KWITANSI DEPO\n\nTerima kasih atas kepercayaan Anda!\n\n📋 Invoice: INV-XXXXX\n👤 Nama: [Nama Pelanggan]\n💵 Total: Rp [Total]',
    badge: 'AUTO',
    badgeColor: 'bg-green-100 text-green-600',
  },
  {
    id: 'loyalty',
    name: 'Galon Gratis!',
    trigger: 'Otomatis saat 10 pembelian',
    preview: '🎉 SELAMAT [NAMA]!\n\nAnda mendapat 1 GALON GRATIS!\nKode Voucher: XXXX-XXXX\n\nKunjungi depo kami untuk klaim.',
    badge: 'AUTO',
    badgeColor: 'bg-green-100 text-green-600',
  },
  {
    id: 'churn',
    name: 'Retarget Churn Risk',
    trigger: 'Manual / Terjadwal (>14 hari)',
    preview: 'Halo [NAMA] 👋\n\nKami kangen kamu! Sudah [X] hari sejak terakhir berbelanja.\n\n🎁 Diskon 10% untuk pembelian berikutnya!\nKode: KANGEN-XXXX',
    badge: 'MANUAL',
    badgeColor: 'bg-orange-100 text-orange-600',
  },
];

export default function WhatsAppCenter() {
  const [tab, setTab] = useState('blast');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [blasting, setBlasting] = useState(false);
  const [blastResult, setBlastResult] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [waKey, setWaKey] = useState(localStorage.getItem('wa_key_info') || '');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/whatsapp/logs');
      setLogs(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const runChurnBlast = async () => {
    if (!window.confirm('Kirim pesan retarget ke semua pelanggan churn risk (>14 hari tidak aktif)?')) return;
    setBlasting(true);
    setBlastResult(null);
    try {
      const res = await api.post('/whatsapp/blast-churn');
      setBlastResult(res.data);
      loadLogs();
    } catch (_) {
      setBlastResult({ success: false, error: 'Gagal mengirim pesan' });
    }
    setBlasting(false);
  };

  const statsCards = [
    { label: 'Pesan Terkirim', value: logs.filter(l => l.status === 'sent').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10' },
    { label: 'Pending', value: logs.filter(l => l.status === 'pending').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
    { label: 'Kwitansi', value: logs.filter(l => l.message_type === 'receipt').length, icon: MI, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/10' },
    { label: 'Retarget', value: logs.filter(l => l.message_type === 'churn_retarget').length, icon: TrendingDown, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
  ];

  return (
    <div className="max-w-[1300px] mx-auto space-y-8 animate-fade-in font-outfit pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="text-green-500" size={28} />
            WhatsApp Command Center
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Otomasi Notifikasi · Kwitansi · Retargeting Pelanggan
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setConfigOpen(true)} className="px-4 py-2 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-primary-500 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Zap size={16} /> Konfigurasi API
          </button>
          <button onClick={loadLogs} className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-primary-500 transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s, i) => (
          <div key={i} className="card p-5 border-none shadow-xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
              {s.icon === MI ? <MI name="receipt_long" size={22} className={s.color} /> : <s.icon size={22} className={s.color} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              tab === t.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-white dark:bg-gray-900 text-gray-500 shadow-sm'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'blast' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6 border-none shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center">
                <TrendingDown size={24} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white">Anti-Churn Blast</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Pelanggan tidak aktif {'>'} 14 hari</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30">
                <p className="text-xs font-bold text-orange-700 dark:text-orange-300 leading-relaxed">
                  Sistem akan secara otomatis mendeteksi pelanggan yang tidak aktif lebih dari 14 hari dan mengirimkan pesan retarget dengan kode diskon khusus 10%.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview Pesan</p>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-mono">
                  {`Halo Budi 👋\n\nKami kangen kamu! Sudah 18 hari sejak terakhir kamu berbelanja di Depo.\n\n🎁 Diskon 10% untuk pembelian berikutnya!\nKode: KANGEN-BUDI-001`}
                </p>
              </div>
            </div>

            <button
              onClick={runChurnBlast}
              disabled={blasting}
              className="w-full py-4 rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {blasting ? <><Loader2 size={18} className="animate-spin" /> Mengirim...</> : <><Send size={18} /> Jalankan Blast Sekarang</>}
            </button>
          </div>

          {/* Result */}
          <div className="card p-6 border-none shadow-xl">
            <h3 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" /> Hasil Pengiriman
            </h3>
            {blastResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${blastResult.success ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
                  {blastResult.success ? <CheckCircle size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-red-500" />}
                  <div>
                    <p className="font-black text-gray-900 dark:text-white">
                      {blastResult.success ? `${blastResult.sent_count} Pesan Terkirim!` : 'Gagal mengirim'}
                    </p>
                    {blastResult.success && <p className="text-[10px] text-gray-500 mt-0.5">Berhasil dijangkau ke pelanggan churn risk</p>}
                  </div>
                </div>
                {blastResult.results?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <Phone size={14} className="text-gray-400" />
                      <div>
                        <p className="text-xs font-black text-gray-800 dark:text-gray-200">{r.customer}</p>
                        <p className="text-[10px] text-gray-400">{r.phone}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${r.status?.includes('demo') ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <Send size={32} className="text-gray-200 dark:text-gray-700 mb-3" />
                <p className="font-bold text-gray-400 text-sm">Belum ada hasil blast</p>
                <p className="text-xs text-gray-300 mt-1">Klik tombol di sebelah kiri untuk memulai</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card p-0 overflow-hidden border-none shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                {['Waktu', 'Pelanggan', 'Tipe', 'Status', 'Nomor HP'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">
                    {new Date(l.sent_at || l.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-gray-800 dark:text-gray-200">{l.customer || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      l.message_type === 'receipt' ? 'bg-blue-100 text-blue-600' :
                      l.message_type === 'loyalty' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {l.message_type === 'receipt' ? 'Kwitansi' : l.message_type === 'loyalty' ? 'Loyalty' : 'Retarget'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase ${l.status === 'sent' ? 'text-green-500' : 'text-orange-500'}`}>
                      {l.status === 'sent' ? '✓ Terkirim' : '• Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{l.phone}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm font-bold">Belum ada log pesan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEMPLATES.map(t => (
            <div key={t.id} className="card p-6 border-none shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 dark:text-white">{t.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${t.badgeColor}`}>{t.badge}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap size={10} /> {t.trigger}
              </p>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{t.preview}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Config Modal */}
      {configOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfigOpen(false)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2"><Zap size={18} className="text-green-500" /> Konfigurasi WhatsApp</h3>
              <button onClick={() => setConfigOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  Aplikasi ini menggunakan Fonnte.com sebagai gateway WhatsApp. Daftarkan nomor WhatsApp Anda di fonnte.com dan masukkan API Key-nya di file .env backend.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variable .env yang diperlukan</label>
                <div className="p-4 rounded-2xl bg-gray-900 font-mono text-xs text-green-400 space-y-1">
                  <p>WHATSAPP_API_KEY=<span className="text-yellow-400">your_fonnte_key</span></p>
                  <p>WHATSAPP_API_URL=<span className="text-yellow-400">https://api.fonnte.com/send</span></p>
                </div>
              </div>
              <a href="https://fonnte.com" target="_blank" rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-green-500 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                <MessageSquare size={16} /> Daftar di Fonnte.com
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
