'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, X, Star, ShieldCheck,
  Grid3X3, List, ChevronDown, Gamepad2, Flame,
  ChevronLeft, ChevronRight, Tag, MapPin, Monitor, ArrowUpDown,
} from 'lucide-react';
import GameIcon from '@/components/GameIcon';
import ListingCard from '@/components/ListingCard';
import { GAME_LIST } from '@/lib/games';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const GAMES = GAME_LIST.map(g => ({ name: g.name, slug: g.slug }));

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'rating',     label: 'Top Rated' },
];

const CATEGORIES = [
  { value: '',        label: 'All',       icon: null },
  { value: 'ACCOUNT', label: 'Accounts',  icon: ShieldCheck },
  { value: 'TOPUP',   label: 'Top-Ups',   icon: Star },
  { value: 'BOOST',   label: 'Boosting',  icon: Flame },
];

const REGIONS    = ['Global', 'Africa', 'Nigeria', 'Ghana', 'Kenya', 'Europe', 'Asia', 'Americas'];
const PLATFORMS  = ['Android', 'iOS', 'PC', 'PlayStation', 'Xbox', 'Nintendo Switch'];
const LIMIT      = 24;

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl overflow-hidden">
      <div className="h-44 skeleton" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-2.5 skeleton rounded-full w-1/3" />
        <div className="h-3.5 skeleton rounded w-5/6" />
        <div className="h-3 skeleton rounded w-2/3" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 skeleton rounded w-16" />
          <div className="h-8 skeleton rounded-xl w-20" />
        </div>
      </div>
    </div>
  );
}

// ── Filter tag pill ───────────────────────────────────────────────────────────
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/20
      text-brand text-xs font-semibold px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove} aria-label={`Remove filter: ${label}`}
        className="hover:text-red-400 transition touch-manipulation">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
