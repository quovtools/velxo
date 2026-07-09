'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getToken, getUser, clearSession, setSession, AuthUser } from '@/lib/auth';
import NotificationProvider from '@/components/NotificationProvider';

const QueryClientInstance = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  logout: () => void;
  refreshSession: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  theme: 'dark',
  toggleTheme: () => {},
  logout: () => {},
  refreshSession: () => {},
  updateUser: () => {},
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Apply theme class to <html> immediately on mount
  useEffect(() => {
    const saved = (localStorage.getItem('velxo_theme') as 'dark' | 'light') || 'dark';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('velxo_theme', next);
    applyTheme(next);
  };

  const refreshSession = () => {
    const token = getToken();
    const stored = getUser();
    if (token && stored) {
      setUser(stored);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  // Update user in state + localStorage without full reload
  const updateUser = (updates: Partial<AuthUser>) => {
    const current = getUser();
    const token = getToken();
    if (current && token) {
      const updated = { ...current, ...updates };
      setSession(token, updated);
      setUser(updated);
    }
  };

  useEffect(() => {
    refreshSession();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    fetch(apiUrl, { method: 'GET' }).catch(() => {});
  }, []);

  const logout = () => {
    clearSession();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <QueryClientProvider client={QueryClientInstance}>
      <AuthContext.Provider value={{ user, loading, theme, toggleTheme, logout, refreshSession, updateUser }}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export const useAuth = () => useContext(AuthContext);
