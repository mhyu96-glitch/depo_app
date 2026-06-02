import { useState, useEffect } from 'react';
import { cashflowApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, Search, Plus, Filter, 
  ArrowUpCircle, ArrowDownCircle, 
  Trash2, Loader2, X, Download
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function CashFlow() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'income',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await cashflowApi.getAll({ branch_id: user?.branch_id });
      setData(res.data.data);
      setSummary(res.data.summary || { total_income: 0, total_expense: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await cashflowApi.create({ ...form, branch_id: user?.branch_id });
      setIsModalOpen(false);
      setForm({
        type: 'income',
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        reference: ''
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus pencatatan kas ini?')) return;
    try {
      await cashflowApi.remove(id);
      loadData();
    } catch (err) {
      alert('Gagal menghapus data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <DollarSign size={24} className="text-primary-500" />
            Kas Masuk & Keluar
          </h1>
          <p className="text-sm text-gray-500">Manajemen pengeluaran operasional dan pendapatan lain</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} /> Tambah Catatan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-brand-100 text-sm font-medium">Total Kas Masuk</p>
              <h3 className="text-2xl font-bold mt-1">{fmt(summary.total_income)}</h3>
            </div>
            <ArrowUpCircle size={32} className="text-brand-200" />
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Kas Keluar</p>
              <h3 className="text-2xl font-bold mt-1">{fmt(summary.total_expense)}</h3>
            </div>
            <ArrowDownCircle size={32} className="text-red-200" />
          </div>
        </div>
        <div className="card p-5 bg-white dark:bg-gray-900 border-2 border-primary-100 dark:border-primary-900/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Saldo Tersedia</p>
              <h3 className="text-2xl font-bold mt-1 text-primary-600 dark:text-primary-400">
                {fmt(summary.total_income - summary.total_expense)}
              </h3>
            </div>
            <DollarSign size={32} className="text-primary-200 dark:text-primary-800" />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <h3 className="font-bold">Riwayat Arus Kas</h3>
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm"><Download size={14} /> Export</button>
            <button className="btn-secondary btn-sm"><Filter size={14} /> Filter</button>
          </div>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
        ) : (
          <div className="table-wrapper rounded-none border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th className="text-right">Jumlah</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                    <td>
                      {item.type === 'income' ? (
                        <span className="badge-green"><ArrowUpCircle size={12} /> Masuk</span>
                      ) : (
                        <span className="badge-red"><ArrowDownCircle size={12} /> Keluar</span>
                      )}
                    </td>
                    <td className="font-medium text-gray-900 dark:text-white">{item.category}</td>
                    <td>
                      <p className="truncate max-w-xs">{item.description}</p>
                      {item.reference && <p className="text-[10px] text-gray-400">Ref: {item.reference}</p>}
                    </td>
                    <td className={`text-right font-bold ${item.type === 'income' ? 'text-brand-600' : 'text-red-500'}`}>
                      {item.type === 'income' ? '+' : '-'} {fmt(item.amount)}
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-lg animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-xl font-bold">Catat Kas Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group col-span-2">
                  <label className="label">Tipe Kas</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, type: 'income'})}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${
                        form.type === 'income' 
                          ? 'border-brand-500 bg-brand-50 text-brand-700' 
                          : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      <ArrowUpCircle size={18} /> Kas Masuk
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, type: 'expense'})}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${
                        form.type === 'expense' 
                          ? 'border-red-500 bg-red-50 text-red-700' 
                          : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      <ArrowDownCircle size={18} /> Kas Keluar
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Tanggal</label>
                  <input 
                    type="date" className="input" required 
                    value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Jumlah (Rp)</label>
                  <input 
                    type="number" className="input" required placeholder="0"
                    value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Kategori</label>
                  <input 
                    type="text" className="input" required placeholder="Contoh: Listrik, Gaji, Bonus"
                    value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Referensi/No. Nota</label>
                  <input 
                    type="text" className="input" placeholder="Opsional"
                    value={form.reference} onChange={e => setForm({...form, reference: e.target.value})}
                  />
                </div>
                <div className="form-group col-span-2">
                  <label className="label">Keterangan</label>
                  <textarea 
                    className="input h-20 resize-none" required
                    placeholder="Tulis deskripsi detail..."
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
