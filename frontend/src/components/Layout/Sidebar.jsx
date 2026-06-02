import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';
import clsx from 'clsx';

// Material Icon Component Wrapper
const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

const NavItem = ({ to, icon, label, onClick, collapsed, color }) => (
  <NavLink to={to} onClick={onClick}
    title={collapsed ? label : ''}
    className={({ isActive }) => clsx(
      'sidebar-link group', 
      isActive && 'active',
      collapsed && 'justify-center px-0'
    )}
  >
    <MI name={icon} size={22} className={clsx('shrink-0 transition-transform group-hover:scale-110', color || 'text-gray-400')} />
    {!collapsed && <span className="animate-fade-in font-medium">{label}</span>}
  </NavLink>
);

const NavGroup = ({ icon, label, children, collapsed, color }) => {
  const [open, setOpen] = useState(false);
  if (collapsed) return null;

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="sidebar-link w-full justify-between group">
        <span className="flex items-center gap-3"><MI name={icon} size={22} className={clsx('transition-colors group-hover:opacity-80', color || 'text-gray-400')} />{label}</span>
        <MI name={open ? 'expand_more' : 'chevron_right'} size={18} />
      </button>
      {open && <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-100 dark:border-gray-800 pl-3">{children}</div>}
    </div>
  );
};

export default function Sidebar({ open, onClose, collapsed }) {
  const { isAdmin, isSuperAdmin, logout, user } = useAuth();
  const { brandName } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={clsx(
      'fixed inset-y-0 left-0 z-30 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 font-outfit',
      open ? 'translate-x-0' : '-translate-x-full',
      collapsed ? 'w-20' : 'w-64',
      'lg:relative lg:translate-x-0'
    )}>
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-5 py-6 border-b border-gray-50 dark:border-gray-800 overflow-hidden',
        collapsed && 'justify-center px-0'
      )}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
          <MI name="water_drop" className="text-white" size={24} />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="font-black text-gray-900 dark:text-white text-base leading-none tracking-tight">{brandName.split(' ')[0]}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{brandName.split(' ').slice(1).join(' ') || 'Management'}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5 custom-scrollbar">
        <NavItem to="/dashboard"  icon="dashboard" label="Dashboard" color="text-blue-500" onClick={onClose} collapsed={collapsed} />
        <NavItem to="/pos"        icon="shopping_cart" label="Point of Sale" color="text-emerald-500" onClick={onClose} collapsed={collapsed} />
        <NavItem to="/customers"  icon="groups" label="Pelanggan" color="text-indigo-500" onClick={onClose} collapsed={collapsed} />
        <NavItem to="/attendance" icon="assignment_turned_in" label="Absensi Kurir" color="text-cyan-500" onClick={onClose} collapsed={collapsed} />
        <NavItem to="/shifts"     icon="schedule" label="Shift Kasir" color="text-violet-500" onClick={onClose} collapsed={collapsed} />

        {isAdmin && (
          <>
            <div className={clsx('pt-6 pb-2 px-3', collapsed && 'flex justify-center px-0')}>
              {collapsed ? <div className="w-8 h-px bg-gray-100 dark:bg-gray-800" /> : <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operasional Toko</p>}
            </div>
            <NavItem to="/fleet"      icon="delivery_dining" label="Armada" color="text-purple-500" onClick={onClose} collapsed={collapsed} />
            <NavItem to="/inventory"  icon="waves" label="Inventori" color="text-blue-400" onClick={onClose} collapsed={collapsed} />
            <NavItem to="/expenses"   icon="receipt_long" label="Biaya Toko" color="text-orange-500" onClick={onClose} collapsed={collapsed} />
            <NavItem to="/cashflow"   icon="account_balance_wallet" label="Kas Toko" color="text-green-500" onClick={onClose} collapsed={collapsed} />

            <div className={clsx('pt-6 pb-2 px-3', collapsed && 'flex justify-center px-0')}>
              {collapsed ? <div className="w-8 h-px bg-gray-100 dark:bg-gray-800" /> : <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Administrator</p>}
            </div>
            <NavItem to="/couriers" icon="badge" label="Data Kurir" color="text-rose-500" onClick={onClose} collapsed={collapsed} />
            <NavItem to="/branches" icon="store" label="Data Cabang" color="text-amber-500" onClick={onClose} collapsed={collapsed} />
            <NavItem to="/users"    icon="manage_accounts" label="Manajemen User" color="text-violet-500" onClick={onClose} collapsed={collapsed} />

            <NavGroup icon="insights" label="Strategic Intelligence" color="text-yellow-500" collapsed={collapsed}>
              <NavItem to="/analytics"           icon="query_stats" label="Analitik & Rank" color="text-yellow-500" onClick={onClose} />
              <NavItem to="/maps"                icon="explore" label="Peta Strategis" color="text-emerald-500" onClick={onClose} />
              <NavItem to="/health"              icon="monitor_heart" label="Cek Mesin & Filter" color="text-rose-500" onClick={onClose} />
              <NavItem to="/payroll"             icon="price_check" label="Gaji & Komisi" color="text-green-500" onClick={onClose} />
              <NavItem to="/audit"               icon="shield" label="Audit Log" color="text-gray-500" onClick={onClose} />
              <NavItem to="/whatsapp"            icon="chat" label="WhatsApp Center" color="text-green-500" onClick={onClose} />
              <NavItem to="/iot"                 icon="sensors" label="IoT Monitor" color="text-orange-500" onClick={onClose} />
            </NavGroup>

            <NavGroup icon="business_center" label="Operasional Bisnis" color="text-sky-500" collapsed={collapsed}>
              <NavItem to="/procurement"         icon="inventory_2" label="Supplier & Pengadaan" color="text-sky-600" onClick={onClose} />
              <NavItem to="/debts"               icon="receipt_long" label="Tracker Piutang" color="text-red-500" onClick={onClose} />
              <NavItem to="/courier-app"         icon="delivery_dining" label="Kurir Mobile App" color="text-purple-500" onClick={onClose} />
            </NavGroup>

            <NavGroup icon="description" label="Laporan Bisnis" color="text-pink-500" collapsed={collapsed}>
              <NavItem to="/reports/sales"       icon="trending_up" label="Penjualan" color="text-emerald-500" onClick={onClose} />
              <NavItem to="/reports/salary"      icon="payments" label="Gaji Kurir" color="text-rose-500" onClick={onClose} />
              <NavItem to="/reports/cashflow"    icon="swap_horiz" label="Arus Kas" color="text-blue-500" onClick={onClose} />
              <NavItem to="/reports/debt"        icon="error_outline" label="Hutang" color="text-red-500" onClick={onClose} />
              {isSuperAdmin && (
                <NavItem to="/reports/profit-loss" icon="analytics" label="Laba Rugi" color="text-indigo-500" onClick={onClose} />
              )}
            </NavGroup>

            <NavItem to="/settings" icon="settings" label="Pengaturan" color="text-gray-500" onClick={onClose} collapsed={collapsed} />
          </>
        )}
      </nav>

      {/* Logout */}
      <div className={clsx('px-3 py-4 border-t border-gray-50 dark:border-gray-800', collapsed && 'flex justify-center px-0')}>
        <button onClick={handleLogout} className={clsx(
          'sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all',
          collapsed && 'justify-center px-0'
        )}>
          <MI name="logout" size={22} />
          {!collapsed && <span className="font-bold">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
