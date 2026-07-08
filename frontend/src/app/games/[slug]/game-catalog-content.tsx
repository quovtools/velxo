'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

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
    averageRating: number;
  };
}

export default function GameCatalogContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Format game name based on slug
  const gameName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    async function loadListings() {
      try {
        const response = await fetch(`${API_BASE}/listings?gameName=${encodeURIComponent(gameName)}`);
        if (response.ok) {
          const result = await response.json();
          setListings(result.data?.listings || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, [gameName]);

  return (
    <div className="space-y-8">
      <div className="border-b border-borderBg pb-6">
        <h1 className="text-4xl font-extrabold text-white">{gameName} Marketplace</h1>
        <p className="text-gray-400 mt-2">Browse active accounts, top-ups, and coins for {gameName}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 h-60 animate-pulse space-y-4">
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
              <div className="h-6 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-10 bg-gray-700 rounded mt-auto"></div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <p className="text-gray-400 text-lg">No active listings found for {gameName}.</p>
          <Link
            href="/sell"
            className="mt-4 inline-block bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white"
          >
            Create first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <div className="text-xs text-gray-400 space-y-1 mb-4">
                  <p>Rank: <span className="text-gray-200">{item.rank || 'N/A'}</span></p>
                  <p>Seller: <span className="text-brand-light">{item.seller?.storeName}</span> ({item.seller?.averageRating?.toFixed(1) || '0.0'} ★)</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-borderBg pt-4 mt-auto">
                <span className="text-2xl font-black text-white">${Number(item.price).toFixed(2)}</span>
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
