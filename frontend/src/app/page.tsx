'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2, ShieldCheck, Award, RefreshCw, Flame, Zap, Users,
  Star, ArrowRight, CheckCircle, Lock, Banknote, MessageSquare,
  TrendingUp, Globe, ChevronRight
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  isFeatured: boolean;
  seller: {
    storeName: string;
    averageRating: number;
  };
}

const FEATURED_GAMES = [
  { name: 'Free Fire', slug: 'free-fire', icon: '🔥', color: 'from-orange-500/20 to-red-500/10' },
  { name: 'COD Mobile', slug: 'cod-mobile', icon: '💣', color: 'from-green-500/20 to-emerald-500/10' },
  { name: 'Blood Strike', slug: 'blood-strike', icon: '🩸', color: 'from-red-500/20 to-rose-500/10' },
  { name: 'Delta Force', slug: 'delta-force', icon: '🪖', color: 'from-yellow-500/20 to-amber-500/10' },
  { name: 'PUBG Mobile', slug: 'pubg-mobile', icon: '🔫', color: 'from-blue-500/20 to-cyan-500/10' },
  { name: 'Valorant', slug: 'valorant', icon: '🎯', color: 'from-rose-500/20 to-pink-500/10' },
  { name: 'Roblox', slug: 'roblox', icon: '🧱', color: 'from-cyan-500/20 to-blue-500/10' },
  { name: 'Mobile Legends', slug: 'mobile-legends', icon: '⚔️', color: 'from-purple-500/20 to-violet-500/10' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Lock className="w-6 h-6 text-brand" />,
    title: 'Find What You Want',
    desc: 'Browse thousands of verified listings across all your favourite games. Filter by game, rank, platform, region, and price.',
  },
  {
    step: '02',
    icon: <Banknote className="w-6 h-6 text-brand" />,
    title: 'Pay Into Escrow',
    desc: 'Your payment is locked securely in Velxo Escrow — never sent to the seller until you confirm delivery. Zero risk.',
  },
  {
    step: '03',
    icon: <Zap className="w-6 h-6 text-brand" />,
    title: 'Seller Delivers',
    desc: 'The seller transfers the account, coins, or completes the service. You chat directly through our secure messenger.',
  },
  {
    step: '04',
    icon: <CheckCircle className="w-6 h-6 text-brand" />,
    title: 'Confirm & Done',
    desc: 'Happy with the delivery? Confirm receipt and funds are released. Not happy? Open a dispute and we step in.',
  },
];

const TRUST_STATS = [
  { icon: <Users className="w-6 h-6 text-brand" />, value: '10,000+', label: 'Active Traders' },
  { icon: <TrendingUp className="w-6 h-6 text-brand" />, value: '50,000+', label: 'Orders Completed' },
  { icon: <Globe className="w-6 h-6 text-brand" />, value: '20+', label: 'Countries Served' },
  { icon: <Star className="w-6 h-6 text-brand" />, value: '4.9/5', label: 'Average Rating' },
];

const CATEGORIES = [
  { name: 'Game Accounts', desc: 'Ranked & unranked', href: '/search?category=accounts', icon: '🎮' },
  { name: 'Top-Ups & Coins', desc: 'Diamonds, UC, CP & more', href: '/search?category=topups', icon: '💎' },
  { name: 'Gift Cards', desc: 'All major platforms', href: '/search?category=giftcards', icon: '🎁' },
  { name: 'Boosting Services', desc: 'Rank up fast', href: '/search?category=boosting', icon: '🚀' },
];

const TESTIMONIALS = [
  {
    name: 'Emeka O.',
    location: 'Lagos, Nigeria',
    text: 'Sold my Free Fire account in 2 hours and got paid instantly. Never going back to Telegram groups.',
    rating: 5,
    initials: 'EO',
  },
  {
    name: 'Amina K.',
    location: 'Nairobi, Kenya',
    text: 'The escrow system is a game changer. Bought a PUBG account and the seller couldn\'t scam me even if they tried.',
    rating: 5,
    initials: 'AK',
  },
  {
    name: 'Kwame A.',
    location: 'Accra, Ghana',
    text: 'Spent 2 years getting scammed on Discord. Finally a platform where gaming trades actually feel safe.',
    rating: 5,
    initials: 'KA',
  },
];

