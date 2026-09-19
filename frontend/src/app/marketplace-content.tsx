'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Gamepad2, Flame, ShieldCheck, X, Lock, Check, ArrowRight,
  Star, Send, AlertTriangle, ChevronRight, Tag, Timer, Shield, Flag,
  DollarSign, TrendingUp, Layers, MessageSquarePlus, Clock,
  Users, Zap, BadgeCheck, Award,
} from 'lucide-react';
import GameIcon from '@/components/GameIcon';
import { storeReferralCode, trackReferralClick } from '@/lib/referral';
import { GAME_LIST } from '@/lib/games';
import { useCurrency } from '@/lib/useCurrency';
import { useAuth } from '@/app/providers';

/* ─────────────────── Types ─────────────────────────────────────────── */
interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  gameSlug?: string;
  platform: string;
  region: string;
  rank: string;
  isFeatured: boolean;
  isSold: boolean;
  status: string;
  images?: string[];
  seller: { storeName: string; averageRating: number; id?: string; isVerified?: boolean };
}

interface GameBanner {
  gameName: string;
  gameSlug: string;
  bannerUrl: string;
  color?: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1');
const GAMES = GAME_LIST.map((g) => ({ name: g.name, slug: g.slug, color: g.color }));

/* ─────────────────── useBanners ─────────────────────────────────────── */
function useBanners() {
  const [banners, setBanners] = useState<Record<string, GameBanner>>({});
  useEffect(() => {
    fetch(`${API_BASE}/game-banners`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const map: Record<string, GameBanner> = {};
        (d.data || []).forEach((b: GameBanner) => { map[b.gameName] = b; });
        setBanners(map);
      })
      .catch(() => {});
  }, []);
  return banners;
}

/* ─────────────────── Skeleton ───────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-52 bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl overflow-hidden">
      <div className="h-36 skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 skeleton rounded w-1/2" />
        <div className="h-3.5 skeleton rounded w-4/5" />
        <div className="h-3 skeleton rounded w-2/3" />
        <div className="flex justify-between mt-2">
          <div className="h-5 skeleton rounded w-16" />
          <div className="h-7 skeleton rounded-lg w-20" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Listing Card (horizontal scroll) ──────────────── */
