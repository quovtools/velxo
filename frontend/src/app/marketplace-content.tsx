'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, Gamepad2, Flame, PlusCircle,
  ShieldCheck, X, Zap, Lock, Check, ArrowRight, Award, Clock,
} from 'lucide-react';
import GameSlideshow from '@/components/GameSlideshow';
import GameIcon from '@/components/GameIcon';
import HorizontalScroll from '@/components/HorizontalScroll';
import { storeReferralCode, trackReferralClick } from '@/lib/referral';
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

/* ─────────────────────────── Skeleton card ─────────────────────────── */
function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className={`flex-shrink-0 ${wide ? 'w-64' : 'w-52'} bg-cardBg border border-borderBg rounded-2xl overflow-hidden animate-pulse`}
    >
      <div className="h-36 bg-gray-700/50" />
      <div className="p-3 space-y-2">
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

/* ─────────────────────── Compact horizontal listing card ─────────────── */
function ListingCardH({ item }: { item: Listing }) {
  const [imgErr, setImgErr] = useState(false);
  const { fmt } = useCurrency();
  const img = item.images?.[0];
  const sold = item.isSold || item.status === 'SOLD';

  return (
    <Link
      href={`/listings/${item.id}`}
      className="flex-shrink-0 w-52 bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-0.5 group"
    >
      <div className="h-32 relative overflow-hidden bg-gradient-to-br from-background to-cardBg">
        {img && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img} alt={item.title} loading="lazy" referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-brand/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        {item.isFeatured && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-1.5 py-0.5 rounded-full">
            <Flame className="w-2.5 h-2.5" /> Hot
          </span>
        )}
        {sold && (
          <span className="absolute top-2 left-2 bg-black/60 text-gray-200 text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
            Sold
          </span>
        )}
        {item.platform && (
          <span className="absolute bottom-2 left-2 text-[9px] font-semibold text-white/90 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {item.platform}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <span className="inline-block bg-brand/10 text-brand-light text-[9px] font-bold px-1.5 py-0.5 rounded border border-brand/20 uppercase tracking-wide truncate max-w-full mb-1">
            {item.gameName}
          </span>
          <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition">
            {item.title}
          </h3>
        </div>
        <div className="flex items-center justify-between border-t border-borderBg pt-2">
          <span className="text-base font-black text-white">{fmt(item.price)}</span>
          <span className="bg-gradient-to-r from-brand to-brand-dark px-2.5 py-1 rounded-lg text-[10px] font-bold text-white">
            Buy
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────── Featured Listings Section ──────────────────────── */
function FeaturedListingsSection() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetch(`${apiBase}/listings/featured?limit=12`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [apiBase]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" /> Featured Listings
        </h2>
        <Link href="/?featured=true" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <HorizontalScroll>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((item) => <ListingCardH key={item.id} item={item} />)
        }
      </HorizontalScroll>
    </div>
  );
}

/* ─────────────────── All/Filtered Listings Scroll Section ──────────────── */
interface ListingsScrollSectionProps {
  listings: Listing[];
  loading: boolean;
  title: string;
  total: number;
  icon?: React.ReactNode;
}

function ListingsScrollSection({ listings, loading, title, total, icon }: ListingsScrollSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-base font-bold text-white">{title}</span>
          <span className="text-xs text-gray-500 bg-background px-2 py-0.5 rounded-full border border-borderBg">
            {loading ? '…' : total}
          </span>
        </div>
        <Link href="/listings" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <HorizontalScroll>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : listings.length === 0
            ? (
              <div className="flex-1 text-center py-10 text-gray-500 text-sm">
                No listings found. Be the first to{' '}
                <Link href="/sell" className="text-brand font-bold hover:underline">list one</Link>.
              </div>
            )
            : listings.map((item) => <ListingCardH key={item.id} item={item} />)
        }
      </HorizontalScroll>
    </div>
  );
}