export default function Homepage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const response = await fetch('http://localhost:3001/api/v1/listings/featured');
        if (response.ok) {
          const result = await response.json();
          setListings(result.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="space-y-16">

      {/* ─── HERO ─── */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-dark/40 via-background to-cyan-900/20 border border-borderBg py-14 px-6 md:px-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand-light text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-brand/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Africa&apos;s No.1 Escrow Gaming Marketplace
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white">
            Trade Gaming Assets <br className="hidden sm:block" />
            <span className="text-gradient">Without the Fear.</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
            Buy and sell game accounts, coins, top-ups, and boosting services — fully protected by Velxo Escrow. Your money only moves when you&apos;re happy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Search games, accounts, coins..."
              className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand transition text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && window.location.assign(`/search?query=${encodeURIComponent(search)}`)}
            />
            <Link
              href={`/search?query=${encodeURIComponent(search)}`}
              className="bg-brand hover:bg-brand-dark px-6 py-3.5 rounded-xl font-bold text-center transition shadow-lg shadow-brand/20 text-white text-sm whitespace-nowrap"
            >
              Search
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/escrow"
              className="flex items-center gap-2 bg-background border border-borderBg hover:border-brand/40 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 transition"
            >
              <ShieldCheck className="w-4 h-4 text-brand" />
              How Escrow Works
            </Link>
            <Link
              href="/sell"
              className="flex items-center gap-2 bg-background border border-borderBg hover:border-brand/40 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 transition"
            >
              <TrendingUp className="w-4 h-4 text-brand" />
              Start Selling
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 bg-background border border-borderBg hover:border-brand/40 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 transition"
            >
              <Users className="w-4 h-4 text-brand" />
              About Velxo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TRUST_STATS.map((stat) => (
          <div key={stat.label} className="bg-cardBg border border-borderBg rounded-2xl p-5 text-center space-y-2">
            <div className="flex justify-center">{stat.icon}</div>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* ─── POPULAR GAMES ─── */}
      <section className="space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Top Games</h2>
            <p className="text-gray-400 text-sm mt-0.5">Tap a game to browse live listings</p>
          </div>
          <Link href="/search" className="text-brand text-sm font-semibold flex items-center gap-1 hover:text-brand-light transition">
            All Games <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {FEATURED_GAMES.map((game) => (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className={`bg-gradient-to-br ${game.color} border border-borderBg hover:border-brand/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition text-center group`}
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{game.icon}</span>
              <span className="text-xs font-bold text-gray-200 leading-tight">{game.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="space-y-5">
        <h2 className="text-2xl font-extrabold text-white">What Can You Trade?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl p-5 space-y-2 transition group"
            >
              <span className="text-3xl">{cat.icon}</span>
              <p className="font-bold text-white text-sm group-hover:text-brand transition">{cat.name}</p>
              <p className="text-xs text-gray-500">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="space-y-6" id="how-it-works">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">How It Works</h2>
          <p className="text-gray-400 text-sm">Four simple steps to a safe trade</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3 relative">
              <div className="absolute top-4 right-4 text-xs font-black text-brand/30 text-2xl">{step.step}</div>
              <div className="w-11 h-11 bg-brand/10 rounded-xl flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="font-bold text-white">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/escrow"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white text-sm shadow-lg shadow-brand/20"
          >
            Learn More About Escrow <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="bg-cardBg border border-borderBg rounded-3xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h3 className="font-bold text-white">Escrow Guaranteed</h3>
              <p className="text-sm text-gray-400 mt-1">Payments are held secure until the buyer confirms the item is delivered successfully.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h3 className="font-bold text-white">Fraud Protection</h3>
              <p className="text-sm text-gray-400 mt-1">Our moderation system monitors listings and orders constantly for buyer security and platform integrity.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h3 className="font-bold text-white">Fast Dispute Resolution</h3>
              <p className="text-sm text-gray-400 mt-1">Moderators review disputed orders within 24–48 hours and issue fair, evidence-based decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED LISTINGS ─── */}
      <section className="space-y-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-2xl font-extrabold text-white">Featured Offers</h2>
          </div>
          <Link href="/search" className="text-brand hover:text-brand-light text-sm font-semibold flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-5 h-52 animate-pulse space-y-3">
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                <div className="h-5 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                <div className="h-9 bg-gray-700 rounded mt-auto"></div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-cardBg border border-borderBg rounded-2xl">
            <Gamepad2 className="w-12 h-12 text-brand/20 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No featured offers right now. Check back shortly!</p>
            <Link href="/search" className="mt-3 inline-block text-brand font-semibold text-sm hover:underline">Browse all listings</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map((item) => (
              <div key={item.id} className="glow-card border border-borderBg p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="bg-brand/10 text-brand-light text-xs font-semibold px-2 py-0.5 rounded border border-brand/20">
                      {item.gameName}
                    </span>
                    <span className="text-xs text-gray-500">{item.region}</span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-2 mb-2 hover:text-brand transition">
                    <Link href={`/listings/${item.id}`}>{item.title}</Link>
                  </h3>
                  <p className="text-xs text-gray-400">
                    by <span className="text-brand-light">{item.seller?.storeName}</span>
                    {' '}· {item.seller?.averageRating?.toFixed(1) || '0.0'} ★
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-borderBg pt-3 mt-3">
                  <span className="text-xl font-black text-white">${Number(item.price).toFixed(2)}</span>
                  <Link
                    href={`/listings/${item.id}`}
                    className="bg-brand hover:bg-brand-dark px-3 py-1.5 rounded-lg text-xs font-semibold transition text-white"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-white">Trusted by Gamers Across Africa</h2>
          <p className="text-gray-400 text-sm">Real traders. Real results.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-brand fill-brand" />
                ))}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 border-t border-borderBg pt-4">
                <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black text-sm">
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHY VELXO / FOUNDER ─── */}
      <section className="bg-cardBg border border-borderBg rounded-3xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Built by a gamer, <span className="text-brand">for gamers.</span>
          </h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            Velxo was founded by <span className="text-white font-bold">Badeji Precious</span> — a gamer who experienced first-hand how broken and unsafe trading was on Telegram groups and Discord servers in Africa.
          </p>
          <p className="text-gray-400 leading-relaxed text-sm">
            The vision was simple: build one trusted platform where African gamers can buy and sell anything — accounts, coins, top-ups, gift cards — with zero risk of scams, backed by a real escrow system.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/about" className="bg-brand hover:bg-brand-dark px-5 py-3 rounded-xl font-bold transition text-white text-sm text-center">
              Our Story
            </Link>
            <Link href="/careers" className="bg-background border border-borderBg hover:border-brand/40 px-5 py-3 rounded-xl font-bold transition text-gray-300 text-sm text-center">
              We&apos;re Hiring
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🛡️', title: 'Escrow Protected', desc: 'Every single transaction' },
            { icon: '⚡', title: 'Instant Delivery', desc: 'Most transfers in minutes' },
            { icon: '💬', title: 'Live Chat', desc: 'Direct buyer-seller comms' },
            { icon: '🌍', title: 'Africa-First', desc: 'Local payments supported' },
          ].map((item) => (
            <div key={item.title} className="bg-background border border-borderBg rounded-xl p-4 space-y-1">
              <span className="text-2xl">{item.icon}</span>
              <p className="font-bold text-white text-sm">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SELLER CTA ─── */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand/20 to-cyan-900/20 border border-brand/20 p-8 md:p-12 text-center space-y-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative space-y-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Ready to turn your gaming assets into cash?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Join thousands of sellers earning on Velxo. List your first item for free in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sell" className="bg-brand hover:bg-brand-dark px-8 py-3.5 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20">
              Start Selling Now
            </Link>
            <Link href="/pricing" className="bg-background border border-borderBg hover:border-brand/40 px-8 py-3.5 rounded-xl font-bold transition text-gray-300">
              View Pricing
            </Link>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-500 pt-2">
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> No listing fees</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 10% fee only on sales</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Instant wallet payouts</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Escrow on every order</span>
          </div>
        </div>
      </section>

      {/* ─── QUICK LINKS / UNDERSTAND ─── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <ShieldCheck className="w-5 h-5 text-brand" />, label: 'How Escrow Works', href: '/escrow' },
          { icon: <MessageSquare className="w-5 h-5 text-brand" />, label: 'Help & Support', href: '/support' },
          { icon: <Award className="w-5 h-5 text-brand" />, label: 'Seller Guidelines', href: '/seller/guidelines' },
          { icon: <Banknote className="w-5 h-5 text-brand" />, label: 'Fees & Pricing', href: '/pricing' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl p-4 flex items-center gap-3 transition group"
          >
            <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition leading-tight">{item.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand transition ml-auto" />
          </Link>
        ))}
      </section>

    </div>
  );
}
