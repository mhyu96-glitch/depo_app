import { useState, useEffect } from 'react';
import { dashboardApi } from '../api';
import { 
  Trophy, Medal, Target, TrendingUp, Users, 
  MapPin, Star, Award, ChevronUp, ChevronDown,
  ArrowUpRight, BarChart3, PieChart as PieIcon, Building2,
  Zap, ArrowRight, Activity
} from 'lucide-react';
import { Skeleton, CardSkeleton, TableSkeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

const RankCard = ({ rank, name, value, label, type = 'courier' }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.1 }}
    className="flex items-center justify-between p-6 rounded-[2.5rem] bg-white dark:bg-gray-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-50 dark:border-gray-800 hover:shadow-2xl hover:scale-[1.02] transition-all group relative overflow-hidden"
  >
     {rank === 1 && <div className="absolute top-0 right-0 p-4 text-yellow-400 opacity-10 rotate-12 group-hover:rotate-0 transition-transform"><Trophy size={80} /></div>}
     <div className="flex items-center gap-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg relative ${
           rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 
           rank === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-white' : 
           rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' : 'bg-gray-100 text-gray-400'
        }`}>
           {rank}
           {rank === 1 && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] text-yellow-600 shadow-sm">👑</motion.div>}
        </div>
        <div>
           <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">{name}</h4>
           <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-[9px] font-black text-gray-400 uppercase tracking-widest">{type === 'courier' ? 'Elite Courier' : 'Regional Branch'}</span>
              <div className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5"><ChevronUp size={10} /> Active</span>
           </div>
        </div>
     </div>
     <div className="text-right relative z-10">
        <p className="text-2xl font-black text-primary-500 tracking-tighter leading-none">{value}</p>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1.5">{label}</p>
     </div>
  </motion.div>
);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simulate complex data processing
    setTimeout(() => {
      setData({
        top_couriers: [
          { name: 'Andi Saputra', score: 145, rating: 4.9 },
          { name: 'Budi Raharjo', score: 128, rating: 4.7 },
          { name: 'Siti Aminah', score: 115, rating: 4.8 }
        ],
        top_branches: [
          { name: 'Depo Pusat', sales: 'Rp 85.4M', growth: '+12%' },
          { name: 'Cabang Melati', sales: 'Rp 42.1M', growth: '+8%' },
          { name: 'Cabang Mawar', sales: 'Rp 38.5M', growth: '+15%' }
        ],
        targets: [
          { label: 'Target Penjualan', current: 8500, goal: 10000, color: 'bg-primary-500', icon: 'shopping_bag' },
          { label: 'Akuisisi Member', current: 42, goal: 50, color: 'bg-indigo-500', icon: 'person_add' },
          { label: 'Efisiensi Armada', current: 92, goal: 100, color: 'bg-emerald-500', icon: 'local_shipping' }
        ]
      });
      setLoading(false);
    }, 1200);
  }, []);

  if (loading) return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in font-outfit pb-20">
       <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-4">
          <div className="space-y-4"><Skeleton className="h-8 w-48 mb-6" /><TableSkeleton rows={3} /></div>
          <div className="space-y-4"><Skeleton className="h-8 w-48 mb-6" /><TableSkeleton rows={3} /></div>
       </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in font-outfit pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-[0.2em]">Strategic Hub</span>
              <span className="text-gray-300 text-xs font-bold flex items-center gap-1"><Activity size={14} className="text-emerald-500" /> Real-time Analytics</span>
           </div>
           <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
              Performance Leaderboard
           </h1>
           <p className="text-gray-400 font-bold mt-1">Pantau produktivitas tim dan pencapaian target bisnis depo Anda.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800 flex items-center gap-4 pr-6">
           <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-inner">
              <BarChart3 size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Periode Laporan</p>
              <p className="text-sm font-black text-gray-800 dark:text-white">Mei 2026</p>
           </div>
        </div>
      </div>

      {/* Target Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {data.targets.map((t, i) => (
           <motion.div 
             key={i} 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="card p-8 border-white shadow-2xl shadow-gray-200/50 relative overflow-hidden group"
           >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100" />
              <div className="flex justify-between items-center mb-8 relative z-10">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${t.color}/10 ${t.color.replace('bg-', 'text-')} flex items-center justify-center`}>
                       <MI name={t.icon} size={20} />
                    </div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.label}</h3>
                 </div>
                 <div className="px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-500">{((t.current/t.goal)*100).toFixed(0)}%</div>
              </div>
              <div className="flex items-baseline gap-2 mb-6 relative z-10">
                 <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{t.current.toLocaleString()}</span>
                 <span className="text-sm font-bold text-gray-300 italic tracking-tight">/ {t.goal.toLocaleString()}</span>
              </div>
              <div className="h-4 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden mb-3 p-1 border border-gray-100 dark:border-gray-700">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(t.current/t.goal)*100}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className={`h-full ${t.color} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
                 />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
                 <span className="text-gray-400">Pencapaian</span>
                 <span className={`${t.color.replace('bg-', 'text-')}`}>+{t.goal - t.current} Unit Lagi</span>
              </div>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-4">
         {/* Courier Leaderboard */}
         <div className="space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-yellow-400/10 text-yellow-500 flex items-center justify-center shadow-sm border border-yellow-400/20"><Trophy size={28} /></div>
                  <div>
                     <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">The Elite Squad</h2>
                     <p className="text-xs font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Peringkat Kurir Terbaik Minggu Ini</p>
                  </div>
               </div>
               <button className="text-[10px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">Semua <ArrowRight size={14} /></button>
            </div>
            <div className="space-y-5">
               {data.top_couriers.map((c, i) => (
                 <RankCard key={i} rank={i+1} name={c.name} value={c.score} label="Performance Points" type="courier" />
               ))}
            </div>
         </div>

         {/* Branch Leaderboard */}
         <div className="space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-primary-500/10 text-primary-500 flex items-center justify-center shadow-sm border border-primary-500/20"><Building2 size={28} /></div>
                  <div>
                     <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">Branch Performance</h2>
                     <p className="text-xs font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Aktivitas Cabang & Pertumbuhan</p>
                  </div>
               </div>
               <button className="text-[10px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">Bandingkan <ArrowRight size={14} /></button>
            </div>
            <div className="space-y-5">
               {data.top_branches.map((b, i) => (
                 <RankCard key={i} rank={i+1} name={b.name} value={b.sales} label={b.growth} type="branch" />
               ))}
            </div>
         </div>
      </div>

      {/* Advanced Insights Section */}
      <div className="relative">
         <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-[3rem] blur opacity-20" />
         <div className="card p-12 bg-gray-900 text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"><Zap size={300} /></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative z-10">
               <div className="space-y-6">
                  <div className="flex items-center gap-3 text-yellow-400">
                     <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center"><Star size={18} fill="currentColor" /></div>
                     <span className="text-[11px] font-black uppercase tracking-[0.2em]">Customer Trust</span>
                  </div>
                  <h3 className="text-6xl font-black tracking-tighter">4.9 <span className="text-xl font-bold opacity-30">/ 5.0</span></h3>
                  <p className="text-sm font-medium opacity-60 leading-relaxed">Kepuasan pelanggan mencapai rekor tertinggi berkat ketepatan waktu pengiriman kurir elite.</p>
               </div>
               <div className="space-y-6">
                  <div className="flex items-center gap-3 text-emerald-400">
                     <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center"><TrendingUp size={18} /></div>
                     <span className="text-[11px] font-black uppercase tracking-[0.2em]">Operational Saving</span>
                  </div>
                  <h3 className="text-6xl font-black tracking-tighter">24% <span className="text-xl font-bold opacity-30">OPT</span></h3>
                  <p className="text-sm font-medium opacity-60 leading-relaxed">Penghematan signifikan pada biaya distribusi melalui optimasi rute cerdas Command Center.</p>
               </div>
               <div className="space-y-6">
                  <div className="flex items-center gap-3 text-primary-400">
                     <div className="w-8 h-8 rounded-lg bg-primary-400/20 flex items-center justify-center"><Users size={18} /></div>
                     <span className="text-[11px] font-black uppercase tracking-[0.2em]">Retention Score</span>
                  </div>
                  <h3 className="text-6xl font-black tracking-tighter">96% <span className="text-xl font-bold opacity-30">STAY</span></h3>
                  <p className="text-sm font-medium opacity-60 leading-relaxed">Hampir seluruh pelanggan tetap Anda melakukan pemesanan ulang secara konsisten setiap minggu.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
