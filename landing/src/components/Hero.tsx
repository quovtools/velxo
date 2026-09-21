'use client';
import React from 'react';
import { ShieldCheck, Lock, Star, TrendingUp, ArrowRight, Search, Zap, Users } from 'lucide-react';

const GAMES = [
  { name: 'Free Fire', slug: 'free-fire' },
  { name: 'PUBG Mobile', slug: 'pubg-mobile' },
  { name: 'COD Mobile', slug: 'cod-mobile' },
  { name: 'Blood Strike', slug: 'blood-strike' },
  { name: 'eFootball', slug: 'efootball' },
];

const STATS = [
  { value: '50K+', label: 'Active Traders' },
  { value: '₦2.5B+', label: 'Secured in Escrow' },
  { value: '99.8%', label: 'Delivery Rate' },
  { value: '4.9★', label: 'Avg. Rating' },
];

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16"
    >
      {/* ── Background layers ── */}
      <div className="pointer-events-none absolute inset-0 hero-bg" />
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60" />
      <div className="noise-bg pointer-events-none absolute inset-0 opacity-40" />
      {/* Gold glow orbs */}
      <div className="pointer-events-none absolute -top-32 left-1/3 h-[500px] w-[500px] rounded-full bg-brand/6 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-brand/4 blur-[100px]" />

      <div className="container-x relative py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">

          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-brand/25 bg-brand/8 px-5 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Escrow-Protected Gaming Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1 id="hero-heading"
            className="mx-auto text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl md:text-7xl">
            Buy, Sell &amp; Trade{' '}
            <span className="text-gradient">Gaming Accounts</span>
            <br className="hidden sm:block" /> Safely
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            Discover verified Free Fire, PUBG Mobile, COD Mobile accounts, top-ups and boosting services.
            Every transaction secured by Piyrox Trust-Trade escrow.
          </p>

          {/* Search bar */}
          <form action="https://app.piyrox.shop/search" method="GET"
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input type="text" name="query"
                placeholder="Search game accounts, top-ups, boosting..."
                className="w-full rounded-2xl border border-white/15 bg-white/5 py-4 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-brand/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.08)]"
              />
            </div>
            <button type="submit"
              className="btn-primary whitespace-nowrap px-8 py-4 text-sm rounded-2xl">
              <Search className="h-4 w-4" /> Search
            </button>
          </form>

          {/* Quick-filter chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {GAMES.map(g => (
              <a key={g.slug}
                href={`https://app.piyrox.shop/games/${g.slug}`}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-gray-400 transition hover:border-brand/35 hover:bg-brand/6 hover:text-brand">
                {g.name}
              </a>
            ))}
          </div>

          {/* Primary CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="https://app.piyrox.shop" className="btn-primary gap-2.5 px-8 py-4 text-base rounded-2xl">
              Browse Marketplace <ArrowRight className="h-4 w-4" />
            </a>
            <a href="https://app.piyrox.shop/sell"
              className="btn-secondary gap-2.5 px-8 py-4 text-base rounded-2xl">
              Start Selling
            </a>
          </div>

          {/* Trust pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: ShieldCheck, text: 'Escrow on every trade' },
              { icon: Lock, text: 'Funds held until delivery' },
              { icon: Star, text: 'Verified sellers' },
              { icon: Zap, text: 'Instant payments' },
            ].map(({ icon: Icon, text }) => (
              <div key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-xs font-medium text-gray-400">
                <Icon className="h-3.5 w-3.5 text-brand flex-shrink-0" /> {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="glass rounded-2xl p-5 text-center">
                <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
                <p className="mt-1 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
