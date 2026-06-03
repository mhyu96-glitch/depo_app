import { useState, useEffect } from 'react';
import { transactionApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  Tag, Calendar, TrendingDown, Package, 
  Loader2, Download, Filter, Search,
  ShoppingCart, Truck, Receipt
} from 'lucide-react';
import { motion } from 'framer-motion';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function VoucherReport() {
  const { user, isSuperAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_vouchers: 0,
    total_discount: 0,
    bl_count: 0,
    dl_count: 0,
    manual_count: 0,
    bl_discount: 0,
    dl_discount: 0,
    manual_discount: 0
  });
  
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    voucher_type: '',
    search: '',
    ...(isSuperAdmin && { branch_id: '' })
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: filters.start_date,
        end_date: filters.end_date,
        has_voucher: true,
        ...filters.voucher_type && { voucher_type: filters.voucher_type },
        ...filters.search && { voucher_code: filters.search }
      };

      // Set branch filter based on user role
      if (isSuperAdmin) {
        // Superadmin bisa pilih cabang atau lihat semua
        if (filters.branch_id) {
          params.branch_id = filters.branch_id;
        }
      } else {
        // Branch admin hanya lihat cabangnya
        if (user?.branch_id) {
          params.branch_id = user.branch_id;
        }
      }

      const response = await transactionApi.getAll(params);
      const transactions = response.data.data || [];
      
      setData(transactions);

      // Calculate summary
      const summaryData = transactions.reduce((acc, tx) => {
        if (tx.voucher_code) {
          acc.total_vouchers++;
          acc.total_discount += tx.voucher_discount || 0;

          if (tx.voucher_type === 'BL') {
            acc.bl_count++;
            acc.bl_discount += tx.voucher_discount || 0;
          } else if (tx.voucher_type === 'DL') {
            acc.dl_count++;
            acc.dl_discount += tx.voucher_discount || 0;
          } else {
            acc.manual_count++;
            acc.manual_discount += tx.voucher_discount || 0;
          }
        }
        return acc;
      }, {
        total_vouchers: 0,
        total_discount: 0,
        bl_count: 0,
        dl_count: 0,
        manual_count: 0,
        bl_discount: 0,
        dl_discount: 0,
        manual_discount: 0
      });

      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading voucher report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const exportData = () => {
    const csvContent = [
      ['Tanggal', 'Kode Voucher', 'Tipe', 'Customer', 'Diskon', 'Total Transaksi'],
      ...data.map(tx => [
        new Date(tx.created_at).toLocaleDateString('id-ID'),
        tx.voucher_code || '',
        tx.voucher_type === 'BL' ? 'Beli Langsung' : tx.voucher_type === 'DL' ? 'Delivery' : 'Manual',
        tx.customer_name || 'Walk-in Customer',
        tx.voucher_discount || 0,
        tx.total_amount || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-voucher-${filters.start_date}-${filters.end_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in font-outfit">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
            <Tag size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              {isSuperAdmin ? 'Laporan Kupon & Voucher' : 'Daily Kupon Tracking'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {isSuperAdmin 
                ? 'Analisis penggunaan kupon BL001, DL001 & manual semua cabang'
                : `Tracking harian kupon cabang ${user?.branch_name || 'Anda'}`
              }
            </p>
          </div>
        </div>
        <button
          onClick={exportData}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className={`grid gap-4 ${isSuperAdmin ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-4'}`}>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              className="input w-full py-3 px-4"
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Tanggal Selesai
            </label>
            <input
              type="date"
              className="input w-full py-3 px-4"
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
            />
          </div>
          {isSuperAdmin && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Cabang
              </label>
              <select
                className="input w-full py-3 px-4"
                value={filters.branch_id || ''}
                onChange={(e) => setFilters({...filters, branch_id: e.target.value})}
              >
                <option value="">Semua Cabang</option>
                <option value="1">Cabang Pusat</option>
                <option value="15">Cabang Mangkupalas</option>
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Tipe Kupon
            </label>
            <select
              className="input w-full py-3 px-4"
              value={filters.voucher_type}
              onChange={(e) => setFilters({...filters, voucher_type: e.target.value})}
            >
              <option value="">Semua Tipe</option>
              <option value="BL">🛒 Beli Langsung (BL)</option>
              <option value="DL">🚚 Delivery (DL)</option>
              <option value="manual">📝 Manual</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Cari Kode
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input w-full py-3 pl-10 pr-4"
                placeholder="Cari kode voucher..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-xl shadow-purple-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <Tag size={24} />
            <span className="text-purple-100 text-xs font-bold">TOTAL</span>
          </div>
          <p className="text-2xl font-black">{summary.total_vouchers}</p>
          <p className="text-purple-100 text-xs font-bold">Kupon Digunakan</p>
          <p className="text-lg font-black mt-1">{fmt(summary.total_discount)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-xl shadow-green-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <ShoppingCart size={24} />
            <span className="text-green-100 text-xs font-bold">BL001</span>
          </div>
          <p className="text-2xl font-black">{summary.bl_count}</p>
          <p className="text-green-100 text-xs font-bold">Beli Langsung</p>
          <p className="text-lg font-black mt-1">{fmt(summary.bl_discount)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <Truck size={24} />
            <span className="text-blue-100 text-xs font-bold">DL001</span>
          </div>
          <p className="text-2xl font-black">{summary.dl_count}</p>
          <p className="text-blue-100 text-xs font-bold">Delivery</p>
          <p className="text-lg font-black mt-1">{fmt(summary.dl_discount)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-500 to-gray-600 p-6 rounded-2xl text-white shadow-xl shadow-gray-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <Receipt size={24} />
            <span className="text-gray-100 text-xs font-bold">MANUAL</span>
          </div>
          <p className="text-2xl font-black">{summary.manual_count}</p>
          <p className="text-gray-100 text-xs font-bold">Kode Manual</p>
          <p className="text-lg font-black mt-1">{fmt(summary.manual_discount)}</p>
        </motion.div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <h3 className="font-bold">Detail Transaksi dengan Kupon</h3>
          <p className="text-sm text-gray-500 mt-1">
            Periode: {new Date(filters.start_date).toLocaleDateString('id-ID')} - {new Date(filters.end_date).toLocaleDateString('id-ID')}
          </p>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Tag size={40} className="mx-auto mb-2 opacity-20" />
            <p>Tidak ada transaksi dengan kupon pada periode ini.</p>
          </div>
        ) : (
          <div className="table-wrapper rounded-none border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kode Voucher</th>
                  <th>Tipe</th>
                  <th>Customer</th>
                  <th>Diskon</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((tx, index) => (
                  <motion.tr 
                    key={tx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {tx.voucher_code}
                      </span>
                    </td>
                    <td>
                      {tx.voucher_type === 'BL' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                          <ShoppingCart size={12} /> Beli Langsung
                        </span>
                      )}
                      {tx.voucher_type === 'DL' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                          <Truck size={12} /> Delivery
                        </span>
                      )}
                      {!tx.voucher_type || tx.voucher_type === 'manual' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                          <Receipt size={12} /> Manual
                        </span>
                      )}
                    </td>
                    <td>{tx.customer_name || 'Walk-in Customer'}</td>
                    <td className="text-red-600 font-bold">-{fmt(tx.voucher_discount || 0)}</td>
                    <td className="font-bold">{fmt(tx.total_amount)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}