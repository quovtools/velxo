'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ShieldCheck, Zap, TrendingUp, Star, ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { slugToGameName, getGameConfig } from '@/lib/games';
import { getGameSEOContent } from '@/lib/seo-content';
import { useCurrency } from '@/lib/useCurrency';
import ListingCard from '@/components/ListingCard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'rating', label: 'Top Rated' },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border-bg)] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white hover:bg-[var(--hover-bg)] transition">
        <span>{question}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-[var(--border-bg)] pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}

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

export default function GameCatalogContent({ slug }: { slug: string }) {
  const gameName = slugToGameName(slug);
  const cfg = getGameConfig(gameName);
  const seo = getGameSEOContent(slug);

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [type, setType] = useState('');
  const [total, setTotal] = useState(0);
  const [bannerUrl, setBannerUrl] = useState('');

  useEffect(() => {
    // Fetch game banner
    fetch(`${API}/game-banners`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const b = (d.data || []).find((x: any) => x.gameName === gameName);
        if (b?.bannerUrl) setBannerUrl(b.bannerUrl);
      }).catch(() => {});
  }, [gameName]);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ gameName, limit: '20', sortBy: sort });
    if (query) p.set('query', query);
    if (type) p.set('category', type);

    fetch(`${API}/listings?${p}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        setListings(d.data?.listings || d.data || []);
        setTotal(d.total || 0);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [gameName, sort, query, type]);

  const color = cfg?.color || '#D4A017';
  const currency = cfg?.currency?.plural || 'in-game currency';
  const topRank = cfg?.ranks?.[cfg.ranks.length - 1] || '';

  const SERVICE_TYPES = [
    { value: '', label: 'All' },
    { value: 'ACCOUNT', label: 'Accounts' },
    { value: 'TOPUP', label: `${currency} Top-Up` },
    { value: 'BOOST', label: 'Boosting' },
  ];

  return (
    <div className="space-y-8 fade-in pb-24 sm:pb-6">

      {/* ── Hero banner ── */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden"
        style={{ minHeight: 220, background: `linear-gradient(135deg,${color}18,#000)` }}>
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt={gameName} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right,rgba(0,0,0,0.85) 40%,rgba(0,0,0,0.3) 100%)' }} />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/games" className="text-xs text-gray-500 hover:text-brand transition">Games</Link>
            <span className="text-gray-700">/</span>
            <span className="text-xs text-gray-300">{gameName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            {gameName} <span className="text-gradient">Marketplace</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
            Buy and sell verified {gameName} accounts, {currency} top-ups and boosting services.
            {topRank && ` Find ${topRank} and starter accounts.`} All trades escrow-protected.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { icon: ShieldCheck, text: 'Escrow Protected' },
              { icon: Zap, text: 'Instant Delivery' },
              { icon: Star, text: 'Verified Sellers' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5 bg-white/8 border border-white/12 px-3 py-1.5 rounded-full text-xs font-medium text-gray-300">
                <Icon className="w-3.5 h-3.5 text-brand" /> {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Service type tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SERVICE_TYPES.map(st => (
          <button key={st.value} onClick={() => setType(st.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              type === st.value
                ? 'bg-brand/10 border-brand/25 text-brand'
                : 'border-[var(--border-bg)] text-gray-400 hover:text-white hover:border-[var(--border-strong)]'
            }`}>
            {st.label}
          </button>
        ))}
      </div>

      {/* ── Search + sort ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${gameName} listings...`}
            className="input pl-10" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="select min-w-[130px]">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Results ── */}
      <div>
        <p className="text-sm text-gray-500 mb-4">
          {loading ? 'Loading...' : `${total || listings.length} listings`}
        </p>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border-bg)] rounded-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-brand/50" />
            </div>
            <p className="text-gray-400 font-semibold mb-2">No listings yet</p>
            <p className="text-sm text-gray-600 mb-5 max-w-xs">Be the first to sell {gameName} accounts on Piyrox.</p>
            <Link href="/sell" className="btn-primary rounded-xl">Start Selling</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(item => <ListingCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      {/* ── Game info panel ── */}
      {cfg && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm">About {gameName}</h3>
            <div className="space-y-2 text-sm">
              {cfg.genre && <div className="flex justify-between"><span className="text-gray-500">Genre</span><span className="text-white font-semibold">{cfg.genre}</span></div>}
              {cfg.currency?.plural && <div className="flex justify-between"><span className="text-gray-500">Currency</span><span className="text-white font-semibold">{cfg.currency.plural}</span></div>}
              {cfg.platforms?.length > 0 && <div className="flex justify-between"><span className="text-gray-500">Platforms</span><span className="text-white font-semibold">{cfg.platforms.join(', ')}</span></div>}
            </div>
          </div>

          {cfg.ranks?.length > 0 && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-sm">Rank Tiers</h3>
              <div className="flex flex-wrap gap-1.5">
                {cfg.ranks.map((r: string) => (
                  <span key={r} className="px-2.5 py-1 rounded-lg bg-brand/8 border border-brand/15 text-brand text-xs font-semibold">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FAQ ── */}
      {seo?.faqs && seo.faqs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-white">Frequently Asked Questions</h2>
          {seo.faqs.map((faq: { question: string; answer: string }) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      )}
    </div>
  );
}
