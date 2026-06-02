import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { customerApi } from '../api';
import { 
  X, User, Phone, MapPin, 
  Hash, FileText, Loader2, CheckCircle2,
  Sparkles, Home
} from 'lucide-react';

export default function AddCustomerModal({ isOpen, onClose, onSuccess, initialData = null, branchId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    address: '',
    block_name: '',
    house_number: '',
    notes: '',
    tier: 'Regular',
    branch_id: branchId
  });

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData, branch_id: branchId });
    } else {
      setForm({
        name: '',
        whatsapp: '',
        address: '',
        block_name: '',
        house_number: '',
        notes: '',
        tier: 'Regular',
        branch_id: branchId
      });
    }
  }, [initialData, branchId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.whatsapp) {
      setError('Nama dan WhatsApp wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (initialData?.id) {
        await customerApi.update(initialData.id, form);
      } else {
        const res = await customerApi.create(form);
        if (onSuccess) onSuccess(res.data.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm font-outfit">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-white/20"
      >
        {/* Header - Compact & Clean */}
        <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
              <UserPlusIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">
                {initialData ? 'Edit Pelanggan' : 'Pelanggan Baru'}
              </h3>
              <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Informasi Profil & Lokasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            
            {/* 1. Basic Info Row */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nama Lengkap</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary-500 font-bold text-xs"
                      placeholder="Input nama..."
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">WhatsApp</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary-500 font-bold text-xs"
                      placeholder="0812..."
                      value={form.whatsapp}
                      onChange={e => setForm({...form, whatsapp: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Address Detail Grid */}
            <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800">
              <p className="text-[10px] font-black uppercase text-primary-500 tracking-widest px-1">Detail Alamat & Lokasi</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Blok / Nama Jalan</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary-500 font-bold text-xs"
                      placeholder="Contoh: Blok B"
                      value={form.block_name}
                      onChange={e => setForm({...form, block_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nomor Rumah</label>
                  <div className="relative">
                    <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary-500 font-bold text-xs"
                      placeholder="Contoh: B-12"
                      value={form.house_number}
                      onChange={e => setForm({...form, house_number: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Alamat Lengkap / Patokan</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-4 top-4 text-gray-300" />
                  <textarea 
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary-500 font-bold text-xs"
                    rows={2}
                    placeholder="Input alamat lengkap..."
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* 3. Notes Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Catatan Tambahan</label>
              <textarea 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary-500 font-bold text-xs"
                rows={2}
                placeholder="Informasi tambahan pelanggan..."
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100">
                {error}
              </div>
            )}
          </div>

          {/* Footer - Precise Actions */}
          <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] py-3.5 rounded-xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20 hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {initialData ? 'SIMPAN PERUBAHAN' : 'TAMBAH PELANGGAN'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function UserPlusIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
