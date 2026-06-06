import axios from 'axios';
import axiosRetry from 'axios-retry';
import { foundation } from '../utils/foundation';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Strengthen foundation with automatic retries for network glitches
axiosRetry(api, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
  }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally & Provide Mock Data for Demo Mode
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const token = localStorage.getItem('token');
    
    // DEMO MODE BYPASS: If in demo mode, return empty success data instead of error
    if (token === 'demo-token') {
      const url = err.config?.url || '';
      console.log('Demo mode: Intercepting error for', url, 'and returning mock data');
      
      let mockData = [];
      if (url.includes('/branches')) {
        mockData = [{ id: 1, name: 'Depo Pusat', address: 'Jl. Melati No. 42', phone: '081234567890', is_active: 1 }];
      } else if (url.includes('/customers')) {
        mockData = [
          { id: 1, name: 'Budi Santoso', whatsapp: '081122334455', address: 'Bukit Mediterania', house_number: 'B-12', block_name: 'Blok B', voucher_code: 'BUDI-99', loyalty_count: 5, total_free_gallon: 0, tier: 'Gold' },
          { id: 2, name: 'Siti Aminah', whatsapp: '085566778899', address: 'Perumahan Citra', house_number: '14', block_name: 'Cluster A', voucher_code: 'SITI-88', loyalty_count: 12, total_free_gallon: 1, tier: 'Platinum' }
        ];
      } else if (url.includes('/products')) {
        mockData = [{ id: 1, name: 'Isi Ulang Galon 19L', price: 5000, stock: 150 }];
      } else if (url.includes('/couriers')) {
        mockData = [{ id: 1, name: 'Andi Saputra', phone: '089988776655', is_active: 1, base_salary: 3000000, branch_name: 'Depo Pusat' }];
      } else if (url.includes('/attendance/today')) {
        mockData = [{ id: 1, courier_id: 1, status: 'present' }];
      }

      return Promise.resolve({ 
        data: { 
          success: true, 
          data: mockData,
          summary: { total_sales: 12500000, total_income: 15000000, total_expense: 2500000, balance: 12500000, opening_cash: 500000 },
          widgets: [
            { label: 'Total Penjualan', value: 'Rp 45.2M', growth: '+12.5%', icon: 'trending_up', color: 'text-emerald-500' },
            { label: 'Cakupan Area', value: '94.2%', growth: '+2.1%', icon: 'explore', color: 'text-blue-500' }
          ]
        }, 
        status: 200 
      });
    }

    const isLoginRequest = err.config?.url === '/auth/login';
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      foundation.storage.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  login:          (data) => api.post('/auth/login', data),
  logout:         ()     => api.post('/auth/logout'),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Settings
export const settingsApi = {
  getCommission: () => api.get('/settings/commission'),
  updateCommission: (data) => api.put('/settings/commission', data),
};

// Branches
export const branchApi = {
  getAll:  (params) => api.get('/branches', { params }),
  create:  (data)   => api.post('/branches', data),
  update:  (id, d)  => api.put(`/branches/${id}`, d),
  remove:  (id)     => api.delete(`/branches/${id}`),
};

// Customers
export const customerApi = {
  getAll:     (params) => api.get('/customers', { params }),
  getById:    (id)     => api.get(`/customers/${id}`),
  getLoyalty: (id)     => api.get(`/customers/${id}/loyalty`),
  create:     (data)   => api.post('/customers', data),
  update:     (id, d)  => api.put(`/customers/${id}`, d),
  remove:     (id)     => api.delete(`/customers/${id}`),
};

// Transactions
export const transactionApi = {
  getAll:       (params) => api.get('/transactions', { params }),
  getById:      (id)     => api.get(`/transactions/${id}`),
  create:       (data)   => api.post('/transactions', data),
  requestDelete: (id, data) => api.post(`/transactions/${id}/request-delete`, data),
};

// Attendance
export const attendanceApi = {
  getAll:       (params) => api.get('/attendance', { params }),
  getTodayPresent:(params) => api.get('/attendance/today', { params }),
  checkIn:      (data)   => api.post('/attendance/checkin', data),
  faceAttendance: (data) => api.post('/attendance/face', data),
  remove:       (id)     => api.delete(`/attendance/${id}`),
};

// Cash Flow
export const cashflowApi = {
  getAll:  (params) => api.get('/cashflow', { params }),
  create:  (data)   => api.post('/cashflow', data),
  update:  (id, d)  => api.put(`/cashflow/${id}`, d),
  remove:  (id)     => api.delete(`/cashflow/${id}`),
};

// Couriers
export const courierApi = {
  getAll:  (params) => api.get('/couriers', { params }),
  create:  (data)   => api.post('/couriers', data),
  update:  (id, d)  => api.put(`/couriers/${id}`, d),
  remove:  (id)     => api.delete(`/couriers/${id}`),
};

// Products
export const productApi = {
  getAll:  (params) => api.get('/products', { params }),
  create:  (data)   => api.post('/products', data),
  update:  (id, d)  => api.put(`/products/${id}`, d),
  remove:  (id)     => api.delete(`/products/${id}`),
};

// Reports
export const reportApi = {
  getSales:      (params) => api.get('/reports/sales', { params }),
  getSalary:     (params) => api.get('/reports/salary', { params }),
  getCashFlow:   (params) => api.get('/reports/cashflow', { params }),
  getDebt:       (params) => api.get('/reports/debt', { params }),
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
};

// Dashboard
export const dashboardApi = {
  getWidgets:         (params) => api.get('/dashboard/widgets', { params }),
  getSalesTrend:       (params) => api.get('/dashboard/sales-trend', { params }),
  getDailySalesTrend: (params) => api.get('/dashboard/daily-sales-trend', { params }),
  getBranchComparison: () => api.get('/dashboard/branch-comparison'),
  getAIProjection:     () => api.get('/dashboard/ai-projection'),
  getBusinessHealth:   () => api.get('/dashboard/business-health'),
};

// Users
export const userApi = {
  getAll:          (params) => api.get('/users', { params }),
  create:          (data)   => api.post('/users', data),
  update:          (id, d)  => api.put(`/users/${id}`, d),
  remove:          (id)     => api.delete(`/users/${id}`),
  courierToKasir:  (data)   => api.post('/users/courier-to-kasir', data),
  kasirToCourier:  (data)   => api.post('/users/kasir-to-courier', data),
};

// Fleet
export const fleetApi = {
  getVehicles:        () => api.get('/fleet/vehicles'),
  createVehicle:      (data) => api.post('/fleet/vehicles', data),
  getMaintenance:     () => api.get('/fleet/maintenance'),
  createMaintenance:  (data) => api.post('/fleet/maintenance', data),
};

// Inventory
export const inventoryApi = {
  getAll:      () => api.get('/inventory'),
  getLogs:     () => api.get('/inventory/logs'),
  updateStock: (data) => api.post('/inventory/update', data),
};

// Expenses
export const expenseApi = {
  getAll:   (params) => api.get('/expenses', { params }),
  getStats: (params) => api.get('/expenses/stats', { params }),
  create:   (data) => api.post('/expenses', data),
};

// Assets
export const assetApi = {
  getAll: () => api.get('/assets'),
  reset:  (id) => api.post('/assets/reset', { id }),
};

// Audit
export const auditApi = {
  getAll: () => api.get('/audit'),
};
