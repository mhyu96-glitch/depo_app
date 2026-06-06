import { useState, useEffect } from 'react';
import { courierApi, settingsApi } from '../api';
import { 
  Wallet, DollarSign, Download, Send, 
  TrendingUp, Award, Clock, History,
  FileText, CheckCircle2, MoreHorizontal, Search,
  Filter, Calendar, ArrowUpRight
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function Payroll() {
  const [couriers, setCouriers] = useState([]);
  const [commissionSettings, setCommissionSettings] = useState({
    base_rate: 500,
    threshold_gallons: 60,
    threshold_rate: 1000
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      courierApi.getAll(),
      settingsApi.getCommission()
    ]).then(([courierRes, settingsRes]) => {
      setCouriers(courierRes.data.data);
      setCommissionSettings(settingsRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const calculatePayroll = (c) => {
    const baseSalary = 2500000;
    const gallons = c.gallons_delivered || 0;
    const rate = gallons > commissionSettings.threshold_gallons
      ? commissionSettings.threshold_rate
      : commissionSettings.base_rate;
    const commission = gallons * rate;
    const bonus = (c.performance_score || 80) > 90 ? 250000 : 0;
    return { baseSalary, commission, bonus, total: baseSalary + commission + bonus };
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse">PROCESSING PAYROLL LEDGER...</div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in font-outfit pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
             <div className="w-2 h-10 bg-emerald-500 rounded-full" />
             Auto-Payroll & Komisi
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Sistem penggajian otomatis berdasarkan performa harian kurir</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-emerald-600 text-white py-4 px-8 rounded-2xl shadow-xl shadow-emerald-600/20 font-black tracking-widest text-xs uppercase flex items-center gap-2 hover:bg-emerald-700 transition-all">
              <Download size={18} /> Export Laporan Gaji
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="card p-8 bg-emerald-600 text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><Wallet size={120} /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Budget Gaji Mei</p>
            <h2 className="text-4xl font-black mt-2 tracking-tighter">{fmt(12500000)}</h2>
            <div className="mt-8 flex items-center gap-2 p-2 bg-white/10 rounded-xl border border-white/10 w-fit">
               <CheckCircle2 size={14} className="text-emerald-200" />
               <span className="text-[10px] font-black uppercase">Dana Siap Bayar</span>
            </div>
         </div>
         
         <div className="card p-8 border-none shadow-xl bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 flex items-center justify-center"><TrendingUp size={24} /></div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Komisi Berjalan</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{fmt(3450000)}</h2>
         </div>

         <div className="card p-8 border-none shadow-xl bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/10 text-orange-600 flex items-center justify-center"><Award size={24} /></div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Bonus</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bonus Performa Diberikan</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{fmt(1200000)}</h2>
         </div>
      </div>

      {/* Payroll Table */}
      <div className="card p-0 border-none shadow-xl overflow-hidden bg-white dark:bg-gray-900">
         <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <FileText size={16} className="text-emerald-500" />
               Rincian Gaji Kurir (Periode Mei 2026)
            </h3>
            <div className="relative">
               <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
               <input 
                 type="text" placeholder="Cari kurir..." 
                 className="input pl-10 py-2.5 text-xs font-bold rounded-xl bg-gray-50 dark:bg-gray-800/50 border-none w-full md:w-64" 
                 value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <th className="px-6 py-4">Kurir</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Gaji Pokok</th>
                     <th className="px-6 py-4 text-right">Komisi (Galon)</th>
                     <th className="px-6 py-4 text-right">Bonus Perf.</th>
                     <th className="px-6 py-4 text-right">Total Take Home</th>
                     <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {couriers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => {
                    const pay = calculatePayroll(c);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 flex items-center justify-center font-black text-sm">
                                  {c.name[0]}
                               </div>
                               <div>
                                  <p className="text-xs font-black text-gray-900 dark:text-white">{c.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">{c.whatsapp}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest">READY TO PAY</span>
                         </td>
                         <td className="px-6 py-5 text-right font-bold text-xs text-gray-500">{fmt(pay.baseSalary)}</td>
                         <td className="px-6 py-5 text-right font-bold text-xs text-gray-500">{fmt(pay.commission)}</td>
                         <td className="px-6 py-5 text-right font-bold text-xs text-emerald-500">{pay.bonus > 0 ? `+${fmt(pay.bonus)}` : '-'}</td>
                         <td className="px-6 py-5 text-right">
                            <p className="text-sm font-black text-gray-900 dark:text-white">{fmt(pay.total)}</p>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-2">
                               <button className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500 transition-colors" title="Download Payslip"><Download size={16} /></button>
                               <button className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20" title="Kirim Slip via WA"><Send size={16} /></button>
                            </div>
                         </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
         <div className="p-6 bg-gray-50/50 dark:bg-gray-800/30 border-t dark:border-gray-800 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menampilkan {couriers.length} data kurir aktif</p>
         </div>
      </div>
    </div>
  );
}
