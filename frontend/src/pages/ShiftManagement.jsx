import { useState, useEffect } from 'react';
import api from '../api';
import { Clock, DollarSign, CheckCircle, AlertTriangle, RefreshCw, X, TrendingDown, Plus } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function ShiftManagement() {
  const [shifts, setShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openForm, setOpenForm] = useState({ opening_cash: '', notes: '' });
  const [closeForm, setCloseForm] = useState({ closing_cash: '', notes: '' });

  const load = async () => {
    try {
      const [allRes, activeRes] = await Promise.all([api.get('/shifts'), api.get('/shifts/active')]);
      setShifts(allRes.data.data);
      setActiveShift(activeRes.data.data);
    } catch (_) {}
  };
  useEffect(() => { load(); }, []);

  const openShift = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shifts/open', { opening_cash: parseFloat(openForm.opening_cash), notes: openForm.notes });
      setShowOpenModal(false); setOpenForm({ opening_cash: '', notes: '' }); load();
    } catch (_) {}
  };

  const closeShift = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/shifts/${activeShift.id}/close`, { closing_cash: parseFloat(closeForm.closing_cash), notes: closeForm.notes });
      setShowCloseModal(false); setCloseForm({ closing_cash: '', notes: '' }); load();
    } catch (_) {}
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in font-outfit pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Clock className="text-indigo-500" size={28} /> Manajemen Shift Kasir
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Buka / Tutup Shift · Rekap Setoran · Selisih Kas</p>
        </div>
        <div className="flex gap-3">
          {!activeShift ? (
            <button onClick={()=>setShowOpenModal(true)} className="px-5 py-2.5 rounded-2xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20">
              <Plus size={16} /> Buka Shift
            </button>
          ) : (
            <button onClick={()=>setShowCloseModal(true)} className="px-5 py-2.5 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/20">
              <X size={16} /> Tutup Shift
            </button>
          )}
          <button onClick={load} className="p-2.5 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-indigo-500"><RefreshCw size={18} /></button>
        </div>
      </div>

      {/* Active Shift Banner */}
      {activeShift && (
        <div className="card p-6 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white border-none shadow-2xl shadow-indigo-500/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Shift Aktif Sekarang</p>
              <h2 className="text-xl font-black mt-1">{activeShift.user_name}</h2>
              <p className="text-xs font-bold opacity-70 mt-0.5">{activeShift.branch_name} · Dibuka: {new Date(activeShift.opened_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Modal Awal', value: fmt(activeShift.opening_cash) },
                { label: 'Total Penjualan', value: fmt(activeShift.total_sales) },
                { label: 'Transaksi', value: `${activeShift.total_transactions} Order` },
              ].map((s,i) => (
                <div key={i} className="text-center bg-white/10 p-3 rounded-2xl">
                  <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">{s.label}</p>
                  <p className="text-sm font-black mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shift History */}
      <div className="card p-0 overflow-hidden border-none shadow-xl">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Riwayat Shift</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50">
              {['Kasir','Cabang','Buka','Tutup','Modal','Penjualan','Kas Aktual','Selisih','Status'].map(h=>(
                <th key={h} className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y dark:divide-gray-800">
              {shifts.map(s => {
                const diff = s.difference;
                return (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-4 text-sm font-black text-gray-900 dark:text-white">{s.user_name}</td>
                    <td className="px-4 py-4 text-xs font-bold text-gray-500">{s.branch_name}</td>
                    <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">{new Date(s.opened_at).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                    <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">{s.closed_at?new Date(s.closed_at).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'-'}</td>
                    <td className="px-4 py-4 text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmt(s.opening_cash)}</td>
                    <td className="px-4 py-4 text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmt(s.total_sales)}</td>
                    <td className="px-4 py-4 text-xs font-black text-gray-900 dark:text-white whitespace-nowrap">{s.closing_cash!=null?fmt(s.closing_cash):'-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {diff!=null ? (
                        <span className={`text-xs font-black ${diff<0?'text-red-500':diff>0?'text-orange-500':'text-green-500'}`}>
                          {diff===0?'✓ BALANCE':diff<0?`-${fmt(Math.abs(diff))}`:fmt(diff)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${s.status==='open'?'bg-green-100 text-green-600 animate-pulse':'bg-gray-100 text-gray-600'}`}>
                        {s.status==='open'?'BERJALAN':'TUTUP'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={()=>setShowOpenModal(false)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white text-xl">Buka Shift Baru</h3>
              <button onClick={()=>setShowOpenModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={openShift} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Modal Kas Awal (Rp)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                  <input 
                    required type="number" value={openForm.opening_cash} 
                    onChange={e=>setOpenForm({...openForm,opening_cash:e.target.value})} 
                    placeholder="500000" className="input w-full pl-12 py-4 px-5 font-black" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Catatan Pembukaan</label>
                <input 
                  value={openForm.notes} onChange={e=>setOpenForm({...openForm,notes:e.target.value})} 
                  placeholder="Kondisi kas awal..."
                  className="input w-full py-4 px-5 font-medium" 
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-4 rounded-3xl bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all">
                  Buka Shift Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={()=>setShowCloseModal(false)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white text-xl">Tutup & Rekap Shift</h3>
              <button onClick={()=>setShowCloseModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={closeShift} className="p-8 space-y-6">
              <div className="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Total Penjualan</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{fmt(activeShift?.total_sales)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Modal Awal</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{fmt(activeShift?.opening_cash)}</span>
                </div>
                <div className="pt-2 border-t border-indigo-100 dark:border-indigo-800/30 flex justify-between items-center">
                  <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">Kas Diharapkan</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{fmt((activeShift?.opening_cash||0)+(activeShift?.total_sales||0))}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Uang Kas Aktual (Rp)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                  <input 
                    required type="number" value={closeForm.closing_cash} 
                    onChange={e=>setCloseForm({...closeForm,closing_cash:e.target.value})} 
                    placeholder="Hitung uang kas sekarang" 
                    className="input w-full pl-12 py-4 px-5 font-black text-red-500" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Catatan Penutupan</label>
                <input 
                  value={closeForm.notes} onChange={e=>setCloseForm({...closeForm,notes:e.target.value})} 
                  placeholder="Kelebihan/kekurangan kas..."
                  className="input w-full py-4 px-5 font-medium" 
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-4 rounded-3xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/30 hover:scale-105 transition-all">
                  Tutup Shift & Simpan Rekap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
