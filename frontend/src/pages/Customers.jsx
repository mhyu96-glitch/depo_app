import { useState, useEffect } from 'react';
import { customerApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Search, Plus, Filter, 
  Phone, MapPin, Gift, Trash2, Edit2, 
  Loader2, X, AlertCircle, Sparkles,
  UserPlus
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import AddCustomerModal from '../components/AddCustomerModal';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAll({ 
        search, 
        branch_id: user?.branch_id 
      });
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleEdit = (cust) => {
    setSelectedCustomer(cust);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus pelanggan ini?')) return;
    try {
      await customerApi.remove(id);
      loadCustomers();
    } catch (err) {
      alert('Gagal menghapus pelanggan');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-outfit">
      
      {/* Header Section - Modern & Precise */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-600/20">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Manajemen Pelanggan</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Database & Loyalty Tracker</p>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
          className="px-8 py-3.5 bg-primary-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary-600/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <UserPlus size={18} /> Tambah Pelanggan
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
            <input 
              type="text" 
              placeholder="Cari nama, alamat, atau nomor whatsapp..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary-500 font-bold text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-all">
            <Filter size={16} /> Filter Lanjutan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800">
           <TableSkeleton rows={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {customers.map((cust) => (
            <div key={cust.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-primary-200 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleEdit(cust)} className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-all">
                    <Edit2 size={14} />
                 </button>
                 <button onClick={() => handleDelete(cust.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-all">
                    <Trash2 size={14} />
                 </button>
              </div>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-gray-400 dark:text-gray-500 font-black text-2xl border border-gray-100 dark:border-gray-700 shadow-inner">
                  {cust.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{cust.name}</h3>
                    {cust.tier && (
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm ${
                        cust.tier === 'Platinum' ? 'bg-indigo-600 text-white' :
                        cust.tier === 'Gold' ? 'bg-amber-500 text-white' : 'bg-gray-400 text-white'
                      }`}>
                        {cust.tier}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-primary-500 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                    <Sparkles size={10} /> {cust.voucher_code || 'No Voucher'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-50 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-300 mt-0.5 shrink-0" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                    {cust.block_name} {cust.house_number ? `No. ${cust.house_number}` : ''}
                    <span className="block text-[10px] opacity-60 font-medium mt-1">{cust.address}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-300 shrink-0" />
                  <span className="text-xs font-black text-gray-600 dark:text-gray-400 tracking-wider">{cust.whatsapp || '-'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 px-1">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Loyalty</p>
                  <p className="font-black text-gray-900 dark:text-white text-lg leading-none mt-1">{cust.loyalty_count} Transaksi</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Klaim Gratis</p>
                  <p className="font-black text-emerald-600 text-lg leading-none mt-1">{cust.total_free_gallon} Galon</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shared Modal Component - Now synced with POS */}
      <AddCustomerModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); loadCustomers(); }} 
        initialData={selectedCustomer}
        branchId={user?.branch_id}
      />
    </div>
  );
}
