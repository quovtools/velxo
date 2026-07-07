'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getToken, getUser, clearSession, AuthUser } from '@/lib/auth';

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  theme: 'dark',
  toggleTheme: () => {},
  logout: () => {},
  refreshSession: () => {},
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Persist & apply theme
  useEffect(() => {
    const saved = (localStorage.getItem('velxo_theme') as 'dark' | 'light') || 'dark';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    const root = document.documentElement;
    if (t === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
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

  useEffect(() => {
    refreshSession();
    // Warm up backend (Render free-tier cold start)
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
      <AuthContext.Provider value={{ user, loading, theme, toggleTheme, logout, refreshSession }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export const useAuth = () => useContext(AuthContext);
