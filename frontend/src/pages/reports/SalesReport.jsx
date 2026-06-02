import { useState, useEffect } from 'react';
import { reportApi, branchApi } from '../../api';
import { 
  TrendingUp, Search, Download, Filter, 
  Calendar, Building2, Loader2, ShoppingCart, 
  Truck, Home, ArrowUpRight 
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

import PillSelect from '../../components/PillSelect';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function SalesReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch_id: '',
    date_from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1st of current month
    date_to: new Date().toISOString().split('T')[0],
    type: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportRes, branchRes] = await Promise.all([
        reportApi.getSales(filters),
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
    if (data.length === 0) return alert('Tidak ada data untuk diekspor');
    const exportData = data.map(item => ({
      'Invoice': item.invoice_number,
      'Tanggal': new Date(item.created_at).toLocaleString('id-ID'),
      'Pelanggan': item.customer_full_name || item.customer_name || 'Umum',
      'Tipe': item.transaction_type,
      'Cabang': item.branch_name,
      'Kurir': item.courier_name || '-',
      'Galon': item.total_gallons,
      'Total': item.total_amount
    }));
    exportToExcel(exportData, `Laporan_Penjualan_${filters.date_from}_${filters.date_to}.xlsx`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return alert('Tidak ada data untuk diekspor');
    const headers = ['Invoice', 'Tanggal', 'Pelanggan', 'Tipe', 'Galon', 'Total'];
    const rows = data.map(item => [
      item.invoice_number,
      new Date(item.created_at).toLocaleDateString('id-ID'),
      item.customer_full_name || item.customer_name || 'Umum',
      item.transaction_type,
      item.total_gallons,
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_amount)
    ]);
    exportToPDF('Laporan Penjualan', headers, rows, `Laporan_Penjualan_${filters.date_from}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp size={24} className="text-primary-500" />
            Laporan Penjualan
          </h1>
          <p className="text-sm text-gray-500">Rekapitulasi transaksi penjualan dan pengiriman</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExportExcel}><Download size={18} /> Excel</button>
          <button className="btn-secondary" onClick={handleExportPDF}><Download size={18} /> PDF</button>
          <button className="btn-primary" onClick={loadData}><Search size={18} /> Tampilkan</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <PillSelect 
          label="Tipe Transaksi"
          icon={Filter}
          options={[
            { value: '', label: 'Semua Tipe' },
            { value: 'pickup', label: 'Ambil di Tempat' },
            { value: 'delivery', label: 'Antar ke Rumah' }
          ]}
          value={filters.type}
          onChange={val => setFilters({...filters, type: val})}
          placeholder="Semua Tipe"
        />
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-primary-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Omzet</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(summary.total_sales)}</p>
          </div>
          <div className="card p-5 border-l-4 border-brand-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Galon</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_gallons} Unit</p>
          </div>
          <div className="card p-5 border-l-4 border-blue-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup (Ambil)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.pickup_count} Transaksi</p>
          </div>
          <div className="card p-5 border-l-4 border-purple-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Delivery (Antar)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.delivery_count} Transaksi</p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-between items-center">
          <h3 className="font-bold">Data Transaksi</h3>
          <span className="text-xs text-gray-400">{data.length} baris data ditemukan</span>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
        ) : (
          <div className="table-wrapper rounded-none border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Tipe</th>
                  <th>Kurir</th>
                  <th className="text-right">Galon</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs font-bold text-primary-600">{item.invoice_number}</td>
                    <td className="whitespace-nowrap">{new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>
                      <p className="font-medium">{item.customer_full_name || item.customer_name || 'Umum'}</p>
                      <p className="text-[10px] text-gray-400">{item.branch_name}</p>
                    </td>
                    <td>
                      {item.transaction_type === 'pickup' ? (
                        <span className="badge-blue"><Home size={10} /> Pickup</span>
                      ) : (
                        <span className="badge-purple"><Truck size={10} /> Delivery</span>
                      )}
                    </td>
                    <td className="text-xs">{item.courier_name || '-'}</td>
                    <td className="text-right font-bold">{item.total_gallons}</td>
                    <td className="text-right font-bold text-gray-900 dark:text-white">{fmt(item.total_amount)}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-400">Belum ada data pada rentang tanggal ini.</td>
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
