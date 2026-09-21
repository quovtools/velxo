'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Flame, ShieldCheck, ArrowRight, ChevronRight,
  Star, DollarSign, Lock, CheckCircle, Award, Send,
  Gamepad2, Zap, Users, BadgeCheck, Tag, TrendingUp,
} from 'lucide-react';
import GameIcon from '@/components/GameIcon';
import { storeReferralCode, trackReferralClick } from '@/lib/referral';
import { GAME_LIST } from '@/lib/games';
import { useCurrency } from '@/lib/useCurrency';
import { useAuth } from '@/app/providers';

/* ── Types ── */
interface Listing {
  id: string; title: string; price: string; gameName: string;
  gameSlug?: string; platform: string; region: string; rank: string;
  isFeatured: boolean; isSold: boolean; status: string;
  images?: string[];
  seller: { storeName: string; averageRating: number; id?: string; isVerified?: boolean };
}
interface GameBanner { gameName: string; gameSlug: string; bannerUrl: string; color?: string; }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const GAMES = GAME_LIST.map(g => ({ name: g.name, slug: g.slug, color: g.color }));

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

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-48 rounded-2xl overflow-hidden border border-[var(--border-bg)] bg-[var(--card-bg)]">
      <div className="h-32 skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-2 skeleton rounded w-1/2" />
        <div className="h-3 skeleton rounded w-4/5" />
        <div className="flex justify-between mt-2">
          <div className="h-4 skeleton rounded w-14" />
          <div className="h-6 skeleton rounded w-16" />
        </div>
      </div>
    </div>
  );
}

/* ── Horizontal listing card ── */
function ListingCardH({ item, banner }: { item: Listing; banner?: GameBanner }) {
  const { fmt } = useCurrency();
  const sold = item.isSold || item.status === 'SOLD';
  const color = banner?.color ?? '#888';
  return (
    <Link href={`/listings/${item.id}`}
      className="flex-shrink-0 w-48 bg-[var(--card-bg)] border border-[var(--border-bg)] hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10 group">
      <div className="h-28 relative overflow-hidden" style={{ background: `linear-gradient(135deg,${color}20,#000)` }}>
        {banner?.bannerUrl ? (
          <Image src={banner.bannerUrl} alt={item.gameName} fill sizes="192px"
            className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GameIcon game={item.gameSlug ?? item.gameName.toLowerCase().replace(/\s+/g, '-')} className="w-8 h-8 opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {item.isFeatured && (
          <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] font-bold text-black bg-brand px-1.5 py-0.5 rounded-full">
            <Flame className="w-2.5 h-2.5" />Hot
          </span>
        )}
        {sold && <span className="absolute top-1.5 left-1.5 bg-black/80 text-gray-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">Sold</span>}
        {item.rank && <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold text-white/90 bg-black/50 px-1.5 py-0.5 rounded">{item.rank}</span>}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
        <div>
          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide truncate max-w-full mb-1"
            style={{ color, background: `${color}15`, borderColor: `${color}25` }}>
            {item.gameName}
          </span>
          <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition">{item.title}</h3>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border-bg)] pt-2 mt-1">
          <span className="text-sm font-black text-white">{fmt(item.price)}</span>
          <span className="bg-brand hover:bg-brand-light px-2 py-1 rounded-lg text-[10px] font-bold text-black transition">Buy</span>
        </div>
      </div>
    </Link>
  );
}

