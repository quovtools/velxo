'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface PlatformStats {
  totalUsers: number;
  totalSellers: number;
  verifiedSellers: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalOrders: number;
  completedOrders: number;
  completedVolume: number;
  totalVolume: number;
}

export const formatCount = (n: number) => n.toLocaleString('en-US');

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  useEffect(() => {
    api.get<{ success: boolean; data: PlatformStats }>('/stats/platform')
      .then((r) => { if (r?.data) setStats(r.data); })
      .catch(() => {});
  }, []);
  return stats;
}
