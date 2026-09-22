'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search, Flame, ShieldCheck, ArrowRight, ChevronRight,
  Star, DollarSign, Lock, CheckCircle, Award, Send,
  Gamepad2, Zap, Users, BadgeCheck, TrendingUp, Sparkles,
  ChevronLeft, Swords,
} from 'lucide-react';
import GameIcon from '@/components/GameIcon';
import { storeReferralCode, trackReferralClick } from '@/lib/referral';
import { GAME_LIST } from '@/lib/games';
import { useCurrency } from '@/lib/useCurrency';
import { useAuth } from '@/app/providers';

/* ─────────────────────────────── Types ─────────────────────────────── */
interface Listing {
  id: string; title: string; price: string; gameName: string;
  gameSlug?: string; platform: string; region: string; rank: string;
  isFeatured: boolean; isSold: boolean; status: string;
  images?: string[];
  seller: { storeName: string; averageRating: number; id?: string; isVerified?: boolean };
}
interface GameBanner { gameName: string; gameSlug: string; bannerUrl: string; color?: string; }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const GAMES = GAME_LIST.map(g => ({ name: g.name, slug: g.slug, color: g.color, logo: g.logo }));

/* ─────────────────────── hooks ─────────────────────── */
function useBanners() {
  const [banners, setBanners] = useState<Record<string, GameBanner>>({});
  useEffect(() => {
    fetch(`${API}/game-banners`).then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const map: Record<string, GameBanner> = {};
        (d.data || []).forEach((b: GameBanner) => { map[b.gameName] = b; });
        setBanners(map);
      }).catch(() => {});
  }, []);
  return banners;
}

/* ─────────────────────── Skeleton ─────────────────────── */
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-52 rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] animate-pulse">
      <div className="h-40 bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-2 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-4/5" />
        <div className="flex justify-between mt-2">
          <div className="h-4 bg-white/5 rounded w-14" />
          <div className="h-6 bg-white/5 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Listing Card ─────────────────────── */
