import { useState, useEffect } from 'react';
import { productApi, branchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Package, Plus, Edit2, Trash2,
  Loader2, X, Tag, Building2,
  CheckCircle, XCircle, Search
} from 'lucide-react';
import PillSelect from '../components/PillSelect';

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n || 0);

export default function Products() {
  const { user, isSuperAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    branch_id: user?.branch_id || '',
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, branchRes] = await Promise.all([
        productApi.getAll(isSuperAdmin ? {} : { branch_id: user?.branch_id }),
        branchApi.getAll(),
      ]);
      setProducts(prodRes.data.data || []);
      setBranches(branchRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setSelectedProduct(null);
    setForm({ name: '', price: '', branch_id: user?.branch_id || '', is_active: true });
  };

  const handleEdit = (p) => {
    setSelectedProduct(p);
    setForm({
      name: p.name,
      price: p.price,
      branch_id: p.branch_id || '',
      is_active: p.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedProduct) {
        await productApi.update(selectedProduct.id, {
          name: form.name,
          price: parseFloat(form.price),
          is_active: form.is_active,
        });
      } else {
        await productApi.create({
          name: form.name,
          price: parseFloat(form.price),
          branch_id: form.branch_id || null,
        });
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (p) => {
    if (!window.confirm(`${p.is_active ? 'Nonaktifkan' : 'Aktifkan'} produk "${p.name}"?`)) return;
    try {
      await productApi.update(p.id, { name: p.name, price: p.price, is_active: !p.is_active });
      loadData();
    } catch (err) {
      alert('Gagal mengubah status produk');
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in font-outfit">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-600/20">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Manajemen Produk
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Kelola daftar produk & harga jual
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-8 py-3.5 bg-primary-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary-600/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Cari nama produk..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary-500 font-bold text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-gray-900 rounded-[2rem] border border-dashed border-gray-200">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="font-black text-gray-400 uppercase tracking-widest text-sm">Belum ada produk</p>
          <p className="text-xs text-gray-400 mt-1">Klik "Tambah Produk" untuk mulai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`bg-white dark:bg-gray-900 p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${
                !p.is_active ? 'opacity-60 border-gray-200' : 'border-gray-100 dark:border-gray-800 hover:border-primary-200'
              }`}
            >
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(p)}
                  className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-all"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeactivate(p)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    p.is_active
                      ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                  title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {p.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                </button>
              </div>

              {/* Icon & Name */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg ${
                    p.is_active
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/20'
                      : 'bg-gray-400'
                  }`}
                >
                  {(p.name?.[0] || 'P').toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white tracking-tight">{p.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {p.is_active ? (
                      <span className="badge-green text-[9px]"><CheckCircle size={9} /> Aktif</span>
                    ) : (
                      <span className="badge-gray text-[9px]"><XCircle size={9} /> Nonaktif</span>
                    )}
                    {p.branch_name && (
                      <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                        <Building2 size={9} /> {p.branch_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Tag size={10} /> Harga Jual
                </p>
                <p className="text-xl font-black text-primary-600 tracking-tight">{fmt(p.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-xl font-black">
                {selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Nama Produk */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  className="input w-full py-4 px-5"
                  placeholder="Contoh: Galon Isi Ulang 19L"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Harga */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Harga Jual (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input w-full py-4 pl-12 pr-5"
                    placeholder="5000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>

              {/* Cabang */}
              <PillSelect
                label="Cabang"
                icon={Building2}
                options={[
                  { value: '', label: 'Semua Cabang (Global)' },
                  ...branches.map((b) => ({ value: b.id, label: b.name })),
                ]}
                value={form.branch_id}
                onChange={(val) => setForm({ ...form, branch_id: val })}
                placeholder="Semua Cabang"
              />

              {/* Status — hanya saat edit */}
              {selectedProduct && (
                <PillSelect
                  label="Status Produk"
                  icon={CheckCircle}
                  options={[
                    { value: true, label: 'Aktif' },
                    { value: false, label: 'Nonaktif' },
                  ]}
                  value={form.is_active}
                  onChange={(val) => setForm({ ...form, is_active: val })}
                />
              )}

              <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-2xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
