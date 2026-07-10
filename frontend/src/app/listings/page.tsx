'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, SlidersHorizontal, Gamepad2, Flame, PlusCircle,
  ShieldCheck, X, Zap, Lock, Check, ArrowLeft, Grid, List,
} from 'lucide-react';
import GameIcon from '@/components/GameIcon';
import { GAME_LIST } from '@/lib/games';
import { useCurrency } from '@/lib/useCurrency';

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
  images?: string[];
  seller: { storeName: string; averageRating: number; id?: string; verified?: boolean };
}

const GAMES = GAME_LIST.map((g) => ({ name: g.name, slug: g.slug }));

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

/* Skeleton card for loading */
function SkeletonCard() {
  return (
    <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-700/50" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-700 rounded w-4/5" />
        <div className="flex justify-between mt-2">
          <div className="h-5 bg-gray-700 rounded w-16" />
          <div className="h-7 bg-gray-700 rounded-lg w-20" />
        </div>
      </div>
    </div>
  );
}

/* Grid listing card */
function ListingCardGrid({ item }: { item: Listing }) {
  const [imgErr, setImgErr] = useState(false);
  const { fmt } = useCurrency();
  const img = item.images?.[0];
  const sold = item.isSold || item.status === 'SOLD';

  return (
    <Link
      href={`/listings/${item.id}`}
      className="bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-0.5 group"
    >
      <div className="h-48 relative overflow-hidden bg-gradient-to-br from-background to-cardBg">
        {img && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 className="w-12 h-12 text-brand/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        {item.isFeatured && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-1 rounded-full">
            <Flame className="w-3 h-3" /> Hot
          </span>
        )}
        {sold && (
          <span className="absolute top-3 left-3 bg-black/60 text-gray-200 text-xs font-bold px-3 py-1 rounded backdrop-blur-sm">
            Sold
          </span>
        )}
        {item.platform && (
          <span className="absolute bottom-3 left-3 text-xs font-semibold text-white/90 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
            {item.platform}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <span className="inline-block bg-brand/10 text-brand-light text-xs font-bold px-2 py-1 rounded border border-brand/20 uppercase tracking-wide mb-2">
            {item.gameName}
          </span>
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand/50" />
            {item.seller?.storeName || 'Velxo Seller'}
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-borderBg pt-3">
          <span className="text-lg font-black text-white">{fmt(item.price)}</span>
          <span className="bg-gradient-to-r from-brand to-brand-dark px-3 py-1.5 rounded-lg text-xs font-bold text-white">
            Buy Now
          </span>
        </div>
      </div>
    </Link>
  );
}

/* List view card */
function ListingCardList({ item }: { item: Listing }) {
  const [imgErr, setImgErr] = useState(false);
  const { fmt } = useCurrency();
  const img = item.images?.[0];
  const sold = item.isSold || item.status === 'SOLD';

  return (
    <Link
      href={`/listings/${item.id}`}
      className="bg-cardBg border border-borderBg hover:border-brand/50 rounded-xl overflow-hidden flex transition-all duration-300 hover:shadow-lg hover:shadow-brand/10 group"
    >
      <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-background to-cardBg">
        {img && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-brand/30" />
          </div>
        )}
        {sold && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs font-bold text-white">
            SOLD
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block bg-brand/10 text-brand-light text-xs font-bold px-2 py-0.5 rounded border border-brand/20 uppercase">
              {item.gameName}
            </span>
            {item.isFeatured && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-orange-400">
                <Flame className="w-2.5 h-2.5" /> Featured
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-brand transition">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {item.rank && <span>{item.rank} Rank</span>} 
            {item.platform && <span> • {item.platform}</span>}
            {item.region && <span> • {item.region}</span>}
          </p>
          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {item.seller?.storeName || 'Velxo Seller'} 
            {item.seller?.verified && <Check className="w-3 h-3 text-blue-400" />}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-xl font-black text-white">{fmt(item.price)}</div>
          <button className="mt-2 bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand px-4 py-1.5 rounded-lg text-xs font-bold text-white transition">
            Buy
          </button>
        </div>
      </div>
    </Link>
  );
}

function ListingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeGame, setActiveGame] = useState(searchParams.get('game') || '');
  const [platform, setPlatform] = useState(searchParams.get('platform') || '');
  const [region, setRegion] = useState(searchParams.get('region') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(1);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
      if (sort === 'price_asc') params.append('sortBy', 'price_low');
      else if (sort === 'price_desc') params.append('sortBy', 'price_high');
      else if (sort === 'rating') params.append('sortBy', 'rating');
      params.append('limit', '50');
      params.append('page', String(page));

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
  }, [search, activeGame, platform, region, category, minPrice, maxPrice, sort, page, apiBase]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  function clearFilters() {
    setSearch('');
    setActiveGame('');
    setPlatform('');
    setRegion('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
  }

  const hasFilters = search || activeGame || platform || region || category || minPrice || maxPrice;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-cardBg rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white">
            {activeGame ? activeGame : 'All Listings'}
          </h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${total} ${activeGame ? activeGame : 'total'} listing${total !== 1 ? 's' : ''} available`}
          </p>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {[
          { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, label: 'Escrow Protected' },
          { icon: <Lock className="w-3.5 h-3.5 text-blue-400" />, label: 'Secure' },
          { icon: <Check className="w-3.5 h-3.5 text-purple-400" />, label: 'Verified Sellers' },
          { icon: <Zap className="w-3.5 h-3.5 text-orange-400" />, label: 'Fast Delivery' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 bg-hoverBg/30 px-3 py-1 rounded-lg border border-borderBg/50">
            {icon} {label}
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
            showFilters || hasFilters
              ? 'bg-brand/10 border-brand/40 text-brand-light'
              : 'bg-cardBg border-borderBg text-gray-300 hover:border-brand/30'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasFilters && <span className="w-2 h-2 rounded-full bg-brand" />}
        </button>
        <div className="flex gap-1 bg-cardBg border border-borderBg rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'grid'
                ? 'bg-brand/20 text-brand'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'list'
                ? 'bg-brand/20 text-brand'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" value={platform} onChange={(e) => { setPlatform(e.target.value); setPage(1); }}>
            <option value="">All Platforms</option>
            {['PC', 'Android', 'iOS', 'PlayStation', 'Xbox', 'Nintendo'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }}>
            <option value="">All Regions</option>
            {['Africa', 'Europe', 'North America', 'Asia', 'Middle East'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input type="number" placeholder="Min Price $" className="bg-background border border-borderBg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} />
          <input type="number" placeholder="Max Price $" className="bg-background border border-borderBg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} />
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition py-1">
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Game filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => { setActiveGame(''); setPage(1); }}
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
            activeGame === '' ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" /> All
        </button>
        {GAMES.map((g) => (
          <button
            key={g.slug}
            onClick={() => { setActiveGame(activeGame === g.name ? '' : g.name); setPage(1); }}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
              activeGame === g.name ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white'
            }`}
          >
            <GameIcon game={g.slug} className="w-4 h-4 rounded" />
            {g.name}
          </button>
        ))}
      </div>

      {/* Listings */}
      {loading && listings.length === 0 ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Gamepad2 className="w-16 h-16 text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg font-semibold">No listings found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search terms</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-brand hover:text-brand-light transition font-semibold text-sm"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((item) => <ListingCardGrid key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => <ListingCardList key={item.id} item={item} />)}
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-borderBg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cardBg transition"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page * 50 >= total}
            className="px-4 py-2 rounded-lg border border-borderBg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cardBg transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-12 bg-cardBg rounded-lg animate-pulse" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-cardBg rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <ListingsPageContent />
    </Suspense>
  );
}