/* ── Hero ── */
function HeroSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  useEffect(() => {
    if (params?.get('ref')) {
      storeReferralCode(params.get('ref')!);
      trackReferralClick(params.get('ref')!).catch(() => {});
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query) p.set('query', query);
    if (selectedGame) p.set('game', selectedGame);
    router.push(`/search?${p}`);
  };

  return (
    <section className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 md:py-20 mb-12">
      <div className="absolute inset-0 hero-bg" />
      <div className="absolute inset-0 bg-dot-grid opacity-40" />
      <div className="absolute inset-0 noise-bg opacity-30" />
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl py-4">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Escrow Protected
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full">
            <Gamepad2 className="w-3.5 h-3.5" /> Gaming Marketplace
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.04] tracking-tight mb-4">
          Buy, Sell &amp; Trade<br />
          <span className="text-gradient">Gaming Accounts</span><br />
          Safely
        </h1>
        <p className="text-base md:text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
          Verified Free Fire, PUBG Mobile, COD Mobile accounts, top-ups and boosting. Every transaction secured by Piyrox Escrow.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-5 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search accounts, games, top-ups..."
              className="w-full bg-white/5 border border-white/15 hover:border-brand/40 focus:border-brand rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(212,160,23,0.08)] transition" />
          </div>
          <select value={selectedGame} onChange={e => setSelectedGame(e.target.value)}
            className="bg-white/5 border border-white/15 hover:border-brand/40 focus:border-brand rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none transition min-w-[130px]">
            <option value="">All Games</option>
            {GAMES.map(g => <option key={g.slug} value={g.name}>{g.name}</option>)}
          </select>
          <button type="submit" className="btn-primary gap-2 rounded-xl">
            <Search className="w-4 h-4" /> Search
          </button>
        </form>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: 'Accounts', href: '/search?category=ACCOUNT' },
            { label: 'Top-Ups', href: '/topups' },
            { label: 'Boosting', href: '/boosting' },
            ...GAMES.map(g => ({ label: g.name, href: `/games/${g.slug}` })),
          ].map(f => (
            <Link key={f.label} href={f.href}
              className="bg-white/5 hover:bg-brand/10 border border-white/10 hover:border-brand/30 text-gray-400 hover:text-brand text-xs font-medium px-3 py-1.5 rounded-lg transition">
              {f.label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Link href="/listings" className="btn-primary gap-2 rounded-xl shadow-lg shadow-brand/20">
            Browse Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/sell" className="btn-secondary gap-2 rounded-xl">
            Sell on Piyrox
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Section header ── */
function SectionHeader({ title, sub, href }: { title: React.ReactNode; sub?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">{title}</h2>
        {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-brand text-sm font-semibold hover:text-brand-light transition flex-shrink-0">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/* ── Popular Games ── */
function PopularGames({ banners }: { banners: Record<string, GameBanner> }) {
  return (
    <section className="mb-14">
      <SectionHeader title="Popular Games" sub="Browse accounts and services by game" href="/games" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {GAMES.map(game => {
          const banner = banners[game.name];
          const color = banner?.color ?? game.color ?? '#888';
          return (
            <Link key={game.slug} href={`/games/${game.slug}`}
              className="relative rounded-2xl overflow-hidden border border-[var(--border-bg)] hover:border-brand/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/10 group aspect-video flex items-end"
              style={{ background: `linear-gradient(135deg,${color}22,#000)` }}>
              {banner?.bannerUrl ? (
                <Image src={banner.bannerUrl} alt={game.name} fill sizes="(max-width:640px)50vw,20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <GameIcon game={game.slug} className="w-10 h-10 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="relative z-10 w-full px-3 pb-3">
                <span className="block text-xs font-extrabold text-white group-hover:text-brand transition leading-tight">{game.name}</span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">View listings <ArrowRight className="w-2.5 h-2.5" /></span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ── Listings row ── */
function ListingsRow({ title, icon, href, endpoint, banners }: {
  title: string; icon?: React.ReactNode; href: string; endpoint: string; banners: Record<string, GameBanner>;
}) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}${endpoint}`).then(r => r.ok ? r.json() : { data: [] })
      .then(d => { setItems((d.data || d.listings || []).slice(0, 8)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [endpoint]);

  return (
    <section className="mb-14">
      <SectionHeader title={<>{icon && <span className="text-brand">{icon}</span>}{title}</>} href={href} />
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--border-bg)] rounded-2xl text-center">
          <Gamepad2 className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-sm font-semibold text-gray-400">No listings yet</p>
          <Link href="/sell" className="mt-3 text-brand text-xs font-semibold hover:text-brand-light transition">Start selling →</Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-1 px-1">
          {items.map(item => <ListingCardH key={item.id} item={item} banner={banners[item.gameName]} />)}
        </div>
      )}
    </section>
  );
}

/* ── Escrow steps ── */
function EscrowSection() {
  const steps = [
    { num: '01', title: 'Buyer Pays', desc: 'Payment held by Piyrox', icon: DollarSign },
    { num: '02', title: 'Secured', desc: 'Funds locked in escrow', icon: Lock },
    { num: '03', title: 'Delivered', desc: 'Seller transfers goods', icon: Send },
    { num: '04', title: 'Confirmed', desc: 'Buyer verifies delivery', icon: CheckCircle },
    { num: '05', title: 'Paid Out', desc: 'Funds released to seller', icon: Award },
  ];
  return (
    <section className="mb-14 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 bg-[var(--surface)] border-y border-[var(--border-bg)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="eyebrow mb-3">Trust-Trade Escrow</span>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-3 mb-2">How Escrow Works</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">Every transaction is protected. Neither party risks losing their money or their account.</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const active = i === 1;
            return (
              <React.Fragment key={step.num}>
                <div className={`flex-1 flex flex-col items-center text-center p-4 rounded-2xl ${active ? 'bg-brand/10 border border-brand/25' : 'bg-white/[0.02] border border-white/5'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 ${active ? 'bg-brand text-black' : 'bg-white/5 text-gray-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-black tracking-widest mb-1 ${active ? 'text-brand' : 'text-gray-600'}`}>{step.num}</span>
                  <h3 className={`text-xs font-bold mb-1 ${active ? 'text-brand' : 'text-white'}`}>{step.title}</h3>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{step.desc}</p>
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
          <Link href="/escrow" className="inline-flex items-center gap-1 text-brand text-sm font-semibold hover:text-brand-light transition">
            Learn more about escrow <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Why Piyrox ── */
function WhyPiyrox() {
  const features = [
    { icon: ShieldCheck, title: 'Escrow Protection', desc: 'Payment held until buyer confirms delivery.' },
    { icon: BadgeCheck, title: 'Verified Sellers', desc: 'KYC-verified sellers with full rating history.' },
    { icon: Lock, title: 'Secure Payments', desc: 'Industry-standard security on all transactions.' },
    { icon: Users, title: 'Dispute Support', desc: 'Dedicated team resolves disputes within 48 hrs.' },
  ];
  return (
    <section className="mb-14">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Why Piyrox</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">A gaming marketplace built around safety, trust, and the buyer-seller relationship.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="card rounded-2xl p-5 card-lift">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center mb-4">
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

/* ── Account Valuation ── */
function AccountValuation() {
  const [game, setGame] = useState('');
  const [rank, setRank] = useState('');
  return (
    <section className="mb-14 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 border-y border-[var(--border-bg)]"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%,rgba(212,160,23,0.06),transparent)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <span className="eyebrow mb-3"><TrendingUp className="w-3.5 h-3.5" /> Account Valuation</span>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 mt-3">How much is your account worth?</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">Get an estimated market value based on game, rank, and assets.</p>
        <div className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-2xl p-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Game</label>
              <select value={game} onChange={e => setGame(e.target.value)} className="input">
                <option value="">Select a game</option>
                {GAMES.map(g => <option key={g.slug} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Rank</label>
              <input value={rank} onChange={e => setRank(e.target.value)} placeholder="e.g. Diamond, Heroic" className="input" />
            </div>
          </div>
          <Link href={`/sell${game ? `?game=${encodeURIComponent(game)}` : ''}`}
            className="btn-primary w-full justify-center gap-2 rounded-xl">
            Get Estimated Value &amp; Sell <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Start Selling ── */
function StartSelling() {
  return (
    <section className="mb-14">
      <div className="relative rounded-2xl overflow-hidden border border-brand/20 p-8 md:p-12 text-center"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 100%,rgba(212,160,23,0.08),transparent),#050505' }}>
        <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Turn gaming assets into money.</h2>
          <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
            List gaming accounts, top-ups and boosting services on Piyrox. Get paid securely through escrow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sell" className="btn-primary gap-2 rounded-xl shadow-lg shadow-brand/20 px-8 py-3">
              Start Selling <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="btn-secondary gap-2 rounded-xl px-8 py-3">View Pricing</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function AppFooter() {
  return (
    <footer className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-10 pb-8 bg-[var(--surface)] border-t border-[var(--border-bg)] mt-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden">
                <img src="/logo-new.png" alt="Piyrox" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-base font-black tracking-widest text-white">PIYROX</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-2">Gaming marketplace with escrow protection. Buy and sell safely.</p>
            <p className="text-[10px] text-gray-600 font-medium tracking-wider uppercase">Play · Trade · Earn</p>
          </div>
          {[
            { label: 'Marketplace', links: [['Browse', '/listings'], ['Games', '/games'], ['Boosting', '/boosting'], ['Top-Ups', '/topups'], ['Sell', '/sell']] },
            { label: 'Account', links: [['Orders', '/orders'], ['Wallet', '/wallet'], ['Messages', '/messages'], ['Affiliate', '/affiliate'], ['Profile', '/profile']] },
            { label: 'Company', links: [['About', '/about'], ['Support', '/support'], ['Pricing', '/pricing'], ['Blog', '/blog'], ['Terms', '/terms']] },
          ].map(({ label, links }) => (
            <div key={label}>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">{label}</h4>
              <ul className="space-y-2.5">
                {links.map(([name, href]) => (
                  <li key={name}><Link href={href} className="text-xs text-gray-500 hover:text-brand transition">{name}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border-bg)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
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

/* ── Dashboard inner (for logged-in users) ── */
function DashboardSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ totalSpent?: string; activeOrders?: number; walletBalance?: string } | null>(null);
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('piyrox_token') : null;
    if (!token) return;
    fetch(`${API}/users/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d?.data && setStats(d.data)).catch(() => {});
  }, []);
  const { fmt } = useCurrency();
  const name = (user as any)?.firstName || 'Gamer';

  return (
    <section className="mb-10 p-5 rounded-2xl bg-gradient-to-br from-brand/8 via-[var(--surface)] to-[var(--surface)] border border-brand/15">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Welcome back, {name}! 👋</h2>
          <p className="text-sm text-gray-400 mt-0.5">Here's what's happening in your marketplace.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/sell" className="btn-primary rounded-xl gap-1.5 text-sm"><Zap className="w-3.5 h-3.5" /> Create Listing</Link>
          <Link href="/orders" className="btn-secondary rounded-xl text-sm">My Orders</Link>
        </div>
      </div>
      {stats && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Wallet Balance', value: fmt(stats.walletBalance || 0), icon: '💰' },
            { label: 'Active Orders', value: stats.activeOrders ?? 0, icon: '📦' },
            { label: 'Total Spent', value: fmt(stats.totalSpent || 0), icon: '💸' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-xl p-3 text-center">
              <div className="text-lg mb-0.5">{icon}</div>
              <div className="text-sm font-black text-white">{value}</div>
              <div className="text-[10px] text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Main export ── */
function MarketplaceInner() {
  const { user } = useAuth();
  const banners = useBanners();

  return (
    <div className="fade-in">
      <HeroSection />
      {user && <DashboardSection />}
      <PopularGames banners={banners} />
      <ListingsRow title="Trending Listings" icon={<Flame className="w-5 h-5" />}
        href="/listings?sortBy=popular" endpoint="/listings/featured?limit=8" banners={banners} />
      <EscrowSection />
      <ListingsRow title="Recently Added" href="/listings?sortBy=newest"
        endpoint="/listings?sortBy=newest&limit=8" banners={banners} />
      <WhyPiyrox />
      <AccountValuation />
      <StartSelling />
      <AppFooter />
    </div>
  );
}

export default function MarketplaceClient() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
      <MarketplaceInner />
    </Suspense>
  );
}
