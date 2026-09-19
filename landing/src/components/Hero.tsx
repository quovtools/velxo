'use client';
import React from 'react';
import { ShieldCheck, Zap, ArrowRight, Star, TrendingUp, Lock, Search } from 'lucide-react';

const TRUST = [
  { icon: <ShieldCheck className="h-3.5 w-3.5 text-brand" />, text: 'Escrow on every trade' },
  { icon: <Lock className="h-3.5 w-3.5 text-brand" />,        text: 'Payment held until delivery' },
  { icon: <Star className="h-3.5 w-3.5 text-brand" />,        text: 'Verified sellers' },
  { icon: <TrendingUp className="h-3.5 w-3.5 text-brand" />,  text: 'Gaming marketplace' },
];

const GAMES = ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'Blood Strike', 'eFootball'];

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-brand-radial" />
      <div className="pointer-events-none absolute inset-0 bg-dotgrid opacity-40" />
      <div className="noise-bg pointer-events-none absolute inset-0 opacity-50" />
      <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-brand/6 blur-3xl" />
      <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-brand/4 blur-3xl" />

      <div className="container-x relative py-24 text-center">
        {/* Eyebrow badge */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/8 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Escrow-Protected Gaming Marketplace
          </span>
        </div>

        {/* Headline — matches architecture image */}
        <h1 id="hero-heading" className="mx-auto max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
          Buy, Sell &amp; Trade{' '}
          <span className="text-gradient">Gaming Accounts</span>{' '}
          Safely
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
          Discover verified Free Fire, PUBG Mobile, COD Mobile accounts, top-ups and boosting services.
          Every transaction secured by Piyrox Escrow.
        </p>

        {/* Search bar */}
        <form
          action="https://app.piyrox.shop/search"
          method="GET"
          className="mx-auto mt-10 flex max-w-2xl flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              name="query"
              placeholder="Search accounts, games, top-ups, boosting..."
              className="w-full rounded-2xl border border-white/15 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-brand/50 focus:bg-white/[0.07]"
            />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap">
            <Search className="h-4 w-4" /> Search
          </button>
        </form>

        {/* Quick filters */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {GAMES.map(g => (
            <a key={g} href={`https://app.piyrox.shop/search?query=${encodeURIComponent(g)}`}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:border-brand/30 hover:text-brand">
              {g}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="https://app.piyrox.shop" className="btn-primary text-base">
            Browse Marketplace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a href="https://app.piyrox.shop/sell" className="btn-secondary text-base">
            Sell on Piyrox
          </a>
        </div>

        {/* Trust pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          {TRUST.map((pill) => (
            <div key={pill.text} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-300">
              {pill.icon} {pill.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
