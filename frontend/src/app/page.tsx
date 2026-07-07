'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, Star, ShieldCheck, Zap,
  ChevronDown, X, Package, Tag, Gamepad2, TrendingUp,
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  level?: number;
  isFeatured: boolean;
  images: string[];
  seller: { storeName: string; averageRating: number; isVerified?: boolean };
}

const CATEGORIES = [
  { id: '', label: 'All', icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'accounts', label: 'Accounts', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  { id: 'topups', label: 'Top-Ups', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'giftcards', label: 'Gift Cards', icon: <Tag className="w-3.5 h-3.5" /> },
  { id: 'boosting', label: 'Boosting', icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

const GAMES = [
  'Free Fire', 'PUBG Mobile', 'COD Mobile', 'Valorant',
  'Fortnite', 'Roblox', 'Mobile Legends', 'Blood Strike',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

function GameBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    'Free Fire': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    'PUBG Mobile': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    'COD Mobile': 'bg-green-500/15 text-green-400 border-green-500/20',
    'Valorant': 'bg-red-500/15 text-red-400 border-red-500/20',
    'Fortnite': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    'Roblox': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${colors[name] || 'bg-brand/10 text-brand-light border-brand/20'}`}>
      {name}
    </span>
  );
}

function ListingCard({ item }: { item: Listing }) {
  return (
    <Link
      href={`/listings/${item.id}`}
      className="group bg-cardBg border border-borderBg hover:border-brand/40 rounded-xl overflow-hidden transition-all duration-200 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-40 bg-surface overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-gray-700" />
          </div>
        )}
        {item.isFeatured && (
          <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            Featured
          </span>
        )}
        <div className="absolute top-2 right-2">
          <GameBadge name={item.gameName} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-brand-light transition">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
            {item.platform && <span>{item.platform}</span>}
            {item.platform && item.region && <span>·</span>}
            {item.region && <span>{item.region}</span>}
            {item.level && <><span>·</span><span>Lv.{item.level}</span></>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <div className="text-lg font-black text-white">${Number(item.price).toFixed(2)}</div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
              {item.seller?.isVerified && <ShieldCheck className="w-3 h-3 text-brand-accent" />}
              <span className="truncate max-w-[90px]">{item.seller?.storeName}</span>
              {item.seller?.averageRating > 0 && (
                <span className="flex items-center gap-0.5 text-yellow-400 ml-1">
                  <Star className="w-2.5 h-2.5 fill-yellow-400" />
                  {item.seller.averageRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <span className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-3 py-2 rounded-lg transition">
            Buy
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-cardBg border border-borderBg rounded-xl overflow-hidden animate-pulse">
      <div className="h-40 bg-surface" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 bg-surface rounded w-3/4" />
        <div className="h-3 bg-surface rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-surface rounded w-16" />
          <div className="h-8 bg-surface rounded-lg w-14" />
        </div>
      </div>
    </div>
  );
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get('query') || '');
  const [activeGame, setActiveGame] = useState(searchParams.get('game') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (activeGame) params.append('gameName', activeGame);
      if (activeCategory) params.append('category', activeCategory);
      if (platform) params.append('platform', platform);
      if (region) params.append('region', region);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort === 'price_asc') { params.append('sortBy', 'price'); params.append('order', 'asc'); }
      else if (sort === 'price_desc') { params.append('sortBy', 'price'); params.append('order', 'desc'); }
      params.append('limit', '24');

      const res = await fetch(`${apiBase}/listings?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setListings(result.data?.listings || []);
        setTotal(result.data?.total || 0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [search, activeGame, activeCategory, platform, region, minPrice, maxPrice, sort, apiBase]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const clearFilters = () => {
    setSearch(''); setActiveGame(''); setActiveCategory('');
    setPlatform(''); setRegion(''); setMinPrice(''); setMaxPrice(''); setSort('newest');
  };

  const hasFilters = search || activeGame || activeCategory || platform || region || minPrice || maxPrice;

  return (
    <div className="space-y-5">

      {/* Trust bar */}
      <div className="flex items-center gap-6 py-2.5 px-4 bg-cardBg border border-borderBg rounded-xl text-xs text-gray-500 overflow-x-auto scrollbar-none">
        {[
          { icon: <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />, text: 'Escrow Protected' },
          { icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />, text: 'Instant Delivery' },
          { icon: <Star className="w-3.5 h-3.5 text-yellow-400" />, text: 'Verified Sellers' },
          { icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />, text: '24/7 Support' },
        ].map((b, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
            {b.icon}
            <span className="font-medium">{b.text}</span>
          </div>
        ))}
      </div>

      {/* Search + filter row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search game accounts, top-ups, gift cards..."
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition flex-shrink-0 ${
            showFilters || hasFilters ? 'bg-brand/10 border-brand/40 text-brand-light' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white hover:border-gray-600'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-cardBg border border-borderBg rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Platform', value: platform, onChange: setPlatform, options: [['', 'All Platforms'], ['PC', 'PC'], ['Android', 'Android'], ['iOS', 'iOS'], ['PlayStation', 'PlayStation'], ['Xbox', 'Xbox']] },
            { label: 'Region', value: region, onChange: setRegion, options: [['', 'All Regions'], ['Africa', 'Africa'], ['Europe', 'Europe'], ['North America', 'N. America'], ['Asia', 'Asia']] },
            { label: 'Sort', value: sort, onChange: setSort, options: SORT_OPTIONS.map(o => [o.value, o.label]) },
          ].map((f) => (
            <select key={f.label} value={f.value} onChange={(e) => f.onChange(e.target.value)}
              className="bg-surface border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
              {(f.options as [string, string][]).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          ))}
          <input type="number" placeholder="Min $" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            className="bg-surface border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" />
          <input type="number" placeholder="Max $" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-surface border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" />
          {hasFilters && (
            <button onClick={clearFilters} className="col-span-2 sm:col-span-3 lg:col-span-5 flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 py-1">
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeCategory === cat.id
                ? 'bg-brand text-white'
                : 'bg-cardBg border border-borderBg text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Game filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          onClick={() => setActiveGame('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            !activeGame ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          All Games
        </button>
        {GAMES.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGame(activeGame === g ? '' : g)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeGame === g ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-white">
            {activeGame || activeCategory ? `${activeGame || activeCategory} Listings` : 'All Listings'}
          </h1>
          <span className="text-xs text-gray-600 bg-surface px-2 py-0.5 rounded-full border border-borderBg">
            {loading ? '…' : total || listings.length}
          </span>
        </div>
        <div className="relative hidden sm:block">
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-cardBg border border-borderBg text-gray-400 text-xs font-medium px-3 py-2 pr-7 rounded-xl focus:outline-none focus:border-brand cursor-pointer">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl space-y-3">
          <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center mx-auto">
            <Gamepad2 className="w-7 h-7 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium text-sm">No listings found</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-brand text-sm hover:text-brand-light">
              Clear filters
            </button>
          )}
          <div className="pt-1">
            <Link href="/sell" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
              List the first one
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {listings.map((item) => <ListingCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="h-12 bg-cardBg border border-borderBg rounded-xl animate-pulse" />
        <div className="h-12 bg-cardBg border border-borderBg rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
