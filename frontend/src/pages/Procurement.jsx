import { useState, useEffect } from 'react';
import api from '../api';
import PillSelect from '../components/PillSelect';
import { Package, Plus, Building2, Phone, Edit2, AlertCircle, Clock, X, Truck, ShoppingCart } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function Procurement() {
  const [tab, setTab] = useState('po');
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', phone: '', address: '', category: '', terms: 30 });
  const [poForm, setPoForm] = useState({ supplier_id: '', items: '', total_amount: '', due_date: '', notes: '' });

  const load = async () => {
    try {
      const [sRes, pRes] = await Promise.all([api.get('/procurement/suppliers'), api.get('/procurement/purchase-orders')]);
      setSuppliers(sRes.data.data);
      setPos(pRes.data.data);
    } catch (_) {}
  };
  useEffect(() => { load(); }, []);

  const saveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (editSupplier) await api.put(`/procurement/suppliers/${editSupplier.id}`, supplierForm);
      else await api.post('/procurement/suppliers', supplierForm);
      setShowSupplierModal(false); setEditSupplier(null);
      setSupplierForm({ name: '', contact: '', phone: '', address: '', category: '', terms: 30 });
      load();
    } catch (_) {}
  };

  const savePO = async (e) => {
    e.preventDefault();
    try {
      await api.post('/procurement/purchase-orders', { ...poForm, total_amount: parseFloat(poForm.total_amount) });
      setShowPOModal(false);
      setPoForm({ supplier_id: '', items: '', total_amount: '', due_date: '', notes: '' });
      load();
    } catch (_) {}
  };

  const updatePO = async (id, status, payment_status) => {
    try { await api.put(`/procurement/purchase-orders/${id}`, { status, payment_status }); load(); } catch (_) {}
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in font-outfit pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Package className="text-blue-500" size={28} /> Supplier & Pengadaan
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Purchase Order · Hutang Supplier</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSupplierModal(true)} className="px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-600 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Plus size={16} /> Supplier</button>
          <button onClick={() => setShowPOModal(true)} className="px-4 py-2.5 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Plus size={16} /> Buat PO</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Supplier', value: suppliers.length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', icon: Building2 },
          { label: 'PO Pending', value: pos.filter(p=>p.status==='pending').length, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10', icon: Clock },
          { label: 'Total PO', value: pos.length, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10', icon: Package },
          { label: 'Hutang Supplier', value: fmt(suppliers.reduce((a,s)=>a+(s.outstanding_debt||0),0)), color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10', icon: AlertCircle, small: true },
        ].map((s, i) => (
          <div key={i} className="card p-5 border-none shadow-xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}><s.icon size={22} className={s.color} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
              <p className={`font-black text-gray-900 dark:text-white ${s.small ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {[{id:'po',label:'Purchase Orders'},{id:'suppliers',label:'Supplier'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab===t.id?'bg-blue-500 text-white shadow-lg shadow-blue-500/20':'bg-white dark:bg-gray-900 text-gray-500 shadow-sm'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'po' && (
        <div className="card p-0 overflow-hidden border-none shadow-xl overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50">
              {['No. PO','Supplier','Item','Total','Status','Bayar','Jatuh Tempo','Aksi'].map(h=>(
                <th key={h} className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y dark:divide-gray-800">
              {pos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4 text-xs font-mono font-bold text-gray-500">{p.po_number}</td>
                  <td className="px-4 py-4 text-sm font-black text-gray-900 dark:text-white">{p.supplier_name}</td>
                  <td className="px-4 py-4 text-xs text-gray-500 max-w-[180px] truncate">{p.items}</td>
                  <td className="px-4 py-4 text-sm font-black text-gray-900 dark:text-white whitespace-nowrap">{fmt(p.total_amount)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${p.status==='delivered'?'bg-green-100 text-green-600':'bg-orange-100 text-orange-600'}`}>
                      {p.status==='delivered'?'✓ Diterima':'○ Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${p.payment_status==='paid'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>
                      {p.payment_status==='paid'?'LUNAS':'BELUM'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">{p.due_date?new Date(p.due_date).toLocaleDateString('id-ID',{day:'2-digit',month:'short'}):'-'}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {p.status!=='delivered'&&<button onClick={()=>updatePO(p.id,'delivered',p.payment_status)} className="px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[9px] font-black hover:bg-green-100">Terima</button>}
                      {p.payment_status!=='paid'&&<button onClick={()=>updatePO(p.id,p.status,'paid')} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black hover:bg-blue-100">Bayar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {suppliers.map(s => (
            <div key={s.id} className="card p-6 border-none shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center"><Building2 size={22} className="text-blue-500" /></div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white text-sm">{s.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.category}</p>
                  </div>
                </div>
                <button onClick={()=>{setEditSupplier(s);setSupplierForm(s);setShowSupplierModal(true);}} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><Edit2 size={14} /></button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-2"><Phone size={12} className="text-gray-300" />{s.phone}</div>
                <div className="flex items-center gap-2"><Truck size={12} className="text-gray-300" />Terms: {s.terms} hari</div>
              </div>
              {s.outstanding_debt>0&&<div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 flex items-center justify-between">
                <span className="text-[10px] font-black text-red-500 uppercase">Hutang</span>
                <span className="text-sm font-black text-red-600">{fmt(s.outstanding_debt)}</span>
              </div>}
            </div>
          ))}
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>{setShowSupplierModal(false);setEditSupplier(null);}} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl relative z-10">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white">{editSupplier?'Edit':'Tambah'} Supplier</h3>
              <button onClick={()=>{setShowSupplierModal(false);setEditSupplier(null);}}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={saveSupplier} className="p-6 space-y-3">
              {[['Nama Perusahaan','name',true],['Kontak','contact',false],['Nomor HP','phone',false],['Kategori','category',false]].map(([l,k,r])=>(
                <div key={k}><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{l}</label>
                  <input required={r} value={supplierForm[k]||''} onChange={e=>setSupplierForm({...supplierForm,[k]:e.target.value})} className="input mt-1 w-full" />
                </div>
              ))}
              <button type="submit" className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-black text-xs uppercase tracking-widest mt-2">Simpan</button>
            </form>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setShowPOModal(false)} />
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl relative z-10">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white">Buat Purchase Order</h3>
              <button onClick={()=>setShowPOModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={savePO} className="p-6 space-y-3">
              <PillSelect 
                label="Supplier"
                icon={ShoppingCart}
                options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                value={poForm.supplier_id}
                onChange={val => setPoForm({...poForm, supplier_id: val})}
                placeholder="-- Pilih Supplier --"
              />
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item</label>
                <input required value={poForm.items} onChange={e=>setPoForm({...poForm,items:e.target.value})} placeholder="Galon Kosong x 100" className="input mt-1 w-full" />
              </div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total (Rp)</label>
                <input required type="number" value={poForm.total_amount} onChange={e=>setPoForm({...poForm,total_amount:e.target.value})} className="input mt-1 w-full" />
              </div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jatuh Tempo</label>
                <input type="date" value={poForm.due_date} onChange={e=>setPoForm({...poForm,due_date:e.target.value})} className="input mt-1 w-full" />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-black text-xs uppercase tracking-widest">Buat PO</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