function ListingCard({ item, banner }: { item: Listing; banner?: GameBanner }) {
  const { fmt } = useCurrency();
  const sold = item.isSold || item.status === 'SOLD';
  const color = banner?.color ?? '#D4A017';
  const img = item.images?.[0];

  return (
    <Link
      href={`/listings/${item.id}`}
      className="group relative flex-shrink-0 w-52 rounded-2xl overflow-hidden border border-white/8 hover:border-brand/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col"
      style={{ background: `linear-gradient(160deg,${color}12 0%,#050505 60%)` }}
    >
      {/* image */}
      <div className="relative h-36 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : banner?.bannerUrl ? (
          <Image src={banner.bannerUrl} alt={item.gameName} fill sizes="208px"
            className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `${color}18` }}>
            <GameIcon game={item.gameSlug ?? item.gameName} className="w-12 h-12 opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* badges */}
        {item.isFeatured && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-black text-black bg-brand px-1.5 py-0.5 rounded-full shadow-lg shadow-brand/30">
            <Flame className="w-2.5 h-2.5" /> HOT
          </span>
        )}
        {sold && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-black uppercase tracking-widest text-white/60 border border-white/20 px-3 py-1 rounded-lg">SOLD</span>
          </div>
        )}
        {item.rank && (
          <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white/90 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
            {item.rank}
          </span>
        )}
      </div>

      {/* body */}
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <span
          className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider w-fit"
          style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
        >
          {item.gameName}
        </span>
        <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition-colors">{item.title}</h3>
        {item.seller?.storeName && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Star className="w-2.5 h-2.5 fill-brand text-brand flex-shrink-0" />
            <span className="truncate">{item.seller.storeName}</span>
            {item.seller.isVerified && <BadgeCheck className="w-2.5 h-2.5 text-brand flex-shrink-0" />}
          </div>
        )}
        <div className="mt-auto pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
          <span className="text-sm font-black text-white">{fmt(item.price)}</span>
          <span
            className="px-2.5 py-1 rounded-lg text-[10px] font-black text-black transition-colors"
            style={{ background: color }}
          >
            Buy
          </span>
        </div>
      </div>

      {/* glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 40px ${color}10` }}
      />
    </Link>
  );
}

/* ─────────────────────── Hero ─────────────────────── */
function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [activeGame, setActiveGame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ref')) {
        storeReferralCode(params.get('ref')!);
        trackReferralClick(params.get('ref')!).catch(() => {});
      }
    }
  }, []);

  // cycle through game accent colours
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveGame(g => (g + 1) % GAMES.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query) p.set('query', query);
    if (selectedGame) p.set('game', selectedGame);
    router.push(`/search?${p}`);
  };

  const accentColor = GAMES[activeGame]?.color ?? '#D4A017';

  return (
    <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden mb-0">
      {/* cinematic background */}
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 70% 80% at 20% 50%, ${accentColor}14, transparent 60%),
                       radial-gradient(ellipse 50% 60% at 80% 50%, ${accentColor}08, transparent 60%)`,
        }}
      />
      {/* grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${accentColor} 1px,transparent 1px),linear-gradient(90deg,${accentColor} 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* floating game logos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {GAMES.map((g, i) => (
          g.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={g.slug}
              src={g.logo}
              alt=""
              aria-hidden
              className="absolute object-contain transition-all duration-1000"
              style={{
                width: 120, height: 120,
                right: `${5 + i * 20}%`,
                top: `${10 + (i % 3) * 25}%`,
                opacity: i === activeGame ? 0.18 : 0.04,
                transform: i === activeGame ? 'scale(1.15)' : 'scale(1)',
                filter: 'drop-shadow(0 0 24px currentColor)',
              }}
            />
          )
        ))}
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-3xl">
          {/* eyebrow */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-bold px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> Escrow Protected
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full">
              <Swords className="w-3.5 h-3.5" /> Gaming Marketplace
            </span>
          </div>

          {/* headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-4">
            Buy. Sell.<br />
            <span
              className="transition-colors duration-1000"
              style={{ color: accentColor }}
            >
              Trade Safe.
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
            Verified gaming accounts, top-ups &amp; boosting — every transaction locked in escrow until you confirm.
          </p>

          {/* search */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search accounts, games, top-ups..."
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand/60 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand/20 transition"
              />
            </div>
            <select
              value={selectedGame} onChange={e => setSelectedGame(e.target.value)}
              className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand/60 rounded-xl px-4 py-3.5 text-sm text-gray-300 focus:outline-none transition min-w-[130px]"
            >
              <option value="">All Games</option>
              {GAMES.map(g => <option key={g.slug} value={g.name}>{g.name}</option>)}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-amber-400 text-black font-black px-6 py-3.5 rounded-xl transition shadow-lg shadow-brand/25 text-sm"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </form>

          {/* quick filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { label: '🎮 Accounts', href: '/search?category=ACCOUNT' },
              { label: '⚡ Top-Ups', href: '/topups' },
              { label: '🏆 Boosting', href: '/boosting' },
              ...GAMES.map(g => ({ label: g.name, href: `/games/${g.slug}` })),
            ].map(f => (
              <Link key={f.label} href={f.href}
                className="bg-white/5 hover:bg-white/10 border border-white/8 hover:border-brand/30 text-gray-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                {f.label}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link href="/listings"
              className="inline-flex items-center gap-2 bg-brand hover:bg-amber-400 text-black font-black px-8 py-3.5 rounded-xl transition shadow-lg shadow-brand/25">
              Browse Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/sell"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white font-bold px-8 py-3.5 rounded-xl transition">
              Start Selling
            </Link>
          </div>
        </div>
      </div>

      {/* bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}

/* ─────────────────────── Popular Games ─────────────────────── */
function PopularGames({ banners }: { banners: Record<string, GameBanner> }) {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">Browse by Game</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">Popular Games</h2>
        </div>
        <Link href="/games" className="flex items-center gap-1 text-brand text-sm font-semibold hover:text-amber-400 transition flex-shrink-0">
          All games <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {GAMES.map((game, i) => {
          const banner = banners[game.name];
          const color = banner?.color ?? game.color ?? '#D4A017';
          return (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="group relative rounded-2xl overflow-hidden border border-white/8 hover:border-brand/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl aspect-[3/4] flex flex-col justify-end"
              style={{ background: `linear-gradient(160deg,${color}20,#000)` }}
            >
              {banner?.bannerUrl ? (
                <Image src={banner.bannerUrl} alt={game.name} fill sizes="(max-width:640px)50vw,20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <GameIcon game={game.slug} className="w-14 h-14 opacity-40 group-hover:opacity-60 transition" />
                </div>
              )}
              {/* gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              {/* glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `inset 0 -60px 40px ${color}20` }}
              />
              <div className="relative z-10 p-3">
                <span className="block text-xs font-extrabold text-white group-hover:text-brand transition leading-tight mb-1">{game.name}</span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-gray-400 transition">
                  View listings <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
              {/* rank number */}
              <span className="absolute top-2.5 left-2.5 text-[10px] font-black text-white/20 tabular-nums">
                #{String(i + 1).padStart(2, '0')}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────── Listings Row ─────────────────────── */
function ListingsRow({ title, icon, href, endpoint, banners, accent = '#D4A017' }: {
  title: string; icon?: React.ReactNode; href: string; endpoint: string;
  banners: Record<string, GameBanner>; accent?: string;
}) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}${endpoint}`).then(r => r.ok ? r.json() : { data: [] })
      .then(d => { setItems((d.data || d.listings || []).slice(0, 10)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [endpoint]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 240 : -240, behavior: 'smooth' });
  };

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-5">
        <div className="flex items-center gap-2.5">
          {icon && <span style={{ color: accent }}>{icon}</span>}
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">{title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')} aria-label="scroll left"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center text-gray-400 hover:text-white transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')} aria-label="scroll right"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center text-gray-400 hover:text-white transition">
            <ChevronRight className="w-4 h-4" />
          </button>
          <Link href={href} className="flex items-center gap-1 text-brand text-sm font-semibold hover:text-amber-400 transition ml-1">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 border border-dashed border-white/8 rounded-2xl text-center">
          <Gamepad2 className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No listings yet</p>
          <Link href="/sell" className="mt-3 text-brand text-xs font-semibold hover:text-amber-400 transition">Be the first to sell →</Link>
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-1 px-1">
          {items.map(item => <ListingCard key={item.id} item={item} banner={banners[item.gameName]} />)}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────── Escrow Strip ─────────────────────── */
function EscrowStrip() {
  const steps = [
    { num: '01', title: 'Buyer Pays', desc: 'Payment held by Piyrox', icon: DollarSign },
    { num: '02', title: 'Secured', desc: 'Funds locked in escrow', icon: Lock },
    { num: '03', title: 'Delivered', desc: 'Seller transfers goods', icon: Send },
    { num: '04', title: 'Confirmed', desc: 'Buyer verifies delivery', icon: CheckCircle },
    { num: '05', title: 'Paid Out', desc: 'Funds released to seller', icon: Award },
  ];

  return (
    <section className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-14 mb-16 relative overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(212,160,23,0.07),transparent)]" />
      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/20 text-brand text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Lock className="w-3.5 h-3.5" /> Trust-Trade Escrow
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-1 mb-2">How Escrow Works</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">Every transaction is fully protected. Zero risk for buyers and sellers.</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isKey = i === 1;
            return (
              <React.Fragment key={step.num}>
                <div className={`flex-1 flex flex-col items-center text-center p-4 rounded-2xl transition-all ${isKey ? 'bg-brand/12 border border-brand/25 shadow-lg shadow-brand/10' : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isKey ? 'bg-brand text-black shadow-lg shadow-brand/30' : 'bg-white/5 text-gray-500'}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className={`text-[9px] font-black tracking-widest mb-1 ${isKey ? 'text-brand' : 'text-gray-700'}`}>{step.num}</span>
                  <h3 className={`text-xs font-bold mb-1 ${isKey ? 'text-brand' : 'text-white'}`}>{step.title}</h3>
                  <p className="text-[10px] text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center w-5 flex-shrink-0">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <Link href="/escrow" className="inline-flex items-center gap-1.5 text-brand text-sm font-semibold hover:text-amber-400 transition">
            Learn more about Trust-Trade <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Why Piyrox ─────────────────────── */
