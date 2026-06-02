import { useState, useEffect } from 'react';
import { reportApi, branchApi } from '../../api';
import { 
  FileText, Search, Download, Calendar, 
  Building2, Loader2, TrendingUp, TrendingDown,
  ArrowRight, Calculator, PieChart as PieChartIcon
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import PillSelect from '../../components/PillSelect';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const COLORS = ['#22c55e', '#ef4444', '#3b82f6'];

export default function ProfitLoss() {
  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch_id: '',
    date_from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportRes, branchRes] = await Promise.all([
        reportApi.getProfitLoss(filters),
        branchApi.getAll()
      ]);
      setData(reportRes.data.data);
      setBranches(branchRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportExcel = () => {
    if (!data) return alert('Tidak ada data');
    const exportData = [
      { 'Item': 'Total Penjualan', 'Jumlah': data.total_sales },
      { 'Item': 'Total Biaya Operasional', 'Jumlah': data.total_expenses },
      { 'Item': 'Total Gaji & Komisi', 'Jumlah': data.total_salary },
      { 'Item': 'Laba Bersih', 'Jumlah': data.net_profit }
    ];
    exportToExcel(exportData, `Laba_Rugi_${filters.date_from}_${filters.date_to}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!data) return alert('Tidak ada data');
    const headers = ['Komponen Keuangan', 'Nilai (Rp)'];
    const rows = [
      ['Total Penjualan (A)', fmt(data.total_sales)],
      ['Total Biaya Operasional (B)', fmt(data.total_expenses)],
      ['Total Gaji & Komisi (C)', fmt(data.total_salary)],
      ['Laba Bersih (A-B-C)', fmt(data.net_profit)]
    ];
    exportToPDF('Laporan Laba Rugi', headers, rows, `Laba_Rugi_${filters.date_from}.pdf`);
  };

  const chartData = data ? [
    { name: 'Penjualan', value: data.total_sales },
    { name: 'Biaya Ops', value: data.total_expenses },
    { name: 'Gaji & Komisi', value: data.total_salary }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText size={24} className="text-primary-500" />
            Laporan Laba Rugi
          </h1>
          <p className="text-sm text-gray-500">Estimasi keuntungan bersih setelah dikurangi biaya dan gaji</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExportExcel}><Download size={18} /> Excel</button>
          <button className="btn-secondary" onClick={handleExportPDF}><Download size={18} /> PDF</button>
          <button className="btn-primary" onClick={loadData}><Search size={18} /> Kalkulasi</button>
        </div>
      </div>

      <div className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <PillSelect 
          label="Cabang"
          icon={Building2}
          options={[
            { value: '', label: 'Semua Cabang' },
            ...branches.map(b => ({ value: b.id, label: b.name }))
          ]}
          value={filters.branch_id}
          onChange={val => setFilters({...filters, branch_id: val})}
          placeholder="Semua Cabang"
        />
        <div className="form-group">
          <label className="label">Dari Tanggal</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="date" className="input pl-10"
              value={filters.date_from}
              onChange={e => setFilters({...filters, date_from: e.target.value})}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Sampai Tanggal</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="date" className="input pl-10"
              value={filters.date_to}
              onChange={e => setFilters({...filters, date_to: e.target.value})}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-8 bg-gradient-to-br from-primary-600 to-brand-600 text-white">
              <div className="flex flex-col items-center text-center">
                <p className="text-primary-100 text-sm font-medium uppercase tracking-widest mb-2">Laba Bersih Estimasi</p>
                <h3 className="text-5xl font-extrabold mb-4">{fmt(data.net_profit)}</h3>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                  {data.net_profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {data.net_profit >= 0 ? 'Kondisi Profit' : 'Kondisi Rugi'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5 border-l-4 border-brand-500">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pendapatan</p>
                  <TrendingUp size={20} className="text-brand-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(data.total_sales)}</p>
                <p className="text-[10px] text-gray-400 mt-1">Penjualan produk galon</p>
              </div>
              <div className="card p-5 border-l-4 border-red-500">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Biaya & Gaji</p>
                  <TrendingDown size={20} className="text-red-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(data.total_expenses + data.total_salary)}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                  <span>Ops: {fmt(data.total_expenses)}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>Gaji: {fmt(data.total_salary)}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Calculator size={18} className="text-primary-500" />
                Rincian Kalkulasi
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Total Penjualan (A)</span>
                  <span className="font-bold text-brand-600">{fmt(data.total_sales)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Total Biaya Operasional (B)</span>
                  <span className="font-bold text-red-500">-{fmt(data.total_expenses)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Total Gaji & Komisi Kurir (C)</span>
                  <span className="font-bold text-red-500">-{fmt(data.total_salary)}</span>
                </div>
                <div className="divider" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Laba Bersih (A - B - C)</span>
                  <span className={`text-xl font-extrabold ${data.net_profit >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                    {fmt(data.net_profit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="lg:col-span-1">
            <div className="card p-6 h-full space-y-6">
              <h4 className="font-bold flex items-center gap-2">
                <PieChartIcon size={18} className="text-orange-500" />
                Struktur Keuangan
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => fmt(value)} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl text-xs text-gray-500 leading-relaxed italic">
                * Grafik di atas menunjukkan perbandingan antara total pendapatan kotor dengan total pengeluaran (operasional + gaji).
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          Gunakan filter dan klik Kalkulasi untuk melihat data.
        </div>
      )}
    </div>
  );
}
