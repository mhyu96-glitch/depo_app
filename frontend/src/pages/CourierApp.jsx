import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Truck, MapPin, CheckCircle, Clock, Phone,
  Package, DollarSign, ChevronRight, Star,
  Navigation, RefreshCw, Zap, TrendingUp,
  Map as MapIcon, ArrowLeft, MoreVertical,
  ExternalLink, Calendar, Bell, Menu, ShieldCheck,
  Award, BarChart3, ListChecks, AlertCircle, LogOut, Search, User, Sun, Moon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import courierMotor from '../assets/courier_motor.png';

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const THEMES = {
  light: {
    bg: '#f8fafc',
    card: '#ffffff',
    accent: '#2563eb',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    success: '#059669',
    danger: '#dc2626',
    border: 'rgba(0, 0, 0, 0.05)',
    cardShadow: '0 10px 30px rgba(0,0,0,0.02)',
    isDark: false
  },
  dark: {
    bg: '#0f172a',
    card: '#1e293b',
    accent: '#3b82f6',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    success: '#10b981',
    danger: '#ef4444',
    border: 'rgba(255, 255, 255, 0.05)',
    cardShadow: '0 20px 50px rgba(0,0,0,0.3)',
    isDark: true
  }
};

export default function CourierApp() {
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tugas');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', desc: '', onConfirm: () => {}, type: 'info' });
  const [themeMode, setThemeMode] = useState(localStorage.getItem('courier_theme') || 'light');

  const COLORS = THEMES[themeMode];

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem('courier_theme', newTheme);
  };

  const showConfirm = (title, desc, onConfirm, type = 'info') => {
    setConfirmModal({ isOpen: true, title, desc, onConfirm, type });
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) { setError('Masukkan username dan password'); return; }
    setLoading(true); setError('');
    try {
      const loggedInUser = await login(username, password);
      if (!loggedInUser?.courier_id) {
        logout();
        setError('Akun ini belum terhubung ke data kurir. Hubungi admin.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal.');
    }
    setLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const cid = user?.courier_id;
      if (!cid) {
        throw new Error('Courier ID tidak ditemukan');
      }
      const res = await api.get(`/transactions/courier/${cid}`);
      const assignedData = res.data.data || [];
      setDeliveries(assignedData);
      setError('');
    } catch (err) {
      setDeliveries([]);
      setError(err.response?.data?.message || err.message || 'Gagal memuat tugas kurir');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadData();
  }, [user?.courier_id]);

  const markDelivered = async (id) => {
    setCompleting(id);
    await new Promise(r => setTimeout(r, 800));
    try {
      await api.patch(`/transactions/${id}/delivery-status`, { status: 'delivered' });
      triggerSuccess();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyelesaikan tugas');
    }
    setCompleting(null);
  };

  const triggerSuccess = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#4f46e5', '#10b981'] });
  };

  const openMaps = (address) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  if (!user) {
    return (
      <div style={{ backgroundColor: COLORS.bg }} className="min-h-screen font-outfit flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
           <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-400/10 rounded-full blur-[120px]" />
           <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-indigo-400/5 rounded-full blur-[100px]" />
        </div>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm relative z-10">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/20 rotate-12">
                   <Truck size={40} className="text-white" />
                </div>
                <h1 style={{ color: COLORS.textPrimary }} className="text-4xl font-black tracking-tight mb-2">Courier<span className="text-blue-600">Pro</span></h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em]">Logistics Command</p>
            </div>

            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Access Key</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter ID" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 placeholder:text-slate-300 font-bold text-sm focus:outline-none focus:border-blue-500/30 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Secure Pass</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 placeholder:text-slate-300 font-bold text-sm focus:outline-none focus:border-blue-500/30 transition-all" />
                  </div>
                  {error && <div className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 py-3 rounded-xl">{error}</div>}
                  <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-600/30 mt-4">LOG IN</motion.button>
                </form>
            </div>
            <div className="flex flex-col items-center gap-4 mt-10">
                <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">v2.4.0 Edition</p>
                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} className="p-3 bg-slate-100 rounded-2xl text-slate-400 border border-slate-200">
                    {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </motion.button>
            </div>
        </motion.div>
      </div>
    );
  }

  const deliveredForCourier = (deliveries || []).filter(d => d.delivery_status === 'delivered' && d.courier_id === user?.courier_id);

  return (
    <div style={{ backgroundColor: COLORS.bg }} className="h-screen font-outfit overflow-hidden flex flex-col transition-colors duration-500">
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
            <AnimatePresence mode="wait">
                {activeTab === 'tugas' && (
                    <TugasView 
                        user={user} loading={loading} loadData={loadData} 
                        deliveries={deliveries || []} markDelivered={markDelivered} 
                        openMaps={openMaps} completing={completing} 
                        logout={logout} showConfirm={showConfirm}
                        loadError={error}
                        delivered={deliveredForCourier}
                        COLORS={COLORS} toggleTheme={toggleTheme} themeMode={themeMode}
                    />
                )}
                {activeTab === 'peta' && <PetaView deliveries={deliveries || []} user={user} COLORS={COLORS} toggleTheme={toggleTheme} themeMode={themeMode} />}
                {activeTab === 'rekap' && <RekapView delivered={deliveredForCourier} user={user} COLORS={COLORS} toggleTheme={toggleTheme} themeMode={themeMode} />}
                {activeTab === 'bonus' && <BonusView delivered={deliveredForCourier} COLORS={COLORS} toggleTheme={toggleTheme} themeMode={themeMode} />}
            </AnimatePresence>
        </div>
        
        {/* Solid Light Bottom Navigation */}
        <div style={{ backgroundColor: COLORS.card }} className="absolute bottom-6 left-[6%] right-[6%] h-20 shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[2.2rem] border border-slate-100 flex items-center justify-around px-4 z-[1000]">
          <TabButton active={activeTab === 'tugas'} icon={Zap} label="Tasks" onClick={() => setActiveTab('tugas')} />
          <TabButton active={activeTab === 'peta'} icon={MapIcon} label="Radar" onClick={() => setActiveTab('peta')} />
          <TabButton active={activeTab === 'rekap'} icon={Calendar} label="Logs" onClick={() => setActiveTab('rekap')} />
          <TabButton active={activeTab === 'bonus'} icon={Award} label="Rewards" onClick={() => setActiveTab('bonus')} />
        </div>
      </div>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-xs bg-white rounded-[3rem] p-8 shadow-2xl relative z-10 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600"><AlertCircle size={32} /></div>
              <h3 className="text-xl font-black text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">{confirmModal.desc}</p>
              <div className="grid grid-cols-2 gap-3 mt-8">
                 <button onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase">Batal</button>
                 <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(p => ({...p, isOpen: false})); }} className="py-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase shadow-lg shadow-blue-600/20">Konfirmasi</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ icon: Icon, label, onClick, active = false }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all ${active ? `bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105` : 'text-slate-400 hover:text-slate-600'}`}>
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </motion.button>
  );
}

function TugasView({ user, loadData, deliveries = [], markDelivered, openMaps, completing, logout, showConfirm, loadError = '', delivered = [], COLORS, toggleTheme, themeMode }) {
    const safeDeliveries = deliveries || [];
    const myTasks = safeDeliveries.filter(d => d.courier_id === user?.courier_id && d.delivery_status !== 'delivered');
    const totalMyTasks = myTasks.length + delivered.length;
    const progressPct = totalMyTasks > 0 ? Math.min((delivered.length / totalMyTasks) * 100, 100) : 0;

    return (
        <div className="pb-10">
            {/* Minimalist Light Header */}
            <div style={{ backgroundColor: COLORS.bg }} className="px-8 pt-16 pb-12 relative overflow-hidden transition-colors duration-500">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Welcome Back,</p>
                        <h1 style={{ color: COLORS.textPrimary }} className="text-4xl font-black tracking-tight">{user?.name}</h1>
                        <div className="flex items-center gap-3 mt-3">
                            <span style={{ backgroundColor: COLORS.isDark ? '#1e293b' : '#ffffff', borderColor: COLORS.border }} className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 border">ID: #{user?.courier_id}</span>
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-600/10 px-3 py-1 rounded-lg">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Active Duty</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }} className="w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all shadow-sm">
                            {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => showConfirm('Logout?', 'Yakin ingin keluar?', logout, 'danger')} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }} className="w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"><LogOut size={20} /></motion.button>
                    </div>
                </div>

                {/* Performance Card */}
                <div style={{ backgroundColor: COLORS.card }} className="p-7 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-slate-900"><TrendingUp size={80} /></div>
                    <div className="flex justify-between items-end mb-6 relative z-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Shift Progress</p>
                            <h3 style={{ color: COLORS.textPrimary }} className="text-lg font-black">{Math.round(progressPct)}% Completed</h3>
                        </div>
                        <div className="text-right">
                             <span className="text-3xl font-black text-blue-600">{delivered.length}</span>
                             <span className="text-lg font-black text-slate-300 ml-1">/ {totalMyTasks}</span>
                        </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1.5 }} className="h-full bg-blue-600 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="px-5 space-y-12">
                {loadError && (
                    <div className="rounded-[2rem] border border-red-100 bg-red-50 p-5 text-center text-[10px] font-black uppercase tracking-widest text-red-600">
                        {loadError}
                    </div>
                )}

                {/* Active Assignments */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-3">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><Zap size={16} /></div>
                             <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">My Assignments</h3>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg border border-blue-100 uppercase tracking-widest">{myTasks.length} Live</span>
                    </div>
                    {myTasks.length > 0 ? (
                        <div className="space-y-5">{myTasks.map(d => <DeliveryCard key={d.id} delivery={d} onComplete={markDelivered} onMaps={openMaps} completing={completing} user={user} COLORS={COLORS} />)}</div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-300"><CheckCircle size={32} /></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Belum ada tugas aktif.<br/>Tunggu penugasan dari kasir.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MapFlyHandler({ target }) {
    const map = useMap();
    useEffect(() => { if (target) map.flyTo(target, 16, { duration: 2 }); }, [target, map]);
    return null;
}

function PetaView({ deliveries = [], user, COLORS, toggleTheme, themeMode }) {
    const [search, setSearch] = useState('');
    const [targetLoc, setTargetLoc] = useState(null);
    const samarindaCenter = [-0.5021, 117.1536];
    const safeDeliveries = deliveries || [];
    const assignedDeliveries = safeDeliveries.filter(d => d.courier_id === user?.courier_id && d.delivery_status !== 'delivered');
    const filtered = assignedDeliveries.filter(d => (d.customer_name || '').toLowerCase().includes(search.toLowerCase()) || (d.address || '').toLowerCase().includes(search.toLowerCase()));
    const handleSelect = (d) => { setTargetLoc([d.lat, d.lng]); setSearch(''); };
    return (
        <div className="h-full flex flex-col relative transition-colors duration-500" style={{ backgroundColor: COLORS.bg }}>
            <div style={{ backgroundColor: COLORS.bg }} className="px-8 pt-16 pb-8 shrink-0 relative z-[1001] overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-56 h-56 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 style={{ color: COLORS.textPrimary }} className="text-3xl font-black tracking-tight">Radar</h2>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }} className="w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-400 transition-all shadow-sm">
                        {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </motion.button>
                </div>
                <div className="relative z-10">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, color: COLORS.textPrimary }} placeholder="Search customers..." className="w-full border rounded-2xl py-4 pl-14 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 shadow-sm transition-all" />
                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <AnimatePresence>
                        {search && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }} className="absolute top-full left-0 right-0 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-2 mt-3 max-h-72 overflow-y-auto z-[2000] no-scrollbar border">
                                {filtered.length > 0 ? filtered.map(d => (
                                    <button key={d.id} onClick={() => handleSelect(d)} style={{ borderBottomColor: COLORS.border }} className="w-full p-5 flex items-center gap-4 hover:bg-blue-500/5 text-left border-b last:border-none transition-all group">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={18} /></div>
                                        <div className="flex-1"><p style={{ color: COLORS.textPrimary }} className="text-xs font-black uppercase tracking-tight">{d.customer_name}</p><p className="text-[10px] font-bold text-slate-400 mt-0.5 line-clamp-1">{d.address}</p></div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </button>
                                )) : <div className="p-10 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">No results found</div>}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <div className="flex-1 relative z-10">
                <MapContainer center={samarindaCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" subdomains={['mt0','mt1','mt2','mt3']} attribution='&copy; Google' />
                    <MapFlyHandler target={targetLoc} />
                    {assignedDeliveries.map(d => {
                        const icon = L.divIcon({
                            className: 'custom-marker',
                            html: `<div class="w-11 h-11 rounded-[1.2rem] border-2 border-white shadow-2xl flex items-center justify-center bg-blue-600 text-white shadow-lg transform hover:scale-110 transition-all">
                                    <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                   </div>`,
                            iconSize: [44, 44]
                        });
                        return (
                            <Marker key={d.id} position={[d.lat, d.lng]} icon={icon}>
                                <Popup className="premium-popup-light">
                                    <div style={{ backgroundColor: COLORS.card }} className="p-5 min-w-[240px] font-outfit rounded-3xl">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100"><User size={24} /></div>
                                            <div>
                                                <p style={{ color: COLORS.textPrimary }} className="font-black text-sm">{d.customer_name}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ditugaskan oleh kasir</p>
                                            </div>
                                        </div>
                                        <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`)} className="w-full bg-slate-900 text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><Navigation size={14} /> LAUNCH NAV</button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}

