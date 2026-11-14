import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const getDashboardRoute = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'PROVIDER':
      return '/provider/dashboard';
    case 'SHOP_OWNER':
      return '/shop/dashboard';
    case 'CUSTOMER':
    default:
      return '/customer/dashboard';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sevasetu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sevasetu_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('sevasetu_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session validation error:', err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('sevasetu_token');
          localStorage.removeItem('sevasetu_user');
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, token: authToken } = res.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('sevasetu_token', authToken);
    localStorage.setItem('sevasetu_user', JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { user: registeredUser, token: authToken } = res.data;
    setUser(registeredUser);
    setToken(authToken);
    localStorage.setItem('sevasetu_token', authToken);
    localStorage.setItem('sevasetu_user', JSON.stringify(registeredUser));
    return registeredUser;
  };

  const logout = async () => {
    try {
      if (token) await api.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('sevasetu_token');
      localStorage.removeItem('sevasetu_user');
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('sevasetu_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        login,
        register,
        logout,
        updateUser,
        getDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
