import { useEffect, useState } from 'react';
import { authApi, settingsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, Package, Key, 
  Loader2, CheckCircle, AlertCircle,
  Palette, Smartphone, Store, Plus, RefreshCcw, Truck, Save
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { brandColor, setBrandColor, brandName, setBrandName } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Branding state
  const [tempBrandName, setTempBrandName] = useState(brandName);
  const [tempBrandColor, setTempBrandColor] = useState(brandColor);
  const [commissionForm, setCommissionForm] = useState({
    base_rate: 500,
    threshold_gallons: 60,
    threshold_rate: 1000
  });
  const [commissionLoading, setCommissionLoading] = useState(true);

  // Password change state
  const [pwForm, setPwForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      return alert('Konfirmasi password baru tidak cocok');
    }
    setSubmitting(true);
    try {
      await authApi.changePassword({ old_password: pwForm.old_password, new_password: pwForm.new_password });
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
      setSuccess('Password berhasil diubah');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBranding = () => {
    setBrandName(tempBrandName);
    setBrandColor(tempBrandColor);
    setSuccess('Branding & Tema berhasil diperbarui');
    setTimeout(() => setSuccess(''), 3000);
  };

  useEffect(() => {
    const loadCommission = async () => {
      try {
        const res = await settingsApi.getCommission();
        setCommissionForm({
          base_rate: res.data.data.base_rate,
          threshold_gallons: res.data.data.threshold_gallons,
          threshold_rate: res.data.data.threshold_rate
        });
      } catch (err) {
        console.error('Gagal mengambil setting komisi:', err);
      } finally {
        setCommissionLoading(false);
      }
    };

    loadCommission();
  }, []);

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        base_rate: Number(commissionForm.base_rate),
        threshold_gallons: Number(commissionForm.threshold_gallons),
        threshold_rate: Number(commissionForm.threshold_rate)
      };
      const res = await settingsApi.updateCommission(payload);
      setCommissionForm(res.data.data);
      setSuccess('Pengaturan komisi kurir berhasil diperbarui');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan komisi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in font-outfit pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
             <div className="w-2 h-10 bg-primary-500 rounded-full" />
             Master Configuration
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Atur branding depo, harga produk, dan keamanan sistem</p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3 animate-scale-in">
          <CheckCircle size={20} /> <span className="font-bold">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Branding Only */}
        <div className="lg:col-span-7 space-y-8">
           {/* Branding Engine */}
           <div className="card p-8 border-none shadow-xl space-y-8">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Palette className="text-primary-500" size={18} />
                 Universal Branding Engine
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Depo / Bisnis</label>
                    <div className="relative">
                       <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                       <input 
                         type="text" className="input pl-12 h-14 text-sm font-black" 
                         value={tempBrandName} onChange={e => setTempBrandName(e.target.value)}
                       />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Warna Utama (Brand Color)</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="color" className="w-14 h-14 rounded-2xl border-none cursor-pointer bg-transparent" 
                         value={tempBrandColor} onChange={e => setTempBrandColor(e.target.value)}
                       />
                       <input 
                         type="text" className="input h-14 text-sm font-mono font-bold" 
                         value={tempBrandColor} onChange={e => setTempBrandColor(e.target.value)}
                       />
                    </div>
                 </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: tempBrandColor }}>
                       <Store size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Preview Brand</p>
                       <p className="text-lg font-black tracking-tight" style={{ color: tempBrandColor }}>{tempBrandName}</p>
                    </div>
                 </div>
                 <button onClick={handleSaveBranding} className="btn-primary py-3 px-8 rounded-2xl shadow-xl shadow-primary-500/20 font-black tracking-widest text-xs uppercase">
                    SIMPAN BRANDING
                 </button>
              </div>
           </div>

           <div className="card p-8 border-none shadow-xl space-y-8">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Truck className="text-emerald-500" size={18} />
                 Komisi Sistem Pengantaran
              </h2>

              {commissionLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 size={28} className="animate-spin text-primary-500" />
                </div>
              ) : (
                <form onSubmit={handleSaveCommission} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate Normal / Galon</label>
                      <input
                        type="number"
                        min="0"
                        className="input h-14 text-sm font-black"
                        value={commissionForm.base_rate}
                        onChange={e => setCommissionForm({ ...commissionForm, base_rate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Batas Galon</label>
                      <input
                        type="number"
                        min="1"
                        className="input h-14 text-sm font-black"
                        value={commissionForm.threshold_gallons}
                        onChange={e => setCommissionForm({ ...commissionForm, threshold_gallons: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate Di Atas Batas</label>
                      <input
                        type="number"
                        min="0"
                        className="input h-14 text-sm font-black"
                        value={commissionForm.threshold_rate}
                        onChange={e => setCommissionForm({ ...commissionForm, threshold_rate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-5 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-emerald-900">Aturan aktif</p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        1-{commissionForm.threshold_gallons} galon: Rp{Number(commissionForm.base_rate || 0).toLocaleString('id-ID')}/galon.
                        Di atas {commissionForm.threshold_gallons} galon: Rp{Number(commissionForm.threshold_rate || 0).toLocaleString('id-ID')}/galon.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Simpan Komisi
                    </button>
                  </div>
                </form>
              )}
           </div>

           {/* Notice about Product Management */}
           <div className="card p-8 border-none shadow-xl space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Package className="text-blue-500" size={18} />
                 Manajemen Produk & Harga
              </h2>
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-lg font-black text-blue-900 dark:text-blue-100 tracking-tight">Konfigurasi Produk Dipindahkan</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-300 mt-1">Semua pengaturan produk dan harga sekarang tersentralisasi di menu "Produk & Harga"</p>
                 </div>
                 <button 
                    onClick={() => window.location.href = '/products'}
                    className="px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all"
                 >
                    BUKA PRODUK
                 </button>
              </div>
           </div>
        </div>

        {/* Right Column: Security & Auth */}
        <div className="lg:col-span-5 space-y-8">
           <div className="card p-8 border-none shadow-xl space-y-8">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Key className="text-orange-500" size={18} />
                 Keamanan & Password
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password Lama</label>
                    <input 
                      type="password" className="input h-14 text-sm font-bold" required
                      value={pwForm.old_password} onChange={e => setPwForm({...pwForm, old_password: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password Baru</label>
                       <input 
                         type="password" className="input h-14 text-sm font-bold" required
                         value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Konfirmasi Password Baru</label>
                       <input 
                         type="password" className="input h-14 text-sm font-bold" required
                         value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password: e.target.value})}
                       />
                    </div>
                 </div>
                 <button 
                   type="submit" 
                   disabled={submitting}
                   className="btn-primary w-full justify-center py-5 rounded-3xl font-black tracking-[0.2em] text-xs uppercase shadow-xl shadow-primary-500/30"
                 >
                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <RefreshCcw size={20} />}
                    <span className="ml-2">UPDATE PASSWORD</span>
                 </button>
              </form>

              <div className="p-6 rounded-[2rem] bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 flex items-start gap-4">
                 <AlertCircle size={24} className="text-orange-500 shrink-0 mt-1" />
                 <p className="text-xs font-bold text-orange-700 dark:text-orange-300 leading-relaxed">
                    <strong>KEAMANAN KRITIS:</strong> Mengganti password akan memutuskan seluruh sesi login aktif di perangkat lain (Handphone/Tablet kurir). Pastikan Anda mencatat password baru Anda.
                 </p>
              </div>
           </div>

            {/* Quick Access Card */}
            <div className="card p-8 bg-gradient-to-br from-gray-900 to-black text-white border-none shadow-2xl relative overflow-hidden mb-8">
               <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Smartphone size={150} /></div>
               <h3 className="text-xl font-black tracking-tight mb-4">Mobile App Access</h3>
               <p className="text-sm font-bold opacity-60 leading-relaxed mb-8">Hubungkan perangkat kasir Anda dengan aplikasi mobile untuk notifikasi push real-time.</p>
               <button className="w-full py-4 rounded-2xl bg-white text-gray-900 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
                  GENERATE DEVICE TOKEN
               </button>
            </div>

            {/* System Access Portals */}
            <div className="card p-8 border-none shadow-xl space-y-6">
               <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Smartphone className="text-cyan-500" size={18} />
                  System Access Portals
               </h2>
               <p className="text-xs font-bold text-gray-400 leading-relaxed">Akses cepat ke aplikasi PWA (Progressive Web App) untuk kurir dan pelanggan.</p>
               
               <div className="space-y-3">
                  <button 
                    onClick={() => window.open('/courier-app', '_blank')}
                    className="w-full p-5 rounded-[2rem] bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 flex items-center justify-between group transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg">
                           <Smartphone size={20} />
                        </div>
                        <div className="text-left">
                           <p className="text-sm font-black text-cyan-900 leading-none">Portal Kurir</p>
                           <p className="text-[10px] font-black text-cyan-600/60 uppercase tracking-widest mt-1">/courier-app</p>
                        </div>
                     </div>
                     <Plus size={20} className="text-cyan-500 group-hover:rotate-45 transition-transform" />
                  </button>

                  <button 
                    onClick={() => window.open('/portal', '_blank')}
                    className="w-full p-5 rounded-[2rem] bg-blue-50 hover:bg-blue-100 border border-blue-100 flex items-center justify-between group transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                           <Store size={20} />
                        </div>
                        <div className="text-left">
                           <p className="text-sm font-black text-blue-900 leading-none">Portal Pelanggan</p>
                           <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mt-1">/portal</p>
                        </div>
                     </div>
                     <Plus size={20} className="text-blue-500 group-hover:rotate-45 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
