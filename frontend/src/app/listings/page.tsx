'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, SlidersHorizontal, Gamepad2, Flame, X, Star,
  ShieldCheck, Grid3X3, List, ChevronDown, Filter,
} from 'lucide-react';
import GameIcon from '@/components/GameIcon';
import ListingCard from '@/components/ListingCard';
import { GAME_LIST } from '@/lib/games';
import { useCurrency } from '@/lib/useCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const GAMES = GAME_LIST.map(g => ({ name: g.name, slug: g.slug, color: g.color }));
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];
const CATEGORIES = [
  { value: '', label: 'All Types' },
  { value: 'ACCOUNT', label: 'Accounts' },
  { value: 'TOPUP', label: 'Top-Ups' },
  { value: 'BOOST', label: 'Boosting' },
];

function SkeletonCard() {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl overflow-hidden">
      <div className="h-44 skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-2.5 skeleton rounded w-1/2" />
        <div className="h-3.5 skeleton rounded w-4/5" />
        <div className="flex justify-between mt-3">
          <div className="h-5 skeleton rounded w-16" />
          <div className="h-8 skeleton rounded-xl w-20" />
        </div>
      </div>
    </div>
  );
}

function ListingsContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { fmt } = useCurrency();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Filter state
  const [query, setQuery] = useState(sp.get('query') || '');
  const [game, setGame] = useState(sp.get('game') || '');
  const [category, setCategory] = useState(sp.get('category') || '');
  const [sort, setSort] = useState(sp.get('sortBy') || 'newest');
  const [minPrice, setMinPrice] = useState(sp.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(sp.get('maxPrice') || '');
  const [region, setRegion] = useState(sp.get('region') || '');
  const [platform, setPlatform] = useState(sp.get('platform') || '');

  const LIMIT = 24;

  const fetch_ = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (game) params.set('gameName', game);
    if (category) params.set('category', category);
    if (sort) params.set('sortBy', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (region) params.set('region', region);
    if (platform) params.set('platform', platform);
    params.set('page', String(p));
    params.set('limit', String(LIMIT));

    try {
      const res = await fetch(`${API}/listings?${params}`);
      const data = res.ok ? await res.json() : {};
      setListings(data.data?.listings || data.listings || []);
      setTotal(data.data?.total || data.total || 0);
      setPage(p);
    } catch { setListings([]); }
    finally { setLoading(false); }
  }, [query, game, category, sort, minPrice, maxPrice, region, platform]);

  useEffect(() => { fetch_(1); }, [fetch_]);

  const clearFilters = () => {
    setGame(''); setCategory(''); setMinPrice(''); setMaxPrice('');
    setRegion(''); setPlatform(''); setSort('newest');
  };

  const activeFilters = [game, category, minPrice, maxPrice, region, platform].filter(Boolean).length;

  return (
    <div className="space-y-5 fade-in pb-24 sm:pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${total.toLocaleString()} listings`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
            className="btn-ghost p-2.5 rounded-xl border border-[var(--border-bg)]">
            {view === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
              showFilters || activeFilters > 0 ? 'bg-brand/10 border-brand/30 text-brand' : 'border-[var(--border-bg)] text-gray-400 hover:text-white'
            }`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-brand text-black text-[10px] font-black flex items-center justify-center">{activeFilters}</span>}
          </button>
          <Link href="/sell" className="btn-primary rounded-xl hidden sm:flex">
            Sell Now
          </Link>
        </div>
      </div>

      {/* ── Search bar ── */}
      <form onSubmit={e => { e.preventDefault(); fetch_(1); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search game accounts, titles, sellers..."
            className="input pl-10" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="select min-w-[150px] hidden sm:block">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button type="submit" className="btn-primary rounded-xl">Search</button>
      </form>

      {/* ── Game tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
        <button onClick={() => setGame('')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
            !game ? 'bg-brand/10 border-brand/25 text-brand' : 'border-[var(--border-bg)] text-gray-400 hover:text-white hover:border-[var(--border-strong)]'
          }`}>
          All Games
        </button>
        {GAMES.map(g => (
          <button key={g.slug} onClick={() => setGame(g.name)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              game === g.name ? 'bg-brand/10 border-brand/25 text-brand' : 'border-[var(--border-bg)] text-gray-400 hover:text-white'
            }`}>
            <GameIcon game={g.slug} className="w-4 h-4" />
            {g.name}
          </button>
        ))}
      </div>

      {/* ── Category chips ── */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              category === c.value ? 'bg-brand text-black border-brand' : 'border-[var(--border-bg)] text-gray-400 hover:border-[var(--border-strong)] hover:text-white'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-2xl p-5 space-y-4 fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Filter Listings</h3>
            <button onClick={clearFilters} className="text-xs text-brand hover:text-brand-light transition flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Min Price ($)</label>
              <input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" placeholder="0" className="input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Max Price ($)</label>
              <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" placeholder="Any" className="input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className="select">
                <option value="">Any Region</option>
                {['Global', 'Africa', 'Nigeria', 'Ghana', 'Kenya', 'Europe', 'Asia'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="select">
                <option value="">Any Platform</option>
                {['Mobile', 'PC', 'iOS', 'Android'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 sm:hidden">
            <select value={sort} onChange={e => setSort(e.target.value)} className="select flex-1">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={() => fetch_(1)} className="btn-primary rounded-xl">Apply Filters</button>
        </div>
      )}

      {/* ── Active filter tags ── */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Active:</span>
          {game && <FilterTag label={`Game: ${game}`} onRemove={() => setGame('')} />}
          {category && <FilterTag label={`Type: ${category}`} onRemove={() => setCategory('')} />}
          {minPrice && <FilterTag label={`Min: $${minPrice}`} onRemove={() => setMinPrice('')} />}
          {maxPrice && <FilterTag label={`Max: $${maxPrice}`} onRemove={() => setMaxPrice('')} />}
          {region && <FilterTag label={`Region: ${region}`} onRemove={() => setRegion('')} />}
          {platform && <FilterTag label={`Platform: ${platform}`} onRemove={() => setPlatform('')} />}
        </div>
      )}

      {/* ── Results ── */}
      {loading ? (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[var(--border-bg)] rounded-2xl text-center">
          <Gamepad2 className="w-12 h-12 text-gray-700 mb-4" />
          <h3 className="text-base font-bold text-gray-400 mb-2">No listings found</h3>
          <p className="text-sm text-gray-600 mb-5 max-w-xs">Try adjusting your filters or search query.</p>
          <button onClick={clearFilters} className="btn-primary rounded-xl">Clear Filters</button>
        </div>
      ) : (
        <>
          <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {listings.map(item => <ListingCard key={item.id} item={item} />)}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button disabled={page <= 1} onClick={() => fetch_(page - 1)}
                className="btn-secondary rounded-xl px-4 disabled:opacity-40">← Prev</button>
              <span className="text-sm text-gray-400">Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => fetch_(page + 1)}
                className="btn-secondary rounded-xl px-4 disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/20 text-brand text-xs font-semibold px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-400 transition"><X className="w-3 h-3" /></button>
    </span>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>}>
      <ListingsContent />
    </Suspense>
  );
}
