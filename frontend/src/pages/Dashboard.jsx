import { useEffect, useState } from 'react';
import { dashboardApi, transactionApi, customerApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, DollarSign, Truck, Gift, RefreshCw,
  AlertCircle, ShoppingCart, Home, ArrowUpRight,
  Zap, Package, CheckCircle, Info, Plus, X,
  Clock, CreditCard, ChevronRight, Award, BarChart3,
  Settings, Wrench, MapPin, Navigation
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { Link } from 'react-router-dom';
import { CardSkeleton } from '../components/Skeleton';

// Material Icons Component
const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border-none shadow-2xl rounded-2xl ring-1 ring-black/5 dark:ring-white/10 animate-scale-in">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-8 mb-1 last:mb-0">
            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="text-sm font-black text-gray-900 dark:text-white">
              {entry.name.includes('Penjualan') || entry.name.includes('Omset') ? fmt(entry.value) : fmtNum(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const WidgetCard = ({ title, value, sub, icon: Icon, color, link, trend = null }) => (
  <Link to={link} className="card p-5 hover:shadow-xl transition-all group overflow-hidden relative border-none">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform ${color}`} />
    <div className="flex flex-col h-full relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${color}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend > 0 ? <ArrowUpRight size={12} /> : <TrendingUp size={12} className="rotate-180" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white truncate tracking-tighter mt-1">{value}</p>
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 truncate">{sub}</p>
      </div>
    </div>
  </Link>
);

export default function Dashboard() {
  const { user, isAdmin: isAdminRole } = useAuth();
  const isAdmin = isAdminRole; // Gunakan dari context, sudah include branch_admin
  const [widgets, setWidgets]   = useState(null);
  const [trend, setTrend]       = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [branches, setBranches] = useState([]);
  const [latestTx, setLatestTx] = useState([]);
  const [aiProjection, setAiProjection] = useState([]);
  const [health, setHealth]     = useState(null);
  const [loading, setLoading]   = useState(true);
  
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [selectedLoyalty, setSelectedLoyalty] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = isAdmin ? {} : { branch_id: user?.branch_id };
      const [w, t, dt, b, l, ap, h] = await Promise.all([
        dashboardApi.getWidgets(params),
        dashboardApi.getSalesTrend(params),
        dashboardApi.getDailySalesTrend(params),
        isAdmin ? dashboardApi.getBranchComparison() : Promise.resolve({ data: { data: [] } }),
        transactionApi.getAll({ ...params, limit: 5 }),
        dashboardApi.getAIProjection(),
        dashboardApi.getBusinessHealth()
      ]);
      setWidgets(w.data.data);
      setTrend(t.data.data);
      setDailyTrend(dt.data.data);
      setBranches(b.data.data);
      setLatestTx(l.data.data);
      setAiProjection(ap.data.data);
      setHealth(h.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openLoyaltyDetail = (customer) => {
    setSelectedLoyalty(customer);
    setShowLoyaltyModal(true);
  };

  if (loading) return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in font-outfit pb-10">
       <div className="flex justify-between items-center mb-4">
          <div className="space-y-2">
             <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
             <div className="h-4 w-48 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse" />
          </div>
          <div className="flex gap-3">
             <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
             <div className="h-12 w-32 bg-primary-200 dark:bg-primary-900/30 rounded-2xl animate-pulse" />
          </div>
       </div>
       <CardSkeleton count={4} />
       <div className="h-[400px] w-full bg-gray-200 dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in font-outfit pb-10 overflow-hidden">
      {/* AI Strategic Intelligence Hub */}
      <div className="card p-1 bg-gradient-to-r from-primary-500 via-indigo-600 to-purple-600 rounded-[2.5rem] shadow-2xl shadow-primary-500/20 overflow-hidden group">
         <div className="bg-white dark:bg-gray-950 rounded-[2.3rem] p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
               <Zap size={200} />
            </div>
            
            <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 shadow-inner relative">
               <div className="absolute inset-0 bg-primary-500 rounded-3xl animate-ping opacity-20" />
               <Zap size={32} className="text-primary-500 fill-current relative z-10" />
            </div>

            <div className="flex-1 space-y-2">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">AI Strategic Briefing</span>
                  <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ANALYSIS</span>
               </div>
               <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Halo {user?.name?.split(' ')[0]}, Bisnis Anda menunjukkan tren <span className="text-primary-500">Positif (+12.5%)</span> pagi ini.
               </h2>
               <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800 text-[10px] font-black uppercase tracking-widest">
                     <CheckCircle size={12} /> Operasional Aman
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800 text-[10px] font-black uppercase tracking-widest">
                     <TrendingUp size={12} /> Target 94% Tercapai
                  </div>
               </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
               <button className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                  LIHAT INSIGHT LENGKAP
               </button>
            </div>
         </div>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
            <div className="w-2 h-10 bg-primary-500 rounded-full" />
            Dashboard Command Center
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
            {user?.branch && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full border border-primary-100 dark:border-primary-800 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <MapPin size={12} className="fill-current opacity-70" />
                {user.branch}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-primary-500 transition-all hover:rotate-180 duration-500">
            <RefreshCw size={20} />
          </button>
          <Link to="/pos" className="btn-primary py-3 px-6 rounded-2xl shadow-xl shadow-primary-500/20 font-black tracking-widest text-xs uppercase">
            <Plus size={18} /> Transaksi Baru
          </Link>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <WidgetCard
          title="Penjualan Hari Ini"
          value={fmt(widgets?.today_sales?.total)}
          sub={`${fmtNum(widgets?.today_sales?.gallons)} Galon · ${fmtNum(widgets?.today_sales?.count)} Order`}
          icon={TrendingUp} color="bg-gradient-to-br from-primary-500 to-primary-600"
          link="/pos" trend={12.5}
        />
        <WidgetCard
          title="Total Kas Toko"
          value={fmt(widgets?.cash_balance)}
          sub="Saldo tersedia saat ini"
          icon={DollarSign} color="bg-gradient-to-br from-brand-500 to-brand-600"
          link="/cashflow" trend={5.2}
        />
        <WidgetCard
          title="Pengiriman Aktif"
          value={fmtNum(widgets?.delivery_today?.count)}
          sub={`Estimasi komisi: ${fmt(widgets?.delivery_today?.total_commission)}`}
          icon={Truck} color="bg-gradient-to-br from-purple-500 to-purple-600"
          link="/attendance"
        />
        <WidgetCard
          title="Klaim Galon Gratis"
          value={`${widgets?.loyalty_due_customers?.length || 0} Member`}
          sub="Pelanggan mencapai target loyalty"
          icon={Gift} color="bg-gradient-to-br from-orange-500 to-pink-500"
          link="/customers"
        />
      </div>
      
      {/* Strategic Vision Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
        <div className="lg:col-span-12 card p-6 bg-white dark:bg-gray-900 border-none shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
           
           <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * (health?.score || 0)) / 100} className="text-primary-500 transition-all duration-1000" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{health?.score || 0}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest -mt-1">BHI SCORE</span>
                 </div>
              </div>
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${health?.score >= 80 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                 {health?.status || 'Calculating...'}
              </div>
           </div>

           <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                 <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Business Health Index (BHI)</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Holistic Operational Performance</p>
                 </div>
                 <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-primary-100 dark:border-primary-800">
                    <Zap size={14} className="fill-current" /> AI Powered Analysis
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { label: 'Profitability', key: 'profitability', icon: 'payments' },
                   { label: 'Asset Health', key: 'asset_integrity', icon: 'precision_manufacturing' },
                   { label: 'Loyalty Growth', key: 'loyalty_growth', icon: 'star' },
                   { label: 'Retention', key: 'retention', icon: 'person_add' }
                 ].map(m => (
                   <div key={m.key} className="space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><MI name={m.icon} size={14} /> {m.label}</span>
                         <span className="text-xs font-black text-gray-900 dark:text-white">{health?.metrics?.[m.key] || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                         <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: `${health?.metrics?.[m.key] || 0}%` }} />
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-start gap-4">
                 <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center text-primary-500 shadow-sm shrink-0 mt-0.5">
                    <Info size={16} />
                 </div>
                 <p className="text-sm font-bold text-gray-600 dark:text-gray-400 leading-relaxed italic">
                    "{health?.insight || 'Menganalisa data bisnis Anda...'}"
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Grid: Charts & Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Charts (8/12) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Daily Sales Trend */}
          <div className="card p-6 border-none shadow-xl shadow-gray-200/50">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <MI name="bar_chart" className="text-brand-500" size={18} />
                 Omset Penjualan 7 Hari Terakhir
               </h2>
               <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Total:</span>
                  <span className="text-[11px] font-black text-brand-600">{fmt(dailyTrend.reduce((acc, curr) => acc + curr.total_sales, 0))}</span>
               </div>
             </div>
             <div className="h-[280px]">
                {dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="8 8" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={v => new Date(v).toLocaleDateString('id-ID', { weekday: 'short' })} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}rb`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="total_sales" name="Omset" fill="#f59e0b" radius={[10, 10, 0, 0]} barSize={40}>
                         {dailyTrend.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === dailyTrend.length - 1 ? '#3b82f6' : '#f59e0b'} fillOpacity={0.8} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 font-bold text-sm">Loading data harian...</div>
                )}
             </div>
          </div>

          {/* Distribution & Fleet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="card p-6 border-none shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-500/5 rounded-full" />
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative z-10">
                  <MI name="donut_large" className="text-primary-500" size={18} />
                  Beli Langsung vs Di Antar
                </h2>
                <div className="h-64 relative z-10">
                  {widgets?.type_distribution ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={widgets.type_distribution} 
                          dataKey="value" nameKey="name" 
                          cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8}
                        >
                          {widgets.type_distribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} cornerRadius={12} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-gray-300">Memuat data...</div>}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Order</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white mt-1">{widgets?.today_sales?.count || 0}</span>
                  </div>
                </div>
                <div className="flex justify-center gap-8 mt-6 relative z-10">
                   {(widgets?.type_distribution || []).map((t, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                         <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                           <span className="text-[10px] font-black text-gray-400 uppercase">{t.name.split(' ')[0]}</span>
                         </div>
                         <span className="text-sm font-black text-gray-900 dark:text-white">{t.value} <span className="text-[10px] text-gray-400 font-bold">Order</span></span>
                      </div>
                   ))}
                </div>
             </div>

             {/* Motorcycle Animation & Fleet Summary */}
             <div className="card p-6 border-none shadow-xl bg-white dark:bg-gray-900 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <MI name="delivery_dining" className="text-primary-500" size={18} />
                      Armada Pengiriman
                   </h2>
                   <span className="badge-green px-3 py-1 font-black tracking-widest text-[9px] uppercase">3 ONLINE</span>
                </div>

                <div className="flex-1 flex flex-col justify-center py-6 relative">
                   {/* Road Graphic */}
                   <div className="absolute bottom-12 left-0 w-full h-[2px] bg-gray-100 dark:bg-gray-800" />
                   <div className="absolute bottom-12 left-0 w-full h-[2px] bg-primary-500/20 animate-pulse-slow" />
                   
                   <div className="overflow-hidden h-20 w-full relative">
                      <div className="animate-motor-move absolute left-0 bottom-1 flex flex-col items-center text-primary-500">
                         <div className="px-2 py-1 bg-primary-500 text-white text-[8px] font-black rounded-md mb-1 shadow-lg shadow-primary-500/30">ON WAY</div>
                         <MI name="delivery_dining" size={42} />
                      </div>
                   </div>
                   
                   <div className="text-center mt-6">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">Depo Express</h3>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Layanan Antar Jemput Galon</p>
                   </div>
                </div>

                <div className="flex gap-3 justify-center pt-4 border-t border-gray-50 dark:border-gray-800">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/10 text-green-500 flex flex-col items-center justify-center gap-0.5 border border-green-100 dark:border-green-800/30 shadow-sm">
                        <MI name="check_circle" size={16} />
                        <span className="text-[8px] font-black uppercase">M-0{i}</span>
                     </div>
                   ))}
                   <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 flex flex-col items-center justify-center gap-0.5 border border-red-100 dark:border-red-800/30 animate-pulse">
                      <MI name="build" size={16} />
                      <span className="text-[8px] font-black uppercase">M-04</span>
                   </div>
                </div>
             </div>
          </div>
          {/* AI Strategic Forecast */}
          <div className="card p-6 bg-gradient-to-br from-primary-900 via-primary-800 to-gray-900 text-white border-none shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={140} /></div>
             
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                      <Zap size={20} className="text-white fill-current" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] leading-none">AI Strategic Forecast</h3>
                      <p className="text-[9px] font-bold opacity-50 mt-1 uppercase tracking-widest">Revenue Projection · Next 7 Days</p>
                   </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest">
                   Confidence: 89%
                </div>
             </div>

             <div className="h-48 mb-8 relative z-10">
                {aiProjection.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={aiProjection}>
                        <defs>
                           <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                           itemStyle={{ color: '#fff', fontWeight: 800 }}
                        />
                        <Area type="monotone" dataKey="projected_sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProj)" />
                     </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center opacity-30">Generating forecast...</div>}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                   <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MI name="trending_up" size={12} /> Optimization</p>
                   <p className="text-xs font-bold leading-relaxed opacity-80">Permintaan diprediksi naik <span className="text-white">12%</span> di akhir pekan. Siapkan kurir tambahan.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                   <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MI name="warning" size={12} /> Stock Alert</p>
                   <p className="text-xs font-bold leading-relaxed opacity-80">Stok filter di Cabang Pusat diprediksi habis dalam <span className="text-white">4 hari</span>.</p>
                </div>
             </div>
          </div>

        </div>

        {/* Sidebar Analytics (4/12) */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Motorcycle Maintenance Log */}
          <div className="card p-6 border-none shadow-xl bg-white dark:bg-gray-900">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <MI name="construction" className="text-red-500" size={18} />
                   Log Perbaikan Motor
                </h2>
                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 animate-bounce-slow">
                   <Wrench size={14} />
                </div>
             </div>
             <div className="space-y-4">
                {(widgets?.motor_maintenance || []).map(m => (
                  <div key={m.id} className="p-5 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-red-500/30 hover:bg-red-50/20 dark:hover:bg-red-900/5 transition-all group relative overflow-hidden">
                     <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] font-black px-3 py-1 bg-gray-900 text-white rounded-xl tracking-widest shadow-lg">{m.plate}</span>
                           {m.status === 'pending' && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${m.status === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                           {m.status === 'completed' ? '✓ SELESAI' : '• DI PROSES'}
                        </span>
                     </div>
                     <p className="text-sm font-black text-gray-800 dark:text-gray-200 relative z-10">{m.description}</p>
                     <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 relative z-10">
                        <div className="flex items-center gap-1.5 text-gray-400">
                           <Clock size={12} />
                           <p className="text-[10px] font-black uppercase tracking-widest">{new Date(m.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</p>
                        </div>
                        <p className="text-xs font-black text-red-500">{m.cost > 0 ? fmt(m.cost) : 'ESTIMASI...'}</p>
                     </div>
                     <div className="absolute right-[-10%] top-[-20%] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12">
                        <MI name="build" size={100} />
                     </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-red-500 hover:text-white hover:shadow-xl hover:shadow-red-500/20 transition-all border border-gray-100 dark:border-gray-800">
                INPUT DATA PERBAIKAN
             </button>
          </div>

          {/* Branch Pie Chart */}
          <div className="card p-6 border-none shadow-xl">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <MI name="pie_chart" className="text-brand-500" size={18} />
              Kontribusi Cabang
            </h2>
            {branches.length > 1 ? (
              <>
                <div className="h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={branches} dataKey="total_sales" nameKey="branch_name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5}>
                        {branches.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={8} stroke="none" />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Total Omset</span>
                    <span className="text-lg font-black text-gray-800 dark:text-white">165jt</span>
                  </div>
                </div>
                <div className="space-y-3 mt-6">
                  {branches.map((b, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{b.branch_name}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-white">{fmt(b.total_sales)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-xs text-center p-8">
                <div><AlertCircle size={32} className="mx-auto mb-2 opacity-20" /><p className="font-bold">Perbandingan antar cabang memerlukan minimal 2 cabang aktif.</p></div>
              </div>
            )}
          </div>

          {/* Inventory Status */}
          <div className="card p-6 border-none shadow-xl">
             <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <MI name="inventory_2" className="text-orange-500" size={18} />
                Status Inventori
             </h2>
             <div className="space-y-5">
                {[
                  { label: 'Tandon Air Baku', value: 85, color: 'bg-primary-500', icon: 'water' },
                  { label: 'Galon Kosong (Standar)', value: 42, color: 'bg-orange-500', icon: 'local_drink' },
                  { label: 'Tutup Galon & Tisu', value: 92, color: 'bg-green-500', icon: 'category' }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-2">
                           <MI name={item.icon} size={14} className={item.color.replace('bg-', 'text-')} />
                           {item.label}
                        </span>
                        <span className="text-[10px] font-black text-gray-900 dark:text-white">{item.value}%</span>
                     </div>
                     <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                     </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-primary-50 hover:text-primary-600 transition-all border border-gray-100 dark:border-gray-800">Kelola Inventori</button>
          </div>

          {/* Live Activity Feed */}
          <div className="card p-0 border-none shadow-xl bg-gray-900 text-white overflow-hidden h-[400px] flex flex-col relative group">
             <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                   Live Strategic Feed
                </h2>
                <div className="flex gap-1">
                   <div className="w-1 h-1 rounded-full bg-white/20" />
                   <div className="w-1 h-1 rounded-full bg-white/20" />
                </div>
             </div>
             <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-transparent to-gray-900 pointer-events-none z-10" />
                <div className="p-5 space-y-4 animate-scroll-vertical">
                   {[
                     { time: '10:02', msg: 'Andi menyelesaikan pengiriman #INV-902', type: 'delivery', color: 'text-emerald-400' },
                     { time: '10:05', msg: 'Transaksi Rp 55.000 (Cabang Melati)', type: 'sale', color: 'text-primary-400' },
                     { time: '10:10', msg: 'ALERTA: Tandon B Depo Pusat (30%)', type: 'alert', color: 'text-red-400' },
                     { time: '10:12', msg: 'Budi mulai absensi (Ready)', type: 'staff', color: 'text-indigo-400' },
                     { time: '10:15', msg: 'Member baru "Siska" terdaftar', type: 'member', color: 'text-orange-400' },
                     { time: '10:18', msg: 'Motor KT 1234 AB masuk servis', type: 'fleet', color: 'text-red-400' },
                     { time: '10:22', msg: 'Andi memulai rute pengiriman baru', type: 'delivery', color: 'text-emerald-400' },
                     { time: '10:25', msg: 'Transaksi Cash Rp 15.000', type: 'sale', color: 'text-primary-400' },
                     { time: '10:02', msg: 'Andi menyelesaikan pengiriman #INV-902', type: 'delivery', color: 'text-emerald-400' },
                     { time: '10:05', msg: 'Transaksi Rp 55.000 (Cabang Melati)', type: 'sale', color: 'text-primary-400' },
                   ].map((item, i) => (
                     <div key={i} className="flex gap-3 items-start opacity-70 hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-black font-mono text-white/30 pt-0.5">{item.time}</span>
                        <p className={`text-[11px] font-bold leading-tight ${item.color}`}>{item.msg}</p>
                     </div>
                   ))}
                </div>
             </div>
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)', backgroundSize: '100% 2px' }} />
          </div>

        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Recent Transactions */}
         <div className="card p-6 border-none shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <MI name="history" className="text-blue-500" size={18} />
                Transaksi Terakhir
              </h2>
              <Link to="/reports/sales" className="text-[10px] font-black text-primary-500 hover:underline uppercase tracking-widest">Semua Data</Link>
            </div>
            <div className="space-y-4">
              {latestTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${tx.transaction_type === 'pickup' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      <MI name={tx.transaction_type === 'pickup' ? 'store' : 'local_shipping'} size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800 dark:text-gray-200">{tx.customer_name || 'Pelanggan Umum'}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase">{tx.invoice_number} · {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900 dark:text-white">{fmt(tx.total_amount)}</p>
                    <p className={`text-[9px] font-black uppercase mt-0.5 ${tx.payment_status === 'paid' ? 'text-green-500' : 'text-red-500'}`}>{tx.payment_status === 'paid' ? 'LUNAS' : 'HUTANG'}</p>
                  </div>
                </div>
              ))}
            </div>
         </div>

         {/* Loyalty Tracker */}
         <div className="card p-6 border-none shadow-xl">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <MI name="workspace_premium" className="text-orange-500" size={18} />
               Pantauan Member Loyalty
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {(widgets?.loyalty_due_customers || []).slice(0, 4).map(c => (
                <div 
                  key={c.id} 
                  onClick={() => openLoyaltyDetail(c)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 group hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    <MI name="person" size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-gray-800 dark:text-gray-200 truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 bg-orange-200 dark:bg-orange-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: '100%' }} />
                      </div>
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">Ready</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-orange-500 shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <MI name="visibility" size={20} />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/customers" className="w-full mt-6 py-3 rounded-2xl bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
               LIHAT SEMUA MEMBER
            </Link>
         </div>
      </div>

      {/* Loyalty Detail Modal */}
      {showLoyaltyModal && selectedLoyalty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowLoyaltyModal(false)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in border border-white/20">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white relative">
               <button onClick={() => setShowLoyaltyModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <X size={20} />
               </button>
               <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center text-orange-500 shadow-xl border-4 border-white/20">
                     <MI name="person" size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedLoyalty.name}</h3>
                    <p className="text-sm font-bold opacity-80 mt-0.5 tracking-widest uppercase">MEMBER PREMIUM #{selectedLoyalty.id}</p>
                  </div>
               </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8">
               {/* Stats Row */}
               <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-3xl bg-gray-50 dark:bg-gray-800 text-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Transaksi</p>
                     <p className="text-xl font-black text-gray-900 dark:text-white">{selectedLoyalty.loyalty_count || 10}</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-gray-50 dark:bg-gray-800 text-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Voucher</p>
                     <p className="text-xl font-black text-orange-500">{Math.floor((selectedLoyalty.loyalty_count || 10) / 10)}</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-gray-50 dark:bg-gray-800 text-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p>
                     <p className="text-[10px] font-black text-green-500 mt-2 uppercase tracking-tighter">AKTIF</p>
                  </div>
               </div>

               {/* Recent Purchase List */}
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Clock size={14} className="text-orange-500" />
                     Riwayat Pembelian Terakhir
                  </h4>
                  <div className="space-y-2">
                     {[
                        { date: '2026-05-12', item: 'Isi Ulang Galon Aqua', qty: 2, total: 10000 },
                        { date: '2026-05-08', item: 'Isi Ulang Galon Aqua', qty: 1, total: 5000 },
                        { date: '2026-05-01', item: 'Galon Baru + Isi', qty: 1, total: 50000 },
                     ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                           <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.item}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {p.qty} Galon</p>
                           </div>
                           <p className="text-sm font-black text-gray-900 dark:text-white">{fmt(p.total)}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Reward Summary */}
               <div className="p-6 rounded-[2rem] bg-orange-500/10 border-2 border-dashed border-orange-500/30 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shrink-0">
                     <Award size={24} />
                  </div>
                  <div>
                     <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Klaim Galon Gratis</p>
                     <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Gunakan kode voucher <span className="font-black text-orange-500">{selectedLoyalty.voucher_code || 'DEMO-FREE'}</span> di kasir.</p>
                  </div>
               </div>

               <button 
                  onClick={() => setShowLoyaltyModal(false)}
                  className="w-full py-4 rounded-3xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform"
               >
                  KEMBALI KE DASHBOARD
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
