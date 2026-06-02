import { useState, useEffect } from 'react';
import api from '../api';
import {
  Wifi, WifiOff, Activity, Droplets, Thermometer, 
  Gauge, AlertTriangle, RefreshCw, Zap, Filter,
  TrendingUp, TrendingDown, Radio, Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

const SENSOR_ICONS = {
  water_level: Droplets,
  water_quality: Activity,
  flow_rate: Gauge,
  temperature: Thermometer,
};

const SENSOR_COLORS = {
  water_level: '#3b82f6',
  water_quality: '#22c55e',
  flow_rate: '#8b5cf6',
  temperature: '#f59e0b',
};

const SENSOR_THRESHOLDS = {
  water_level: { warning: 30, critical: 20 },
  water_quality: { min: 6.5, max: 8.5 },
  flow_rate: { warning: 1.5 },
  temperature: { warning: 35 },
};

function getDeviceStatus(device) {
  const v = parseFloat(device.last_value);
  if (device.type === 'water_level' && v < 20) return 'critical';
  if (device.type === 'water_level' && v < 30) return 'warning';
  if (device.type === 'water_quality' && (v < 6.5 || v > 8.5)) return 'warning';
  if (device.type === 'temperature' && v > 35) return 'warning';
  return device.status === 'online' ? 'normal' : 'offline';
}

export default function IoTMonitor() {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadDevices = async () => {
    setRefreshing(true);
    try {
      const [devRes, sumRes] = await Promise.all([
        api.get('/iot/devices'),
        api.get('/iot/summary'),
      ]);
      setDevices(devRes.data.data);
      setSummary(sumRes.data.data);
      setLastUpdate(new Date());
    } catch (_) {}
    setRefreshing(false);
    setLoading(false);
  };

  const loadReadings = async (deviceId) => {
    try {
      const res = await api.get(`/iot/readings/${deviceId}`);
      setReadings(res.data.data);
    } catch (_) {}
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) loadReadings(selected.device_id);
  }, [selected]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Radio size={48} className="mx-auto text-primary-500 animate-pulse mb-4" />
        <p className="font-black text-gray-400 animate-pulse">CONNECTING TO IOT NETWORK...</p>
      </div>
    </div>
  );

  const criticalDevices = devices.filter(d => getDeviceStatus(d) === 'critical' || getDeviceStatus(d) === 'warning');

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in font-outfit pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Radio className="text-primary-500" size={28} />
            IoT Sensor Monitor
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Pemantauan Real-Time · Update tiap 30 detik · Terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
          </p>
        </div>
        <button onClick={loadDevices} className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-primary-500 transition-all">
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary Row */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Sensor', value: summary.total_devices, icon: Radio, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/10' },
            { label: 'Online', value: summary.online, icon: Wifi, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10' },
            { label: 'Warning', value: summary.warning, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
            { label: 'Offline', value: summary.offline, icon: WifiOff, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
          ].map((s, i) => (
            <div key={i} className="card p-5 border-none shadow-xl flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={22} className={s.color} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Critical Alerts */}
      {criticalDevices.length > 0 && (
        <div className="space-y-2">
          {criticalDevices.map(d => (
            <div key={d.device_id} className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
              <AlertTriangle className="text-orange-500 shrink-0 animate-bounce" size={20} />
              <div className="flex-1">
                <p className="text-sm font-black text-orange-800 dark:text-orange-300">{d.name} — {d.branch_name}</p>
                <p className="text-xs font-bold text-orange-600">Nilai: {d.last_value} {d.unit} · Perlu perhatian segera!</p>
              </div>
              <button onClick={() => setSelected(d)} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">
                Detail
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Device Grid & Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Devices */}
        <div className="xl:col-span-5 space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Radio size={14} /> Perangkat Sensor ({devices.length})
          </h2>
          {devices.map(d => {
            const status = getDeviceStatus(d);
            const Icon = SENSOR_ICONS[d.type] || Activity;
            const color = SENSOR_COLORS[d.type] || '#3b82f6';
            const isSelected = selected?.device_id === d.device_id;

            return (
              <button
                key={d.device_id}
                onClick={() => setSelected(d)}
                className={`w-full text-left card p-5 border-2 transition-all hover:shadow-xl ${
                  isSelected ? 'border-primary-500 shadow-xl shadow-primary-500/10' :
                  status === 'critical' ? 'border-red-300 dark:border-red-800' :
                  status === 'warning' ? 'border-orange-300 dark:border-orange-800' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900 dark:text-white text-sm truncate">{d.name}</p>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        status === 'critical' ? 'bg-red-500 animate-pulse' :
                        status === 'warning' ? 'bg-orange-500 animate-pulse' :
                        status === 'normal' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d.branch_name} · {d.device_id}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-gray-900 dark:text-white" style={{ color }}>{d.last_value}</p>
                    <p className="text-[10px] font-bold text-gray-400">{d.unit}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Chart */}
        <div className="xl:col-span-7">
          {selected ? (
            <div className="card p-6 border-none shadow-xl sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white">{selected.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{selected.branch_name} · Riwayat 24 Jam</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/10">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-green-600 uppercase">LIVE</span>
                </div>
              </div>

              <div className="h-64 mb-6">
                {readings.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readings.map(r => ({ ...r, time: new Date(r.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }))}>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={3} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '11px' }}
                        itemStyle={{ color: '#fff', fontWeight: 800 }}
                      />
                      {selected.type === 'water_level' && <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning 30%', fontSize: 9, fill: '#f59e0b' }} />}
                      {selected.type === 'water_level' && <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical 20%', fontSize: 9, fill: '#ef4444' }} />}
                      <Line
                        type="monotone" dataKey="value"
                        stroke={SENSOR_COLORS[selected.type] || '#3b82f6'}
                        strokeWidth={2.5} dot={false} activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-300">
                    <div className="text-center">
                      <Activity size={32} className="mx-auto mb-2 animate-pulse" />
                      <p className="text-sm font-bold">Memuat data sensor...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Saat Ini', value: `${selected.last_value} ${selected.unit}` },
                  { label: 'Status', value: getDeviceStatus(selected).toUpperCase() },
                  { label: 'Tipe', value: selected.type.replace('_', ' ').toUpperCase() },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* IoT API Info */}
              <div className="mt-4 p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Zap size={12} /> Endpoint Sensor</p>
                <code className="text-[10px] font-mono text-gray-700 dark:text-gray-300 break-all">
                  POST /api/iot/ingest<br/>
                  {'{'} device_id: "{selected.device_id}", value: ..., sensor_type: "{selected.type}" {'}'}
                </code>
              </div>
            </div>
          ) : (
            <div className="card p-12 border-none shadow-xl flex flex-col items-center justify-center text-center">
              <Radio size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="font-black text-gray-400">Pilih sensor</p>
              <p className="text-sm text-gray-300 mt-1">Klik sensor di sebelah kiri untuk melihat riwayat data</p>
            </div>
          )}
        </div>
      </div>

      {/* API Guide */}
      <div className="card p-6 border-none shadow-xl bg-gray-900 text-white">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" /> Panduan Integrasi Sensor IoT
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2">Arduino / ESP32</p>
            <code className="text-[10px] font-mono text-gray-300 leading-relaxed whitespace-pre">{`HTTPClient http;
http.begin("http://server/api/iot/ingest");
http.addHeader("Content-Type","application/json");
String body = "{\\"device_id\\":\\"TANDON-01\\",\\"sensor_type\\":\\"water_level\\",\\"value\\":" + String(level) + ",\\"unit\\":\\"%\\"}";
http.POST(body);`}</code>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Raspberry Pi / Python</p>
            <code className="text-[10px] font-mono text-gray-300 leading-relaxed whitespace-pre">{`import requests
requests.post("http://server/api/iot/ingest", json={
  "device_id": "QUALITY-PST-01",
  "sensor_type": "water_quality",
  "value": ph_value,
  "unit": "pH"
})`}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
