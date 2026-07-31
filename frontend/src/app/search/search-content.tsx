'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LoadingArea } from '@/components/LoadingLogo';
import { useCurrency } from '@/lib/useCurrency';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import SellerLevelBadge from '@/components/SellerLevelBadge';
import TrustBadge from '@/components/TrustBadge';
import {
  Filter, SlidersHorizontal, X, ChevronDown, Bookmark, BookmarkCheck,
  Search, AlertCircle,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const GAMES = ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'Mobile Legends', 'Blood Strike', 'Valorant', 'Roblox', 'eFootball'];
const RANKED_GAMES = ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'Mobile Legends', 'Valorant'];
const RANK_OPTIONS: Record<string, string[]> = {
  'Free Fire':      ['Bronze','Silver','Gold','Platinum','Diamond','Heroic','Grandmaster'],
  'PUBG Mobile':    ['Bronze','Silver','Gold','Platinum','Diamond','Crown','Ace','Conqueror'],
  'COD Mobile':     ['Rookie','Veteran','Elite','Pro','Master','Legend','Grandmaster'],
  'Mobile Legends': ['Warrior','Elite','Master','Grandmaster','Epic','Legend','Mythic','Mythical Glory'],
  'Valorant':       ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'],
};

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank?: string;
  seller: { storeName: string; isVerified?: boolean; sellerLevel?: string; badges?: any[] };
}

