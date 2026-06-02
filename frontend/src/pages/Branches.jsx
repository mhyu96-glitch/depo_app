import { useState, useEffect } from 'react';
import { branchApi } from '../api';
import { 
  Building2, Plus, Edit2, Trash2, 
  Loader2, X, MapPin, Phone, Hash
} from 'lucide-react';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await branchApi.getAll();
      const list = res.data.data || [];
      setBranches(list);
      // Cache ke localStorage agar halaman login bisa pakai saat belum login
      if (list.length > 0) {
        localStorage.setItem('cached_branches', JSON.stringify(list));
      }
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
      if (selectedBranch) {
        await branchApi.update(selectedBranch.id, form);
      } else {
        await branchApi.create(form);
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setSelectedBranch(null);
    setForm({ name: '', code: '', address: '', phone: '' });
  };

  const handleEdit = (b) => {
    setSelectedBranch(b);
    setForm({
      name: b.name,
      code: b.code,
      address: b.address || '',
      phone: b.phone || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Nonaktifkan cabang ini?')) return;
    try {
      await branchApi.remove(id);
      loadData();
    } catch (err) {
      alert('Gagal menonaktifkan cabang');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 size={24} className="text-primary-500" />
            Manajemen Cabang
          </h1>
          <p className="text-sm text-gray-500">Daftar lokasi depo dan pengaturan cabang</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Tambah Cabang
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {branches.map((b) => (
            <div key={b.id} className="card p-6 space-y-4 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{b.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="badge-blue"><Hash size={10} /> {b.code}</span>
                      <span className="text-xs text-gray-400">{b.user_count || 0} Pengguna</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(b)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <span>{b.address || 'Alamat belum diatur'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Phone size={16} className="shrink-0 text-gray-400" />
                  <span>{b.phone || '-'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button className="w-full btn-secondary btn-sm justify-center">Lihat Laporan Cabang</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-lg animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-xl font-bold">{selectedBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nama Cabang</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input 
                      type="text" className="input w-full pl-12 py-4" required 
                      placeholder="Contoh: Cabang Samarinda"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Kode Cabang</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input 
                      type="text" className="input w-full pl-12 py-4" required 
                      placeholder="Contoh: SMD"
                      value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nomor Telepon</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input 
                      type="text" className="input w-full pl-12 py-4" 
                      placeholder="08xx-xxxx-xxxx"
                      value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Alamat Cabang</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-6 text-primary-500" />
                    <textarea 
                      className="input w-full pl-12 py-4 h-28 resize-none" required
                      placeholder="Alamat lengkap lokasi depo..."
                      value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="px-8 py-3 rounded-2xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 transition-all">Simpan Cabang</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
