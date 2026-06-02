import { useState, useEffect } from 'react';
import { fleetApi, dashboardApi } from '../api';
import { 
  Plus, Settings, Wrench, Clock, ShieldCheck, 
  AlertTriangle, CheckCircle2, Navigation,
  Calendar, DollarSign, X, Check, MapPin, Store
} from 'lucide-react';

import PillSelect from '../components/PillSelect';

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVModal, setShowVModal] = useState(false);
  const [showMModal, setShowMModal] = useState(false);
  
  const [vForm, setVForm] = useState({ plate: '', brand: '', branch_name: '', owner_name: '', owner_phone: '' });
  const [mForm, setMForm] = useState({ plate: '', description: '', cost: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, l, b] = await Promise.all([
        fleetApi.getVehicles(),
        fleetApi.getMaintenance(),
        dashboardApi.getBranchComparison() // This gives us branch names
      ]);
      setVehicles(v.data.data);
      setLogs(l.data.data);
      setBranches(b.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await fleetApi.createVehicle(vForm);
      setVForm({ plate: '', brand: '', branch_name: '', owner_name: '', owner_phone: '' });
      setShowVModal(false);
      loadData();
    } catch (_) {}
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      await fleetApi.createMaintenance({ ...mForm, cost: parseFloat(mForm.cost) });
      setMForm({ plate: '', description: '', cost: '' });
      setShowMModal(false);
      loadData();
    } catch (_) {}
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse">MEMUAT DATA ARMADA...</div>;

  const readyCount = vehicles.filter(v => v.status === 'ready').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-outfit pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
             <div className="w-2 h-10 bg-primary-500 rounded-full" />
             Manajemen Armada
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Pantau kesehatan kendaraan operasional Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowVModal(true)}
            className="btn-primary py-3 px-6 rounded-2xl shadow-xl shadow-primary-500/20 font-black tracking-widest text-xs uppercase flex items-center gap-2"
          >
            <Plus size={18} /> Tambah Motor
          </button>
          <button 
            onClick={() => setShowMModal(true)}
            className="bg-red-500 text-white py-3 px-6 rounded-2xl shadow-xl shadow-red-500/20 font-black tracking-widest text-xs uppercase flex items-center gap-2 hover:bg-red-600 transition-all"
          >
            <Wrench size={18} /> Log Perbaikan
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-xl shadow-green-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle2 size={100} /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Motor Ready</p>
            <h2 className="text-4xl font-black mt-2 tracking-tighter">{readyCount} <span className="text-sm font-bold opacity-60">UNIT</span></h2>
            <p className="text-[11px] font-bold mt-2 opacity-80 uppercase tracking-widest">SIAP BEROPERASI HARI INI</p>
         </div>
         <div className="card p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-xl shadow-orange-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Wrench size={100} /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Dalam Perbaikan</p>
            <h2 className="text-4xl font-black mt-2 tracking-tighter">{vehicles.length - readyCount} <span className="text-sm font-bold opacity-60">UNIT</span></h2>
            <p className="text-[11px] font-bold mt-2 opacity-80 uppercase tracking-widest">SEDANG MASUK BENGKEL</p>
         </div>
         <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none shadow-xl shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Calendar size={100} /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Servis Terjadwal</p>
            <h2 className="text-4xl font-black mt-2 tracking-tighter">2 <span className="text-sm font-bold opacity-60">UNIT</span></h2>
            <p className="text-[11px] font-bold mt-2 opacity-80 uppercase tracking-widest">JADWAL MINGGU INI</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Vehicle List */}
         <div className="lg:col-span-7 space-y-6">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <MI name="delivery_dining" className="text-primary-500" size={18} />
               Daftar Unit Motor
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {vehicles.map(v => (
                 <div key={v.id} className="card p-5 border-none shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col justify-between min-h-[240px]">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${v.status === 'ready' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 animate-bounce-slow' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                            <MI name="delivery_dining" size={24} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.status === 'ready' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600 animate-pulse'}`}>
                            {v.status === 'ready' ? 'READY' : 'DI SERVIS'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{v.brand}</h3>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black px-2 py-0.5 bg-gray-900 text-white rounded-md tracking-widest">{v.plate}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                           <MapPin size={10} className="text-primary-500" />
                           {v.branch_name || 'Tidak Ada Cabang'}
                        </div>
                      </div>
                      {v.owner_name && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                          <MI name="person" size={13} className="text-amber-500" />
                          <span>{v.owner_name}</span>
                          {v.owner_phone && <span className="text-gray-400">· {v.owner_phone}</span>}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto relative z-10">
                      <div className="pt-4 border-t border-gray-50 dark:border-gray-800 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Terakhir Servis</p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{new Date(v.last_service).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'2-digit' })}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Servis Berikutnya</p>
                            <p className="text-xs font-bold text-primary-500">{new Date(v.next_service).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* FULL WIDTH Animated Road */}
                    {v.status === 'ready' && (
                      <div className="absolute bottom-0 left-0 w-full h-8 overflow-hidden pointer-events-none">
                         <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-100 dark:bg-gray-800" />
                         <div className="absolute bottom-0 left-0 w-full h-[2px] border-b-2 border-dashed border-primary-500/30 opacity-50" />
                         <div className="animate-motor-move absolute bottom-1 text-primary-500 flex flex-col items-center">
                            <span className="text-[7px] font-black bg-primary-500 text-white px-1 rounded mb-[-4px] shadow-sm uppercase">GO</span>
                            <MI name="delivery_dining" size={24} />
                         </div>
                      </div>
                    )}

                    <div className="absolute right-[-10%] top-[20%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none">
                       <MI name="delivery_dining" size={140} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Maintenance Logs */}
         <div className="lg:col-span-5 space-y-6">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <MI name="construction" className="text-red-500" size={18} />
               Riwayat Perbaikan
            </h2>
            <div className="space-y-4">
               {logs.map(l => (
                 <div key={l.id} className="card p-5 border-none shadow-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg tracking-widest w-fit">{l.plate}</span>
                          <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                             <MapPin size={8} /> {l.branch_name || 'Depo Pusat'}
                          </span>
                       </div>
                       <span className={`text-[9px] font-black uppercase ${l.status === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                          {l.status === 'completed' ? '✓ SELESAI' : '• DI PROSES'}
                       </span>
                    </div>
                    <p className="text-sm font-black text-gray-800 dark:text-gray-200">{l.description}</p>
                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock size={12} />
                          <p className="text-[10px] font-black uppercase tracking-widest">{new Date(l.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</p>
                       </div>
                       <p className="text-sm font-black text-red-500">{fmt(l.cost)}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Add Vehicle Modal */}
      {showVModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowVModal(false)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in">
             <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">Tambah Motor Baru</h3>
                <button onClick={() => setShowVModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={20} /></button>
             </div>
              <form onSubmit={handleAddVehicle} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Plat Nomor</label>
                   <input 
                     required value={vForm.plate} onChange={e => setVForm({...vForm, plate: e.target.value.toUpperCase()})}
                     placeholder="KT 1234 XX" className="input w-full text-lg font-black tracking-widest py-4 px-5" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Merk & Tipe</label>
                   <input 
                     required value={vForm.brand} onChange={e => setVForm({...vForm, brand: e.target.value})}
                     placeholder="Honda Vario 160" className="input w-full font-bold py-4 px-5" 
                   />
                </div>
                <PillSelect 
                  label="Penempatan Cabang"
                  icon={Store}
                  options={branches.map(b => ({ value: b.branch_name, label: b.branch_name }))}
                  value={vForm.branch_name}
                  onChange={val => setVForm({...vForm, branch_name: val})}
                  placeholder="-- Pilih Cabang --"
                />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nama Pemilik Armada</label>
                   <input 
                     value={vForm.owner_name} onChange={e => setVForm({...vForm, owner_name: e.target.value})}
                     placeholder="Nama pemilik kendaraan" className="input w-full font-bold py-4 px-5" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">No. HP Pemilik</label>
                   <input 
                     value={vForm.owner_phone} onChange={e => setVForm({...vForm, owner_phone: e.target.value})}
                     placeholder="0812..." className="input w-full font-bold py-4 px-5" 
                   />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-4 rounded-3xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/30 hover:scale-[1.02] transition-transform">
                     SIMPAN UNIT
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Maintenance Modal */}
        {showMModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowMModal(false)} />
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in">
               <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight text-red-500">Log Perbaikan</h3>
                  <button onClick={() => setShowMModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={20} /></button>
               </div>
               <form onSubmit={handleAddMaintenance} className="p-8 space-y-6">
                   <PillSelect 
                     label="Pilih Unit (Plat)"
                     icon={Navigation}
                     options={vehicles.map(v => ({ value: v.plate, label: `${v.plate} - ${v.brand} (${v.branch_name})` }))}
                     value={mForm.plate}
                     onChange={val => setMForm({...mForm, plate: val})}
                     placeholder="-- Pilih Motor --"
                   />
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Deskripsi Kerusakan/Servis</label>
                     <textarea 
                       required value={mForm.description} onChange={e => setMForm({...mForm, description: e.target.value})}
                       placeholder="Ganti Oli, Cek Rem, dll..." className="input w-full font-bold py-4 px-5 h-32 resize-none" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Estimasi Biaya (Rp)</label>
                     <input 
                       required type="number" value={mForm.cost} onChange={e => setMForm({...mForm, cost: e.target.value})}
                       placeholder="150000" className="input w-full font-black py-4 px-5" 
                     />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full py-4 rounded-3xl bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-transform">
                       SIMPAN LOG
                    </button>
                  </div>
               </form>
          </div>
        </div>
      )}
    </div>
  );
}
