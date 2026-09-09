import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, removeToken } from '../api/client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  candidateNumber?: string;
  role: 'STUDENT' | 'ADMIN';
  profile?: {
    targetBand?: number;
    examDate?: string;
    phone?: string;
    bio?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  signup: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.auth.getMe();
      setUser(data.user);
    } catch {
      setUser(null);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const data = await api.auth.login(credentials);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const res = await api.auth.signup(data);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      removeToken();
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        isAdmin,
        isStudent,
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
