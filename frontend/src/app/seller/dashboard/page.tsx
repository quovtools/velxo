'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { DollarSign, ShieldAlert, Award, Star, ListCollapse } from 'lucide-react';
import Link from 'next/link';

interface SellerProfile {
  id: string;
  storeName: string;
  reputationScore: number;
  totalSales: number;
  totalRevenue: string;
  averageRating: number;
}

interface SellerListing {
  id: string;
  title: string;
  price: string;
  status: string;
  salesCount: number;
  viewCount: number;
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadDashboard() {
      try {
        const [sRes, lRes] = await Promise.all([
          api.get<{ success: boolean; data: SellerProfile }>('/sellers/me'),
          api.get<{ success: boolean; data: { listings: SellerListing[] } }>('/listings?sellerId=' + user!.id),
        ]);

        if (sRes.success) setSeller(sRes.data);
        if (lRes.success) setListings(lRes.data?.listings || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user, router]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading seller dashboard console...</div>;
  }

  return (
    <div className="space-y-8 my-6">
      <div className="flex justify-between items-end border-b border-borderBg pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Merchant Dashboard</h1>
          <p className="text-gray-400 mt-2">Manage listings, analyze store earnings, and check metrics.</p>
        </div>
        <Link
          href="/sell"
          className="bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white text-sm"
        >
          + Add Offer
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Revenue</p>
          <h2 className="text-3xl font-black text-white">${Number(seller?.totalRevenue || 0).toFixed(2)}</h2>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Store Sales</p>
          <h2 className="text-3xl font-black text-white">{seller?.totalSales || 0}</h2>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Merchant Rating</p>
          <div className="flex items-center gap-1">
            <Star className="w-6 h-6 text-brand fill-brand" />
            <h2 className="text-3xl font-black text-white">{seller?.averageRating?.toFixed(1) || '0.0'}</h2>
          </div>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Reputation Index</p>
          <h2 className="text-3xl font-black text-emerald-400">{(seller?.reputationScore || 0).toFixed(0)} pts</h2>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ListCollapse className="w-5 h-5 text-brand" />
          Active Product Listings
        </h3>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No active product listings found for this store.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-500 uppercase font-bold border-b border-borderBg">
                <tr>
                  <th className="py-3 px-4">Offer Title</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Sales</th>
                  <th className="py-3 px-4">Moderation State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderBg">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-background/20 transition">
                    <td className="py-4 px-4 font-semibold text-white truncate max-w-xs">{item.title}</td>
                    <td className="py-4 px-4 font-bold text-brand-light">${Number(item.price).toFixed(2)}</td>
                    <td className="py-4 px-4">{item.viewCount}</td>
                    <td className="py-4 px-4">{item.salesCount}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                          : 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