function RekapView({ delivered, user, COLORS, toggleTheme, themeMode }) {
    const totalEarnings = delivered.reduce((acc, c) => acc + (c.commission_amount || 0), 0);
    return (
        <div className="pb-32 transition-colors duration-500" style={{ backgroundColor: COLORS.bg }}>
            <div style={{ backgroundColor: COLORS.bg }} className="px-8 pt-16 pb-10 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-56 h-56 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <h2 style={{ color: COLORS.textPrimary }} className="text-4xl font-black tracking-tight">Logs</h2>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }} className="w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-400 transition-all shadow-sm">
                        {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </motion.button>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] relative z-10">Shift History & Earnings</p>
            </div>
            
            <div className="px-6 space-y-8">
                <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Completed</p>
                        <p style={{ color: COLORS.textPrimary }} className="text-4xl font-black">{delivered.length}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Net Earnings</p>
                        <p className="text-2xl font-black text-emerald-600">{fmt(totalEarnings)}</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 ml-3">Recent Closures</h3>
                    {delivered.length > 0 ? delivered.map(d => (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={d.id} style={{ backgroundColor: COLORS.card }} className="p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center group shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100"><CheckCircle size={24} /></div>
                                <div><p style={{ color: COLORS.textPrimary }} className="font-black group-hover:text-blue-600 transition-all">{d.customer_name}</p><p className="text-[10px] font-bold text-slate-300 mt-1">{d.invoice_number}</p></div>
                            </div>
                            <p className="font-black text-emerald-600">{fmt(d.commission_amount || 0)}</p>
                        </motion.div>
                    )) : (
                        <div className="py-20 text-center opacity-20">
                            <BarChart3 size={48} className="mx-auto mb-4 text-slate-900" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No activities recorded</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function BonusView({ delivered = [], COLORS, toggleTheme, themeMode }) {
    const TARGET = 20;
    const deliveredCount = delivered.length;
    const balance = delivered.reduce((acc, curr) => acc + (curr.commission_amount || 0), 0);
    const pct = Math.min((deliveredCount / TARGET) * 100, 100);
    return (
        <div className="pb-32 transition-colors duration-500" style={{ backgroundColor: COLORS.bg }}>
            <div style={{ backgroundColor: COLORS.bg }} className="px-8 pt-16 pb-10 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-56 h-56 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <h2 style={{ color: COLORS.textPrimary }} className="text-4xl font-black tracking-tight">Rewards</h2>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }} className="w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-400 transition-all shadow-sm">
                        {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </motion.button>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] relative z-10">Incentives & Achievements</p>
            </div>

            <div className="px-6 space-y-8">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ backgroundColor: COLORS.card }} className="p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] rotate-12 text-slate-900"><Award size={120} /></div>
                    <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-8 text-amber-500 border border-amber-100"><Award size={40} /></div>
                    <h3 style={{ color: COLORS.textPrimary }} className="text-2xl font-black mb-2">Shift Runner</h3>
                    <p className="text-xs text-slate-400 font-medium mb-10 max-w-[220px] leading-relaxed">Reach {TARGET} completions today for a <span className="text-blue-600 font-black">Rp 50.000</span> bonus incentive.</p>
                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-300">Live Progress</span>
                            <span style={{ color: COLORS.textPrimary }}>{deliveredCount} <span className="text-slate-200">/ {TARGET}</span></span>
                        </div>
                        <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5 }} className="h-full bg-amber-400 rounded-full" />
                        </div>
                        <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest text-right">{Math.round(pct)}% Achieved</p>
                    </div>
                </motion.div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div style={{ backgroundColor: COLORS.card }} className="p-7 rounded-[2.5rem] border border-slate-100 text-left group shadow-sm">
                         <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 border border-blue-100"><Star size={20} /></div>
                         <p className="text-[10px] font-black uppercase text-slate-300 mb-1">Rank</p>
                         <p style={{ color: COLORS.textPrimary }} className="text-lg font-black tracking-tight uppercase group-hover:text-blue-600 transition-colors">Elite Agent</p>
                    </div>
                    <div style={{ backgroundColor: COLORS.card }} className="p-7 rounded-[2.5rem] border border-slate-100 text-left group shadow-sm">
                         <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100"><DollarSign size={20} /></div>
                         <p className="text-[10px] font-black uppercase text-slate-300 mb-1">Balance</p>
                         <p style={{ color: COLORS.textPrimary }} className="text-lg font-black tracking-tight group-hover:text-emerald-600 transition-colors">{fmt(balance)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeliveryCard({ delivery: d, onComplete, onMaps, completing, user, COLORS }) {
  const isCompleting = completing === d.id;
  const isMine = d.courier_id === user?.courier_id;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, boxShadow: COLORS.cardShadow }} className="rounded-[2.2rem] p-7 border relative overflow-hidden group transition-all duration-500">
      {!isMine && <div style={{ backgroundColor: COLORS.isDark ? 'rgba(245,158,11,0.1)' : '#f1f5f9', color: COLORS.isDark ? '#f59e0b' : '#64748b', borderColor: COLORS.border }} className="absolute top-0 right-0 px-5 py-2 text-[8px] font-black uppercase rounded-bl-2xl border-l border-b">Bukan tugas Anda</div>}
      
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
              {d.priority === 'express' && <div className="flex items-center gap-1 bg-red-500/10 text-red-600 text-[8px] font-black px-2.5 py-1 rounded-lg border border-red-500/20"><Zap size={10} /> PRIORITY</div>}
              <div style={{ backgroundColor: d.payment_status === 'cod' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: d.payment_status === 'cod' ? '#d97706' : '#059669', borderColor: COLORS.border }} className="text-[8px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest">{d.payment_status}</div>
          </div>
          <h3 style={{ color: COLORS.textPrimary }} className="text-xl font-black tracking-tight">{d.customer_name}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{d.invoice_number}</p>
        </div>
        <div className="text-right">
            <p className="text-2xl font-black text-blue-600 leading-none mb-1">{fmt(d.total_amount)}</p>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d.total_gallons} Galon</span>
        </div>
      </div>

      <div style={{ backgroundColor: COLORS.isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderColor: COLORS.border }} className="p-5 rounded-2xl mb-7 flex items-start gap-4 border">
          <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-slate-400 leading-relaxed">{d.address}</p>
      </div>

      <div className="flex gap-4">
         {isMine ? (
             <>
                 <div className="flex gap-2.5">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => onMaps(d.address)} style={{ backgroundColor: COLORS.isDark ? '#334155' : '#ffffff', borderColor: COLORS.border }} className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-400 border hover:text-blue-600 transition-all shadow-sm"><Navigation size={22} /></motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.open(`https://wa.me/${d.customer_phone}`, '_blank')} style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }} className="w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-600 border transition-all shadow-sm"><Phone size={22} /></motion.button>
                 </div>
                 <motion.button whileTap={{ scale: 0.95 }} onClick={() => onComplete(d.id)} disabled={isCompleting} style={{ backgroundColor: COLORS.isDark ? COLORS.accent : '#0f172a' }} className="flex-1 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-2">
                    {isCompleting ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    {isCompleting ? 'VERIFYING...' : 'FINISH TASK'}
                 </motion.button>
             </>
         ) : (
            <div style={{ backgroundColor: COLORS.isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderColor: COLORS.border }} className="w-full py-5 rounded-2xl border flex items-center justify-center gap-3 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
                <Clock size={16} /> MENUNGGU PENUGASAN KASIR
            </div>
         )}
      </div>
    </motion.div>
  );
}
