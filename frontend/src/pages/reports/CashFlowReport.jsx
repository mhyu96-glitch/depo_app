import { useState, useEffect } from 'react';
import { reportApi, branchApi } from '../../api';
import { 
  DollarSign, Search, Download, Calendar, 
  Building2, Loader2, ArrowUpCircle, ArrowDownCircle,
  TrendingUp, TrendingDown, Wallet 
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

import PillSelect from '../../components/PillSelect';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function CashFlowReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
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
        reportApi.getCashFlow(filters),
        branchApi.getAll()
      ]);
      setData(reportRes.data.data);
      setSummary(reportRes.data.summary);
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
    if (data.length === 0) return alert('Tidak ada data');
    const exportData = data.map(item => ({
      'Tanggal': new Date(item.date).toLocaleDateString('id-ID'),
      'Cabang': item.branch_name,
      'Kategori': item.category,
      'Keterangan': item.description,
      'Tipe': item.type === 'income' ? 'Masuk' : 'Keluar',
      'Jumlah': item.amount
    }));
    exportToExcel(exportData, `Arus_Kas_${filters.date_from}_${filters.date_to}.xlsx`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return alert('Tidak ada data');
    const headers = ['Tanggal', 'Kategori', 'Keterangan', 'Tipe', 'Jumlah'];
    const rows = data.map(item => [
      new Date(item.date).toLocaleDateString('id-ID'),
      item.category,
      item.description,
      item.type === 'income' ? 'Masuk' : 'Keluar',
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)
    ]);
    exportToPDF('Laporan Arus Kas', headers, rows, `Arus_Kas_${filters.date_from}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <DollarSign size={24} className="text-primary-500" />
            Laporan Arus Kas
          </h1>
          <p className="text-sm text-gray-500">Rekapitulasi kas masuk dan keluar operasional</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExportExcel}><Download size={18} /> Excel</button>
          <button className="btn-secondary" onClick={handleExportPDF}><Download size={18} /> PDF</button>
          <button className="btn-primary" onClick={loadData}><Search size={18} /> Tampilkan</button>
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

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 border-l-4 border-brand-500 bg-brand-50/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">Total Kas Masuk</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(summary.total_income)}</p>
              </div>
              <TrendingUp size={24} className="text-brand-500" />
            </div>
          </div>
          <div className="card p-5 border-l-4 border-red-500 bg-red-50/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Total Kas Keluar</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(summary.total_expense)}</p>
              </div>
              <TrendingDown size={24} className="text-red-500" />
            </div>
          </div>
          <div className="card p-5 border-l-4 border-primary-500 bg-primary-50/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Selisih Kas</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                  {fmt(summary.balance)}
                </p>
              </div>
              <Wallet size={24} className="text-primary-500" />
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
        ) : (
          <div className="table-wrapper rounded-none border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Cabang</th>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th className="text-right">Tipe</th>
                  <th className="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                    <td className="text-xs text-gray-500">{item.branch_name}</td>
                    <td><span className="font-medium text-gray-900 dark:text-white">{item.category}</span></td>
                    <td className="text-xs text-gray-500 italic max-w-xs truncate">{item.description}</td>
                    <td className="text-right">
                      {item.type === 'income' ? (
                        <span className="badge-green">Masuk</span>
                      ) : (
                        <span className="badge-red">Keluar</span>
                      )}
                    </td>
                    <td className={`text-right font-bold ${item.type === 'income' ? 'text-brand-600' : 'text-red-500'}`}>
                      {item.type === 'income' ? '+' : '-'} {fmt(item.amount)}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400">Tidak ada data arus kas ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
