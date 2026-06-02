import { useState, useEffect } from 'react';
import { reportApi, branchApi } from '../../api';
import { 
  CreditCard, Search, Download, Calendar, 
  Building2, Loader2, Truck, User, 
  Wallet, Banknote, Briefcase
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

import PillSelect from '../../components/PillSelect';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function SalaryReport() {
  const [data, setData] = useState([]);
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
        reportApi.getSalary(filters),
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
    if (data.length === 0) return alert('Tidak ada data');
    const exportData = data.map(item => ({
      'Nama Kurir': item.courier_name,
      'Cabang': item.branch_name,
      'Hari Kerja': item.work_days,
      'Gaji Pokok': item.base_salary,
      'Total Komisi': item.total_commission,
      'Total Diterima': item.total_salary
    }));
    exportToExcel(exportData, `Gaji_Kurir_${filters.date_from}_${filters.date_to}.xlsx`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return alert('Tidak ada data');
    const headers = ['Nama Kurir', 'Cabang', 'Hari', 'Pokok', 'Komisi', 'Total'];
    const rows = data.map(item => [
      item.courier_name,
      item.branch_name,
      item.work_days,
      fmt(item.base_salary),
      fmt(item.total_commission),
      fmt(item.total_salary)
    ]);
    exportToPDF('Laporan Gaji Kurir', headers, rows, `Gaji_Kurir_${filters.date_from}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CreditCard size={24} className="text-primary-500" />
            Laporan Gaji Kurir
          </h1>
          <p className="text-sm text-gray-500">Rekapitulasi gaji pokok dan komisi pengantaran kurir</p>
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

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
        ) : (
          <div className="table-wrapper rounded-none border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Kurir</th>
                  <th>Cabang</th>
                  <th className="text-right">Hari Kerja</th>
                  <th className="text-right">Gaji Pokok</th>
                  <th className="text-right">Total Komisi</th>
                  <th className="text-right bg-primary-50 dark:bg-primary-900/20">Total Diterima</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                          <User size={16} />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{item.courier_name}</span>
                      </div>
                    </td>
                    <td className="text-xs text-gray-500">{item.branch_name}</td>
                    <td className="text-right font-medium">{item.work_days} Hari</td>
                    <td className="text-right text-gray-600 dark:text-gray-400">{fmt(item.base_salary)}</td>
                    <td className="text-right text-brand-600 font-medium">+{fmt(item.total_commission)}</td>
                    <td className="text-right font-bold text-primary-600 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-900/10">
                      {fmt(item.total_salary)}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400">Tidak ada data kurir ditemukan.</td>
                  </tr>
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                  <tr>
                    <td colSpan="5" className="text-right py-4">TOTAL KESELURUHAN GAJI</td>
                    <td className="text-right py-4 text-lg text-primary-600">
                      {fmt(data.reduce((acc, curr) => acc + parseFloat(curr.total_salary), 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shrink-0">
              <Banknote size={24} />
            </div>
            <div>
              <h4 className="font-bold text-primary-900 dark:text-primary-100">Informasi Penggajian</h4>
              <p className="text-sm text-primary-700 dark:text-primary-300 mt-1 leading-relaxed">
                Gaji dihitung berdasarkan gaji pokok bulanan ditambah total komisi pengantaran yang terkumpul pada rentang tanggal yang dipilih. Jumlah hari kerja diambil dari data absensi.
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6 bg-brand-50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shrink-0">
              <Briefcase size={24} />
            </div>
            <div>
              <h4 className="font-bold text-brand-900 dark:text-brand-100">Kebijakan Komisi</h4>
              <p className="text-sm text-brand-700 dark:text-brand-300 mt-1 leading-relaxed">
                Komisi otomatis: Rp500 per galon untuk pengiriman 1-60 galon, dan Rp1.000 per galon untuk pengiriman di atas 60 galon dalam satu transaksi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
