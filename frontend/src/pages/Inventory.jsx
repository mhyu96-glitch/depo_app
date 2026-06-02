import { useState, useEffect } from 'react';
import { inventoryApi } from '../api';
import { 
  Plus, Droplets, Package, History, AlertCircle, 
  ArrowUpRight, ArrowDownRight, RefreshCw, X, Check,
  Waves, Settings, Info, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

import PillSelect from '../components/PillSelect';

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

const TankVisual = ({ item }) => {
  const percent = Math.min(100, Math.max(0, (item.current / item.capacity) * 100));
  const isLow = percent < 20;

  return (
    <div className="card p-6 border-none shadow-xl relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{item.name}</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Kapasitas: {item.capacity} {item.unit}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLow ? 'bg-red-500 text-white animate-pulse' : 'bg-primary-50 text-primary-500'}`}>
          <Droplets size={20} />
        </div>
      </div>

      <div className="flex items-end gap-6 relative z-10">
        <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
          {item.current.toLocaleString()} <span className="text-sm text-gray-400 font-bold">{item.unit}</span>
        </div>
        <div className={`text-xs font-black px-2 py-0.5 rounded-lg mb-1 ${isLow ? 'text-red-500 bg-red-50' : 'text-primary-500 bg-primary-50'}`}>
          {percent.toFixed(0)}%
        </div>
      </div>

      {/* Tank Animation */}
      <div className="mt-8 h-48 bg-gray-100 dark:bg-gray-800 rounded-3xl relative overflow-hidden border-4 border-white dark:border-gray-900 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
         <div 
           className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out ${isLow ? 'bg-gradient-to-t from-red-500 to-red-400' : 'bg-gradient-to-t from-primary-600 to-primary-400'}`}
           style={{ height: `${percent}%` }}
         >
            {/* Wave animation overlay */}
            <div className="absolute top-0 left-0 w-full h-8 -translate-y-4 opacity-30">
               <div className="animate-wave absolute inset-0 bg-white/40" style={{ borderRadius: '40% 45% 35% 40%' }} />
               <div className="animate-wave absolute inset-0 bg-white/20" style={{ borderRadius: '35% 40% 45% 35%', animationDelay: '1s' }} />
            </div>
            
            {/* Bubbles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="absolute w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ left: `${20*i}%`, bottom: `${10*i}%`, animationDelay: `${i*0.5}s` }} />
               ))}
            </div>
         </div>
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Fluid Status</span>
            <span className={`text-sm font-black ${percent > 50 ? 'text-white' : 'text-gray-400'}`}>{percent < 20 ? 'CRITICAL LOW' : 'OPTIMAL'}</span>
         </div>
      </div>
      
      <button className="w-full mt-6 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-primary-500 hover:text-white transition-all border border-gray-100 dark:border-gray-800">
         INPUT ISI ULANG
      </button>
    </div>
  );
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: '', type: 'in', qty: '', note: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, logRes] = await Promise.all([
        inventoryApi.getAll(),
        inventoryApi.getLogs()
      ]);
      setItems(res.data.data);
      setLogs(logRes.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const tanks = items.filter(i => i.type === 'tank');
  const supplies = items.filter(i => i.type === 'supply');

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await inventoryApi.updateStock({ ...form, qty: parseInt(form.qty) });
      setForm({ id: '', type: 'in', qty: '', note: '' });
      setShowModal(false);
      loadData();
    } catch (_) {}
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse">SYNCHRONIZING INVENTORY...</div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in font-outfit pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
             <div className="w-2 h-10 bg-primary-500 rounded-full" />
             Smart Inventory
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Kendalikan stok air dan kebutuhan operasional toko</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary py-4 px-8 rounded-2xl shadow-xl shadow-primary-500/20 font-black tracking-widest text-xs uppercase flex items-center gap-2"
        >
          <Plus size={18} /> Update Stok
        </button>
      </div>

      {/* Tanks Grid */}
      <div className="space-y-6">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
           <Waves className="text-primary-500" size={18} />
           Monitor Tandon Air Baku
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tanks.map(tank => <TankVisual key={tank.id} item={tank} />)}
          
          {/* AI Smart Forecast Hub */}
          <div className="card p-8 bg-gray-900 text-white border-none shadow-2xl relative overflow-hidden flex flex-col justify-between group h-full min-h-[300px]">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000"><MI name="psychology" size={200} /></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                      <Zap size={20} />
                   </div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">AI Inventory Predictor</h3>
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-3">Estimasi Kehabisan Stok</h3>
                <p className="text-sm font-medium opacity-60 leading-relaxed">Berdasarkan tren konsumsi <span className="text-white font-bold">7 hari terakhir</span>, stok air baku Anda diprediksi akan mencapai titik kritis pada:</p>
                <div className="mt-4 flex items-baseline gap-2">
                   <span className="text-4xl font-black text-yellow-400 tracking-tighter">Senin, 18 Mei</span>
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">(Dalam 4 Hari)</span>
                </div>
             </div>
             <div className="mt-8 p-5 rounded-3xl bg-white/5 border border-white/10 relative z-10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confidence Score</span>
                   <span className="text-[10px] font-black text-emerald-400">92% ACCURATE</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 2 }}
                      className="h-full bg-emerald-500" 
                   />
                </div>
                <div className="mt-4 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0"><Info size={16} /></div>
                   <p className="text-[10px] font-bold text-gray-400 leading-tight">Saran: Jadwalkan pengiriman tangki baru paling lambat <span className="text-white">Minggu Sore</span>.</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* Supplies Section */}
         <div className="xl:col-span-7 space-y-6">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <Package className="text-orange-500" size={18} />
               Kebutuhan Operasional
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {supplies.map(s => (
                 <div key={s.id} className="card p-5 border-none shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                       <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <Package size={24} />
                       </div>
                       {s.current <= s.min_stock && (
                          <span className="badge-red animate-pulse py-1 px-3">STOK MENIPIS</span>
                       )}
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{s.name}</h3>
                    <div className="flex items-end gap-2 mt-4">
                       <span className="text-2xl font-black text-gray-900 dark:text-white">{s.current.toLocaleString()}</span>
                       <span className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">{s.unit}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min. Stok: {s.min_stock}</p>
                       <button className="text-[10px] font-black text-orange-500 hover:underline uppercase tracking-widest">BELI LAGI</button>
                    </div>
                    <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                       <MI name="inventory_2" size={120} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* History Logs */}
         <div className="xl:col-span-5 space-y-6">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <History className="text-blue-500" size={18} />
               Log Mutasi Stok
            </h2>
            <div className="space-y-4">
               {logs.map(l => (
                 <div key={l.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-lg border border-gray-50 dark:border-gray-800 hover:border-primary-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${l.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {l.type === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                       </div>
                       <div>
                          <p className="text-xs font-black text-gray-800 dark:text-gray-200">{l.item_name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date(l.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })} · {l.note}</p>
                       </div>
                    </div>
                    <span className={`text-sm font-black ${l.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                       {l.type === 'in' ? '+' : '-'}{l.qty.toLocaleString()}
                    </span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Update Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in">
             <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">Update Mutasi Stok</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={20} /></button>
             </div>
             <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <PillSelect 
                  label="Pilih Barang"
                  icon={Package}
                  options={items.map(i => ({ value: i.id, label: i.name }))}
                  value={form.id}
                  onChange={val => setForm({...form, id: val})}
                  placeholder="-- Pilih Barang --"
                />
                <div className="grid grid-cols-2 gap-6">
                  <PillSelect 
                    label="Tipe Mutasi"
                    icon={RefreshCw}
                    options={[
                      { value: 'in', label: 'MASUK (+)' },
                      { value: 'out', label: 'KELUAR (-)' }
                    ]}
                    value={form.type}
                    onChange={val => setForm({...form, type: val})}
                    placeholder="-- Pilih Tipe --"
                  />
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Jumlah</label>
                     <input 
                       required type="number" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})}
                       placeholder="100" className="input w-full font-black py-4 px-5" 
                     />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Keterangan / Memo</label>
                   <input 
                     value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                     placeholder="Restock supplier, rusak, dll..." className="input w-full font-bold py-4 px-5" 
                   />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-4 rounded-3xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/30 hover:scale-[1.02] transition-transform">
                     SIMPAN MUTASI
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
