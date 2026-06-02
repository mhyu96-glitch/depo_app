import { useState, useEffect } from 'react';
import { assetApi } from '../api';
import { 
  Activity, ShieldCheck, AlertTriangle, RefreshCw, 
  Settings, Info, Zap, Droplets, Filter, Clock,
  Calendar, CheckCircle2, LayoutGrid
} from 'lucide-react';

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

const AssetCard = ({ asset, onReset }) => {
  const percent = Math.min(100, (asset.current_gallons / asset.lifespan_gallons) * 100);
  const isCritical = percent > 90;
  const isWarning = percent > 75 && !isCritical;
  
  return (
    <div className="card p-6 border-none shadow-xl relative overflow-hidden group">
      {/* Dynamic Glow Effect */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 transition-transform group-hover:scale-125 ${isCritical ? 'bg-red-500' : 'bg-primary-500'}`} />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
           <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all ${
              isCritical ? 'bg-red-500 text-white animate-pulse' : 'bg-primary-50 dark:bg-primary-900/10 text-primary-500'
           }`}>
              {asset.type === 'uv' ? <Zap size={28} /> : asset.type === 'membrane' ? <Droplets size={28} /> : <Filter size={28} />}
           </div>
           <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{asset.name}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{asset.branch_name}</p>
           </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
           isCritical ? 'bg-red-100 text-red-600' : isWarning ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
        }`}>
           {isCritical ? 'URGENT CHANGE' : isWarning ? 'REPLACE SOON' : 'OPTIMAL'}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
         <div className="flex justify-between items-end">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Masa Pakai</p>
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{asset.current_gallons.toLocaleString()}</span>
                  <span className="text-xs font-bold text-gray-400">/ {asset.lifespan_gallons.toLocaleString()} Galon</span>
               </div>
            </div>
            <div className="text-right">
               <p className="text-2xl font-black text-gray-900 dark:text-white">{percent.toFixed(0)}%</p>
               <p className="text-[9px] font-black text-gray-400 uppercase">Usage Level</p>
            </div>
         </div>

         {/* Health Bar */}
         <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-primary-500'}`}
              style={{ width: `${percent}%` }} 
            />
         </div>

         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-800">
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Terakhir Ganti</p>
               <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{new Date(asset.last_change).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'2-digit' })}</span>
               </div>
            </div>
            <div className="flex flex-col justify-end items-end">
               <button 
                 onClick={() => onReset(asset.id)}
                 className="flex items-center gap-1.5 text-[10px] font-black text-primary-500 hover:text-primary-600 uppercase tracking-widest"
               >
                  <RefreshCw size={12} /> Reset Meter
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default function AssetHealth() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await assetApi.getAll();
      setAssets(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleReset = async (id) => {
    if (window.confirm('Apakah Anda yakin telah mengganti komponen ini? Meteran penggunaan akan direset ke 0.')) {
      try {
        await assetApi.reset(id);
        loadData();
      } catch (_) {}
    }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse">ANALYSING SYSTEM INTEGRITY...</div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in font-outfit pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
             <div className="w-2 h-10 bg-primary-500 rounded-full" />
             Smart Health Monitoring
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Pantau kesehatan filter dan lampu UV secara real-time</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-6 py-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">System Online</span>
           </div>
        </div>
      </div>

      {/* Grid Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {assets.map(asset => (
            <AssetCard key={asset.id} asset={asset} onReset={handleReset} />
         ))}

         {/* Summary AI Card */}
         <div className="card p-8 bg-gradient-to-br from-gray-900 to-black text-white border-none shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Activity size={180} /></div>
            <div className="relative z-10">
               <h3 className="text-xl font-black tracking-tight mb-2 flex items-center gap-2">
                  <Zap className="text-yellow-400" size={24} /> 
                  System Intelligence
               </h3>
               <p className="text-sm font-bold opacity-80 leading-relaxed italic mt-4">
                  "Semua sistem sterilisasi UV berfungsi optimal. Disarankan pengecekan filter sedimen di **Cabang Melati** dalam 48 jam ke depan."
               </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">System Integrity</p>
                     <p className="text-lg font-black text-green-400">94.2%</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Laporan Audit</button>
               </div>
            </div>
         </div>
      </div>

      {/* Maintenance Recommendations Section */}
      <div className="card p-8 border-none shadow-xl bg-white dark:bg-gray-900">
         <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <ShieldCheck className="text-primary-500" size={18} />
            Rekomendasi Maintenance Mingguan
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Pembersihan Kaca UV', desc: 'Bersihkan tabung kuarsa lampu UV dengan kain lembut untuk menjaga radiasi optimal.', icon: 'cleaning_services' },
              { title: 'Backwash Sand Filter', desc: 'Lakukan backwash rutin 15 menit setiap 2 hari untuk menjaga kejernihan air baku.', icon: 'settings_backup_restore' },
              { title: 'Cek TDS Akhir', desc: 'Pastikan angka TDS air minum tetap stabil di bawah ambang batas standar depo.', icon: 'biotech' }
            ].map((r, i) => (
              <div key={i} className="space-y-3 p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:scale-[1.02] transition-transform group">
                 <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                    <MI name={r.icon} size={24} />
                 </div>
                 <h4 className="text-base font-black tracking-tight">{r.title}</h4>
                 <p className="text-xs font-medium text-gray-500 leading-relaxed">{r.desc}</p>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
