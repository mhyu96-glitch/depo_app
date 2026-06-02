import { useState, useEffect } from 'react';
import { auditApi } from '../api';
import { 
  Shield, Search, Clock, 
  User, HardDrive, Info, 
  ChevronRight, RefreshCw, Filter
} from 'lucide-react';

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.getAll();
      setLogs(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const filtered = logs.filter(l => 
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in font-outfit">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
             <Shield className="text-primary-500" size={28} />
             Enterprise Audit Trail
          </h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Sistem Keamanan & Audit Aktivitas</p>
        </div>
        <button onClick={loadLogs} className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-primary-500 transition-all">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={18} />
          <input 
            className="input pl-12 h-14 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm font-bold" 
            placeholder="Cari user, aksi, atau target..." 
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="h-14 px-6 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border-none font-black text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Filter size={16} /> Filter Periode
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-none shadow-xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Activity</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Target</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">IP Address</th>
                  </tr>
               </thead>
               <tbody className="divide-y dark:divide-gray-800">
                  {filtered.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <Clock size={14} className="text-gray-300" />
                             <span className="text-xs font-bold text-gray-500">{new Date(l.date).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
                                <User size={14} />
                             </div>
                             <span className="text-sm font-black text-gray-800 dark:text-gray-200">{l.user}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             l.action.includes('Update') ? 'bg-blue-100 text-blue-600' :
                             l.action.includes('Delete') ? 'bg-red-100 text-red-600' :
                             'bg-gray-100 text-gray-600'
                          }`}>
                             {l.action}
                          </span>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <HardDrive size={14} className="text-gray-300" />
                             <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{l.target}</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">{l.detail}</p>
                       </td>
                       <td className="px-6 py-5">
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">{l.ip}</span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <div className="p-6 rounded-[2rem] bg-primary-500/5 border-2 border-dashed border-primary-500/20 flex items-center gap-6">
         <div className="w-14 h-14 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Info size={28} />
         </div>
         <div>
            <h4 className="text-sm font-black text-primary-700 dark:text-primary-300 uppercase tracking-widest">Audit Policy Active</h4>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mt-1">
               Semua aktivitas sistem dicatat secara otomatis untuk keamanan perusahaan. Data log disimpan selama 365 hari sesuai dengan kebijakan kepatuhan Enterprise.
            </p>
         </div>
      </div>
    </div>
  );
}
