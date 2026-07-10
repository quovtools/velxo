'use client';
import React from 'react';
import { ShieldCheck, Zap, ArrowRight, Star, TrendingUp } from 'lucide-react';

const STATS = [
  { value: '10K+', label: 'Active Traders' },
  { value: '50K+', label: 'Orders Completed' },
  { value: '$2M+', label: 'Safely Traded' },
  { value: '4.9/5', label: 'Avg Rating' },
];

const TRUST = [
  { icon: <ShieldCheck className="h-3.5 w-3.5 text-accent-emerald" />, text: 'Escrow on every trade' },
  { icon: <Zap className="h-3.5 w-3.5 text-yellow-400" />, text: 'Instant delivery' },
  { icon: <Star className="h-3.5 w-3.5 text-brand-light" />, text: 'Verified sellers' },
  { icon: <TrendingUp className="h-3.5 w-3.5 text-brand-400" />, text: 'Trusted across Africa' },
];

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-brand-radial" />
      <div className="pointer-events-none absolute inset-0 bg-dotgrid opacity-50" />
      <div className="noise-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />

      <div className="container-x relative py-24 text-center">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent-emerald" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-light">
            Africa&apos;s No.1 Escrow Gaming Marketplace
          </span>
        </div>

        <h1 id="hero-heading" className="mx-auto max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
          Trade Games.{' '}
          <span className="text-gradient">Zero Risk.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
          Buy and sell game accounts, coins, top-ups, and boosting services with full escrow protection.
          Your money only moves when you&apos;re satisfied — guaranteed.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="https://market.velxo.shop/auth/register" className="btn-primary text-base">
            Start Trading Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a href="https://market.velxo.shop" className="btn-secondary text-base">
            Browse Marketplace
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          {TRUST.map((pill) => (
            <div key={pill.text} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-300">
              {pill.icon} {pill.text}
            </div>
          ))}
        </div>

        {/* Stats */}
        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-background/60 px-4 py-6 backdrop-blur">
              <dt className="text-2xl font-black text-white sm:text-3xl">{s.value}</dt>
              <dd className="mt-1 text-xs font-medium text-gray-500">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
