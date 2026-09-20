import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager } from '../offline/SyncManager';

interface AuthContextData {
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@fintech_token');
      if (storedToken) {
        setToken(storedToken);
        syncManager.setToken(storedToken);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string) => {
    await AsyncStorage.setItem('@fintech_token', newToken);
    setToken(newToken);
    syncManager.setToken(newToken);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@fintech_token');
    setToken(null);
    syncManager.setToken('');
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
