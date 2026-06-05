import { useState, useEffect } from 'react';
import { attendanceApi, courierApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardCheck, UserCheck, Calendar, 
  Search, Plus, Trash2, Loader2, AlertCircle, CheckCircle, Camera 
} from 'lucide-react';

import PillSelect from '../components/PillSelect';
import FaceAttendance from '../components/FaceAttendance';

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFaceAttendance, setShowFaceAttendance] = useState(false);
  const [faceAttendanceType, setFaceAttendanceType] = useState('check_in');

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, courierRes] = await Promise.all([
        attendanceApi.getAll({ date, branch_id: user?.branch_id }),
        courierApi.getAll({ branch_id: user?.branch_id })
      ]);
      setAttendance(attRes.data.data);
      setCouriers(courierRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedCourier) return;
    setSubmitting(true);
    try {
      await attendanceApi.checkIn({
        courier_id: selectedCourier,
        date,
        branch_id: user?.branch_id,
        notes
      });
      setSelectedCourier('');
      setNotes('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal melakukan absensi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus absensi ini?')) return;
    try {
      await attendanceApi.remove(id);
      loadData();
    } catch (err) {
      alert('Gagal menghapus absensi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardCheck size={24} className="text-primary-500" />
            Absensi Kurir
          </h1>
          <p className="text-sm text-gray-500">Pencatatan kehadiran kurir harian</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
          <Calendar size={18} className="text-gray-400" />
          <input 
            type="date" 
            className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-in Form */}
        <div className="lg:col-span-1">
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserCheck size={20} className="text-brand-500" />
              Input Kehadiran
            </h2>
            <form onSubmit={handleCheckIn} className="space-y-6">
              <PillSelect 
                label="Pilih Kurir"
                icon={UserCheck}
                options={couriers.map(c => ({ value: c.id, label: c.name }))}
                value={selectedCourier}
                onChange={val => setSelectedCourier(val)}
                placeholder="-- Pilih Kurir --"
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Catatan (Opsional)</label>
                <textarea 
                  className="input w-full h-24 py-4 px-5 resize-none font-medium" 
                  placeholder="Keterangan tambahan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="pt-2 space-y-3">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {submitting ? 'Memproses...' : 'Simpan Kehadiran'}
                </button>

                {/* Face Attendance Button */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">ATAU</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    setFaceAttendanceType('check_in');
                    setShowFaceAttendance(true);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={16} />
                  Absen dengan Wajah
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Attendance List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="font-bold">Daftar Kehadiran: {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            </div>
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
            ) : attendance.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <AlertCircle size={40} className="mx-auto mb-2 opacity-20" />
                <p>Belum ada kurir yang absen pada tanggal ini.</p>
              </div>
            ) : (
              <div className="table-wrapper rounded-none border-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Kurir</th>
                      <th>Jam Masuk</th>
                      <th>Keterangan</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((att) => {
                      const courierName = att.courier_name || att.name || `Kurir #${att.courier_id || '-'}`;
                      const checkInValue = att.check_in_display || att.check_in_time || att.check_in || att.created_at;
                      const checkInLabel = checkInValue
                        ? new Date(checkInValue).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--';

                      return (
                      <tr key={att.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 font-bold text-xs">
                              {courierName[0].toUpperCase()}
                            </div>
                            <span className="font-medium">{courierName}</span>
                          </div>
                        </td>
                        <td>{checkInLabel}</td>
                        <td>{att.notes || '-'}</td>
                        <td className="text-right">
                          <button 
                            onClick={() => handleDelete(att.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Face Attendance Modal */}
      {showFaceAttendance && (
        <FaceAttendance
          courierId={selectedCourier || null}
          type={faceAttendanceType}
          onSuccess={(data) => {
            setShowFaceAttendance(false);
            setSelectedCourier('');
            loadData(); // Reload attendance list
            alert('Absensi wajah berhasil!');
          }}
          onCancel={() => setShowFaceAttendance(false)}
        />
      )}
    </div>
  );
}
