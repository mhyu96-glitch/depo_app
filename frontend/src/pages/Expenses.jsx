import { useState, useEffect } from 'react';
import { expenseApi, dashboardApi } from '../api';
import { 
  DollarSign, Plus, PieChart as PieIcon, History, 
  ArrowDownCircle, Calendar, Store, Tag, X,
  TrendingDown, TrendingUp, Wallet, Receipt
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import PillSelect from '../components/PillSelect';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#22c55e', '#06b6d4'];

const EXPENSE_CATEGORIES = [
  { value: 'Listrik & Air', label: 'Listrik & Air' },
  { value: 'Gaji Karyawan', label: 'Gaji Karyawan' },
  { value: 'BBM Armada', label: 'BBM Armada' },
  { value: 'Sewa Ruko', label: 'Sewa Ruko' },
  { value: 'Maintenance Alat', label: 'Maintenance Alat' },
  { value: 'Marketing', label: 'Marketing' }
];

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '', branch_name: '', note: '', date: new Date().toISOString().split('T')[0] });

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, sRes, bRes] = await Promise.all([
        expenseApi.getAll(),
        expenseApi.getStats(),
        dashboardApi.getBranchComparison()
      ]);
      setExpenses(res.data.data);
      setStats(sRes.data.data);
      setBranches(bRes.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await expenseApi.create({ ...form, amount: parseFloat(form.amount) });
      setForm({ category: '', amount: '', branch_name: '', note: '', date: new Date().toISOString().split('T')[0] });
      setShowModal(false);
      loadData();
    } catch (_) {}
  };

  const chartData = stats?.byCategory ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value })) : [];

  if (loading) return <div className="p-10 text-center font-black animate-pulse">ANALYSING OPERATIONAL COSTS...</div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in font-outfit pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
             <div className="w-2 h-10 bg-red-500 rounded-full" />
             Biaya Operasional
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Pantau pengeluaran toko dan analisa efisiensi bisnis</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-500 text-white py-4 px-8 rounded-2xl shadow-xl shadow-red-500/20 font-black tracking-widest text-xs uppercase flex items-center gap-2 hover:bg-red-600 transition-all"
        >
          <Plus size={18} /> Catat Pengeluaran
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-4 space-y-8">
            <div className="card p-8 bg-gradient-to-br from-red-500 to-red-700 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><TrendingDown size={120} /></div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Pengeluaran Bulan Ini</p>
               <h2 className="text-4xl font-black mt-2 tracking-tighter">{fmt(stats?.total)}</h2>
               <div className="mt-8 flex items-center gap-2 p-3 bg-white/10 rounded-2xl border border-white/10">
                  <TrendingUp className="text-red-200" size={16} />
                  <p className="text-[11px] font-bold text-red-50 leading-tight">Meningkat <span className="font-black text-white">5.2%</span> dibanding bulan lalu. Optimalkan biaya BBM armada.</p>
               </div>
            </div>

            <div className="card p-6 border-none shadow-xl">
               <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <PieIcon size={16} className="text-red-500" />
                  Alokasi Biaya
               </h3>
               <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5}>
                           {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={8} stroke="none" />)}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Struktur</span>
                     <span className="text-sm font-black text-gray-800 dark:text-white">COSTS</span>
                  </div>
               </div>
               <div className="mt-6 space-y-3">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{d.name}</span>
                       </div>
                       <span className="text-xs font-black text-gray-900 dark:text-white">{fmt(d.value)}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-8 space-y-6">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <History className="text-red-500" size={18} />
               Log Pengeluaran Terkini
            </h2>
            <div className="space-y-4">
               {expenses.map(e => (
                 <div key={e.id} className="card p-6 border-none shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
                             <Receipt size={24} />
                          </div>
                          <div>
                             <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{e.category}</h4>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{e.branch_name} · {new Date(e.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-red-600 tracking-tighter">{fmt(e.amount)}</p>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${e.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>
                             {e.status === 'paid' ? 'LUNAS' : 'PENDING'}
                          </span>
                       </div>
                    </div>
                    <p className="text-xs font-bold text-gray-500 border-t border-gray-50 dark:border-gray-800 pt-3 mt-3 italic">"{e.note || 'Tidak ada keterangan'}"</p>
                    <div className="absolute right-[-5%] bottom-[-5%] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                       <MI name="payments" size={100} />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in">
             <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight text-red-500">Catat Pengeluaran</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={20} /></button>
             </div>
              <form onSubmit={handleCreate} className="p-8 space-y-6">
                <PillSelect 
                  label="Kategori Biaya"
                  icon={Tag}
                  options={EXPENSE_CATEGORIES}
                  value={form.category}
                  onChange={val => setForm({...form, category: val})}
                  placeholder="-- Pilih Kategori --"
                />

                <PillSelect 
                  label="Penempatan Cabang"
                  icon={Store}
                  options={branches.map(b => ({ value: b.branch_name, label: b.branch_name }))}
                  value={form.branch_name}
                  onChange={val => setForm({...form, branch_name: val})}
                  placeholder="-- Pilih Cabang --"
                />

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Jumlah Biaya (Rp)</label>
                   <input 
                     required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                     placeholder="500000" className="input w-full font-black py-4 px-5" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Keterangan / Memo</label>
                   <input 
                     value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                     placeholder="Detail pengeluaran..." className="input w-full font-bold py-4 px-5" 
                   />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-4 rounded-3xl bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-transform">
                     SIMPAN PENGELUARAN
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
