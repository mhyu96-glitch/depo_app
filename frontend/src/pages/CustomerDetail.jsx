import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerApi } from '../api';
import { 
  User, Phone, MapPin, Gift, 
  History, ShoppingCart, ArrowLeft, 
  Loader2, Calendar, Hash, Tag, FileText
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function CustomerDetail() {
  const { id } = useParams();
  const [cust, setCust] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getById(id);
      setCust(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
  );

  if (!cust) return (
    <div className="text-center p-12">
      <p className="text-gray-500 mb-4">Pelanggan tidak ditemukan.</p>
      <Link to="/customers" className="btn-primary inline-flex">Kembali ke Daftar</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/customers" className="btn-secondary p-2 rounded-xl">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cust.name}</h1>
          <p className="text-sm text-gray-500">ID Pelanggan: #{cust.id.toString().padStart(5, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 text-3xl font-bold mb-4">
                {cust.name[0].toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cust.name}</h2>
              <span className="badge-blue mt-2">{cust.voucher_code || 'Belum Ada Voucher'}</span>
            </div>

            <div className="divider" />

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">WhatsApp</p>
                  <p className="text-sm font-medium">{cust.whatsapp || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Alamat</p>
                  <p className="text-sm font-medium">
                    {cust.block_name && `${cust.block_name} No. ${cust.house_number}`}
                    <br />
                    {cust.address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Catatan</p>
                  <p className="text-sm text-gray-500 italic">{cust.notes || 'Tidak ada catatan'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Stats Card */}
          <div className="card p-6 bg-gradient-to-br from-orange-500 to-pink-500 text-white relative overflow-hidden">
            <Gift size={100} className="absolute -right-5 -bottom-5 text-white/10 rotate-12" />
            <div className="relative z-10">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Gift size={18} /> Loyalitas Pelanggan
              </h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-orange-100 text-xs mb-1">Total Isi Ulang</p>
                  <p className="text-4xl font-black">{cust.loyalty_count}</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-xs mb-1">Gratis Didapat</p>
                  <p className="text-2xl font-bold">{cust.total_free_gallon} Galon</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-xs text-orange-50">
                  {10 - (cust.loyalty_count % 10)} transaksi lagi untuk mendapatkan 1 galon GRATIS berikutnya.
                </p>
                <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500" 
                    style={{ width: `${(cust.loyalty_count % 10) * 10}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div className="lg:col-span-2">
          <div className="card h-full overflow-hidden flex flex-col">
            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="font-bold flex items-center gap-2">
                <History size={18} className="text-primary-500" />
                Riwayat Transaksi Terakhir
              </h3>
            </div>
            {cust.transactions?.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
                <ShoppingCart size={40} className="mb-2 opacity-20" />
                <p>Belum ada riwayat transaksi.</p>
              </div>
            ) : (
              <div className="table-wrapper rounded-none border-none flex-1">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Tanggal</th>
                      <th>Tipe</th>
                      <th className="text-right">Galon</th>
                      <th className="text-right">Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cust.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="font-mono text-[10px] font-bold text-primary-600">{tx.invoice_number}</td>
                        <td className="text-xs">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                        <td>
                          {tx.transaction_type === 'pickup' ? (
                            <span className="badge-blue">Pickup</span>
                          ) : (
                            <span className="badge-purple">Delivery</span>
                          )}
                        </td>
                        <td className="text-right font-bold">{tx.total_gallons}</td>
                        <td className="text-right font-bold text-gray-900 dark:text-white">{fmt(tx.total_amount)}</td>
                        <td>
                          {tx.is_free_gallon ? (
                            <span className="badge-green">GRATIS</span>
                          ) : tx.payment_status === 'paid' ? (
                            <span className="badge-green">Lunas</span>
                          ) : (
                            <span className="badge-red">Hutang</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 border-t dark:border-gray-800 text-center">
              <button className="text-xs text-primary-500 font-bold hover:underline">Lihat Semua Riwayat</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
