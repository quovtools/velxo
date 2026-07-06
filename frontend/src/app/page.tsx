'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, ShieldAlert, Award, RefreshCw, Flame } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  isFeatured: boolean;
  seller: {
    storeName: string;
    averageRating: number;
  };
}

const FEATURED_GAMES = [
  { name: 'Free Fire', slug: 'free-fire', icon: '🔥' },
  { name: 'PUBG Mobile', slug: 'pubg-mobile', icon: '🔫' },
  { name: 'COD Mobile', slug: 'cod-mobile', icon: '💣' },
  { name: 'Fortnite', slug: 'fortnite', icon: '⛏️' },
  { name: 'Valorant', slug: 'valorant', icon: '🎯' },
  { name: 'Roblox', slug: 'roblox', icon: '🧱' },
  { name: 'Clash of Clans', slug: 'clash-of-clans', icon: '🏰' },
  { name: 'Mobile Legends', slug: 'mobile-legends', icon: '⚔️' },
];

export default function Homepage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const response = await fetch('http://localhost:3001/api/v1/listings/featured');
        if (response.ok) {
          const result = await response.json();
          setListings(result.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-dark/40 to-cyan-900/30 border border-borderBg py-20 px-8 md:px-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-2xl space-y-6">
          <span className="bg-brand/10 text-brand-light text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-brand/20">
            Escrow Protected Gaming Hub
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-white">
            Africa&apos;s No.1 <span className="text-gradient">Gaming Marketplace</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Trade accounts, top-ups, coins, gift cards, and custom boosting services with total confidence and automated escrow protection.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <input
              type="text"
              placeholder="Search games, ranks, accounts, or services..."
              className="flex-1 bg-background border border-borderBg rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link
              href={`/search?query=${encodeURIComponent(search)}`}
              className="bg-brand hover:bg-brand-dark px-8 py-4 rounded-xl font-bold text-center transition shadow-lg shadow-brand/20 text-white"
            >
              Search
            </Link>
          </div>
        </div>

        <div className="hidden lg:block relative w-80 h-80 flex-shrink-0 animate-pulse">
          <div className="absolute inset-0 bg-brand rounded-full filter blur-[80px] opacity-20"></div>
          <Gamepad2 className="w-full h-full text-brand/40" />
        </div>
      </section>

      {/* Featured Games Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Popular Games</h2>
            <p className="text-gray-400 text-sm mt-1">Select a title to explore current listings</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {FEATURED_GAMES.map((game) => (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="glow-card border border-borderBg hover:border-brand/40 p-6 flex flex-col items-center justify-center gap-3 transition text-center"
            >
              <span className="text-4xl">{game.icon}</span>
              <span className="text-sm font-semibold text-gray-200">{game.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-cardBg border border-borderBg rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <Award className="w-10 h-10 text-brand flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-white">Escrow Guaranteed</h3>
            <p className="text-sm text-gray-400 mt-1">Payments are held secure until the buyer confirms the product is delivered successfully.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <ShieldAlert className="w-10 h-10 text-brand flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-white">Fraud Protection</h3>
            <p className="text-sm text-gray-400 mt-1">Our AI-assisted fraud detection system monitors listings and orders constantly for buyer security.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <RefreshCw className="w-10 h-10 text-brand flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-white">Fast Disputes</h3>
            <p className="text-sm text-gray-400 mt-1">Moderators arbitrate disputed orders within hours, backed by cryptographic audit trials.</p>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Featured Offers</h2>
          </div>
          <Link href="/search" className="text-brand hover:text-brand-light text-sm font-semibold">
            View All Offers &rarr;
          </Link>
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
          <div className="text-center py-12 bg-cardBg border border-borderBg rounded-2xl">
            <p className="text-gray-400">No active featured offers right now. Check back shortly!</p>
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
      </section>
    </div>
  );
}
