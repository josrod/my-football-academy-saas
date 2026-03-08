import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import i18n from '../i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // Apply saved language preference
        if (parsed.language) {
          i18n.changeLanguage(parsed.language);
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
    // Apply user's saved language preference
    if (res.user.language) {
      i18n.changeLanguage(res.user.language);
    }
    return res.user;
  };

  const signup = async (name, email, password, clubName) => {
    const res = await api.post('/api/auth/signup', { name, email, password, club_name: clubName, role: 'admin' });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
