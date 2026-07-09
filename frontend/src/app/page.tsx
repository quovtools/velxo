'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, Gamepad2, ChevronRight,
  Star, Flame, PlusCircle, ShieldCheck, X,
  Users, TrendingUp, Zap, Lock, Shield, Check,
  Award, Heart, Gift, Bell, ArrowRight
} from 'lucide-react';
import GameSlideshow from '@/components/GameSlideshow';
import GameIcon from '@/components/GameIcon';
import Footer from '@/components/Footer';
import { storeReferralCode, trackReferralClick } from '@/lib/referral';

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  isFeatured: boolean;
  isSold: boolean;
  status: string;
  seller: { storeName: string; averageRating: number; id?: string };
}

const GAMES = [
  { name: 'Free Fire', slug: 'free-fire' },
  { name: 'COD Mobile', slug: 'cod-mobile' },
  { name: 'Blood Strike', slug: 'blood-strike' },
  { name: 'Delta Force', slug: 'delta-force' },
  { name: 'PUBG Mobile', slug: 'pubg-mobile' },
  { name: 'Valorant', slug: 'valorant' },
  { name: 'Roblox', slug: 'roblox' },
  { name: 'Mobile Legends', slug: 'mobile-legends' },
  { name: 'eFootball', slug: 'efootball' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

function MarketplaceContent() {
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get('query') || '');
  const [activeGame, setActiveGame] = useState(searchParams.get('game') || '');
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // Capture affiliate referral code from the URL (?ref=CODE) and track the click
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      storeReferralCode(ref);
      trackReferralClick(ref);
    }
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (activeGame) params.append('gameName', activeGame);
      if (platform) params.append('platform', platform);
      if (region) params.append('region', region);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort === 'price_asc') { params.append('sortBy', 'price_low'); }
      else if (sort === 'price_desc') { params.append('sortBy', 'price_high'); }
      else if (sort === 'rating') { params.append('sortBy', 'rating'); }
      params.append('limit', '24');

      const res = await fetch(`${apiBase}/listings?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setListings(result.data?.listings || []);
        setTotal(result.data?.total || result.data?.listings?.length || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, activeGame, platform, region, category, minPrice, maxPrice, sort, apiBase]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  function clearFilters() {
    setSearch(''); setActiveGame(''); setPlatform('');
    setRegion(''); setCategory(''); setMinPrice(''); setMaxPrice('');
    setSort('newest');
  }

  const hasFilters = search || activeGame || platform || region || category || minPrice || maxPrice;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeGame ? <span>{activeGame}</span> : 'Browse Marketplace'}
          </h1>
          <p className="text-sm text-gray-500">
            {activeGame ? `${GAMES.find(g => g.name === activeGame)?.slug || activeGame} listings` : 'Game accounts, top-ups, gift cards & boosting services'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeGame && (
            <button onClick={() => setActiveGame('')} className="text-xs font-bold text-brand hover:text-brand-light transition">
              Clear game filter
            </button>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-sm text-gray-400">
        <div className="flex items-center gap-2 bg-hoverBg/30 px-4 py-2 rounded-xl border border-borderBg/50">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Escrow Protected</span>
        </div>
        <div className="flex items-center gap-2 bg-hoverBg/30 px-4 py-2 rounded-xl border border-borderBg/50">
          <Lock className="w-4 h-4 text-blue-400" />
          <span>Secure Transactions</span>
        </div>
        <div className="flex items-center gap-2 bg-hoverBg/30 px-4 py-2 rounded-xl border border-borderBg/50">
          <Check className="w-4 h-4 text-purple-400" />
          <span>Verified Sellers</span>
        </div>
        <div className="flex items-center gap-2 bg-hoverBg/30 px-4 py-2 rounded-xl border border-borderBg/50">
          <Zap className="w-4 h-4 text-orange-400" />
          <span>Fast Delivery</span>
        </div>
      </div>

      {/* Slideshow */}
      <GameSlideshow />

      {/* Search bar row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts, coins, gift cards, skins..."
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition ${
            showFilters || hasFilters
              ? 'bg-brand/10 border-brand/40 text-brand-light'
              : 'bg-cardBg border-borderBg text-gray-300 hover:border-brand/30'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
        </button>
        <Link
          href="/sell"
          className="flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-4 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-brand/20 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Sell</span>
        </Link>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={platform} onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">All Platforms</option>
            <option value="PC">PC</option>
            <option value="Android">Android</option>
            <option value="iOS">iOS</option>
            <option value="PlayStation">PlayStation</option>
            <option value="Xbox">Xbox</option>
            <option value="Nintendo">Nintendo Switch</option>
          </select>
          <select
            className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={region} onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">All Regions</option>
            <option value="Africa">Africa</option>
            <option value="Europe">Europe</option>
            <option value="North America">North America</option>
            <option value="Asia">Asia</option>
            <option value="Middle East">Middle East</option>
          </select>
          <select
            className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={category} onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="accounts">Game Accounts</option>
            <option value="topups">Top-Ups & Coins</option>
            <option value="giftcards">Gift Cards</option>
            <option value="boosting">Boosting</option>
          </select>
          <input
            type="number" placeholder="Min Price $"
            className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number" placeholder="Max Price $"
            className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
          />
          <select
            className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
            value={sort} onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="col-span-2 sm:col-span-3 lg:col-span-6 flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition py-1"
            >
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Game tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button
          onClick={() => setActiveGame('')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition ${
            activeGame === '' ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white hover:border-brand/30'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" /> All Games
        </button>
        {GAMES.map((g) => (
          <button
            key={g.slug}
            onClick={() => setActiveGame(activeGame === g.name ? '' : g.name)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
              activeGame === g.name ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white hover:border-brand/30'
            }`}
          >
            <GameIcon game={g.slug} className="w-5 h-5 rounded-md" />
            {g.name}
          </button>
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold text-white">
            {activeGame ? `${activeGame} Listings` : 'All Listings'}
          </span>
          <span className="text-xs text-gray-500 bg-background px-2 py-0.5 rounded-full border border-borderBg">
            {loading ? '...' : `${total || listings.length} found`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
          <span className="hidden sm:inline">All trades escrow-protected</span>
        </div>
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-700/50" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-700 rounded w-12" />
                </div>
                <div className="flex items-center justify-between border-t border-borderBg pt-3 mt-2">
                  <div className="h-7 bg-gray-700 rounded w-20" />
                  <div className="h-8 bg-gray-700 rounded-lg w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto">
            <Gamepad2 className="w-8 h-8 text-brand/40" />
          </div>
          <p className="text-gray-400 font-semibold">No listings match your filters.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-brand text-sm font-bold hover:underline">
              Clear all filters
            </button>
          )}
          <div className="pt-1">
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-brand/20"
            >
              <PlusCircle className="w-4 h-4" /> Be the first to list
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((item) => (
            <Link
              key={item.id}
              href={`/listings/${item.id}`}
              className="group bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:shadow-lg hover:shadow-brand/10"
            >
              {/* Image area placeholder */}
              <div className="h-36 bg-gradient-to-br from-background to-cardBg flex items-center justify-center relative">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{item.gameName}</span>
                {item.isFeatured && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-accent flex-shrink-0 absolute top-2 right-2">
                    <Flame className="w-3 h-3" /> Hot
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-brand/10 text-brand-light text-[10px] font-bold px-2 py-0.5 rounded border border-brand/20 uppercase tracking-wide truncate max-w-[120px]">
                      {item.gameName}
                    </span>
                    <span className="text-[10px] text-gray-600 truncate">{item.platform}</span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-brand transition">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                    {item.seller?.id ? (
                      <Link href={`/seller/${item.seller.id}`} className="truncate hover:text-brand transition">
                        {item.seller?.storeName}
                      </Link>
                    ) : (
                      <span className="truncate">{item.seller?.storeName}</span>
                    )}
                    <span className="flex items-center gap-0.5 flex-shrink-0">
                      <Star className="w-3 h-3 text-brand fill-brand" />
                      {item.seller?.averageRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-borderBg pt-3">
                  <span className="text-lg font-black text-white tracking-tight">${Number(item.price).toFixed(2)}</span>
                  {item.isSold || item.status === 'SOLD' ? (
                    <span className="bg-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300">
                      Sold
                    </span>
                  ) : (
                    <span className="bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-lg shadow-brand/20">
                      Buy Now
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom game grid for discovery */}
      {!activeGame && !loading && listings.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Browse by Game</h2>
            <Link href="/games" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {GAMES.map((game) => (
              <button
                key={game.slug}
                onClick={() => setActiveGame(game.name)}
                className="flex flex-col items-center gap-1.5 p-3 bg-cardBg border border-borderBg hover:border-brand/40 hover:shadow-md rounded-xl transition group"
              >
                <GameIcon game={game.slug} className="w-9 h-9 rounded-lg" />
                <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition leading-tight text-center">{game.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <TopupShowcase />
      <GigShowcase />

      <Footer />
    </div>
  );
}

/* ── Official Velxo Gaming Top-Ups showcase ── */
function TopupShowcase() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    fetch(`${apiBase}/topups`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand" /> Official Velxo Top-Ups
        </h2>
        <Link href="/topups" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 h-28 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />
            ))
          : items.slice(0, 10).map((t) => (
              <Link
                key={t.id}
                href="/topups"
                className="flex-shrink-0 w-44 bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden transition group"
              >
                <div className="h-20 bg-gradient-to-br from-brand/30 to-background flex items-center justify-center relative">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <Zap className="w-6 h-6 text-brand/60" />
                  )}
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-brand text-white px-1.5 py-0.5 rounded">
                    Official
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-white truncate">{t.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">{t.gameName}</p>
                  <p className="text-xs font-black text-brand-light mt-1">${Number(t.price).toFixed(2)}</p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}

/* ── Rank Boosting gigs showcase ── */
function GigShowcase() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    fetch(`${apiBase}/gigs`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-brand" /> Rank Boosting Services
        </h2>
        <Link href="/boosting" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-52 h-32 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />
            ))
          : items.slice(0, 10).map((g) => (
              <Link
                key={g.id}
                href="/boosting"
                className="flex-shrink-0 w-52 bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden transition group"
              >
                <div className="h-24 bg-gradient-to-br from-purple-500/30 to-background flex items-center justify-center relative">
                  {g.imageUrl ? (
                    <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                  ) : (
                    <Gamepad2 className="w-6 h-6 text-purple-400/60" />
                  )}
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-purple-500 text-white px-1.5 py-0.5 rounded">
                    {g.accountType || 'Boost'}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-white truncate">{g.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {g.gameName} · {g.rankFrom ? `${g.rankFrom}→${g.rankTo}` : 'Rank up'}
                  </p>
                  <p className="text-xs font-black text-brand-light mt-1">${Number(g.price).toFixed(2)}</p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="space-y-5">
        <div className="h-64 bg-cardBg border border-borderBg rounded-3xl animate-pulse" />
        <div className="h-12 bg-cardBg border border-borderBg rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
