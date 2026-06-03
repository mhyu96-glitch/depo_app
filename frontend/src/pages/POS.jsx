import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionApi, customerApi, courierApi, productApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, Printer, X, CheckCircle2, Plus, 
  Search, Truck, Calculator, 
  Droplet, Zap, Sparkles, Minus, CreditCard, 
  Bell, RefreshCw, ShoppingCart, Tag, 
  Bookmark
} from 'lucide-react';
import AddCustomerModal from '../components/AddCustomerModal';
import { foundation } from '../utils/foundation';

const fmt = foundation.format.idr;

const zeroScrollStyles = `
  .pos-container { height: calc(100vh - 90px); display: flex; flex-direction: column; gap: 0.5rem; overflow: hidden; padding: 0.25rem; }
  .main-grid { display: grid; grid-template-columns: 1fr 300px; gap: 0.75rem; height: 100%; min-height: 0; }
  .left-content { display: flex; flex-direction: column; gap: 0.75rem; overflow: hidden; }
  .sidebar-content { background: white; border-radius: 1.25rem; border: 1px solid #f1f5f9; display: flex; flex-direction: column; height: 100%; overflow: hidden; box-shadow: 0 4px 20px -10px rgba(0,0,0,0.05); }
  .qty-card { background: white; border-radius: 1rem; border: 1px solid #f1f5f9; padding: 1.25rem; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
  .price-card { background: white; border-radius: 1rem; border: 1px solid #f1f5f9; padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.15rem; min-width: 180px; }
  .preset-btn { padding: 0.6rem; border-radius: 0.6rem; border: 1px solid #f1f5f9; font-weight: 800; font-size: 9px; text-transform: uppercase; transition: all 0.2s; background: white; color: #64748b; }
  .preset-btn.active { background: #1e40af; color: white; border-color: #1e40af; }
  .payment-option { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 0.75rem; border: 1px solid #f1f5f9; transition: all 0.1s; cursor: pointer; }
  .payment-option.selected { border-color: #2563eb; background: #eff6ff; color: #1e40af; }
  input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
`;

