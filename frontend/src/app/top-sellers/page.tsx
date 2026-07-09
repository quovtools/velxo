'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Seller {
  id: string;
  storeName: string;
  storeDescription?: string | null;
  isVerified: boolean;
  reputationScore: number;
  totalSales: number;
  averageRating: number;
  responseRate: number;
  responseTime?: number | null;
  subscriptionTier?: string;
  createdAt: string;
  user?: {
    email: string;
    firstName?: string;
    avatarUrl?: string | null;
  } | null;
}

export default function TopSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopSellers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '20');

      const response = await fetch(`${API_BASE}/sellers/top-sellers?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setSellers(result.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopSellers();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">Top Sellers</h1>
        <p className="text-sm text-gray-400 font-semibold">{sellers.length} sellers found</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 h-48 animate-pulse space-y-4"></div>
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <p className="text-gray-400">No top sellers are available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <div key={seller.id} className="glow-card border border-borderBg p-6 flex flex-col justify-between h-full">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {seller.user?.avatarUrl ? (
                    <img
                      src={seller.user.avatarUrl}
                      alt={seller.storeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-brand-light font-black text-lg">
                      {seller.storeName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-lg text-white truncate hover:text-brand transition">
                      <Link href={`/seller/${seller.id}`}>{seller.storeName}</Link>
                    </h3>
                    {seller.isVerified && (
                      <span className="bg-brand/10 text-brand-light text-[10px] font-semibold px-2 py-0.5 rounded border border-brand/20">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Reputation {Number(seller.reputationScore || 0).toFixed(1)} / 5
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-5 text-center">
                <div className="bg-background border border-borderBg rounded-xl py-2">
                  <p className="text-lg font-black text-white">
                    {seller.averageRating ? Number(seller.averageRating).toFixed(1) : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Rating</p>
                </div>
                <div className="bg-background border border-borderBg rounded-xl py-2">
                  <p className="text-lg font-black text-white">{seller.totalSales || 0}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Sales</p>
                </div>
                <div className="bg-background border border-borderBg rounded-xl py-2">
                  <p className="text-lg font-black text-white">
                    {seller.responseTime ? `${seller.responseTime}m` : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Reply</p>
                </div>
              </div>

              <Link
                href={`/seller/${seller.id}`}
                className="mt-5 w-full text-center bg-brand hover:bg-brand-dark px-4 py-2 rounded-lg text-xs font-semibold transition text-white"
              >
                View Store
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
