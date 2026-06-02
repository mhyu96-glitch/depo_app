import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout/Layout';
import AIChat from './components/Layout/AIChat';

// Pages
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import POS             from './pages/POS';
import Customers       from './pages/Customers';
import CustomerDetail  from './pages/CustomerDetail';
import Attendance      from './pages/Attendance';
import CashFlow        from './pages/CashFlow';
import Couriers        from './pages/Couriers';
import Branches        from './pages/Branches';
import Users           from './pages/Users';
import Analytics       from './pages/Analytics';
import Fleet           from './pages/Fleet';
import Inventory       from './pages/Inventory';
import Settings        from './pages/Settings';
import SalesReport     from './pages/reports/SalesReport';
import SalaryReport    from './pages/reports/SalaryReport';
import CashFlowReport  from './pages/reports/CashFlowReport';
import DebtReport      from './pages/reports/DebtReport';
import ProfitLoss      from './pages/reports/ProfitLoss';
import Expenses        from './pages/Expenses';
import Maps            from './pages/Maps';
import AssetHealth     from './pages/AssetHealth';
import Payroll         from './pages/Payroll';
import AuditLog        from './pages/AuditLog';
import WhatsAppCenter  from './pages/WhatsAppCenter';
import IoTMonitor      from './pages/IoTMonitor';
import CourierApp      from './pages/CourierApp';
import Procurement     from './pages/Procurement';
import ShiftManagement from './pages/ShiftManagement';
import DebtTracker     from './pages/DebtTracker';
import CustomerPortal  from './pages/CustomerPortal';
import IPhoneDemo      from './pages/IPhoneDemo';

const PrivateRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (superAdminOnly && user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      
      {/* Standalone Pages (No Sidebar/Layout) */}
      <Route path="/portal" element={<CustomerPortal />} />
      <Route path="/demo" element={<IPhoneDemo />} />
      <Route path="/courier-app" element={<CourierApp />} />

      {/* Admin Dashboard Layout */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard"          element={<Dashboard />} />
        <Route path="pos"                element={<POS />} />
        <Route path="customers"          element={<Customers />} />
        <Route path="customers/:id"      element={<CustomerDetail />} />
        <Route path="attendance"         element={<Attendance />} />
        <Route path="shifts"             element={<ShiftManagement />} />
        
        {/* Admin Only Routes */}
        <Route path="fleet"              element={<PrivateRoute adminOnly><Fleet /></PrivateRoute>} />
        <Route path="inventory"          element={<PrivateRoute adminOnly><Inventory /></PrivateRoute>} />
        <Route path="expenses"           element={<PrivateRoute adminOnly><Expenses /></PrivateRoute>} />
        <Route path="cashflow"           element={<PrivateRoute adminOnly><CashFlow /></PrivateRoute>} />
        <Route path="couriers"           element={<PrivateRoute adminOnly><Couriers /></PrivateRoute>} />
        <Route path="branches"           element={<PrivateRoute adminOnly><Branches /></PrivateRoute>} />
        <Route path="users"              element={<PrivateRoute adminOnly><Users /></PrivateRoute>} />
        <Route path="settings"           element={<PrivateRoute adminOnly><Settings /></PrivateRoute>} />
        <Route path="reports/sales"      element={<PrivateRoute adminOnly><SalesReport /></PrivateRoute>} />
        <Route path="reports/salary"     element={<PrivateRoute adminOnly><SalaryReport /></PrivateRoute>} />
        <Route path="reports/cashflow"   element={<PrivateRoute adminOnly><CashFlowReport /></PrivateRoute>} />
        <Route path="reports/debt"       element={<PrivateRoute adminOnly><DebtReport /></PrivateRoute>} />
        <Route path="reports/profit-loss"element={<PrivateRoute superAdminOnly><ProfitLoss /></PrivateRoute>} />
        <Route path="analytics"          element={<PrivateRoute adminOnly><Analytics /></PrivateRoute>} />
        <Route path="maps"               element={<PrivateRoute adminOnly><Maps /></PrivateRoute>} />
        <Route path="health"             element={<PrivateRoute adminOnly><AssetHealth /></PrivateRoute>} />
        <Route path="payroll"            element={<PrivateRoute adminOnly><Payroll /></PrivateRoute>} />
        <Route path="audit"              element={<PrivateRoute adminOnly><AuditLog /></PrivateRoute>} />
        <Route path="whatsapp"           element={<PrivateRoute adminOnly><WhatsAppCenter /></PrivateRoute>} />
        <Route path="iot"                element={<PrivateRoute adminOnly><IoTMonitor /></PrivateRoute>} />
        <Route path="procurement"        element={<PrivateRoute adminOnly><Procurement /></PrivateRoute>} />
        <Route path="debts"              element={<PrivateRoute adminOnly><DebtTracker /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ConditionalAIChat />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

const ConditionalAIChat = () => {
  const isPortalOrCourier = window.location.pathname.includes('/portal') || window.location.pathname.includes('/courier-app');
  if (isPortalOrCourier) return null;
  return <AIChat />;
};
