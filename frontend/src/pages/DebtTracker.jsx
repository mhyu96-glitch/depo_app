import { useState, useEffect } from 'react';
import api from '../api';
import { AlertCircle, DollarSign, CheckCircle, Clock, MessageSquare, X, RefreshCw, Phone, TrendingDown } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function DebtTracker() {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/debts');
      setDebts(res.data.data);
      setSummary(res.data.summary);
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const recordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/debts/${selected.id}/pay`, { amount: parseFloat(payAmount), note: payNote });
      setSelected(null); setPayAmount(''); setPayNote(''); load();
    } catch (_) {}
  };

  const sendReminder = async (id) => {
    try { await api.post(`/debts/${id}/remind`); alert('Pengingat terkirim!'); } catch (_) {}
  };

  const filtered = filter === 'all' ? debts : debts.filter(d => d.status === filter);
  const statusLabel = { overdue: 'Jatuh Tempo', partial: 'Bayar Sebagian', active: 'Aktif', all: 'Semua' };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in font-outfit pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <TrendingDown className="text-red-500" size={28} /> Tracker Piutang Pelanggan
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Hutang Pelanggan · Catat Pembayaran · Kirim Tagihan WA</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-red-500"><RefreshCw size={18} className={loading?'animate-spin':''} /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Piutang', value: fmt(summary?.total_receivable), icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10', small: true },
          { label: 'Jatuh Tempo', value: summary?.overdue_count || 0, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
          { label: 'Aktif', value: summary?.active_count || 0, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
          { label: 'Total Debitur', value: debts.length, icon: Phone, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
        ].map((s,i) => (
          <div key={i} className="card p-5 border-none shadow-xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}><s.icon size={22} className={s.color} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
              <p className={`font-black text-gray-900 dark:text-white ${s.small?'text-base':'text-2xl'}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all','overdue','partial','active'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter===f?'bg-red-500 text-white shadow-lg shadow-red-500/20':'bg-white dark:bg-gray-900 text-gray-500 shadow-sm'}`}>
            {statusLabel[f]} {f!=='all'&&`(${debts.filter(d=>d.status===f).length})`}
          </button>
        ))}
      </div>

      {/* Debt Cards */}
      <div className="space-y-4">
        {filtered.map(d => (
          <div key={d.id} className={`card p-6 border-none shadow-xl hover:shadow-2xl transition-all ${d.status==='overdue'?'border-l-4 border-l-red-500':d.status==='partial'?'border-l-4 border-l-orange-400':''}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${d.status==='overdue'?'bg-red-100 dark:bg-red-900/20 text-red-500':d.status==='partial'?'bg-orange-100 dark:bg-orange-900/20 text-orange-500':'bg-blue-100 dark:bg-blue-900/20 text-blue-500'}`}>
                  {d.status==='overdue'?<AlertCircle size={22} />:d.status==='partial'?<Clock size={22} />:<DollarSign size={22} />}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white">{d.customer_name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d.invoice_number} · {d.branch_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${d.status==='overdue'?'bg-red-100 text-red-600':d.status==='partial'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>
                      {statusLabel[d.status]}
                    </span>
                    {d.days_overdue>0&&<span className="text-[9px] font-black text-red-500">{d.days_overdue} hari lewat jatuh tempo</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Sisa Hutang</p>
                  <p className="text-xl font-black text-red-600">{fmt(d.remaining)}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">dari {fmt(d.total_debt)} · Bayar {fmt(d.paid_amount)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setSelected(d)} className="px-4 py-2 rounded-xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-600 flex items-center gap-1.5">
                    <CheckCircle size={12} /> Catat Bayar
                  </button>
                  <button onClick={() => sendReminder(d.id)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-green-50 hover:text-green-600 flex items-center gap-1.5">
                    <MessageSquare size={12} /> Tagih WA
                  </button>
                </div>
              </div>
            </div>
            {/* Partial Payment Bar */}
            {d.paid_amount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  <span>Progres Pembayaran</span>
                  <span>{((d.paid_amount/d.total_debt)*100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${(d.paid_amount/d.total_debt)*100}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-16"><CheckCircle size={48} className="mx-auto text-green-300 mb-4" /><p className="font-black text-gray-400">Tidak ada piutang {filter!=='all'?statusLabel[filter].toLowerCase():''}</p></div>
        )}
      </div>

      {/* Payment Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setSelected(null)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl relative z-10">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white">Catat Pembayaran</h3>
              <button onClick={()=>setSelected(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={recordPayment} className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10">
                <p className="font-black text-gray-900 dark:text-white">{selected.customer_name}</p>
                <p className="text-xs text-gray-500">{selected.invoice_number}</p>
                <p className="text-lg font-black text-red-600 mt-1">Sisa: {fmt(selected.remaining)}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jumlah Dibayar (Rp)</label>
                <input required type="number" max={selected.remaining} value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder={selected.remaining} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</label>
                <input value={payNote} onChange={e=>setPayNote(e.target.value)} placeholder="Bayar cash / transfer BCA" className="input mt-1 w-full" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>{setPayAmount(selected.remaining);}} className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-black uppercase">Bayar Lunas</button>
                <button type="submit" className="flex-1 py-3 rounded-2xl bg-green-500 text-white text-xs font-black uppercase shadow-lg shadow-green-500/20">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