interface SavedSearch { id: string; name: string; params: Record<string, string> }

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SearchContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const pathname      = usePathname();
  const { fmt }       = useCurrency();
  const { user }      = useAuth();

  // --- Filter state — initialised from URL so filters survive refresh/share ---
  const [search,      setSearch]      = useState(searchParams.get('query') || searchParams.get('search') || '');
  const [gameName,    setGameName]    = useState(searchParams.get('gameName') || '');
  const [platform,    setPlatform]    = useState(searchParams.get('platform') || '');
  const [region,      setRegion]      = useState(searchParams.get('region') || '');
  const [minPrice,    setMinPrice]    = useState(searchParams.get('minPrice') || '');
  const [maxPrice,    setMaxPrice]    = useState(searchParams.get('maxPrice') || '');
  const [rank,        setRank]        = useState(searchParams.get('rank') || '');
  const [sortBy,      setSortBy]      = useState(searchParams.get('sortBy') || 'newest');
  const [isVerified,  setIsVerified]  = useState(searchParams.get('isVerified') === 'true');
  const [sellerLevel, setSellerLevel] = useState(searchParams.get('sellerLevel') || '');
  const [page,        setPage]        = useState(1);

  // --- Results ---
  const [listings,  setListings]  = useState<Listing[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // --- Saved searches ---
  const [savedSearches,   setSavedSearches]   = useState<SavedSearch[]>([]);
  const [saveModalOpen,   setSaveModalOpen]   = useState(false);
  const [saveName,        setSaveName]        = useState('');
  const [savingSearch,    setSavingSearch]    = useState(false);
  const [savedToast,      setSavedToast]      = useState('');

  const debouncedSearch = useDebounce(search, 400);
  const showRanks = RANKED_GAMES.includes(gameName);
  const rankOptions = RANK_OPTIONS[gameName] || [];

  // --- Sync filters → URL ---
  const syncUrl = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const vals: Record<string, string> = {
      search: debouncedSearch, gameName, platform, region,
      minPrice, maxPrice, rank, sortBy,
      isVerified: isVerified ? 'true' : '',
      sellerLevel,
      ...overrides,
    };
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, gameName, platform, region, minPrice, maxPrice, rank, sortBy, isVerified, sellerLevel, router, pathname]);

  // --- Fetch listings ---
  const fetchResults = useCallback(async (resetPage = true) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (gameName)    params.set('gameName', gameName);
      if (platform)    params.set('platform', platform);
      if (region)      params.set('region', region);
      if (minPrice)    params.set('minPrice', minPrice);
      if (maxPrice)    params.set('maxPrice', maxPrice);
      if (rank)        params.set('rank', rank);
      if (sortBy)      params.set('sortBy', sortBy);
      if (isVerified)  params.set('isVerified', 'true');
      if (sellerLevel) params.set('sellerLevel', sellerLevel);
      params.set('page', String(currentPage));
      params.set('limit', '20');

      const response = await fetch(`${API_BASE}/listings?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        if (resetPage) {
          setListings(data.listings || data || []);
        } else {
          setListings(prev => [...prev, ...(data.listings || data || [])]);
        }
        setTotal(data.total || (data.listings || data || []).length);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [debouncedSearch, gameName, platform, region, minPrice, maxPrice, rank, sortBy, isVerified, sellerLevel, page]);

  useEffect(() => { fetchResults(true); syncUrl(); }, [debouncedSearch, gameName, platform, region, rank, sortBy, isVerified, sellerLevel]);

  // --- Saved searches ---
  useEffect(() => {
    if (!user) return;
    api.get<{ data: SavedSearch[] }>('/search/saved').then(r => setSavedSearches(r.data || [])).catch(() => {});
  }, [user]);

  const applySearch = (params: Record<string, string>) => {
    if (params.search !== undefined)      setSearch(params.search);
    if (params.gameName !== undefined)    setGameName(params.gameName);
    if (params.platform !== undefined)    setPlatform(params.platform);
    if (params.region !== undefined)      setRegion(params.region);
    if (params.minPrice !== undefined)    setMinPrice(params.minPrice);
    if (params.maxPrice !== undefined)    setMaxPrice(params.maxPrice);
    if (params.rank !== undefined)        setRank(params.rank);
    if (params.sortBy !== undefined)      setSortBy(params.sortBy);
    if (params.isVerified !== undefined)  setIsVerified(params.isVerified === 'true');
    if (params.sellerLevel !== undefined) setSellerLevel(params.sellerLevel);
  };

  const clearAll = () => {
    setSearch(''); setGameName(''); setPlatform(''); setRegion('');
    setMinPrice(''); setMaxPrice(''); setRank(''); setSortBy('newest');
    setIsVerified(false); setSellerLevel('');
  };

  const activeFilterCount = [gameName, platform, region, rank, sellerLevel, isVerified ? '1' : '', minPrice || maxPrice ? '1' : ''].filter(Boolean).length;

  const handleSaveSearch = async () => {
    if (!saveName.trim()) return;
    setSavingSearch(true);
    try {
      const params = { search: debouncedSearch, gameName, platform, region, minPrice, maxPrice, rank, sortBy, isVerified: isVerified ? 'true' : '', sellerLevel };
      const res = await api.post<{ data: SavedSearch }>('/search/save', { name: saveName, params });
      setSavedSearches(prev => [...prev, res.data]);
      setSaveModalOpen(false); setSaveName('');
      setSavedToast('Search saved!');
      setTimeout(() => setSavedToast(''), 2500);
    } catch { /* silent */ } finally { setSavingSearch(false); }
  };

  const deleteSearch = async (id: string) => {
    await api.delete(`/search/saved/${id}`).catch(() => {});
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      {/* Sort */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort By</label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
          <option value="top_rated">Top Rated</option>
        </select>
      </div>

      {/* Keyword */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Keyword</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="e.g. heroic, bundle, coins"
            className="w-full bg-background border border-borderBg rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand" />
        </div>
      </div>

      {/* Game */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Game</label>
        <select value={gameName} onChange={e => { setGameName(e.target.value); setRank(''); }}
          className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All Games</option>
          {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Rank — only for ranked games */}
      {showRanks && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Min Rank</label>
          <select value={rank} onChange={e => setRank(e.target.value)}
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
            <option value="">Any Rank</option>
            {rankOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* Platform */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform</label>
        <select value={platform} onChange={e => setPlatform(e.target.value)}
          className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All Platforms</option>
          {['Android','iOS','PC','PlayStation','Xbox'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Region */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Region</label>
        <select value={region} onChange={e => setRegion(e.target.value)}
          className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All Regions</option>
          {['Africa','Europe','North America','Asia','Middle East'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price Range (USD)</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
            className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" />
          <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" />
        </div>
        <button onClick={() => fetchResults(true)}
          className="w-full bg-brand/10 hover:bg-brand/20 text-brand-light font-bold py-2 rounded-xl text-xs border border-brand/20 transition">
          Apply Price Filter
        </button>
      </div>

      {/* Seller Quality */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seller Quality</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)}
              className="w-4 h-4 rounded border-borderBg text-brand focus:ring-brand" />
            <span className="text-sm text-gray-300">Verified sellers only</span>
          </label>
          <select value={sellerLevel} onChange={e => setSellerLevel(e.target.value)}
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
            <option value="">Any seller level</option>
            <option value="BRONZE">Bronze+</option>
            <option value="SILVER">Silver+</option>
            <option value="GOLD">Gold+</option>
            <option value="ELITE">Elite only</option>
          </select>
        </div>
      </div>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <button onClick={clearAll}
          className="w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-900/20 py-2 rounded-xl text-xs font-bold transition">
          <X className="w-3.5 h-3.5" /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 fade-in">
      {/* Toast */}
      {savedToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-900/90 text-emerald-200 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">
          ✓ {savedToast}
        </div>
      )}

      {/* Top bar: result count + save search + saved searches dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Searching...' : <><span className="text-white font-bold">{total}</span> listings found</>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Saved searches dropdown */}
          {user && savedSearches.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-cardBg border border-borderBg rounded-xl text-sm font-semibold text-gray-300 hover:border-brand/40 transition">
                <BookmarkCheck className="w-4 h-4 text-brand" />
                Saved Searches
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-56 bg-cardBg border border-borderBg rounded-xl shadow-2xl z-30 hidden group-hover:block">
                {savedSearches.map(s => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-hoverBg/40 transition group/item">
                    <button onClick={() => applySearch(s.params as Record<string, string>)}
                      className="flex-1 text-sm text-left text-gray-200 truncate">
                      {s.name}
                    </button>
                    <button onClick={() => deleteSearch(s.id)}
                      className="opacity-0 group-hover/item:opacity-100 text-gray-600 hover:text-red-400 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Save current search */}
          {user && (
            <button onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-cardBg border border-borderBg rounded-xl text-sm font-semibold text-gray-300 hover:border-brand/40 transition">
              <Bookmark className="w-4 h-4" /> Save Search
            </button>
          )}
          {/* Mobile filter toggle */}
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-brand/10 border border-brand/30 rounded-xl text-sm font-semibold text-brand-light">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && <span className="bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block bg-cardBg border border-borderBg rounded-2xl p-5 h-fit space-y-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-brand" /> Filters</h2>
            {activeFilterCount > 0 && (
              <span className="bg-brand/10 text-brand text-xs font-bold px-2 py-0.5 rounded-full border border-brand/20">{activeFilterCount} active</span>
            )}
          </div>
          <FilterPanel />
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {loading && listings.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-52 skeleton rounded-2xl" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl space-y-3">
              <AlertCircle className="w-12 h-12 text-gray-700 mx-auto" />
              <p className="text-gray-400 font-semibold">No listings match your filters</p>
              <p className="text-xs text-gray-600">Try removing some filters or browsing by game.</p>
              <button onClick={clearAll} className="text-brand text-sm hover:underline">Clear all filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map(item => (
                  <div key={item.id}
                    className="group bg-cardBg border border-borderBg hover:border-brand/40 hover:-translate-y-0.5 transition rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-xl hover:shadow-brand/10">
                    <div className="flex items-start justify-between gap-2">
                      <span className="bg-brand/10 text-brand-light text-xs font-semibold px-2 py-0.5 rounded border border-brand/20 shrink-0">{item.gameName}</span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {item.rank && <span className="text-[10px] bg-violet-900/30 text-violet-300 border border-violet-500/20 px-1.5 py-0.5 rounded font-semibold">{item.rank}</span>}
                        {item.seller?.isVerified && <TrustBadge type="KYC_VERIFIED" size="xs" showLabel={false} />}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-2 group-hover:text-brand-light transition">
                      <Link href={`/listings/${item.id}`}>{item.title}</Link>
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-500 truncate">by {item.seller?.storeName}</p>
                      {item.seller?.sellerLevel && item.seller.sellerLevel !== 'BRONZE' && (
                        <SellerLevelBadge level={item.seller.sellerLevel} size="xs" showLabel={false} />
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-borderBg pt-3 mt-auto">
                      <span className="text-xl font-black text-white">{fmt(item.price)}</span>
                      <Link href={`/listings/${item.id}`}
                        className="bg-gradient-to-r from-brand to-brand-dark hover:shadow-md hover:shadow-brand/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition text-white">
                        View Offer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {/* Load more */}
              {listings.length < total && (
                <div className="text-center pt-2">
                  <button onClick={() => { setPage(p => p + 1); fetchResults(false); }}
                    disabled={loading}
                    className="px-8 py-3 bg-cardBg border border-borderBg hover:border-brand/40 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {loading ? 'Loading...' : `Load More (${total - listings.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-cardBg border-t border-borderBg rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Filters {activeFilterCount > 0 && <span className="text-brand text-sm">({activeFilterCount})</span>}</h3>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-hoverBg rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setMobileOpen(false)}
              className="w-full bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition">
              Show {total} Results
            </button>
          </div>
        </div>
      )}

      {/* Save search modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSaveModalOpen(false)} />
          <div className="relative bg-cardBg border border-borderBg rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg">Save Current Search</h3>
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
              placeholder="e.g. Free Fire Heroic accounts"
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSaveSearch(); }} />
            <div className="flex gap-3">
              <button onClick={() => setSaveModalOpen(false)}
                className="flex-1 border border-borderBg py-2.5 rounded-xl text-sm font-semibold hover:bg-hoverBg transition">Cancel</button>
              <button onClick={handleSaveSearch} disabled={savingSearch || !saveName.trim()}
                className="flex-1 bg-brand hover:bg-brand-dark py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
                {savingSearch ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingArea label="Loading search…" />}>
      <SearchContent />
    </Suspense>
  );
}
