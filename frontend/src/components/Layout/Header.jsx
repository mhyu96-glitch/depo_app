import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth }  from '../../context/AuthContext';

// Material Icon Component Wrapper
const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

export default function Header({ onMenuClick, onToggleSidebar, isCollapsed }) {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 glass sticky top-0 z-10 font-outfit">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button onClick={onMenuClick} className="p-2 lg:hidden rounded-xl hover:bg-gray-100 transition-colors">
          <MI name="menu" size={24} />
        </button>

        {/* Desktop sidebar toggle (Collapse) */}
        <button 
          onClick={onToggleSidebar} 
          className="hidden lg:flex p-2 rounded-xl text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          <MI name={isCollapsed ? 'menu_open' : 'menu'} size={24} />
        </button>

        <div className="hidden sm:block ml-2">
          <p className="text-sm font-black text-gray-800 dark:text-gray-200 leading-none tracking-tight">
            Selamat datang, <span className="text-primary-600 dark:text-primary-400">{user?.name}</span>
          </p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{user?.branch_name || 'Demo Branch'}</p>
        </div>
      </div>

      {/* Center: Live Clock (Desktop Only) */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-gray-400">
          <MI name="schedule" size={16} />
          <span className="text-xs font-black tracking-widest">{time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-2 text-primary-500">
          <MI name="cloud" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">32°C Cerah</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggle} className="p-2 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all" title="Toggle dark mode">
          <MI name={dark ? 'light_mode' : 'dark_mode'} size={22} className={dark ? 'text-yellow-400' : 'text-gray-500'} />
        </button>
        <button className="p-2 rounded-xl relative group hover:bg-red-50 transition-all" title="Notifikasi">
          <MI name="notifications_none" size={22} className="text-gray-500 group-hover:text-red-500 transition-colors" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        </button>
        
        <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-2 hidden md:block" />
        
        <div className="hidden md:flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="text-xs font-black text-gray-900 dark:text-white leading-none">{user?.username}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">ONLINE</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-primary-500/20 ring-2 ring-white dark:ring-gray-800">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
