import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Droplets, Eye, EyeOff, Loader2, MapPin, 
  ChevronDown, User, Lock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { foundation } from '../utils/foundation';

// Material Icons Component
const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ username: '', password: '', branch: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showBranch, setShowBranch] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  // Load cabang dari API (tanpa authenticate)
  useEffect(() => {
    const CACHE_KEY = 'cached_branches';

    // Pakai cache dulu - instant load
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) {
          setBranches(list);
          // TIDAK AUTO SELECT - biarkan user pilih sendiri atau kosongkan (otomatis dari database)
        }
      }
    } catch (e) {
      console.warn('Cache parse error:', e);
    }

    // Fetch branches dari backend (public route)
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/branches`, { 
          method: 'GET',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) {
          console.error('Failed to fetch branches:', res.status, res.statusText);
          setBranchesLoading(false);
          return;
        }

        const data = await res.json();
        const list = data?.data || [];
        
        if (Array.isArray(list) && list.length > 0) {
          console.log('Branches loaded:', list);
          setBranches(list);
          // TIDAK AUTO SELECT - biarkan user pilih sendiri atau kosongkan (otomatis dari database)
          localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Branch tidak wajib - user akan otomatis login ke cabang mereka dari database
    
    console.log('Login attempt:', { 
      username: form.username, 
      branch: form.branch || '(auto dari database)',
      availableBranches: branches.map(b => b.name)
    });
    
    setLoading(true);
    try {
      await login(form.username, form.password, form.branch);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Akses Ditolak: Periksa kembali Username & Password Anda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-brand-900 p-4 relative overflow-hidden font-outfit">
      {/* Background orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] animate-pulse" />

      <div className="w-full max-w-md relative z-10 pt-24 pb-10">
        {/* Logo card */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-brand-400 shadow-2xl mb-6 relative"
          >
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
            <Droplets size={40} className="text-white relative z-10" />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Depo</h1>
          <p className="text-primary-300 mt-2 text-sm font-bold uppercase tracking-[0.3em] opacity-60">Control Center Pro</p>
        </div>

        {/* Login form */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-50" />
          
          <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Masuk ke Akun</h2>

          {error && (
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mb-6 px-5 py-4 rounded-2xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-bold leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Custom Pill Branch Selector */}
            <div className="form-group relative z-[50]">
               <label className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-3 block">Lokasi Cabang (Opsional)</label>
               <div className="relative">
                  <motion.div 
                    onClick={() => setShowBranch(!showBranch)}
                    className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-6 flex items-center justify-between cursor-pointer transition-all shadow-inner group"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <MapPin size={14} />
                      </div>
                      <span className="text-white font-black text-xs uppercase tracking-widest">
                        {form.branch || 'Pilih Cabang (Opsional)'}
                      </span>
                    </div>
                    <ChevronDown size={18} className={`text-white/30 transition-transform duration-300 ${showBranch ? 'rotate-180' : ''}`} />
                  </motion.div>

                  <AnimatePresence>
                    {showBranch && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 8, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-3 shadow-2xl z-[100] overflow-hidden"
                      >
                        {branchesLoading ? (
                          <div className="p-4 text-center">
                            <Loader2 className="animate-spin mx-auto mb-2 text-primary-400" size={20} />
                            <p className="text-[10px] text-primary-300 font-bold uppercase tracking-widest">Memuat cabang...</p>
                          </div>
                        ) : branches.length > 0 ? (
                          branches.map(b => (
                            <motion.div
                              key={b.id || b.name}
                              onClick={() => {
                                setForm(f => ({ ...f, branch: b.name }));
                                setShowBranch(false);
                              }}
                              className={`p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition-all mb-1 last:mb-0 ${form.branch === b.name ? 'bg-primary-500 text-white shadow-xl' : 'text-primary-200 hover:bg-white/5'}`}
                              whileHover={{ x: 5 }}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${form.branch === b.name ? 'bg-white' : 'bg-primary-500'}`} />
                              <span className="text-xs font-black uppercase tracking-widest">{b.name}</span>
                            </motion.div>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-xs text-red-400 font-bold mb-3">Tidak ada cabang tersedia</p>
                            <p className="text-[10px] text-primary-300 opacity-60">Hubungi administrator</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            <div className="form-group">
              <label className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-3 block">Username</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full h-14 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all pl-14 pr-6 rounded-full text-sm font-bold"
                  placeholder="ID Pengguna"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-400">
                   <User size={18} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-3 block">Password Keamanan</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full h-14 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all pl-14 pr-14 rounded-full text-sm font-bold tracking-widest"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-400">
                   <Lock size={18} />
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-primary-500 to-brand-500 text-white flex items-center justify-center gap-3 rounded-full font-black tracking-[0.3em] text-xs uppercase shadow-2xl shadow-primary-500/40 hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Droplets size={20} />}
              {loading ? 'MEMPROSES...' : 'MASUK KE SISTEM'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest opacity-40">
              Auth: admin/admin123 · kasir/kasir123
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
