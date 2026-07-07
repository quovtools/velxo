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
  logout: () => void;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshSession: () => {},
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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

    // Warm up the backend on app load (Render free-tier cold start)
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
      <AuthContext.Provider value={{ user, loading, logout, refreshSession }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export const useAuth = () => useContext(AuthContext);
