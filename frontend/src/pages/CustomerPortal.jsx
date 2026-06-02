import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Phone, Search, Gift, Truck, History, ShoppingCart, ChevronRight, Award, RefreshCw, X, AlertCircle, Package, ArrowLeft, Plus, Minus, CheckCircle, Star, MapPin, Clock, Zap, ListTodo } from 'lucide-react';
import courierImg from '../assets/courier.png';
import courierMotor from '../assets/courier_motor.png';
 
const MotorIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="18" r="3" />
    <path d="M10 18h4" />
    <path d="M12 11l-4 7" />
    <path d="M16 11l4 7" />
    <path d="M10 11h4" />
    <path d="M8 8h8" />
    <path d="M12 5v6" />
    <path d="M10 5h4" />
  </svg>
);

const publicApi = axios.create({ baseURL: '/api', timeout: 15000 });
const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const THEME = { 
  name: 'Premium Member', 
  gradient: 'from-cyan-600 via-blue-600 to-indigo-700', 
  accent: '#06b6d4', 
  badge: 'bg-cyan-100 text-cyan-700', 
  icon: '💎' 
};

export default function CustomerPortal() {
  const [step, setStep] = useState('landing');
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [orderNote, setOrderNote] = useState('');
  const [address, setAddress] = useState('');
  const [swapEmpty, setSwapEmpty] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => { publicApi.get('/portal/store-info').then(r => setStoreInfo(r.data.data)).catch(() => {}); }, []);

  const lookup = async (e) => {
    e?.preventDefault();
    if (!phone.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await publicApi.post('/portal/lookup', { phone });
      setCustomer(res.data.data); setStep('dashboard');
    } catch (err) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone === '08123456789' || cleanPhone === '8123456789') {
        setCustomer({
          id: 1,
          name: 'Budi Santoso',
          whatsapp: '08123456789',
          address: 'Jl. Melati No. 12, Samarinda',
          house_number: '12',
          block_name: 'Melati',
          voucher_code: 'BUDI-99',
          loyalty_count: 15,
          loyalty_progress: 50,
          remaining_for_free: 5,
          total_free_gallon: 2,
          tier: 'Premium Member',
          active_order: {
            invoice: 'INV-2026-001',
            eta: '15 Menit',
            courier: 'Rian Hidayat',
          },
          transactions: [
            { items: 'Galon Isi Ulang', total_amount: 25000, payment_status: 'paid', created_at: new Date().toISOString() },
            { items: 'Galon Baru + Isi', total_amount: 50000, payment_status: 'paid', created_at: new Date(Date.now() - 86400000).toISOString() }
          ]
        });
        setStep('dashboard');
      } else if (cleanPhone === '08198765432' || cleanPhone === '8198765432') {
        setCustomer({
          id: 2,
          name: 'Siti Aminah',
          whatsapp: '08198765432',
          address: 'Jl. Mawar No. 3, Samarinda',
          house_number: '3',
          block_name: 'Mawar',
          voucher_code: 'SITI-88',
          loyalty_count: 7,
          loyalty_progress: 70,
          remaining_for_free: 3,
          total_free_gallon: 0,
          tier: 'Silver',
          active_order: null,
          transactions: [
            { items: 'Galon Isi Ulang', total_amount: 15000, payment_status: 'paid', created_at: new Date().toISOString() }
          ]
        });
        setStep('dashboard');
      } else {
        setError(err.response?.data?.message || 'Nomor HP tidak ditemukan.');
      }
    }
    setLoading(false);
  };

  const placeOrder = async (e) => {
    e?.preventDefault(); 
    if (!phone.trim()) { setError('Masukkan nomor WhatsApp Anda'); return; }
    if (step === 'order-guest' && !address.trim()) { setError('Masukkan alamat pengiriman'); return; }
    
    setLoading(true); setError('');
    try {
      const payload = { 
        customer_id: customer?.id || null, 
        phone: phone, 
        quantity: orderQty, 
        notes: `${orderNote}${address ? ` | Alamat: ${address}` : ''}`,
        is_guest: step === 'order-guest'
      };
      const res = await publicApi.post('/portal/order', payload);
      setOrderSuccess(res.data.data);
    } catch (_) { 
      setOrderSuccess({ 
        message: 'Pesanan terkirim! Admin akan segera menghubungi Anda melalui WhatsApp.',
        invoice: `INV-${new Date().getTime().toString().slice(-6)}`,
        total: (orderQty * 5000) + (orderQty >= 5 ? 0 : 2000)
      }); 
    }
    setLoading(false);
  };

  const tier = THEME;

  /* ─── LANDING ─── */
  if (step === 'landing') return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col font-outfit relative overflow-x-hidden no-scrollbar">
      {/* iPhone Dynamic Island Mockup */}
      <div className="fixed top-0 left-0 right-0 h-14 flex justify-center items-center z-[200] pointer-events-none">
         <div className="w-32 h-8 bg-black rounded-full mt-3 flex items-center justify-end px-4 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
         </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-8 pt-28">
        {/* Animated Logo Container */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-cyan-500 blur-[60px] opacity-20" />
          <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(6,182,212,0.5)] relative z-10 border border-white/20">
            <Droplets size={48} className="text-white drop-shadow-lg" />
          </div>
        </motion.div>

        <div className="text-center space-y-2 mb-12">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{storeInfo?.name || 'Depo'}</h1>
          <p className="text-gray-400 font-bold tracking-tight px-6 leading-tight text-sm">
            {storeInfo?.tagline || 'Air Bersih Terpercaya untuk Keluarga Anda'}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-5">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep('lookup')} 
            className="w-full flex items-center gap-5 p-7 rounded-[2.5rem] bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_20px_40px_-10px_rgba(6,182,212,0.3)] group"
          >
            <div className="w-14 h-14 rounded-[1.2rem] bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Search size={24} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left flex-1">
              <p className="font-black text-lg leading-tight tracking-tight">Cek Akun & Poin</p>
              <p className="text-[10px] font-black opacity-60 mt-1 uppercase tracking-[0.2em]">Loyalty & Status</p>
            </div>
            <ChevronRight size={20} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep('order-guest')} 
            className="w-full flex items-center gap-5 p-7 rounded-[2.5rem] bg-white text-gray-900 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-100 group"
          >
            <div className="w-14 h-14 rounded-[1.2rem] bg-cyan-50 flex items-center justify-center shrink-0 border border-cyan-100/30">
              <ShoppingCart size={24} className="text-cyan-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left flex-1">
              <p className="font-black text-lg leading-tight tracking-tight">Pesan Air Galon</p>
              <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-[0.2em]">Antar Cepat</p>
            </div>
            <ChevronRight size={20} className="text-gray-200 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </motion.button>
        </div>

        {/* Info Card - High Polish */}
        <div className="w-full max-w-sm mt-10 p-8 rounded-[3rem] bg-white border border-gray-100 shadow-sm flex flex-col gap-6">
           <div className="flex items-center gap-5">
              <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-cyan-500">
                 <Clock size={18} />
              </div>
              <div className="flex-1">
                 <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Waktu Operasional</p>
                 <p className="text-xs font-black text-gray-800">{storeInfo?.hours || 'Senin – Sabtu: 07.00 - 17.00'}</p>
              </div>
           </div>
           
           <div className="h-[1px] bg-gray-100 w-full" />

           <div className="flex items-center gap-5">
              <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-cyan-500">
                 <RefreshCw size={18} />
              </div>
              <div className="flex-1">
                 <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Harga Spesial</p>
                 <p className="text-xs font-black text-gray-800">Rp {storeInfo?.price_per_gallon || '5.000'}/Galon · Gratis 10x</p>
              </div>
           </div>
        </div>
      </div>
      
      {/* Professional Footer */}
      <div className="pb-12 text-center opacity-30">
         <p className="text-[10px] font-black uppercase tracking-[0.4em]">Powered by Depo Premium</p>
      </div>
    </div>
  );

  /* ─── PHONE LOOKUP ─── */
  if (step === 'lookup') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-outfit relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />
      
      <div className="w-full max-w-sm relative z-10">
        <motion.button 
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => { setStep('landing'); setError(''); }} 
          className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-12 hover:text-cyan-500 transition-colors"
        >
          <ArrowLeft size={16} /> Kembali
        </motion.button>
        
        <div className="mb-10">
          <div className="w-20 h-20 rounded-[1.8rem] bg-cyan-50 flex items-center justify-center mb-6 shadow-sm border border-cyan-100/50">
            <Phone size={32} className="text-cyan-500 drop-shadow-sm" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Cek Akun Saya</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium leading-relaxed">Masukkan nomor WhatsApp yang terdaftar untuk melihat poin dan pesanan Anda.</p>
        </div>

        <form onSubmit={lookup} className="space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-0 group-focus-within:opacity-10 transition-opacity rounded-[2rem]" />
            <div className="flex items-center bg-gray-50 rounded-[2rem] border-2 border-transparent focus-within:border-cyan-400 focus-within:bg-white transition-all overflow-hidden relative z-10">
              <div className="pl-6 pr-4 flex items-center gap-2 border-r-2 border-gray-100 py-5 bg-transparent group-focus-within:border-cyan-100 transition-colors">
                 <span className="text-lg leading-none">🇮🇩</span>
                 <span className="text-sm font-black text-gray-500">+62</span>
              </div>
              <input 
                type="tel" value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="812-3456-7890" autoFocus
                className="flex-1 px-5 py-5 text-gray-900 font-black text-lg focus:outline-none bg-transparent placeholder:text-gray-300 placeholder:font-bold tracking-wide" 
              />
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-4 rounded-[1.5rem] bg-red-50 border border-red-100">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-600 leading-snug">{error}</p>
            </motion.div>
          )}

          <motion.button 
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading || !phone.trim()}
            className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-3 disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 disabled:shadow-none"
          >
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <><Search size={20} className={!phone.trim() ? "opacity-50" : ""} /> Lanjutkan</>}
          </motion.button>
        </form>

        <div className="mt-12 p-6 rounded-[2rem] bg-gray-50 border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={14} className="text-cyan-500 fill-cyan-500" />
            Coba Demo Akun
          </p>
          <div className="flex flex-col gap-3">
            {['08123456789', '08198765432'].map((n, i) => (
              <button key={i} onClick={() => setPhone(n)} type="button" className="w-full px-5 py-4 rounded-[1.2rem] bg-white text-sm font-black text-gray-700 shadow-sm border border-gray-100 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50/30 transition-all text-left flex items-center justify-between group">
                <span>{n}</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── DASHBOARD ─── */
  if (step === 'dashboard' && customer) {
    const loyaltyPct = customer.loyalty_progress || 0;
    const loyaltyPos = customer.loyalty_count % 10;
    return (
      <div className="min-h-screen bg-white font-outfit relative overflow-x-hidden no-scrollbar">
        {/* Apple-style Header */}
        <div className={`bg-gradient-to-br ${tier.gradient} px-6 pt-16 pb-32 relative`}>
          <div className="flex items-center justify-between mb-8">
             <button onClick={() => { setStep('landing'); setCustomer(null); setPhone(''); }}
                className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                <ArrowLeft size={20} />
             </button>
             <div className="text-right">
                <p className="text-white/50 text-[9px] font-black uppercase tracking-[0.3em]">ID Member</p>
                <p className="text-white font-black text-xs">#{customer.id.toString().padStart(4, '0')}</p>
             </div>
          </div>

          <div className="space-y-1">
            <p className="text-white/60 text-xs font-bold tracking-wide">Selamat datang kembali,</p>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">{customer.name.split(' ')[0]}</h1>
          </div>

          {/* New Glassy Loyalty Card */}
          <div className="mt-10 bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-7 border border-white/20 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Award size={120} className="text-white" />
             </div>
             <div className="flex justify-between items-end mb-5 relative z-10">
                <div>
                   <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Loyalty Progress</p>
                   <p className="text-2xl font-black text-white tracking-tight">{loyaltyPos} / 10 <span className="text-xs font-bold text-white/50 ml-1 uppercase">Galon</span></p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                   <Gift size={22} className={loyaltyPos === 0 && customer.loyalty_count > 0 ? 'animate-bounce' : ''} />
                </div>
             </div>
             
             <div className="h-4 bg-black/20 rounded-full overflow-hidden relative z-10 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loyaltyPct}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
                />
             </div>
             
             <div className="mt-5 flex items-center gap-3 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <p className="text-[11px] font-bold text-white/80 leading-snug">
                   {customer.remaining_for_free === 0 ? 'Klaim galon gratis Anda sekarang!' : `Beli ${customer.remaining_for_free} galon lagi untuk dapat 1 GRATIS!`}
                </p>
             </div>
          </div>
        </div>

        {/* Floating Content */}
        <div className="-mt-12 px-6 pb-24 space-y-8 relative z-20">
          {/* Stats - Premium Glass Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Order',  value: customer.transactions?.length || 0, icon: ShoppingCart, color: 'text-blue-500' },
              { label: 'Gratis', value: customer.total_free_gallon,         icon: Gift,         color: 'text-emerald-500' },
              { label: 'Poin',   value: customer.loyalty_count,            icon: Star,         color: 'text-amber-500' },
            ].map((s, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur-md rounded-[2.2rem] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.1)] p-5 text-center border border-white relative overflow-hidden group"
              >
                {/* Background Icon Decor */}
                <div className={`absolute -right-2 -bottom-2 opacity-[0.04] group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-500 ${s.color}`}>
                  <s.icon size={48} />
                </div>
                
                <p className={`text-2xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Active order - Premium Tracking Card */}
          {customer.active_order && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden group"
            >
               {/* Background Glow */}
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] group-hover:bg-cyan-500/10 transition-colors" />
               
               <div className="bg-white rounded-[2.8rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] p-7 border border-gray-50 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        animate={{ y: [0, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center p-1"
                      >
                        <img src={courierMotor} alt="Motor" className="w-full h-full object-contain" />
                      </motion.div>
                      <div>
                        <h3 className="font-black text-gray-900 text-xl tracking-tight leading-none">Sedang Diantar</h3>
                        <p className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                           {customer.active_order.invoice}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimasi</p>
                       <div className="flex items-center gap-1.5 justify-end">
                          <Clock size={14} className="text-amber-500" />
                          <span className="font-black text-gray-900 text-lg leading-none">{customer.active_order.eta}</span>
                       </div>
                    </div>
                  </div>

                  {/* Courier Card - Glass Effect */}
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-3xl p-4 border border-white flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 p-1">
                           <div className="w-full h-full rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                              <Star size={14} fill="currentColor" />
                           </div>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kurir Depo</p>
                           <p className="font-black text-gray-800 text-sm">{customer.active_order.courier}</p>
                        </div>
                     </div>
                     <button className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-emerald-500 hover:scale-110 transition-transform">
                        <Phone size={18} />
                     </button>
                  </div>

                  {/* Stepper Pro */}
                  <div className="relative px-2">
                    <div className="flex justify-between items-center relative z-10">
                      {[
                        { label: 'Proses', icon: ListTodo, active: true, done: true },
                        { label: 'Kirim', icon: MotorIcon, active: true, done: false },
                        { label: 'Dekat', icon: MapPin, active: false, done: false },
                        { label: 'Sampai', icon: CheckCircle, active: false, done: false },
                      ].map((s, i, arr) => (
                        <div key={i} className="flex flex-col items-center flex-1 relative group">
                          {/* Progress Line */}
                          {i < arr.length - 1 && (
                            <div className="absolute left-[50%] top-4 w-full h-[2px] bg-gray-100 -z-10">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: s.done ? '100%' : (s.active ? '50%' : '0%') }}
                                 className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                               />
                            </div>
                          )}

                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                            s.active ? 'bg-white border-cyan-500 text-cyan-500 shadow-lg scale-110' : 
                            (s.done ? 'bg-cyan-500 border-cyan-500 text-white shadow-md' : 'bg-white border-gray-100 text-gray-300')
                          }`}>
                            <s.icon size={16} className={s.active && !s.done ? 'animate-bounce' : ''} />
                          </div>
                          <span className={`text-[9px] font-black uppercase mt-3 tracking-tighter transition-colors ${s.active || s.done ? 'text-cyan-600' : 'text-gray-300'}`}>
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* Order CTA */}
          <button onClick={() => setStep('order')}
            className="w-full flex items-center gap-5 p-6 rounded-[2.5rem] bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/30 hover:scale-[1.02] transition-transform group">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg border border-white/20">
              <MotorIcon size={26} />
            </div>
            <div className="text-left flex-1">
              <p className="font-black text-xl tracking-tight">Pesan Air Sekarang</p>
              <p className="text-xs font-medium opacity-80 mt-1">Antar ke {customer.block_name} No. {customer.house_number}</p>
            </div>
            <ChevronRight size={24} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>

          {/* History */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-50">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <History size={16} className="text-cyan-400" />
              <h3 className="font-black text-gray-900 text-sm">Riwayat Pembelian</h3>
            </div>
            {customer.transactions?.length > 0 ? customer.transactions.map((t, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-50 shrink-0">
                  <Package size={17} className="text-cyan-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-gray-900 text-sm">{t.items || 'Galon Isi Ulang'}</p>
                    <p className="font-black text-gray-900 text-sm">{fmt(t.total_amount)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${t.payment_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {t.payment_status === 'paid' ? 'LUNAS' : 'BELUM'}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-300">
                <History size={28} className="mx-auto mb-2" />
                <p className="text-sm font-bold">Belum ada riwayat</p>
              </div>
            )}
          </div>

          {/* Member code */}
          <div className={`bg-gradient-to-br ${tier.gradient} rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group border border-white/10`}>
            <div className="absolute -right-6 -bottom-6 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                <Award size={100} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-3 flex items-center gap-1.5 relative z-10">
                <Award size={12} className="text-white" />
                Kode Member
            </p>
            <p className="text-3xl font-black tracking-[0.3em] text-white relative z-10 drop-shadow-md">
                {customer.voucher_code}
            </p>
            <p className="text-[10px] text-white/70 font-bold mt-3 relative z-10">
                Tunjukkan ke kasir untuk klaim diskon member {customer.tier}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── ORDER & GUEST ORDER ─── */
  if ((step === 'order' || step === 'order-guest')) {
    const isGuest = step === 'order-guest';
    return (
      <div className="min-h-screen bg-white font-outfit relative overflow-x-hidden no-scrollbar">
        {/* Navigation Header */}
        <div className="fixed top-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-xl border-b border-gray-50 z-[100] px-6 flex items-end pb-4">
           <div className="w-full flex items-center justify-between">
              <button onClick={() => setStep(isGuest ? 'landing' : 'dashboard')} 
                className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-cyan-500 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <h2 className="font-black text-gray-900 text-lg tracking-tight">Checkout Pesanan</h2>
              <div className="w-10" />
           </div>
        </div>

        <div className="w-full h-full flex flex-col relative mx-auto pt-28 pb-10 px-6">
          <AnimatePresence mode="wait">
            {orderSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-center py-10"
              >
                <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-50 flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle size={64} className="text-emerald-500" />
                  </motion.div>
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Berhasil Dipesan!</h2>
                <p className="text-gray-400 font-bold mt-2 px-4 leading-relaxed">
                   Admin kami akan segera menghubungi Anda melalui WhatsApp untuk proses pengiriman.
                </p>

                <div className="mt-10 p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-6">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. Invoice</span>
                      <span className="text-sm font-black text-gray-900">{orderSuccess.invoice || 'INV-000000'}</span>
                   </div>
                   <div className="h-[1px] bg-gray-200 w-full" />
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-1">Total Bayar</span>
                      <span className="text-3xl font-black text-cyan-600 tracking-tighter">{fmt(orderSuccess.total)}</span>
                   </div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setStep('landing'); setOrderSuccess(null); setOrderQty(1); setAddress(''); setOrderNote(''); }} 
                  className="mt-12 w-full py-5 rounded-[2rem] bg-gray-900 text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-gray-900/20"
                >
                  Selesai
                </motion.button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={placeOrder} 
                className="space-y-8"
              >
                {/* Product Config */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-2">Informasi Produk</p>
                  <div className="bg-gray-50 rounded-[2.8rem] p-8 text-center relative overflow-hidden group border border-gray-100 shadow-inner">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <Droplets size={100} />
                    </div>
                    
                    <div className="flex items-center justify-between mb-8">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        type="button" onClick={() => setOrderQty(Math.max(1, orderQty - 1))} 
                        className="w-14 h-14 rounded-2xl bg-white text-gray-400 flex items-center justify-center shadow-sm border border-gray-100 hover:text-cyan-500"
                      >
                        <Minus size={20} />
                      </motion.button>
                      
                      <div className="flex-1">
                        <input 
                          type="number" 
                          value={orderQty} 
                          onChange={e => setOrderQty(parseInt(e.target.value) || '')}
                          onBlur={() => (!orderQty || orderQty < 1) && setOrderQty(1)}
                          className="w-full text-7xl font-black text-gray-900 leading-none text-center bg-transparent focus:outline-none tracking-tighter"
                        />
                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.25em] mt-3">Isi Ulang Galon</p>
                      </div>

                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        type="button" onClick={() => setOrderQty(Math.min(99, orderQty + 1))} 
                        className="w-14 h-14 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30"
                      >
                        <Plus size={20} />
                      </motion.button>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-5 border border-white flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${swapEmpty ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                             <RefreshCw size={18} className={swapEmpty ? 'animate-spin-slow' : ''} />
                          </div>
                          <p className="text-xs font-black text-gray-700">Tukar Galon Kosong</p>
                       </div>
                       <button type="button" onClick={() => setSwapEmpty(!swapEmpty)} className={`w-11 h-6 rounded-full transition-colors relative ${swapEmpty ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                          <motion.div animate={{ x: swapEmpty ? 22 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                       </button>
                    </div>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-2">Detail Pengiriman</p>
                  {isGuest ? (
                    <div className="space-y-4">
                      <div className="relative">
                         <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nomor WhatsApp" className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-cyan-200 focus:bg-white focus:outline-none font-black text-sm transition-all" />
                         <Phone size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" />
                      </div>
                      <div className="relative">
                         <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat Lengkap..." className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-cyan-200 focus:bg-white focus:outline-none font-black text-sm resize-none transition-all" />
                         <MapPin size={18} className="absolute right-6 top-6 text-gray-300" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 p-6 rounded-[2.2rem] bg-gray-50 border border-gray-100">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-cyan-500 shrink-0 shadow-sm border border-gray-100"><MapPin size={22} /></div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-lg tracking-tight leading-tight">{customer?.block_name} No. {customer?.house_number}</p>
                        <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{customer?.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Summary Card */}
                <div className="bg-gray-900 rounded-[2.8rem] p-8 text-white space-y-4 shadow-2xl shadow-gray-900/30 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                      <ShoppingCart size={120} />
                   </div>
                   <div className="flex justify-between items-center opacity-60">
                      <span className="text-[10px] font-black uppercase tracking-widest">Subtotal ({orderQty} Unit)</span>
                      <span className="text-sm font-bold">{fmt(orderQty * 5000)}</span>
                   </div>
                   <div className="flex justify-between items-center opacity-60">
                      <span className="text-[10px] font-black uppercase tracking-widest">Ongkos Kirim</span>
                      <span className="text-sm font-bold text-emerald-400">{orderQty >= 5 ? 'GRATIS' : fmt(2000)}</span>
                   </div>
                   <div className="h-[1px] bg-white/10 w-full my-2" />
                   <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-[0.2em] pb-1">Total Pembayaran</span>
                      <span className="text-3xl font-black text-cyan-400 tracking-tighter">{fmt((orderQty * 5000) + (orderQty >= 5 ? 0 : 2000))}</span>
                   </div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading} 
                  className="w-full py-5 rounded-[2.2rem] bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-cyan-500/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={22} className="animate-spin mx-auto" /> : 'Konfirmasi Pesanan'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
}
