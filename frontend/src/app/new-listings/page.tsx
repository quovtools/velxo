'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/lib/useCurrency';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  seller: {
    storeName: string;
  };
}

export default function NewListingsPage() {
  const { fmt } = useCurrency();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNewListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('sortBy', 'newest');

      const response = await fetch(`${API_BASE}/listings?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setListings(result.data?.listings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewListings();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">New Listings</h1>
        <p className="text-sm text-gray-400 font-semibold">{listings.length} items found</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 h-60 animate-pulse space-y-4"></div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <p className="text-gray-400">No new offers are available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="glow-card border border-borderBg p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="bg-brand/10 text-brand-light text-xs font-semibold px-2 py-0.5 rounded border border-brand/20">
                    {item.gameName}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {item.platform} • {item.region}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white line-clamp-2 mb-2 hover:text-brand transition">
                  <Link href={`/listings/${item.id}`}>{item.title}</Link>
                </h3>
                <p className="text-xs text-gray-400">
                  Seller: <span className="text-brand-light">{item.seller?.storeName}</span>
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-borderBg pt-4 mt-6">
                <span className="text-2xl font-black text-white">{fmt(item.price)}</span>
                <Link
                  href={`/listings/${item.id}`}
                  className="bg-brand hover:bg-brand-dark px-4 py-2 rounded-lg text-xs font-semibold transition text-white"
                >
                  View Offer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
