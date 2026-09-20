import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password, remember_me) => {
    const response = await api.post('/auth/login', { email, password, remember_me });
    localStorage.setItem('token', response.data.access_token);
    
    // Fetch user details immediately after login
    const userRes = await api.get('/auth/me');
    setUser(userRes.data);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    } catch (e) {
      console.error("Failed to refresh user details", e);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore failure on logout API
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>; // Consider a better loader
  }

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.role === 'Admin' || user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser, login, logout, isAuthenticated: !!user, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