/* ─────────────────── GIG Services Section ──────────────────────────── */
function GigServicesSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { fmt } = useCurrency();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetch(`${apiBase}/gigs`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [apiBase]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" /> GIG Services
        </h2>
        <Link href="/boosting" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <HorizontalScroll>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} wide />)
          : items.slice(0, 16).map((g) => (
              <Link
                key={g.id}
                href="/boosting"
                className="flex-shrink-0 w-60 bg-cardBg border border-borderBg hover:border-purple-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5 group"
              >
                <div className="h-32 bg-gradient-to-br from-purple-600/30 to-background relative overflow-hidden flex items-center justify-center">
                  {g.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Gamepad2 className="w-8 h-8 text-purple-400/50" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-purple-500 text-white px-1.5 py-0.5 rounded">
                    {g.accountType || 'Boost'}
                  </span>
                  {g.region && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {g.region}
                    </span>
                  )}
                  {g.deliveryTime && (
                    <span className="absolute bottom-2 right-2 flex items-center gap-0.5 text-[9px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      <Clock className="w-2.5 h-2.5" /> {g.deliveryTime}h
                    </span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[9px] text-purple-300 font-bold uppercase">{g.gameName}</span>
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition mt-0.5">
                      {g.title}
                    </h3>
                    {(g.rankFrom || g.rankTo) && (
                      <p className="text-[10px] text-purple-400 font-semibold mt-1">
                        {g.rankFrom || '?'} → {g.rankTo || '?'}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {g.seller?.storeName || 'Velxo Seller'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-borderBg pt-2">
                    <span className="text-base font-black text-white">{fmt(g.price)}</span>
                    <span className="bg-gradient-to-r from-purple-600 to-brand px-2.5 py-1 rounded-lg text-[10px] font-bold text-white">
                      Hire
                    </span>
                  </div>
                </div>
              </Link>
            ))
        }
      </HorizontalScroll>
    </div>
  );
}

/* ─────────────────── Top Up Deals Section ───────────────────────────── */
function TopUpDealsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { fmt } = useCurrency();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetch(`${apiBase}/topups`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [apiBase]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand" /> Top Up Deals
        </h2>
        <Link href="/topups" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <HorizontalScroll>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.slice(0, 16).map((t) => (
              <Link
                key={t.id}
                href="/topups"
                className="flex-shrink-0 w-48 bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-0.5 group"
              >
                <div className="h-28 bg-gradient-to-br from-brand/30 to-background relative overflow-hidden flex items-center justify-center">
                  {t.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.imageUrl} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Zap className="w-8 h-8 text-brand/50" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-brand text-white px-1.5 py-0.5 rounded">
                    Official
                  </span>
                  {t.region && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {t.region}
                    </span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[9px] text-brand font-bold uppercase">{t.gameName}</span>
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition mt-0.5">
                      {t.title}
                    </h3>
                    {t.deliveryInfo && (
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> {t.deliveryInfo}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-borderBg pt-2">
                    <span className="text-base font-black text-brand-light">{fmt(t.price)}</span>
                    <span className="bg-gradient-to-r from-brand to-purple-600 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white">
                      Buy
                    </span>
                  </div>
                </div>
              </Link>
            ))
        }
      </HorizontalScroll>
    </div>
  );
}

/* ─────────────────── Main Marketplace Content ───────────────────────── */
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

  // Capture affiliate referral code from the URL (?ref=CODE)
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
      if (sort === 'price_asc') params.append('sortBy', 'price_low');
      else if (sort === 'price_desc') params.append('sortBy', 'price_high');
      else if (sort === 'rating') params.append('sortBy', 'rating');
      params.append('limit', '40');

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
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeGame ? activeGame : 'Browse Marketplace'}
          </h1>
          <p className="text-sm text-gray-500">
            {activeGame
              ? `${GAMES.find((g) => g.name === activeGame)?.slug || activeGame} listings`
              : 'Game accounts, top-ups, gift cards & boosting services'}
          </p>
        </div>
        {activeGame && (
          <button onClick={() => setActiveGame('')} className="text-xs font-bold text-brand hover:text-brand-light transition self-start sm:self-auto">
            Clear game filter
          </button>
        )}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 text-sm text-gray-400">
        {[
          { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, label: 'Escrow Protected' },
          { icon: <Lock className="w-4 h-4 text-blue-400" />, label: 'Secure Transactions' },
          { icon: <Check className="w-4 h-4 text-purple-400" />, label: 'Verified Sellers' },
          { icon: <Zap className="w-4 h-4 text-orange-400" />, label: 'Fast Delivery' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2 bg-hoverBg/30 px-4 py-2 rounded-xl border border-borderBg/50">
            {icon} <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Slideshow */}
      <GameSlideshow />

      {/* Search bar + Filters + Sell */}
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
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">All Platforms</option>
            {['PC','Android','iOS','PlayStation','Xbox','Nintendo'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All Regions</option>
            {['Africa','Europe','North America','Asia','Middle East'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="accounts">Game Accounts</option>
            <option value="topups">Top-Ups & Coins</option>
            <option value="giftcards">Gift Cards</option>
            <option value="boosting">Boosting</option>
          </select>
          <input type="number" placeholder="Min Price $" className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <input type="number" placeholder="Max Price $" className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="col-span-2 sm:col-span-3 lg:col-span-6 flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition py-1">
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Game tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button
          onClick={() => setActiveGame('')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition ${activeGame === '' ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white hover:border-brand/30'}`}
        >
          <Gamepad2 className="w-3.5 h-3.5" /> All Games
        </button>
        {GAMES.map((g) => (
          <button
            key={g.slug}
            onClick={() => setActiveGame(activeGame === g.name ? '' : g.name)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${activeGame === g.name ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white hover:border-brand/30'}`}
          >
            <GameIcon game={g.slug} className="w-5 h-5 rounded-md" />
            {g.name}
          </button>
        ))}
      </div>

      {/* ── Main Listings — horizontal scroll, left & right ── */}
      <ListingsScrollSection
        listings={listings}
        loading={loading}
        total={total || listings.length}
        title={activeGame ? `${activeGame} Listings` : 'All Listings'}
        icon={<Flame className="w-4 h-4 text-orange-400" />}
      />

      {/* ── Featured Listings ── */}
      {!hasFilters && <FeaturedListingsSection />}

      {/* ── Browse by Game grid (shown when no filter active) ── */}
      {!activeGame && !loading && listings.length > 0 && !hasFilters && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Browse by Game</h2>
            <Link href="/games" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
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

      {/* ── GIG Services ── */}
      <GigServicesSection />

      {/* ── Top Up Deals ── */}
      <TopUpDealsSection />

      {/* Bottom CTA to sell */}
      {!hasFilters && (
        <div className="bg-gradient-to-r from-brand/10 via-purple-500/10 to-brand/10 border border-brand/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-white font-bold text-base">Have something to sell?</p>
            <p className="text-gray-400 text-sm mt-0.5">List your game account, coins, or boosting service in minutes.</p>
          </div>
          <Link
            href="/sell"
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-brand/20"
          >
            <PlusCircle className="w-4 h-4" /> Start Selling
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Page export with Suspense ──────────────────────── */
export default function MarketplaceClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <div className="h-64 bg-cardBg border border-borderBg rounded-3xl animate-pulse" />
          <div className="h-12 bg-cardBg border border-borderBg rounded-xl animate-pulse" />
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-52 h-52 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