function WhyPiyrox() {
  const features = [
    { icon: ShieldCheck, title: 'Escrow on Every Trade', desc: 'Payment held until buyer confirms delivery — guaranteed.' },
    { icon: BadgeCheck, title: 'KYC-Verified Sellers', desc: 'Every seller identity-checked with full rating history.' },
    { icon: Lock, title: 'Bank-Grade Security', desc: 'Industry-standard encryption on all transactions.' },
    { icon: Users, title: 'Dispute Resolution', desc: 'Dedicated team resolves disputes within 48 hrs.' },
  ];

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-2">Built for Gamers</p>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Why Piyrox</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">A gaming marketplace built around safety, trust, and the buyer-seller relationship.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="group relative rounded-2xl p-5 border border-white/8 hover:border-brand/30 bg-white/[0.02] hover:bg-brand/[0.04] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 text-[80px] font-black text-white/[0.02] leading-none select-none pointer-events-none translate-x-4 -translate-y-2">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition">
                <Icon className="w-5 h-5 text-brand" />
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

/* ─────────────────────── Account Valuation ─────────────────────── */
function AccountValuation() {
  const [game, setGame] = useState('');
  const [rank, setRank] = useState('');
  return (
    <section className="mb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-14 border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,160,23,0.06),transparent)]" />
      <div className="relative max-w-xl mx-auto text-center">
        <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/20 text-brand text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          <TrendingUp className="w-3.5 h-3.5" /> Account Valuation
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 mt-1">How much is your account worth?</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">Get an estimated market value based on game, rank, and assets.</p>
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Game</label>
              <select value={game} onChange={e => setGame(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-brand/40 focus:border-brand rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition">
                <option value="">Select a game</option>
                {GAMES.map(g => <option key={g.slug} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Rank</label>
              <input value={rank} onChange={e => setRank(e.target.value)} placeholder="e.g. Diamond, Heroic"
                className="w-full bg-white/5 border border-white/10 hover:border-brand/40 focus:border-brand rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition" />
            </div>
          </div>
          <Link href={`/sell${game ? `?game=${encodeURIComponent(game)}` : ''}`}
            className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl transition shadow-lg shadow-brand/20 text-sm">
            Get Estimated Value &amp; Sell <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Start Selling CTA ─────────────────────── */
function StartSelling() {
  return (
    <section className="mb-16">
      <div className="relative rounded-3xl overflow-hidden border border-brand/20 p-8 md:p-14">
        {/* backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_100%,rgba(212,160,23,0.12),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#D4A017 1px,transparent 1px),linear-gradient(90deg,#D4A017 1px,transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Sell on Piyrox
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
              Turn your accounts &amp;<br />skills into income.
            </h2>
            <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md leading-relaxed">
              List in minutes, sell with escrow protection, and get paid to mobile money. Thousands of buyers are waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/sell"
                className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-amber-400 text-black font-black px-8 py-4 rounded-xl transition shadow-xl shadow-brand/25">
                Start Selling <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/marketplace"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white font-bold px-8 py-4 rounded-xl transition">
                Browse Marketplace
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: ShieldCheck, text: 'Funds locked in escrow before delivery — payout guaranteed' },
              { icon: BadgeCheck, text: 'Free storefront with verified badge and seller levels' },
              { icon: DollarSign, text: 'Flat 5% fee — no listing costs, no hidden charges' },
              { icon: Zap, text: 'Dispute mediation team on every order' },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-3 bg-white/[0.03] border border-white/8 hover:border-brand/20 rounded-xl px-4 py-3.5 transition group">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20 transition">
                    <Icon className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-xs text-gray-300 font-medium leading-snug">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Dashboard (logged-in) ─────────────────────── */
function DashboardSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ totalSpent?: string; activeOrders?: number; walletBalance?: string } | null>(null);
  const { fmt } = useCurrency();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('piyrox_token') : null;
    if (!token) return;
    fetch(`${API}/users/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d?.data && setStats(d.data)).catch(() => {});
  }, []);

  const name = (user as any)?.firstName || 'Gamer';

  return (
    <section className="mb-12 rounded-2xl border border-brand/15 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/8 via-black to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_0%,rgba(212,160,23,0.08),transparent)]" />
      <div className="relative z-10 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-black text-white">Welcome back, {name}! 👋</h2>
            <p className="text-sm text-gray-500 mt-0.5">Here&apos;s what&apos;s happening in your marketplace.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/sell"
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-amber-400 text-black font-black rounded-xl px-4 py-2 text-sm transition shadow-lg shadow-brand/20">
              <Zap className="w-3.5 h-3.5" /> Create Listing
            </Link>
            <Link href="/orders"
              className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl px-4 py-2 text-sm transition">
              My Orders
            </Link>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Wallet Balance', value: fmt(stats.walletBalance || 0), emoji: '💰' },
              { label: 'Active Orders', value: stats.activeOrders ?? 0, emoji: '📦' },
              { label: 'Total Spent', value: fmt(stats.totalSpent || 0), emoji: '💸' },
            ].map(({ label, value, emoji }) => (
              <div key={label} className="bg-white/[0.03] border border-white/8 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{emoji}</div>
                <div className="text-sm font-black text-white">{value}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────── Footer ─────────────────────── */
function AppFooter() {
  return (
    <footer className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-12 pb-8 border-t border-white/5 mt-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-new.png" alt="Piyrox" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-base font-black tracking-widest text-white">PIYROX</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">Gaming marketplace with escrow protection. Buy and sell safely.</p>
            <p className="text-[10px] text-gray-700 font-bold tracking-widest uppercase">Play · Trade · Earn</p>
          </div>
          {[
            { label: 'Marketplace', links: [['Browse', '/listings'], ['Games', '/games'], ['Boosting', '/boosting'], ['Top-Ups', '/topups'], ['Sell', '/sell']] },
            { label: 'Account', links: [['Orders', '/orders'], ['Wallet', '/wallet'], ['Messages', '/messages'], ['Affiliate', '/affiliate'], ['Profile', '/profile']] },
            { label: 'Company', links: [['About', '/about'], ['Support', '/support'], ['Pricing', '/pricing'], ['Blog', '/blog'], ['Terms', '/terms']] },
          ].map(({ label, links }) => (
            <div key={label}>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">{label}</h4>
              <ul className="space-y-2.5">
                {links.map(([name, href]) => (
                  <li key={name}><Link href={href} className="text-xs text-gray-600 hover:text-brand transition">{name}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-700">
          <p>&copy; {new Date().getFullYear()} Piyrox — All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-brand transition">Terms</Link>
            <Link href="/privacy" className="hover:text-brand transition">Privacy</Link>
            <Link href="/support" className="hover:text-brand transition">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────── Main ─────────────────────── */
function MarketplaceInner() {
  const { user } = useAuth();
  const banners = useBanners();

  return (
    <div className="fade-in">
      <HeroSection />

      <div className="pt-12">
        {user && <DashboardSection />}
        <PopularGames banners={banners} />

        <ListingsRow
          title="🔥 Trending Listings"
          href="/listings?sortBy=popular"
          endpoint="/listings/featured?limit=10"
          banners={banners}
          accent="#FF6B35"
        />

        <EscrowStrip />

        <ListingsRow
          title="✨ Recently Added"
          href="/listings?sortBy=newest"
          endpoint="/listings?sortBy=newest&limit=10"
          banners={banners}
          accent="#D4A017"
        />

        <WhyPiyrox />
        <AccountValuation />
        <StartSelling />
      </div>

      <AppFooter />
    </div>
  );
}

export default function MarketplaceClient() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-600 text-sm">Loading marketplace...</div>}>
      <MarketplaceInner />
    </Suspense>
  );
}