function ListingsContent() {
  const sp = useSearchParams();

  // Filter state — seeded from URL
  const [query,    setQuery]    = useState(sp.get('query')    || '');
  const [game,     setGame]     = useState(sp.get('game')     || '');
  const [category, setCategory] = useState(sp.get('category') || '');
  const [sort,     setSort]     = useState(sp.get('sortBy')   || 'newest');
  const [minPrice, setMinPrice] = useState(sp.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(sp.get('maxPrice') || '');
  const [region,   setRegion]   = useState(sp.get('region')   || '');
  const [platform, setPlatform] = useState(sp.get('platform') || '');

  // UI state
  const [listings,      setListings]     = useState<any[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [total,         setTotal]        = useState(0);
  const [page,          setPage]         = useState(1);
  const [view,          setView]         = useState<'grid' | 'list'>('grid');
  const [filterOpen,    setFilterOpen]   = useState(false);   // mobile bottom-sheet
  const [sortOpen,      setSortOpen]     = useState(false);
  const inputRef        = useRef<HTMLInputElement>(null);
  const sortRef         = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  // Lock body scroll when filter sheet is open (mobile)
  useEffect(() => {
    document.body.style.overflow = filterOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filterOpen]);

  const fetch_ = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query)    params.set('query',    query);
    if (game)     params.set('gameName', game);
    if (category) params.set('category', category);
    if (sort)     params.set('sortBy',   sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (region)   params.set('region',   region);
    if (platform) params.set('platform', platform);
    params.set('page',  String(p));
    params.set('limit', String(LIMIT));
    try {
      const res  = await fetch(`${API}/listings?${params}`);
      const data = res.ok ? await res.json() : {};
      setListings(data.data?.listings || data.listings || []);
      setTotal(data.data?.total       || data.total    || 0);
      setPage(p);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [query, game, category, sort, minPrice, maxPrice, region, platform]);

  // Initial load + re-fetch on filter change
  useEffect(() => { fetch_(1); }, [fetch_]);

  const clearFilters = () => {
    setGame(''); setCategory(''); setMinPrice(''); setMaxPrice('');
    setRegion(''); setPlatform(''); setSort('newest');
  };

  const applyAndClose = () => { fetch_(1); setFilterOpen(false); };

  const activeFilterCount = [game, category, minPrice, maxPrice, region, platform].filter(Boolean).length;
  const totalPages = Math.ceil(total / LIMIT);
  const sortLabel  = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Sort';

  return (
    <div className="space-y-0 fade-in pb-28 sm:pb-8">

      {/* ══ Sticky search + control bar ════════════════════════ */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-md
        border-b border-[var(--border-bg)] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8
        pt-3 pb-3 space-y-2.5">

        {/* Row 1: page title + view toggle (desktop) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg sm:text-2xl font-black text-white leading-none truncate">Marketplace</h1>
            {!loading && (
              <span className="hidden sm:inline text-sm text-gray-500 tabular-nums">
                {total.toLocaleString()} listings
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Sort dropdown — desktop only */}
            <div className="hidden sm:block relative" ref={sortRef}>
              <button onClick={() => setSortOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400
                  border border-[var(--border-bg)] hover:border-brand/30 hover:text-white
                  rounded-xl px-3 py-2 transition">
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortLabel}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-[var(--card-bg)]
                  border border-[var(--border-bg)] rounded-2xl overflow-hidden shadow-xl shadow-black/40 z-30">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { setSort(o.value); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition
                        ${sort === o.value
                          ? 'bg-brand/10 text-brand'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle — desktop */}
            <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl
                border border-[var(--border-bg)] text-gray-500 hover:text-white
                hover:border-brand/30 transition"
              aria-label="Toggle view">
              {view === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </button>

            {/* Filter button */}
            <button onClick={() => setFilterOpen(true)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm
                font-bold border transition touch-manipulation
                ${activeFilterCount > 0
                  ? 'bg-brand/10 border-brand/30 text-brand'
                  : 'border-[var(--border-bg)] text-gray-400 hover:text-white hover:border-[var(--border-strong)]'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand text-black text-[10px]
                  font-black flex items-center justify-center flex-shrink-0">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sell button */}
            <Link href="/sell" className="btn-primary rounded-xl !py-2 !px-3 sm:!px-5 !text-xs sm:!text-sm touch-manipulation">
              + Sell
            </Link>
          </div>
        </div>

        {/* Row 2: search input */}
        <form onSubmit={e => { e.preventDefault(); fetch_(1); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search accounts, games, sellers…"
              aria-label="Search listings"
              className="input pl-10 !py-2.5 text-sm"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition touch-manipulation">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary rounded-xl !py-2 !px-4 sm:!px-5 touch-manipulation">
            Search
          </button>
        </form>

        {/* Row 3: horizontal game tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1" role="tablist">
          <button role="tab" aria-selected={!game} onClick={() => setGame('')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition touch-manipulation
              ${!game
                ? 'bg-brand/10 border-brand/25 text-brand'
                : 'border-[var(--border-bg)] text-gray-400 hover:text-white hover:border-[var(--border-strong)]'}`}>
            All
          </button>
          {GAMES.map(g => (
            <button key={g.slug} role="tab" aria-selected={game === g.name}
              onClick={() => setGame(prev => prev === g.name ? '' : g.name)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition touch-manipulation
                ${game === g.name
                  ? 'bg-brand/10 border-brand/25 text-brand'
                  : 'border-[var(--border-bg)] text-gray-400 hover:text-white hover:border-[var(--border-strong)]'}`}>
              <GameIcon game={g.slug} className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{g.name}</span>
            </button>
          ))}
        </div>

        {/* Row 4: category chips + mobile sort */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            return (
              <button key={c.value} onClick={() => setCategory(v => v === c.value ? '' : c.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition touch-manipulation
                  ${category === c.value
                    ? 'bg-brand text-black border-brand'
                    : 'border-[var(--border-bg)] text-gray-400 hover:border-[var(--border-strong)] hover:text-white'}`}>
                {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
                {c.label}
              </button>
            );
          })}

          {/* Mobile sort pill */}
          <button onClick={() => setFilterOpen(true)}
            className="sm:hidden flex-shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-xl
              text-xs font-bold border border-[var(--border-bg)] text-gray-400 hover:text-white transition ml-auto touch-manipulation">
            <ArrowUpDown className="w-3 h-3" />
            {sortLabel}
          </button>
        </div>
      </div>

      {/* ══ Active filter tags ══════════════════════════════════ */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center pt-3 px-0">
          <span className="text-xs text-gray-500">Active:</span>
          {game     && <FilterTag label={`Game: ${game}`}         onRemove={() => setGame('')} />}
          {category && <FilterTag label={`Type: ${category}`}     onRemove={() => setCategory('')} />}
          {minPrice && <FilterTag label={`Min: $${minPrice}`}     onRemove={() => setMinPrice('')} />}
          {maxPrice && <FilterTag label={`Max: $${maxPrice}`}     onRemove={() => setMaxPrice('')} />}
          {region   && <FilterTag label={`Region: ${region}`}     onRemove={() => setRegion('')} />}
          {platform && <FilterTag label={`Platform: ${platform}`} onRemove={() => setPlatform('')} />}
          <button onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-red-400 transition underline underline-offset-2 touch-manipulation">
            Clear all
          </button>
        </div>
      )}

      {/* ══ Results grid ════════════════════════════════════════ */}
      <div className="pt-4">
        {loading ? (
          <div className={`grid gap-3 sm:gap-4 ${
            view === 'grid'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2'
          }`}>
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-20 sm:py-28
            border border-dashed border-[var(--border-bg)] rounded-3xl text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border-bg)]
              flex items-center justify-center mb-5">
              <Gamepad2 className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">No listings found</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
              {activeFilterCount > 0
                ? 'No listings match your current filters. Try broadening your search or clearing some filters.'
                : 'No listings available right now. Check back soon or be the first to list!'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn-primary rounded-xl touch-manipulation">
                  Clear Filters
                </button>
              )}
              <Link href="/sell" className="btn-secondary rounded-xl touch-manipulation">
                Sell an Account
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Result count (mobile) */}
            <p className="sm:hidden text-xs text-gray-500 mb-3 tabular-nums">
              {total.toLocaleString()} listing{total !== 1 ? 's' : ''} found
            </p>

            <div className={`grid gap-3 sm:gap-4 ${
              view === 'grid'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {listings.map(item => <ListingCard key={item.id} item={item} />)}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => { fetch_(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex items-center gap-1.5 btn-secondary rounded-xl !px-4 !py-2.5 disabled:opacity-40 touch-manipulation">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-gray-400 tabular-nums px-2">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => { fetch_(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex items-center gap-1.5 btn-secondary rounded-xl !px-4 !py-2.5 disabled:opacity-40 touch-manipulation">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ Filter bottom-sheet (mobile) / side panel (desktop) ═ */}
      {filterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:right-4 sm:top-16 sm:w-80
            bg-[var(--card-bg)] border-t sm:border border-[var(--border-bg)]
            rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/50
            flex flex-col max-h-[88vh] sm:max-h-[calc(100vh-80px)]
            animate-[slideInUp_0.22s_ease-out]">

            {/* Sheet handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-bg)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand" />
                <h2 className="font-bold text-white text-sm">Filter Listings</h2>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-black bg-brand text-black
                    w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters}
                    className="text-xs text-brand hover:text-brand-light transition touch-manipulation">
                    Clear all
                  </button>
                )}
                <button onClick={() => setFilterOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg
                    text-gray-500 hover:text-white hover:bg-white/8 transition touch-manipulation">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sheet body — scrollable */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5 overscroll-contain">

              {/* Sort (mobile only) */}
              <div className="sm:hidden">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  <ArrowUpDown className="w-3 h-3 inline-block mr-1" />Sort by
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSort(o.value)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition touch-manipulation text-left
                        ${sort === o.value
                          ? 'bg-brand/10 border-brand/30 text-brand'
                          : 'border-[var(--border-bg)] text-gray-400 hover:border-[var(--border-strong)] hover:text-white'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  <Tag className="w-3 h-3" />Price range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold pointer-events-none">$</span>
                    <input
                      type="number" value={minPrice} min={0} placeholder="Min"
                      onChange={e => setMinPrice(e.target.value)}
                      className="input !pl-7 !py-2.5 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold pointer-events-none">$</span>
                    <input
                      type="number" value={maxPrice} min={0} placeholder="Max"
                      onChange={e => setMaxPrice(e.target.value)}
                      className="input !pl-7 !py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  <MapPin className="w-3 h-3" />Region
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => setRegion(v => v === r ? '' : r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition touch-manipulation
                        ${region === r
                          ? 'bg-brand/10 border-brand/30 text-brand'
                          : 'border-[var(--border-bg)] text-gray-400 hover:border-[var(--border-strong)] hover:text-white'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  <Monitor className="w-3 h-3" />Platform
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setPlatform(v => v === p ? '' : p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition touch-manipulation
                        ${platform === p
                          ? 'bg-brand/10 border-brand/30 text-brand'
                          : 'border-[var(--border-bg)] text-gray-400 hover:border-[var(--border-strong)] hover:text-white'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sheet footer — Apply CTA */}
            <div className="px-5 py-4 border-t border-[var(--border-bg)] flex-shrink-0 bg-[var(--card-bg)]
              safe-area-pb rounded-b-3xl sm:rounded-b-2xl"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
              <button onClick={applyAndClose}
                className="btn-primary w-full !py-3.5 shadow-lg shadow-brand/20 touch-manipulation">
                Apply Filters
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5 pt-4">
        <div className="h-10 skeleton rounded-2xl w-1/3" />
        <div className="h-12 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl overflow-hidden">
              <div className="h-44 skeleton" />
              <div className="p-3.5 space-y-2">
                <div className="h-3 skeleton rounded w-1/2" />
                <div className="h-4 skeleton rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