export default function POS() {
  const { user } = useAuth();
  
  // View State: 'form' untuk transaksi baru, 'history' untuk melihat history
  const [currentView, setCurrentView] = useState('form');
  
  // Form states
  const [form, setForm] = useState({ transaction_type: 'pickup', courier_id: '', customer_id: '', customer_name: '', total_gallons: 1, unit_price: 5000, discount: 0, payment_method: 'cash', payment_status: 'paid', partial_amount: 0, notes: '', });
  const [customers, setCustomers] = useState([]);
  const [couriers,  setCouriers]  = useState([]);
  const [products,  setProducts]  = useState([]);
  const [custSearch, setCustSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  const [loading, setLoading]  = useState(false);
  const [success, setSuccess]  = useState(null);
  
  // History states
  const [salesHistory, setSalesHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 🎫 Kupon/Voucher Toggle
  const [useVoucher, setUseVoucher] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherValid, setVoucherValid] = useState(false);
  const [autoVoucherType, setAutoVoucherType] = useState(''); // 'BL' or 'DL'

  // Load sales history function
  const loadSalesHistory = async () => {
    setHistoryLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const params = { 
        branch_id: user?.branch_id,
        start_date: today,
        end_date: today
      };
      const res = await transactionApi.getAll(params);
      setSalesHistory(res.data.data || []);
    } catch (error) {
      console.error('Error loading sales history:', error);
      setSalesHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle delete request
  const handleDeleteRequest = async (transactionId, invoiceNumber) => {
    const reason = prompt(`Masukkan alasan penghapusan untuk ${invoiceNumber}:`);
    if (!reason || reason.trim() === '') {
      alert('Alasan penghapusan harus diisi!');
      return;
    }

    setDeleteLoading(prev => ({ ...prev, [transactionId]: true }));
    try {
      await transactionApi.requestDelete(transactionId, { reason: reason.trim() });
      alert(`✅ Permintaan penghapusan untuk ${invoiceNumber} berhasil dikirim ke admin!`);
      // Reload history to show updated status
      loadSalesHistory();
    } catch (error) {
      alert('❌ Gagal mengirim permintaan: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  useEffect(() => {
    const p = { branch_id: user?.branch_id };
    Promise.all([ courierApi.getAll(p), productApi.getAll(p) ]).then(([c, pr]) => {
      setCouriers(c.data.data || []); setProducts(pr.data.data || []);
      if (pr.data.data?.[0]?.price) setForm(f => ({ ...f, unit_price: pr.data.data[0].price }));
    });
    
    // Load history if we're on history view
    if (currentView === 'history') {
      loadSalesHistory();
    }
  }, [user, currentView]);

  useEffect(() => {
    if (selectedCust) {
      setForm(f => {
        let d = 0; const sub = f.total_gallons * f.unit_price;
        if (selectedCust.tier === 'Platinum') d = sub * 0.1;
        else if (selectedCust.tier === 'Gold') d = sub * 0.05;
        return { ...f, discount: d };
      });
    }
  }, [form.total_gallons, form.unit_price, selectedCust]);

  // Validasi Voucher
  useEffect(() => {
    if (!useVoucher || !voucherCode || voucherCode.length < 3) {
      setVoucherDiscount(0);
      setVoucherValid(false);
      return;
    }

    // Simulasi validasi voucher (bisa diganti dengan API call ke backend)
    const validateVoucher = async () => {
      const subtotal = form.total_gallons * form.unit_price;
      
      // Contoh voucher codes (bisa diganti dengan API)
      const voucherDB = {
        'DISKON10': { type: 'percentage', value: 10, min_purchase: 0 },
        'DISKON20': { type: 'percentage', value: 20, min_purchase: 50000 },
        'DISKON50K': { type: 'fixed', value: 50000, min_purchase: 100000 },
        'GRATIS1': { type: 'free_item', value: 1, min_purchase: 100000 },
      };

      const voucher = voucherDB[voucherCode];
      
      if (voucher && subtotal >= voucher.min_purchase) {
        setVoucherValid(true);
        if (voucher.type === 'percentage') {
          setVoucherDiscount(subtotal * (voucher.value / 100));
        } else if (voucher.type === 'fixed') {
          setVoucherDiscount(voucher.value);
        } else {
          setVoucherDiscount(0); // Untuk free_item, logika berbeda
        }
      } else {
        setVoucherValid(false);
        setVoucherDiscount(0);
      }
    };

    const timer = setTimeout(validateVoucher, 500);
    return () => clearTimeout(timer);
  }, [useVoucher, voucherCode, form.total_gallons, form.unit_price]);

  const searchCustomers = useCallback(async (q) => {
    if (!q || q.length < 2) { setCustomers([]); return; }
    try { const res = await customerApi.getAll({ search: q, branch_id: user?.branch_id, limit: 5 }); setCustomers(res.data.data || []); } catch (_) { setCustomers([]); }
  }, [user]);

  // Generate Auto Voucher Code
  const generateAutoVoucherCode = useCallback((type) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timeStr = today.getHours().toString().padStart(2, '0') + today.getMinutes().toString().padStart(2, '0');
    
    if (type === 'pickup') {
      return `BL${dateStr}${timeStr}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    } else if (type === 'delivery') {
      return `DL${dateStr}${timeStr}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    }
    return '';
  }, []);

  const total = (form.total_gallons * form.unit_price) - Number(form.discount || 0) - Number(voucherDiscount || 0);

  const [offlineQueue, setOfflineQueue] = useState([]);

  // Load offline queue on mount
  useEffect(() => {
    const stored = localStorage.getItem('depo_offline_tx');
    if (stored) {
      try { setOfflineQueue(JSON.parse(stored)); } catch(e) {}
    }
  }, []);

  const saveOffline = (payload) => {
    const updated = [...offlineQueue, { id: Date.now(), ...payload }];
    setOfflineQueue(updated);
    localStorage.setItem('depo_offline_tx', JSON.stringify(updated));
    alert('⚠️ Jaringan Terputus! Transaksi aman disimpan di memori kasir (Mode Offline).');
  };

  const syncOffline = async () => {
    if (offlineQueue.length === 0) return;
    setLoading(true);
    let successCount = 0;
    const failedQueue = [];
    for (const tx of offlineQueue) {
      try {
        await transactionApi.create(tx);
        successCount++;
      } catch (err) {
        failedQueue.push(tx);
      }
    }
    setOfflineQueue(failedQueue);
    localStorage.setItem('depo_offline_tx', JSON.stringify(failedQueue));
    setLoading(false);
    alert(`✅ Sinkronisasi selesai: ${successCount} transaksi berhasil dikirim ke server.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.transaction_type === 'delivery' && !form.courier_id) { alert('Pilih kurir!'); return; }
    setLoading(true);
    
    const payload = { 
      ...form, 
      branch_id: user?.branch_id, 
      subtotal: form.total_gallons * form.unit_price, 
      total_amount: total, 
      items: [{
        product_id: products[0]?.id, 
        product_name: products[0]?.name || 'Galon', 
        quantity: form.total_gallons, 
        unit_price: form.unit_price, 
        total_price: form.total_gallons * form.unit_price 
      }], 
      customer_phone: selectedCust?.whatsapp,
      // Data voucher
      voucher_code: useVoucher && voucherValid ? voucherCode : null,
      voucher_discount: useVoucher && voucherValid ? voucherDiscount : 0,
      voucher_type: autoVoucherType || 'manual', // 'BL', 'DL', atau 'manual'
    };
    
    try {
      const res = await transactionApi.create(payload);
      setSuccess(res.data.data);
      // Reset form dan voucher
      setForm(f => ({ 
        ...f, 
        customer_id: '', 
        customer_name: '', 
        total_gallons: 1, 
        discount: 0, 
        notes: '', 
        courier_id: '', 
        transaction_type: 'pickup', 
        payment_method: 'cash' 
      }));
      setSelectedCust(null); 
      setCustSearch('');
      setUseVoucher(false);
      setVoucherCode('');
      setVoucherDiscount(0);
      setVoucherValid(false);
      setAutoVoucherType('');
      
      // Refresh history if we're in history view
      if (currentView === 'history') {
        loadSalesHistory();
      }
    } catch (err) { 
      if (!err.response || err.message.includes('Network Error')) {
         saveOffline(payload);
         setForm(f => ({ 
           ...f, 
           customer_id: '', 
           customer_name: '', 
           total_gallons: 1, 
           discount: 0, 
           notes: '', 
           courier_id: '', 
           transaction_type: 'pickup', 
           payment_method: 'cash' 
         }));
         setSelectedCust(null); 
         setCustSearch('');
         setUseVoucher(false);
         setVoucherCode('');
         setVoucherDiscount(0);
         setVoucherValid(false);
         setAutoVoucherType('');
      } else {
         alert('Gagal: ' + (err.response?.data?.message || err.message)); 
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="pos-container font-outfit animate-fade-in">
      <style>{zeroScrollStyles}</style>

      {/* TOP BAR (ULTRA COMPACT) */}
      <div className="flex items-center justify-between gap-3 px-4 py-1.5 bg-white rounded-xl shadow-sm border border-gray-100 shrink-0">
         {/* Left: Search atau History Button */}
         <div className="flex-1">
           {currentView === 'form' ? (
             <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-gray-50 border-none focus:ring-1 focus:ring-primary-100 font-bold text-[11px]" 
                   placeholder="Cari Pelanggan..." value={custSearch} onChange={e => { setCustSearch(e.target.value); searchCustomers(e.target.value); setSelectedCust(null); setForm(f=>({...f, customer_id:'', customer_name:e.target.value})); }} />
                
                {customers.length > 0 && (
                   <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                      {customers.map(c => (
                         <button key={c.id} type="button" onClick={() => { setSelectedCust(c); setCustSearch(c.name); setCustomers([]); setForm(f=>({...f, customer_id:c.id, customer_name:c.name})); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-primary-50 text-left border-b last:border-0 border-gray-50">
                            <div className="w-5 h-5 rounded bg-primary-100 text-primary-600 flex items-center justify-center font-black text-[9px]">{c.name[0]}</div>
                            <p className="text-[10px] font-black">{c.name}</p>
                         </button>
                      ))}
                   </div>
                )}
             </div>
           ) : (
             <button 
               onClick={() => setCurrentView('form')}
               className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-black text-[11px] uppercase tracking-wide hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
             >
               <Plus size={14} />
               TRANSAKSI BARU
             </button>
           )}
         </div>

         {/* Middle: Transaction Type (hanya di form view) */}
         {currentView === 'form' && (
           <div className="flex p-0.5 bg-gray-50 rounded-lg shrink-0">
              {[{v:'pickup', l:'Pickup'}, {v:'delivery', l:'Delivery'}].map(t => (
                 <button key={t.v} type="button" onClick={() => setForm(f=>({...f, transaction_type:t.v, courier_id: t.v === 'pickup' ? '' : f.courier_id}))}
                    className={`px-5 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${form.transaction_type === t.v ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400'}`}>{t.l}</button>
              ))}
           </div>
         )}

         {/* Right: Action buttons */}
         <div className="flex items-center gap-2 shrink-0">
            {currentView === 'form' && (
              <button 
                type="button" 
                onClick={() => setCurrentView('history')}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 hover:bg-blue-100 transition-colors"
              >
                <Bell size={12} />
                HISTORY
              </button>
            )}
            {offlineQueue.length > 0 && (
              <button type="button" onClick={syncOffline} disabled={loading} className="px-3 py-1 bg-rose-50 text-rose-500 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 animate-pulse">
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> {offlineQueue.length} Pending
              </button>
            )}
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-[10px]">
              {user?.username?.slice(0, 2)?.toUpperCase() || 'KS'}
            </div>
         </div>
      </div>

      {/* MAIN CONTENT - Conditional Rendering */}
      {currentView === 'form' ? (
        /* FORM VIEW - Original POS Form */
        <form onSubmit={handleSubmit} className="main-grid">
          {/* LEFT CONTENT */}
          <div className="left-content">
            {/* Middle Row: Qty & Prices (SLIM) */}
            <div className="flex gap-3 items-stretch flex-1 min-h-0">
               <div className="qty-card">
                  <p className="absolute top-4 left-4 text-[8px] font-black uppercase text-gray-300 tracking-widest">Qty</p>
                  <div className="flex items-center gap-6">
                     <button type="button" onClick={() => setForm(f=>({...f, total_gallons:Math.max(1, f.total_gallons-1)}))} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 hover:text-rose-500"><Minus size={18}/></button>
                     <span className="text-6xl font-black tabular-nums tracking-tighter text-gray-900 leading-none">{form.total_gallons}</span>
                     <button type="button" onClick={() => setForm(f=>({...f, total_gallons:f.total_gallons+1}))} className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-600/30 hover:bg-primary-700"><Plus size={18}/></button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 h-1 bg-gray-50 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, form.total_gallons * 5)}%` }} className="h-full bg-primary-600" />
                  </div>
               </div>

               <div className="flex flex-col gap-3 shrink-0">
                  <div className="price-card">
                     <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none">Price</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-gray-300">Rp</span>
                        <input type="number" className="bg-transparent border-none focus:ring-0 p-0 font-black text-lg w-20" value={form.unit_price} onChange={e=>setForm(f=>({...f, unit_price:parseFloat(e.target.value)||0}))} />
                     </div>
                  </div>
                  <div className="price-card border-rose-50 bg-rose-50/10">
                     <p className="text-[8px] font-black uppercase text-rose-400 tracking-widest leading-none">Disc</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-rose-200">Rp</span>
                        <input type="number" className="bg-transparent border-none focus:ring-0 p-0 font-black text-lg w-20 text-rose-600" value={form.discount} onChange={e=>setForm(f=>({...f, discount:parseFloat(e.target.value)||0}))} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Bottom Presets (SLIM) */}
            <div className="flex gap-2 shrink-0">
               {[1, 2, 5, 10, 20].map(q => (
                  <button key={q} type="button" onClick={() => setForm(f=>({...f, total_gallons:q}))}
                     className={`preset-btn flex-1 ${form.total_gallons === q ? 'active' : ''}`}>{q} G</button>
               ))}
            </div>
          </div>

          {/* SIDEBAR (ZERO SCROLL FIXED) */}
          <div className="sidebar-content">
             {/* Slim Header */}
             <div className="px-5 py-4 bg-gray-900 text-white shrink-0">
                <p className="text-[8px] font-black opacity-30 uppercase tracking-widest mb-1">Total</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg font-black text-primary-500">Rp</span>
                   <span className="text-2xl font-black tabular-nums tracking-tighter">{total.toLocaleString('id-ID')}</span>
                </div>
             </div>

             <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
              {/* 🎫 KUPON/VOUCHER TOGGLE */}
              <div className="space-y-1.5">
                 <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Kupon Diskon</p>
                 <div className="flex gap-2">
                    <button 
                       type="button"
                       onClick={() => { 
                         setUseVoucher(false); 
                         setVoucherCode(''); 
                         setAutoVoucherType(''); 
                         setVoucherDiscount(0);
                       }}
                       className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${!useVoucher ? 'bg-primary-600 text-white border-2 border-primary-600' : 'bg-gray-50 text-gray-400 border-2 border-gray-100'}`}
                    >
                       TANPA KUPON
                    </button>
                    <button 
                       type="button"
                       onClick={() => setUseVoucher(true)}
                       className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${useVoucher ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-600' : 'bg-gray-50 text-gray-400 border-2 border-gray-100'}`}
                    >
                       <Tag size={11}/> PAKAI KUPON
                    </button>
                 </div>
                 
                 {/* Voucher Options */}
                 <AnimatePresence>
                    {useVoucher && (
                       <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-2"
                       >
                          {/* Auto Voucher Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                             <button
                                type="button"
                                onClick={() => {
                                  const code = generateAutoVoucherCode('pickup');
                                  setVoucherCode(code);
                                  setAutoVoucherType('BL');
                                  setVoucherDiscount(2000); // Diskon Rp 2000 untuk beli langsung
                                  setVoucherValid(true);
                                }}
                                className={`py-2 px-3 rounded-lg text-[8px] font-black uppercase transition-all border-2 ${
                                  autoVoucherType === 'BL' 
                                    ? 'bg-green-500 text-white border-green-500' 
                                    : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                }`}
                             >
                                🛒 BELI LANGSUNG
                             </button>
                             <button
                                type="button"
                                onClick={() => {
                                  const code = generateAutoVoucherCode('delivery');
                                  setVoucherCode(code);
                                  setAutoVoucherType('DL');
                                  setVoucherDiscount(1000); // Diskon Rp 1000 untuk delivery
                                  setVoucherValid(true);
                                }}
                                className={`py-2 px-3 rounded-lg text-[8px] font-black uppercase transition-all border-2 ${
                                  autoVoucherType === 'DL' 
                                    ? 'bg-blue-500 text-white border-blue-500' 
                                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                }`}
                             >
                                🚚 DELIVERY
                             </button>
                          </div>

                          {/* Manual Voucher Input */}
                          <div className="relative">
                             <input 
                                type="text"
                                value={voucherCode}
                                onChange={(e) => {
                                  setVoucherCode(e.target.value.toUpperCase());
                                  setAutoVoucherType(''); // Reset auto type if manual input
                                }}
                                placeholder="ATAU MASUKKAN KODE MANUAL"
                                className={`w-full px-3 py-2 rounded-lg text-[10px] font-black uppercase placeholder:text-purple-300 focus:ring-2 transition-all ${
                                   voucherCode && voucherValid 
                                      ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 focus:ring-emerald-500' 
                                      : voucherCode && !voucherValid && !autoVoucherType
                                      ? 'bg-rose-50 border-2 border-rose-400 text-rose-900 focus:ring-rose-500'
                                      : 'bg-purple-50 border-2 border-purple-200 text-purple-900 focus:ring-purple-500'
                                }`}
                             />
                             {voucherCode && (
                                <div className={`absolute right-2 top-1/2 -translate-y-1/2 ${voucherValid ? 'text-emerald-500' : 'text-rose-500'}`}>
                                   {voucherValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                                </div>
                             )}
                          </div>
                          
                          {/* Voucher Status Messages */}
                          {voucherCode && voucherValid && autoVoucherType && (
                             <motion.div 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                                  autoVoucherType === 'BL' 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-blue-50 border-blue-200'
                                }`}
                             >
                                <Sparkles size={10} className={autoVoucherType === 'BL' ? 'text-green-500' : 'text-blue-500'} />
                                <span className={`text-[8px] font-black uppercase ${
                                  autoVoucherType === 'BL' ? 'text-green-700' : 'text-blue-700'
                                }`}>
                                   {autoVoucherType === 'BL' ? '🛒 Kupon Beli Langsung' : '🚚 Kupon Delivery'} - Diskon {fmt(voucherDiscount)}
                                </span>
                             </motion.div>
                          )}
                          
                          {voucherCode && voucherValid && !autoVoucherType && (
                             <motion.div 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200"
                             >
                                <Sparkles size={10} className="text-emerald-500" />
                                <span className="text-[8px] font-black text-emerald-700 uppercase">
                                   Voucher Valid! Diskon {fmt(voucherDiscount)}
                                </span>
                             </motion.div>
                          )}
                          
                          {voucherCode && !voucherValid && !autoVoucherType && (
                             <motion.div 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-lg border border-rose-200"
                             >
                                <X size={10} className="text-rose-500" />
                                <span className="text-[8px] font-black text-rose-700 uppercase">
                                   Kode tidak valid atau minimum pembelian belum terpenuhi
                                </span>
                             </motion.div>
                          )}
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="space-y-1.5">
                 <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1 uppercase">Payment</p>
                 <div className="space-y-1">
                    {[
                       {v:'cash', l:'TUNAI / CASH', i:<Calculator size={12}/>},
                       {v:'transfer', l:'TRANSFER BANK', i:<CreditCard size={12}/>},
                       {v:'credit', l:'PIUTANG / KASBON', i:<Bookmark size={12}/>}
                    ].map(m => (
                       <div key={m.v} onClick={() => setForm(f=>({...f, payment_method:m.v}))} className={`payment-option ${form.payment_method === m.v ? 'selected' : ''}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${form.payment_method === m.v ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-300'}`}>{m.i}</div>
                          <span className="text-[9px] font-black uppercase tracking-tight">{m.l}</span>
                       </div>
                    ))}
                 </div>
              </div>

               {form.transaction_type === 'delivery' && (
                  <div className="space-y-1.5 shrink-0">
                     <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1 uppercase">Pilih Kurir</p>
                     <select 
                        value={form.courier_id} 
                        onChange={e => setForm(f => ({ ...f, courier_id: e.target.value }))}
                        className="w-full p-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-black uppercase focus:ring-1 focus:ring-primary-100 text-gray-800"
                        required
                     >
                        <option value="">-- Pilih Kurir --</option>
                        {couriers.map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                     </select>
                  </div>
               )}

              <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
                 <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1 uppercase">Notes</p>
                 <textarea value={form.notes} onChange={e=>setForm(f=>({...f, notes:e.target.value}))} rows={1} placeholder="..." className="w-full flex-1 p-3 rounded-lg bg-gray-50 border-none focus:ring-1 focus:ring-primary-100 text-[9px] font-bold resize-none" />
              </div>

              <div className="space-y-1 shrink-0 pb-1">
                 <div className="flex justify-between text-[9px] font-bold text-gray-400"><span>Subtotal</span><span className="text-gray-900">{fmt(form.total_gallons * form.unit_price)}</span></div>
                 {form.discount > 0 && (
                    <div className="flex justify-between text-[9px] font-bold text-rose-400">
                       <span>Diskon Pelanggan</span>
                       <span>- {fmt(form.discount)}</span>
                    </div>
                 )}
                 {useVoucher && voucherValid && voucherDiscount > 0 && (
                    <div className="flex justify-between text-[9px] font-bold text-purple-500">
                       <span className="flex items-center gap-1">
                          <Tag size={9} />
                          {autoVoucherType === 'BL' ? '🛒 Kupon Beli Langsung' :
                           autoVoucherType === 'DL' ? '🚚 Kupon Delivery' : 
                           `Voucher (${voucherCode})`}
                       </span>
                       <span>- {fmt(voucherDiscount)}</span>
                    </div>
                 )}
                 <div className="flex justify-between text-[9px] font-bold text-gray-400"><span>Pajak (0%)</span><span className="text-gray-900">Rp 0</span></div>
              </div>
           </div>

           <div className="p-4 pt-0 shrink-0">
              <motion.button whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-md shadow-primary-600/20 flex items-center justify-center gap-2">
                 {loading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                 <span>KONFIRMASI</span>
              </motion.button>
           </div>
        </div>
      </form>
      ) : (
        /* HISTORY VIEW - Sales History with Delete Request */
        <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* History Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg tracking-tight">History Penjualan Hari Ini</h2>
                <p className="text-blue-100 text-sm font-medium">{new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={loadSalesHistory}
                  disabled={historyLoading}
                  className="px-4 py-2 bg-white/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-white/30 transition-colors"
                >
                  <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} />
                  {historyLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* History Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Memuat history penjualan...</p>
                </div>
              </div>
            ) : salesHistory.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-lg">Belum ada transaksi hari ini</p>
                  <p className="text-gray-400 text-sm">Mulai dengan membuat transaksi baru</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {salesHistory.map((transaction, index) => {
                  const isDeleteRequested = transaction.delete_requested;
                  
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isDeleteRequested 
                          ? 'border-amber-200 bg-amber-50' 
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-gray-900">{transaction.invoice_number}</span>
                              {transaction.transaction_type === 'delivery' && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                  <Truck size={10} className="inline mr-1" />
                                  DELIVERY
                                </span>
                              )}
                              {isDeleteRequested && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                                  ⏳ PENDING DELETE
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date(transaction.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-700 text-sm">
                                {transaction.customer_name || 'Pelanggan Umum'}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  {transaction.total_gallons || 1}x Galon
                                </span>
                                {transaction.voucher_code && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                                    <Tag size={10} className="inline mr-1" />
                                    {transaction.voucher_type === 'BL' ? '🛒 BL' : 
                                     transaction.voucher_type === 'DL' ? '🚚 DL' : 'VOUCHER'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-lg text-emerald-600">
                                {fmt(transaction.total_amount)}
                              </p>
                              <p className="text-xs text-gray-400 uppercase font-bold">
                                {transaction.payment_method}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Delete Button */}
                        {!isDeleteRequested && (
                          <div className="ml-4 pl-4 border-l border-gray-100">
                            <button
                              onClick={() => handleDeleteRequest(transaction.id, transaction.invoice_number)}
                              disabled={deleteLoading[transaction.id]}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase flex items-center gap-1 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {deleteLoading[transaction.id] ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <X size={12} />
                              )}
                              HAPUS
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSuccess(null)}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Transaksi Berhasil!</h3>
              <p className="text-gray-600 mb-1 font-medium">{success.invoice_number}</p>
              <p className="text-2xl font-black text-emerald-600 mb-6">{fmt(success.total_amount)}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setSuccess(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    window.print();
                    setSuccess(null);
                  }}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors"
                >
                  <Printer size={16} />
                  Print
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddCustomerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={(c) => { setSelectedCust(c); setCustSearch(c.name); setForm(f=>({...f, customer_id:c.id, customer_name:c.name})); }} branchId={user?.branch_id} />
    </div>
  );
}
