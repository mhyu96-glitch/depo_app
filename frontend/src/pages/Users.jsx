import { useState, useEffect } from 'react';
import { userApi, branchApi, courierApi } from '../api';
import { 
  UserCog, Plus, Edit2, Trash2, 
  Loader2, X, Shield, Building2, 
  User, Lock, CheckCircle, XCircle, RefreshCw, Truck
} from 'lucide-react';

import PillSelect from '../components/PillSelect';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'kasir',
    branch_id: '',
    is_active: 1
  });

  const roleLabels = {
    kasir: 'Kasir',
    admin: 'Administrator',
    branch_admin: 'Admin Cabang',
    superadmin: 'Super Admin',
    kurir: 'Kurir'
  };

  const isPrivilegedRole = (role) => role === 'admin' || role === 'branch_admin' || role === 'superadmin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, branchRes] = await Promise.all([
        userApi.getAll(),
        branchApi.getAll()
      ]);
      setUsers(userRes.data.data);
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
      if (selectedUser) {
        await userApi.update(selectedUser.id, form);
      } else {
        await userApi.create(form);
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setForm({
      name: '',
      username: '',
      password: '',
      role: 'kasir',
      branch_id: '',
      is_active: 1
    });
  };

  const handleEdit = (u) => {
    setSelectedUser(u);
    setForm({
      name: u.name,
      username: u.username,
      password: '', // Password empty when editing unless changed
      role: u.role,
      branch_id: u.branch_id || '',
      is_active: u.is_active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Nonaktifkan pengguna ini?')) return;
    try {
      await userApi.remove(id);
      loadData();
    } catch (err) {
      alert('Gagal menonaktifkan pengguna');
    }
  };

  // ── Rolling: kasir → kurir ──────────────────────────────
  const [rollingUser, setRollingUser] = useState(null);
  const [rollingForm, setRollingForm] = useState({ phone: '', base_salary: '' });
  const [rollingLoading, setRollingLoading] = useState(false);

  // ── Rolling: kurir → kasir ──────────────────────────────
  const [rollingCourier, setRollingCourier] = useState(null);
  const [courierToKasirForm, setCourierToKasirForm] = useState({ username: '', password: '' });
  const [courierToKasirLoading, setCourierToKasirLoading] = useState(false);

  const handleRollingToCourier = async (e) => {
    e.preventDefault();
    setRollingLoading(true);
    try {
      // Jika admin atau branch_admin, langsung ubah role-nya dan create courier
      if (rollingUser.role === 'admin' || rollingUser.role === 'branch_admin') {
        // Buat data courier dulu
        const courierRes = await courierApi.create({
          name: rollingUser.name,
          phone: rollingForm.phone || '',
          base_salary: rollingForm.base_salary || 0,
          branch_id: rollingUser.branch_id
        });
        
        // Update user role menjadi kurir dan hubungkan ke courier
        await userApi.update(rollingUser.id, {
          role: 'kurir',
          courier_id: courierRes.data.data.id
        });
        
        alert(`${rollingUser.name} berhasil diubah menjadi Kurir!`);
      } else {
        // Jika kasir, gunakan API kasirToCourier
        const res = await userApi.kasirToCourier({
          user_id: rollingUser.id,
          phone: rollingForm.phone,
          base_salary: rollingForm.base_salary
        });
        alert(res.data.message);
      }
      setRollingUser(null);
      setRollingForm({ phone: '', base_salary: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal rolling ke kurir');
    } finally {
      setRollingLoading(false);
    }
  };

  const handleCourierToKasir = async (e) => {
    e.preventDefault();
    setCourierToKasirLoading(true);
    try {
      // Jika admin atau branch_admin, langsung ubah role-nya menjadi kasir
      if (rollingCourier.role === 'admin' || rollingCourier.role === 'branch_admin') {
        await userApi.update(rollingCourier.id, {
          role: 'kasir',
          username: courierToKasirForm.username,
          password: courierToKasirForm.password || undefined
        });
        alert(`${rollingCourier.name} berhasil diubah menjadi Kasir!`);
      } else {
        // Jika kurir, gunakan API courierToKasir
        const res = await userApi.courierToKasir({
          courier_id: rollingCourier.courier_id,
          username: courierToKasirForm.username,
          password: courierToKasirForm.password
        });
        alert(res.data.message);
      }
      setRollingCourier(null);
      setCourierToKasirForm({ username: '', password: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal rolling ke kasir');
    } finally {
      setCourierToKasirLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserCog size={24} className="text-primary-500" />
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-gray-500">Pengaturan akun admin dan kasir cabang</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Tambah Pengguna
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : (
        <div className="table-wrapper card">
          <table className="table">
            <thead>
              <tr>
                <th>Nama & Role</th>
                <th>Username</th>
                <th>Cabang</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isPrivilegedRole(u.role) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                        {(u.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isPrivilegedRole(u.role) ? 'text-primary-500' : 'text-gray-400'}`}>
                          {roleLabels[u.role] || u.role}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{u.username}</td>
                  <td>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <Building2 size={14} className="text-gray-400" />
                      {u.branch_name || 'Semua Cabang'}
                    </div>
                  </td>
                  <td>
                    {u.is_active ? (
                      <span className="badge-green"><CheckCircle size={10} /> Aktif</span>
                    ) : (
                      <span className="badge-red"><XCircle size={10} /> Nonaktif</span>
                    )}
                  </td>
                  <td className="text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* Admin/Branch Admin → Kasir / Kurir */}
                      {(u.role === 'admin' || u.role === 'branch_admin') && u.is_active && (
                        <>
                          <button 
                            onClick={() => { setRollingUser(u); setRollingForm({ phone: '', base_salary: '' }); }}
                            className="p-2 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg text-gray-400 hover:text-cyan-500 transition-colors"
                            title="Jadikan Kurir"
                          >
                            <Truck size={16} />
                          </button>
                          <button 
                            onClick={() => { setRollingCourier(u); setCourierToKasirForm({ username: u.username, password: '' }); }}
                            className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-gray-400 hover:text-purple-500 transition-colors"
                            title="Jadikan Kasir"
                          >
                            <UserCog size={16} />
                          </button>
                        </>
                      )}
                      {/* Kasir → Kurir */}
                      {u.role === 'kasir' && u.is_active && (
                        <button 
                          onClick={() => { setRollingUser(u); setRollingForm({ phone: '', base_salary: '' }); }}
                          className="p-2 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg text-gray-400 hover:text-cyan-500 transition-colors"
                          title="Jadikan Kurir"
                        >
                          <Truck size={16} />
                        </button>
                      )}
                      {/* Kurir → Kasir */}
                      {u.role === 'kurir' && u.is_active && u.courier_id && (
                        <button 
                          onClick={() => { setRollingCourier(u); setCourierToKasirForm({ username: '', password: '' }); }}
                          className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-gray-400 hover:text-purple-500 transition-colors"
                          title="Jadikan Kasir"
                        >
                          <UserCog size={16} />
                        </button>
                      )}
                      <button onClick={() => handleEdit(u)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-lg animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-xl font-bold">{selectedUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input 
                      type="text" className="input w-full pl-12 py-4" required 
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Nama lengkap pengguna..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Username</label>
                  <div className="relative">
                    <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input 
                      type="text" className="input w-full pl-12 py-4" required 
                      disabled={!!selectedUser}
                      value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                      placeholder="username_akses"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Password {selectedUser && '(Kosongkan jika tidak ganti)'}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input 
                      type="password" className="input w-full pl-12 py-4" 
                      required={!selectedUser}
                      value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="md:col-span-1">
                  <PillSelect 
                    label="Hak Akses / Role"
                    icon={Shield}
                    options={[
                      { value: 'kasir', label: 'Kasir' },
                      { value: 'branch_admin', label: 'Admin Cabang' },
                      { value: 'admin', label: 'Administrator' }
                    ]}
                    value={form.role}
                    onChange={val => setForm({
                      ...form,
                      role: val,
                      branch_id: val === 'admin' ? '' : form.branch_id
                    })}
                    placeholder="-- Pilih Role --"
                  />
                </div>
                <div className="md:col-span-1">
                  <PillSelect 
                    label="Cabang"
                    icon={Building2}
                    options={form.role === 'admin' 
                      ? [{ value: '', label: 'Semua Cabang' }, ...branches.map(b => ({ value: b.id, label: b.name }))]
                      : branches.map(b => ({ value: b.id, label: b.name }))
                    }
                    value={form.branch_id}
                    onChange={val => setForm({...form, branch_id: val})}
                    placeholder={form.role === 'admin' ? 'Semua Cabang' : '-- Pilih Cabang --'}
                  />
                </div>
                {selectedUser && (
                  <div className="md:col-span-2">
                    <PillSelect 
                      label="Status Akun"
                      icon={CheckCircle}
                      options={[
                        { value: 1, label: 'Aktif' },
                        { value: 0, label: 'Nonaktif' }
                      ]}
                      value={form.is_active}
                      onChange={val => setForm({...form, is_active: val})}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="px-8 py-3 rounded-2xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 transition-all">Simpan User</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Rolling: Kasir → Kurir */}
      {rollingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-in">
            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Rolling Jabatan</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kasir → Kurir</p>
                </div>
              </div>
              <button onClick={() => setRollingUser(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleRollingToCourier} className="p-8 space-y-6">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black">
                  {(rollingUser.name?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-purple-900 dark:text-purple-100">{rollingUser.name}</p>
                  <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                    {(rollingUser.role === 'admin' || rollingUser.role === 'branch_admin') ? 'Admin' : 'Kasir'} · akan dijadikan Kurir
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">No. HP Kurir (opsional)</label>
                <input
                  type="text"
                  className="input w-full py-4 px-5"
                  placeholder="0812..."
                  value={rollingForm.phone}
                  onChange={e => setRollingForm({ ...rollingForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Gaji Pokok Kurir (Rp)</label>
                <input
                  type="number"
                  className="input w-full py-4 px-5"
                  placeholder="3000000"
                  value={rollingForm.base_salary}
                  onChange={e => setRollingForm({ ...rollingForm, base_salary: e.target.value })}
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  {(rollingUser.role === 'admin' || rollingUser.role === 'branch_admin')
                    ? 'Akun admin akan berubah menjadi kurir. Data kurir baru akan dibuat dan role user diubah menjadi kurir.'
                    : 'Akun kasir tetap aktif. Data kurir baru akan dibuat dan dihubungkan ke akun ini.'
                  }
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-800">
                <button type="button" onClick={() => setRollingUser(null)} className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 font-black text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" disabled={rollingLoading} className="px-8 py-3 rounded-2xl bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 transition-all flex items-center gap-2">
                  {rollingLoading ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                  Jadikan Kurir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rolling: Kurir → Kasir */}
      {rollingCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-in">
            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Rolling Jabatan</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kurir → Kasir</p>
                </div>
              </div>
              <button onClick={() => setRollingCourier(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleCourierToKasir} className="p-8 space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black">
                  {(rollingCourier.name?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-blue-900 dark:text-blue-100">{rollingCourier.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    {(rollingCourier.role === 'admin' || rollingCourier.role === 'branch_admin') ? 'Admin' : 'Kurir'} · akan dijadikan Kasir
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Username Login Kasir</label>
                <input
                  type="text"
                  required
                  className="input w-full py-4 px-5"
                  placeholder="kasir.andi"
                  value={courierToKasirForm.username}
                  onChange={e => setCourierToKasirForm({ ...courierToKasirForm, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Password Login Kasir {(rollingCourier.role === 'admin' || rollingCourier.role === 'branch_admin') && '(Opsional - kosongkan jika tidak ingin mengubah)'}
                </label>
                <input
                  type="password"
                  required={(rollingCourier.role !== 'admin' && rollingCourier.role !== 'branch_admin')}
                  className="input w-full py-4 px-5"
                  placeholder="••••••••"
                  value={courierToKasirForm.password}
                  onChange={e => setCourierToKasirForm({ ...courierToKasirForm, password: e.target.value })}
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  {(rollingCourier.role === 'admin' || rollingCourier.role === 'branch_admin')
                    ? 'Role admin akan diubah menjadi kasir. Username dan password akan digunakan untuk login sebagai kasir.'
                    : 'Akun kasir baru akan dibuat dan dihubungkan ke data kurir ini. Kurir tetap bisa login dengan akun barunya.'
                  }
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-800">
                <button type="button" onClick={() => setRollingCourier(null)} className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 font-black text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" disabled={courierToKasirLoading} className="px-8 py-3 rounded-2xl bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2">
                  {courierToKasirLoading ? <Loader2 size={16} className="animate-spin" /> : <UserCog size={16} />}
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
