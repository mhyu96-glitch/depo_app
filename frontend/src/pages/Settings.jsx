import { useState, useEffect } from 'react';
import { productApi, authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, Package, Key, 
  Save, Loader2, CheckCircle, AlertCircle, Droplets,
  Palette, Smartphone, Store, Plus, RefreshCcw
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { brandColor, setBrandColor, brandName, setBrandName } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Branding state
  const [tempBrandName, setTempBrandName] = useState(brandName);
  const [tempBrandColor, setTempBrandColor] = useState(brandColor);

  // Password change state
  const [pwForm, setPwForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll();
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePriceUpdate = async (id, price) => {
    try {
      await productApi.update(id, { price });
      setSuccess('Harga produk berhasil diperbarui');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      alert('Gagal memperbarui harga');
    }
  };

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
        {/* Left Column: Branding & Products */}
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

           {/* Product Prices */}
           <div className="card p-8 border-none shadow-xl space-y-8">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Package className="text-primary-500" size={18} />
                 Konfigurasi Harga Produk
              </h2>
              {loading ? (
                <div className="flex justify-center py-8 font-black animate-pulse text-gray-300">SYNCING PRODUCTS...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <div key={p.id} className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-primary-500/30 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-primary-500">
                          <Droplets size={20} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{p.name}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase">{p.branch_name || 'Global System'}</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Rp</span>
                           <input 
                            type="number" className="input pl-10 h-11 text-sm font-black bg-white dark:bg-gray-900" 
                            defaultValue={p.price}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val !== p.price) handlePriceUpdate(p.id, val);
                            }}
                          />
                        </div>
                        <button className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                          <Save size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    onClick={() => window.open('/courier', '_blank')}
                    className="w-full p-5 rounded-[2rem] bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 flex items-center justify-between group transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg">
                           <Smartphone size={20} />
                        </div>
                        <div className="text-left">
                           <p className="text-sm font-black text-cyan-900 leading-none">Portal Kurir</p>
                           <p className="text-[10px] font-black text-cyan-600/60 uppercase tracking-widest mt-1">Buka Aplikasi PWA</p>
                        </div>
                     </div>
                     <Plus size={20} className="text-cyan-500 group-hover:rotate-45 transition-transform" />
                  </button>

                  <button 
                    onClick={() => window.open('/customer', '_blank')}
                    className="w-full p-5 rounded-[2rem] bg-blue-50 hover:bg-blue-100 border border-blue-100 flex items-center justify-between group transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                           <Store size={20} />
                        </div>
                        <div className="text-left">
                           <p className="text-sm font-black text-blue-900 leading-none">Portal Pelanggan</p>
                           <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mt-1">Akses Layanan Mandiri</p>
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
