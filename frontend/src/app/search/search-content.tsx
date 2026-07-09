'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // States
  const [search, setSearch] = useState(initialQuery);
  const [gameName, setGameName] = useState('');
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (gameName) params.append('gameName', gameName);
      if (platform) params.append('platform', platform);
      if (region) params.append('region', region);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

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
    fetchResults();
  }, [search, gameName, platform, region]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Filters */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-6 h-fit space-y-6">
        <h2 className="text-xl font-bold text-white">Search Filters</h2>

        {/* Text search */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search Keyword</label>
          <input
            type="text"
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            placeholder="e.g. skin, bundle, coins"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Game Name */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Game</label>
          <select
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
          >
            <option value="">All Games</option>
            <option value="Free Fire">Free Fire</option>
            <option value="PUBG Mobile">PUBG Mobile</option>
            <option value="COD Mobile">COD Mobile</option>
            <option value="Fortnite">Fortnite</option>
            <option value="Valorant">Valorant</option>
            <option value="Roblox">Roblox</option>
          </select>
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform</label>
          <select
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">All Platforms</option>
            <option value="PC">PC</option>
            <option value="Android">Android</option>
            <option value="iOS">iOS</option>
            <option value="PlayStation">PlayStation</option>
            <option value="Xbox">Xbox</option>
            <option value="Nintendo">Nintendo Switch</option>
          </select>
        </div>

        {/* Region */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Region</label>
          <select
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">All Regions</option>
            <option value="Africa">Africa</option>
            <option value="Europe">Europe</option>
            <option value="North America">North America</option>
            <option value="Asia">Asia</option>
            <option value="Middle East">Middle East</option>
          </select>
        </div>

        {/* Price filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price Range (USD)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              className="w-full bg-background border border-borderBg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-full bg-background border border-borderBg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <button
            onClick={fetchResults}
            className="w-full mt-2 bg-brand/10 hover:bg-brand/20 text-brand-light font-bold py-2 rounded-xl text-xs border border-brand/20 transition"
          >
            Apply Price Filter
          </button>
        </div>
      </div>

      {/* Results grid */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-white">Marketplace Catalog</h1>
          <p className="text-sm text-gray-400 font-semibold">{listings.length} items found</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 h-60 animate-pulse space-y-4"></div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
            <p className="text-gray-400">No offers fit the selected criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div key={item.id} className="group bg-cardBg border border-borderBg hover:border-brand/40 hover:-translate-y-0.5 transition rounded-2xl p-6 flex flex-col justify-between h-full shadow-sm hover:shadow-xl hover:shadow-brand/10">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="bg-brand/10 text-brand-light text-xs font-semibold px-2 py-0.5 rounded border border-brand/20">
                      {item.gameName}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {item.platform} • {item.region}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-white line-clamp-2 mb-2 group-hover:text-brand transition">
                    <Link href={`/listings/${item.id}`}>{item.title}</Link>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Seller: <span className="text-brand-light">{item.seller?.storeName}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-borderBg pt-4 mt-6">
                  <span className="text-2xl font-black text-white">${Number(item.price).toFixed(2)}</span>
                  <Link
                    href={`/listings/${item.id}`}
                    className="bg-gradient-to-r from-brand to-brand-dark hover:shadow-md hover:shadow-brand/30 px-4 py-2 rounded-lg text-xs font-semibold transition text-white"
                  >
                    View Offer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading search console...</div>}>
      <SearchContent />
    </Suspense>
  );
}
