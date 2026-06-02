import { useState, useEffect } from 'react';
import { reportApi, branchApi } from '../../api';
import { 
  AlertCircle, Search, Download, Building2, 
  Loader2, Phone, User, Calendar, 
  CreditCard, CheckCircle, XCircle 
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

import PillSelect from '../../components/PillSelect';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function DebtReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch_id: '',
    status: 'unpaid'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportRes, branchRes] = await Promise.all([
        reportApi.getDebt(filters),
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
      'Pelanggan': item.customer_name,
      'WA': item.whatsapp,
      'Cabang': item.branch_name,
      'Tgl. Hutang': new Date(item.created_at).toLocaleDateString('id-ID'),
      'Total Tagihan': item.amount,
      'Telah Dibayar': item.paid_amount,
      'Sisa Hutang': item.amount - item.paid_amount
    }));
    exportToExcel(exportData, `Laporan_Hutang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return alert('Tidak ada data');
    const headers = ['Pelanggan', 'WA', 'Tgl', 'Tagihan', 'Bayar', 'Sisa'];
    const rows = data.map(item => [
      item.customer_name,
      item.whatsapp || '-',
      new Date(item.created_at).toLocaleDateString('id-ID'),
      fmt(item.amount),
      fmt(item.paid_amount),
      fmt(item.amount - item.paid_amount)
    ]);
    exportToPDF('Laporan Hutang Pelanggan', headers, rows, `Laporan_Hutang_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AlertCircle size={24} className="text-red-500" />
            Laporan Hutang Pelanggan
          </h1>
          <p className="text-sm text-gray-500">Daftar tagihan pelanggan yang belum lunas</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExportExcel}><Download size={18} /> Excel</button>
          <button className="btn-secondary" onClick={handleExportPDF}><Download size={18} /> PDF</button>
          <button className="btn-primary" onClick={loadData}><Search size={18} /> Tampilkan</button>
        </div>
      </div>

      <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <PillSelect 
          label="Status Hutang"
          icon={CreditCard}
          options={[
            { value: '', label: 'Semua Status Belum Lunas' },
            { value: 'unpaid', label: 'Belum Dibayar Sama Sekali' },
            { value: 'partial', label: 'Sudah Bayar Sebagian' }
          ]}
          value={filters.status}
          onChange={val => setFilters({...filters, status: val})}
          placeholder="Semua Status"
        />
      </div>

      {summary && (
        <div className="card p-6 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shrink-0">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Total Hutang Mengendap</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{fmt(summary.total_debt)}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-xs text-gray-500">Jumlah Pelanggan Bermasalah</p>
              <p className="text-lg font-bold text-red-600">{summary.count} Orang</p>
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
                  <th>Pelanggan</th>
                  <th>Kontak</th>
                  <th>Cabang</th>
                  <th>Tgl. Hutang</th>
                  <th className="text-right">Total Tagihan</th>
                  <th className="text-right">Telah Dibayar</th>
                  <th className="text-right text-red-600">Sisa Hutang</th>
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
                        <span className="font-bold text-gray-900 dark:text-white">{item.customer_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-brand-600 font-medium">
                        <Phone size={12} /> {item.whatsapp || '-'}
                      </div>
                    </td>
                    <td className="text-xs text-gray-500">{item.branch_name}</td>
                    <td className="text-xs">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="text-right font-medium">{fmt(item.amount)}</td>
                    <td className="text-right text-brand-600 font-medium">{fmt(item.paid_amount)}</td>
                    <td className="text-right font-bold text-red-600 bg-red-50/30 dark:bg-red-900/10">
                      {fmt(item.amount - item.paid_amount)}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-400">Tidak ada data hutang ditemukan. Semua tagihan lunas!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex items-start gap-3">
        <Calendar size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>Tip Penagihan:</strong> Anda dapat melihat rincian alamat pelanggan dengan mengklik nama mereka. Gunakan tombol WhatsApp untuk mengirimkan pengingat tagihan secara sopan.
        </p>
      </div>
    </div>
  );
}