function ListingCardH({ item, banner }: { item: Listing; banner?: GameBanner }) {
  const { fmt } = useCurrency();
  const sold = item.isSold || item.status === 'SOLD';
  const accentColor = banner?.color ?? '#888888';

  return (
    <Link
      href={`/listings/${item.id}`}
      className="flex-shrink-0 w-52 bg-[var(--card-bg)] border border-[var(--border-bg)] hover:border-brand/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-1 group"
    >
      <div className="h-32 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accentColor}22, #000)` }}>
        {banner?.bannerUrl ? (
          <Image src={banner.bannerUrl} alt={item.gameName} fill sizes="208px"
            className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GameIcon game={item.gameSlug ?? item.gameName.toLowerCase().replace(/\s+/g, '-')} className="w-10 h-10 opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
        {item.isFeatured && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold text-black bg-brand px-1.5 py-0.5 rounded-full">
            <Flame className="w-2.5 h-2.5" /> Hot
          </span>
        )}
        {sold && <span className="absolute top-2 left-2 bg-black/80 text-gray-400 text-[9px] font-bold px-2 py-0.5 rounded border border-white/10">Sold</span>}
        {item.rank && <span className="absolute bottom-2 left-2 text-[9px] font-semibold text-white/90 bg-black/50 px-1.5 py-0.5 rounded">{item.rank}</span>}
        {item.platform && <span className="absolute bottom-2 right-2 text-[9px] font-semibold text-white/70 bg-black/50 px-1.5 py-0.5 rounded">{item.platform}</span>}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide truncate max-w-full mb-1"
            style={{ color: accentColor, background: `${accentColor}15`, borderColor: `${accentColor}25` }}>
            {item.gameName}
          </span>
          <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition">{item.title}</h3>
          {item.seller?.isVerified && (
            <span className="flex items-center gap-1 text-[9px] text-brand mt-0.5"><ShieldCheck className="w-2.5 h-2.5" /> Verified</span>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border-bg)] pt-2">
          <span className="text-sm font-black text-white">{fmt(item.price)}</span>
          <span className="bg-brand hover:bg-brand-light px-2.5 py-1 rounded-lg text-[10px] font-bold text-black transition">Buy</span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────── Hero Section ───────────────────────────────────── */
function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (selectedGame) params.set('game', selectedGame);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[520px] md:min-h-[580px] flex items-center overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-12">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,160,23,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Right side game art — decorative */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
        <div className="w-full h-full bg-gradient-to-br from-brand/5 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-3xl py-16 md:py-20">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Escrow Protected
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs font-medium px-3 py-1 rounded-full">
            Gaming Marketplace
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
          Buy, Sell &amp; Trade<br />
          <span className="text-brand">Gaming Accounts</span><br />
          Safely
        </h1>

        <p className="text-base md:text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
          Discover verified Free Fire, PUBG Mobile, COD Mobile accounts, top-ups and boosting services.
          Every transaction secured by Piyrox Escrow.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search accounts, games, top-ups, boosting..."
              className="w-full bg-white/5 border border-white/15 hover:border-brand/40 focus:border-brand rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none transition"
            />
          </div>
          <select
            value={selectedGame}
            onChange={e => setSelectedGame(e.target.value)}
            className="bg-white/5 border border-white/15 hover:border-brand/40 focus:border-brand rounded-xl px-4 py-3.5 text-sm text-gray-300 focus:outline-none transition min-w-[140px]"
          >
            <option value="">All Games</option>
            {GAMES.map(g => <option key={g.slug} value={g.name}>{g.name}</option>)}
          </select>
          <button type="submit"
            className="bg-brand hover:bg-brand-light text-black font-bold px-6 py-3.5 rounded-xl transition flex items-center gap-2 justify-center whitespace-nowrap">
            <Search className="w-4 h-4" /> Search
          </button>
        </form>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Accounts', href: '/search?category=ACCOUNT' },
            { label: 'Top-Ups', href: '/topups' },
            { label: 'Boosting', href: '/boosting' },
            { label: 'Free Fire', href: '/games/free-fire' },
            { label: 'PUBG Mobile', href: '/games/pubg-mobile' },
          ].map(f => (
            <Link key={f.label} href={f.href}
              className="bg-white/5 hover:bg-brand/10 border border-white/10 hover:border-brand/30 text-gray-400 hover:text-brand text-xs font-medium px-3 py-1.5 rounded-lg transition">
              {f.label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/listings"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-black font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-brand/20">
            Browse Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/sell"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-brand/40 text-white font-semibold px-6 py-3 rounded-xl transition">
            Sell on Piyrox
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Popular Games ──────────────────────────────────── */
function PopularGames({ banners }: { banners: Record<string, GameBanner> }) {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white">Popular Games</h2>
          <p className="text-sm text-gray-500 mt-0.5">Browse accounts and services by game</p>
        </div>
        <Link href="/games" className="flex items-center gap-1 text-brand text-sm font-semibold hover:text-brand-light transition">
          All Games <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {GAMES.map(game => {
          const banner = banners[game.name];
          const color = banner?.color ?? game.color ?? '#888888';
          return (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="relative rounded-2xl overflow-hidden border border-[var(--border-bg)] hover:border-brand/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand/10 hover:-translate-y-1 group aspect-video flex items-end"
              style={{ background: `linear-gradient(135deg, ${color}28, #000)` }}
            >
              {banner?.bannerUrl ? (
                <Image src={banner.bannerUrl} alt={game.name} fill
                  sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <GameIcon game={game.slug} className="w-12 h-12 opacity-60" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="relative z-10 w-full px-3 pb-3">
                <span className="block text-xs font-extrabold text-white group-hover:text-brand transition leading-tight">{game.name}</span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                  View listings <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────── Trending Listings ─────────────────────────────── */
function TrendingListings({ banners }: { banners: Record<string, GameBanner> }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/listings/featured?limit=8`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => { setListings(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand" /> Trending Listings
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Featured accounts and services</p>
        </div>
        <Link href="/listings?sortBy=newest" className="flex items-center gap-1 text-brand text-sm font-semibold hover:text-brand-light transition">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No featured listings yet"
          description="New gaming accounts and services will appear here as sellers start listing."
          actions={[{ label: 'Browse Marketplace', href: '/listings' }, { label: 'Start Selling', href: '/sell' }]}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-1 px-1">
          {listings.map(item => (
            <ListingCardH key={item.id} item={item} banner={banners[item.gameName]} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────── Recently Added ─────────────────────────────────── */
function RecentlyAdded({ banners }: { banners: Record<string, GameBanner> }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/listings?sortBy=newest&limit=8`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => { setListings((d.data || d.listings || []).slice(0, 8)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white">Recently Added</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fresh listings from verified sellers</p>
        </div>
        <Link href="/listings?sortBy=newest" className="flex items-center gap-1 text-brand text-sm font-semibold hover:text-brand-light transition">
          See more <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No new listings yet"
          description="New gaming accounts and services will appear here as sellers start listing."
          actions={[{ label: 'Browse Marketplace', href: '/listings' }, { label: 'Start Selling', href: '/sell' }]}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-1 px-1">
          {listings.map(item => (
            <ListingCardH key={item.id} item={item} banner={banners[item.gameName]} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────── Empty State ────────────────────────────────────── */
function EmptyState({ title, description, actions }: {
  title: string;
  description: string;
  actions: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 border border-dashed border-[var(--border-bg)] rounded-2xl text-center">
      <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
        <Gamepad2 className="w-6 h-6 text-brand/60" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-sm">{description}</p>
      <div className="flex gap-3">
        {actions.map(a => (
          <Link key={a.label} href={a.href}
            className="inline-flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 border border-brand/25 text-brand text-sm font-semibold px-4 py-2 rounded-xl transition">
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── Escrow Section ────────────────────────────────── */
function EscrowSection() {
  const steps = [
    { num: '01', title: 'Buyer Pays', desc: 'Payment is securely held by Piyrox', icon: DollarSign },
    { num: '02', title: 'Payment Secured', desc: 'Funds are locked — seller is notified', icon: Lock },
    { num: '03', title: 'Seller Delivers', desc: 'Account or service is delivered to buyer', icon: Send },
    { num: '04', title: 'Buyer Confirms', desc: 'Buyer verifies delivery within window', icon: Check },
    { num: '05', title: 'Seller Gets Paid', desc: 'Funds are released to the seller', icon: Award },
  ];

  return (
    <section className="mb-14 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-14 bg-black border-y border-[var(--border-bg)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Trust-Trade Escrow
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">How Escrow Works</h2>
          <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
            Every transaction on Piyrox is protected by our escrow system.
            Neither party can lose their money or their account.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-stretch gap-0 md:gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === 1; // "Payment Secured" highlighted
            return (
              <React.Fragment key={step.num}>
                <div className={`flex-1 flex flex-col items-center text-center p-5 rounded-2xl transition ${isActive ? 'bg-brand/10 border border-brand/30' : 'bg-white/[0.02] border border-white/5'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isActive ? 'bg-brand text-black' : 'bg-white/5 text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-black tracking-widest mb-1 ${isActive ? 'text-brand' : 'text-gray-600'}`}>{step.num}</span>
                  <h3 className={`text-sm font-bold mb-1 ${isActive ? 'text-brand' : 'text-white'}`}>{step.title}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center w-6 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/escrow"
            className="inline-flex items-center gap-2 text-brand text-sm font-semibold hover:text-brand-light transition">
            Learn more about Piyrox Escrow <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Why Piyrox ─────────────────────────────────────── */
function WhyPiyrox() {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Escrow Protection',
      desc: 'Payment is held securely until the buyer confirms delivery. No risk of losing money or accounts.',
    },
    {
      icon: BadgeCheck,
      title: 'Verified Sellers',
      desc: 'Sellers go through verification. See ratings, completed orders, and seller history before buying.',
    },
    {
      icon: Lock,
      title: 'Secure Transactions',
      desc: 'All payments processed through our platform with industry-standard security.',
    },
    {
      icon: Users,
      title: 'Buyer Support',
      desc: 'Dedicated dispute resolution. If something goes wrong, our team steps in to resolve it.',
    },
  ];

  return (
    <section className="mb-14">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Why Piyrox</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          A gaming marketplace built around safety, trust, and the buyer-seller relationship.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="bg-[var(--card-bg)] border border-[var(--border-bg)] hover:border-brand/25 rounded-2xl p-5 transition group">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition">
                <Icon className="w-4.5 h-4.5 text-brand" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────── Account Valuation ─────────────────────────────── */
function AccountValuation() {
  const [game, setGame] = useState('');
  const [rank, setRank] = useState('');

  return (
    <section className="mb-14 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-14 bg-gradient-to-br from-brand/5 via-transparent to-transparent border-y border-[var(--border-bg)]">
      <div className="max-w-2xl mx-auto text-center">
        <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <TrendingUp className="w-3.5 h-3.5" /> Account Valuation
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
          How much is your gaming account worth?
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
          Get an estimated market value for your gaming account based on game, rank, level and assets.
        </p>
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Game</label>
              <select value={game} onChange={e => setGame(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-brand rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition">
                <option value="">Select a game</option>
                {GAMES.map(g => <option key={g.slug} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Rank</label>
              <input value={rank} onChange={e => setRank(e.target.value)}
                placeholder="e.g. Diamond, Heroic"
                className="w-full bg-white/5 border border-white/10 focus:border-brand rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition" />
            </div>
          </div>
          <Link href={`/sell${game ? `?game=${encodeURIComponent(game)}` : ''}`}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-black font-bold py-3 rounded-xl transition">
            Get Estimated Value &amp; Sell <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Start Selling ─────────────────────────────────── */
function StartSelling() {
  return (
    <section className="mb-14">
      <div className="relative rounded-2xl overflow-hidden border border-brand/20 bg-gradient-to-br from-brand/8 via-black to-black p-8 md:p-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(212,160,23,0.08),transparent)]" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            Turn your gaming assets into money.
          </h2>
          <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
            List your gaming accounts, top-ups and boosting services on Piyrox.
            Get paid securely through escrow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sell"
              className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-black font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-brand/20">
              Start Selling <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold px-8 py-3.5 rounded-xl transition">
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Footer ─────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-12 pb-8 bg-black border-t border-[var(--border-bg)] mt-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo-new.png" alt="Piyrox" className="w-7 h-7 rounded-lg object-contain" />
              <span className="text-lg font-black tracking-widest text-white">PIYROX</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Gaming marketplace with escrow protection. Buy and sell gaming accounts, top-ups and services safely.
            </p>
            <p className="text-[10px] text-gray-600 font-medium tracking-wider uppercase">Play · Trade · Earn</p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Marketplace</h4>
            <ul className="space-y-2.5">
              {[['Browse Listings', '/listings'], ['Games', '/games'], ['Boosting', '/boosting'], ['Top-Ups', '/topups'], ['Sell', '/sell']].map(([label, href]) => (
                <li key={label}><Link href={href} className="text-xs text-gray-500 hover:text-brand transition">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[['About', '/about'], ['Support', '/support'], ['Pricing', '/pricing'], ['Affiliate', '/affiliate'], ['Blog', '/blog']].map(([label, href]) => (
                <li key={label}><Link href={href} className="text-xs text-gray-500 hover:text-brand transition">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[['Terms of Service', '/terms'], ['Privacy Policy', '/privacy'], ['Refund Policy', '/refund'], ['Escrow', '/escrow'], ['Docs', '/docs']].map(([label, href]) => (
                <li key={label}><Link href={href} className="text-xs text-gray-500 hover:text-brand transition">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-[var(--border-bg)] gap-3">
          <p className="text-[11px] text-gray-600">© {new Date().getFullYear()} Piyrox. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <ShieldCheck className="w-3 h-3 text-brand" /> Escrow Protected
            </span>
            <span className="text-[10px] text-gray-700">|</span>
            <span className="text-[10px] text-gray-600">Gaming Marketplace</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────── Referral handler ───────────────────────────────── */
function ReferralHandler() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) { storeReferralCode(ref); trackReferralClick(ref); }
  }, [searchParams]);
  return null;
}

/* ─────────────────── Main Export ────────────────────────────────────── */
export default function MarketplaceClient() {
  const banners = useBanners();

  return (
    <>
      <Suspense fallback={null}><ReferralHandler /></Suspense>

      {/* Hero */}
      <HeroSection />

      {/* Popular Games */}
      <PopularGames banners={banners} />

      {/* Trending Listings */}
      <TrendingListings banners={banners} />

      {/* Recently Added */}
      <RecentlyAdded banners={banners} />

      {/* How Escrow Works */}
      <EscrowSection />

      {/* Why Piyrox */}
      <WhyPiyrox />

      {/* Account Valuation */}
      <AccountValuation />

      {/* Start Selling */}
      <StartSelling />

      {/* Footer */}
      <Footer />
    </>
  );
}
