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
    const res = await authApi.login({ username, password, branch });
    const { token: tk, user: u } = res.data.data;
    const userWithBranch = { ...u, branch: branch || u.branch };
    
    localStorage.setItem('token', tk);
    foundation.storage.set('user', userWithBranch);
    
    setToken(tk);
    setUser(userWithBranch);
    return userWithBranch;
  };

  const logout = () => {
    localStorage.removeItem('token');
    foundation.storage.clear();
    setToken(null);
    setUser(null);
  };

  const isAdmin  = user?.role === 'admin';
  const isKasir  = user?.role === 'kasir';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isKasir }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
