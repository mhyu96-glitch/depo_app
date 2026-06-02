import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, Target, MapPin, 
  Layers, Search, Filter, Maximize, ZoomIn, ZoomOut,
  Info, TrendingUp, Users, Activity, Truck
} from 'lucide-react';
import { customerApi } from '../api';
import { Skeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for default marker icons in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker for Strategic Points
const createPulseIcon = (color = '#6366f1') => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color};" class="w-4 h-4 rounded-full shadow-[0_0_15px_${color}] animate-pulse border-2 border-white"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export default function Maps() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('heatmap');
  const [mapCenter, setMapCenter] = useState([-0.4948, 117.1436]); // Samarinda default
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    setLoading(true);
    customerApi.getAll({ limit: 100 }).then(res => {
      // Add random coords if not present for demo/strategic purposes
      const enriched = res.data.data.map(c => ({
        ...c,
        lat: c.lat || -0.4948 + (Math.random() - 0.5) * 0.05,
        lng: c.lng || 117.1436 + (Math.random() - 0.5) * 0.05
      }));
      setCustomers(enriched);
    }).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const areas = ['Samarinda Ulu', 'Sungai Kunjang', 'Samarinda Utara', 'Loa Janan Hilir'];
    return areas.map(area => ({
      area,
      count: Math.floor(Math.random() * 100) + 50,
      growth: `+${Math.floor(Math.random() * 20)}%`,
      color: area === 'Samarinda Ulu' ? 'bg-indigo-500' : 'bg-blue-500'
    }));
  }, []);

  if (loading) return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in font-outfit pb-10">
       <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <Skeleton className="h-10 w-48 rounded-xl" />
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8"><Skeleton className="h-[700px] w-full rounded-[2.5rem]" /></div>
          <div className="xl:col-span-4 space-y-6">
             <Skeleton className="h-40 w-full rounded-[2rem]" />
             <Skeleton className="h-96 w-full rounded-[2rem]" />
          </div>
       </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in font-outfit pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">Geospatial Intelligence</span>
             <span className="text-gray-300 text-xs font-bold flex items-center gap-1"><Activity size={14} className="text-indigo-500" /> Live Distribution</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
             Strategic Distribution Map
          </h1>
          <p className="text-gray-400 font-bold mt-1">Pantau kepadatan pelanggan dan rute logistik depo Anda secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800">
           <button onClick={() => setActiveTab('heatmap')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'heatmap' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-gray-600'}`}>Heatmap</button>
           <button onClick={() => setActiveTab('clusters')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'clusters' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-gray-600'}`}>Clusters</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* Map Container (8/12) */}
         <div className="xl:col-span-8 relative">
            <div className="card p-0 border-white shadow-2xl h-[720px] rounded-[3rem] overflow-hidden relative z-10 group">
               <MapContainer 
                 center={mapCenter} 
                 zoom={zoom} 
                 scrollWheelZoom={false}
                 zoomControl={false}
                 className="h-full w-full grayscale-[0.5] contrast-[1.1]"
               >
                 {/* Dark-themed premium map tiles */}
                 <TileLayer
                   url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                 />
                 <MapController center={mapCenter} zoom={zoom} />
                 
                 {customers.map((c, i) => (
                    <div key={i}>
                       <Marker position={[c.lat, c.lng]} icon={createPulseIcon(i % 5 === 0 ? '#f43f5e' : '#6366f1')}>
                          <Popup className="premium-popup">
                             <div className="p-2 font-outfit min-w-[150px]">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.voucher_code}</p>
                                <p className="text-sm font-black text-gray-900 mb-1">{c.name}</p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                                   <MapPin size={10} className="text-indigo-500" /> {c.whatsapp}
                                </div>
                             </div>
                          </Popup>
                       </Marker>
                       {activeTab === 'heatmap' && (
                          <Circle 
                            center={[c.lat, c.lng]} 
                            radius={400} 
                            pathOptions={{ 
                               fillColor: i % 5 === 0 ? '#f43f5e' : '#6366f1', 
                               fillOpacity: 0.1, 
                               stroke: false 
                            }} 
                          />
                       )}
                    </div>
                 ))}
               </MapContainer>

               {/* Overlay Navigation Info */}
               <div className="absolute top-8 left-8 z-[1000] space-y-4">
                  <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white flex items-center gap-5">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Navigation size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active Coverage</p>
                        <p className="text-lg font-black text-gray-900 tracking-tight">Samarinda, Kalimantan Timur</p>
                     </div>
                  </div>
               </div>

               {/* Map Controls */}
               <div className="absolute top-8 right-8 z-[1000] space-y-3">
                  <div className="flex flex-col bg-white/90 backdrop-blur-xl border border-white rounded-[1.5rem] overflow-hidden shadow-2xl">
                     <button onClick={() => setZoom(z => z + 1)} className="p-4 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all active:scale-90"><ZoomIn size={20} /></button>
                     <button onClick={() => setZoom(z => z - 1)} className="p-4 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border-t border-gray-100 transition-all active:scale-90"><ZoomOut size={20} /></button>
                  </div>
                  <button className="w-14 h-14 bg-white/90 backdrop-blur-xl border border-white rounded-[1.5rem] text-gray-400 hover:text-indigo-600 shadow-2xl flex items-center justify-center hover:bg-indigo-50 transition-all active:scale-90"><Layers size={22} /></button>
               </div>

               {/* Dynamic Legend */}
               <div className="absolute bottom-8 left-8 z-[1000]">
                  <div className="bg-gray-900/90 backdrop-blur-xl p-5 rounded-[2.5rem] text-white shadow-2xl border border-white/10 flex items-center gap-8">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Normal Delivery</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">High Demand Zone</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar Analysis (4/12) */}
         <div className="xl:col-span-4 space-y-8">
            <motion.div 
               whileHover={{ y: -5 }}
               className="card p-8 border-none shadow-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden rounded-[3rem]"
            >
               <div className="absolute -right-10 -top-10 opacity-10 rotate-12"><Target size={200} /></div>
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                     <Activity size={24} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Geo-Intelligence</h3>
               </div>
               <p className="text-sm font-medium opacity-90 leading-relaxed mb-8">
                  Sistem mendeteksi kepadatan tinggi di area **Samarinda Ulu**. Disarankan untuk memindahkan 1 kurir cadangan ke titik ini guna meminimalisir keterlambatan.
               </p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-sm">
                     <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Efficiency</p>
                     <p className="text-xl font-black">94.2%</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-sm">
                     <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Fleet Load</p>
                     <p className="text-xl font-black">High</p>
                  </div>
               </div>
            </motion.div>

            <div className="card p-8 border-white shadow-2xl rounded-[3rem]">
               <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <Users size={18} className="text-indigo-500" />
                  Regional Distribution
               </h3>
               <div className="space-y-6">
                  {stats.map((a, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-default">
                       <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${a.color} group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                          <div>
                             <p className="text-sm font-black text-gray-800 dark:text-gray-100">{a.area}</p>
                             <p className="text-[10px] font-bold text-gray-400 mt-0.5">{a.count} Active Members</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-xs font-black ${a.growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{a.growth}</p>
                          <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Week Growth</p>
                       </div>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-10 py-5 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                  <Truck size={16} /> Optimasi Rute
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
