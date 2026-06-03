import { useState, useEffect } from 'react';
import { courierApi, branchApi, userApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, Plus, Edit2, Trash2, 
  Loader2, X, Phone, Building2, 
  Wallet, CheckCircle, XCircle, UserPlus, RefreshCw
} from 'lucide-react';

import PillSelect from '../components/PillSelect';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function Couriers() {
  const { user } = useAuth();
  const [couriers, setCouriers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    branch_id: user?.branch_id || '',
    base_salary: '',
    is_active: 1
  });

  // State untuk modal rolling kurir → kasir
  const [rollingCourier, setRollingCourier] = useState(null);
  const [rollingForm, setRollingForm] = useState({ username: '', password: '' });
  const [rollingLoading, setRollingLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Jika bukan admin, kirim branch_id milik user agar hanya kurir cabang sendiri yang tampil
      const params = user?.role !== 'admin' && user?.branch_id
        ? { branch_id: user.branch_id }
        : {};
      const [courierRes, branchRes] = await Promise.all([
        courierApi.getAll(params),
        branchApi.getAll()
      ]);
      setCouriers(courierRes.data.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCourier) {
        await courierApi.update(selectedCourier.id, form);
      } else {
        await courierApi.create(form);
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setSelectedCourier(null);
    setForm({
      name: '',
      phone: '',
      branch_id: user?.branch_id || '',
      base_salary: '',
      is_active: 1
    });
  };

  const handleEdit = (c) => {
    setSelectedCourier(c);
    setForm({
      name: c.name,
      phone: c.phone || '',
      branch_id: c.branch_id || '',
      base_salary: c.base_salary || '',
      is_active: c.is_active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Nonaktifkan kurir ini?')) return;
    try {
      await courierApi.remove(id);
      loadData();
    } catch (err) {
      alert('Gagal menonaktifkan kurir');
    }
  };

  const handleRollingToKasir = async (e) => {
    e.preventDefault();
    if (!rollingCourier) return;
    setRollingLoading(true);
    try {
      const res = await userApi.courierToKasir({
        courier_id: rollingCourier.id,
        username: rollingForm.username,
        password: rollingForm.password
      });
      alert(res.data.message);
      setRollingCourier(null);
      setRollingForm({ username: '', password: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal rolling ke kasir');
    } finally {
      setRollingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Truck size={24} className="text-primary-500" />
            Manajemen Kurir
          </h1>
          <p className="text-sm text-gray-500">Daftar kurir pengantaran dan konfigurasi gaji</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Tambah Kurir
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {couriers.map((c) => {
            console.log('Courier data:', c.name, 'is_active:', c.is_active, 'type:', typeof c.is_active);
            return (
            <div key={c.id} className={`card p-6 space-y-4 hover:shadow-md transition-all ${!(c.is_active === true || c.is_active === 1) ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${(c.is_active === true || c.is_active === 1) ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gray-400'}`}>
                    {(c.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {(c.is_active === true || c.is_active === 1) ? (
                        <span className="badge-green"><CheckCircle size={10} /> Aktif</span>
                      ) : (
                        <span className="badge-gray"><XCircle size={10} /> Nonaktif</span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Building2 size={12} /> {c.branch_name || 'Semua Cabang'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  {(c.is_active === true || c.is_active === 1) && (
                    <>
                      <button 
                        onClick={() => { setRollingCourier(c); setRollingForm({ username: c.name.toLowerCase().replace(/\s+/g, '_'), password: '' }); }}
                        className="p-2 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl text-gray-400 hover:text-cyan-500 transition-colors"
                        title="Jadikan Kasir"
                      >
                        <UserPlus size={18} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800/50">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                    <Phone size={10} /> Kontak
                  </p>
                  <p className="text-sm font-semibold truncate">{c.phone || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800/50">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                    <Wallet size={10} /> Gaji Pokok
                  </p>
                  <p className="text-sm font-semibold text-brand-600 truncate">{fmt(c.base_salary)}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-400 text-center">
                  Komisi: Rp500/galon (1-60) · Rp1.000/galon (&gt;60)
                </p>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-lg animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-xl font-bold">{selectedCourier ? 'Edit Kurir' : 'Tambah Kurir Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                  <input 
                    type="text" className="input w-full py-4 px-5" required 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Masukkan nama kurir..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nomor WhatsApp/HP</label>
                  <input 
                    type="text" className="input w-full py-4 px-5" 
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="0812..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Gaji Pokok (Rp)</label>
                  <input 
                    type="number" className="input w-full py-4 px-5" required 
                    value={form.base_salary} onChange={e => setForm({...form, base_salary: e.target.value})}
                    placeholder="3000000"
                  />
                </div>
                <div className="md:col-span-1">
                  <PillSelect 
                    label="Penempatan Cabang"
                    icon={Building2}
                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                    value={form.branch_id}
                    onChange={val => setForm({...form, branch_id: val})}
                    placeholder="-- Pilih Cabang --"
                  />
                </div>
                <div className="md:col-span-1">
                  <PillSelect 
                    label="Status Keaktifan"
                    icon={CheckCircle}
                    options={[
                      { value: 1, label: 'Aktif' },
                      { value: 0, label: 'Nonaktif' }
                    ]}
                    value={form.is_active}
                    onChange={val => setForm({...form, is_active: val})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="px-8 py-3 rounded-2xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 transition-all">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Rolling: Kurir → Kasir */}
      {rollingCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Rolling Jabatan</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kurir → Kasir</p>
                </div>
              </div>
              <button onClick={() => setRollingCourier(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleRollingToKasir} className="p-8 space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center font-black">
                  {(rollingCourier.name?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-cyan-900 dark:text-cyan-100">{rollingCourier.name}</p>
                  <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                    {rollingCourier.branch_name || 'Kurir'} · akan dijadikan Kasir
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Username Login</label>
                <input
                  type="text" required
                  className="input w-full py-4 px-5"
                  placeholder="username_kasir"
                  value={rollingForm.username}
                  onChange={e => setRollingForm({ ...rollingForm, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Password</label>
                <input
                  type="password" required minLength={6}
                  className="input w-full py-4 px-5"
                  placeholder="Min. 6 karakter"
                  value={rollingForm.password}
                  onChange={e => setRollingForm({ ...rollingForm, password: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-800">
                <button type="button" onClick={() => setRollingCourier(null)} className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 font-black text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" disabled={rollingLoading} className="px-8 py-3 rounded-2xl bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2">
                  {rollingLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Jadikan Kasir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
