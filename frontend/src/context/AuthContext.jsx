import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import { foundation } from '../utils/foundation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => foundation.storage.get('user'));
  const [token, setToken]     = useState(() => localStorage.getItem('token') || null); // Token remains for Axios header simplicity
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      if (token === 'demo-token') {
        setLoading(false);
        return;
      }

      authApi.getMe()
        .then(res => {
          const u = res.data.data;
          setUser(u);
          foundation.storage.set('user', u);
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password, branch) => {
    console.log('AuthContext.login called:', { username, branch });
    const res = await authApi.login({ username, password, branch });
    console.log('Login API response:', res.data);
    
    const { token: tk, user: u } = res.data.data;
    
    // User data sudah lengkap dari backend (termasuk branch_name)
    // Tidak perlu tambahkan field branch lagi
    
    localStorage.setItem('token', tk);
    foundation.storage.set('user', u);
    
    setToken(tk);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    foundation.storage.clear();
    setToken(null);
    setUser(null);
  };

  const isAdmin      = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const isKasir      = user?.role === 'kasir';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isSuperAdmin, isKasir }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
