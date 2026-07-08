'use client';
import React from 'react';
import { ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';

const STATS = [
  { value: '10K+', label: 'Active Traders' },
  { value: '50K+', label: 'Orders Completed' },
  { value: '$2M+', label: 'Safely Traded' },
  { value: '4.9/5', label: 'Avg Rating' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 noise-bg pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="text-xs font-bold text-brand-light uppercase tracking-wider">Africa's No.1 Escrow Gaming Marketplace</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none text-white mb-6">
          Trade Games.{' '}
          <br className="hidden sm:block" />
          <span>Zero Risk.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Buy and sell game accounts, coins, top-ups, and boosting services with full escrow protection.
          Your money only moves when you&apos;re satisfied — guaranteed.
        </p>

        {/* CTA Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a
            href="https://market.velxo.shop/auth/register"
            className="group flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-brand/30 text-base hover:shadow-brand/50 hover:scale-105"
          >
            Start Trading Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="https://market.velxo.shop"
            className="flex items-center gap-2 bg-card hover:bg-border border border-border hover:border-brand/40 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base"
          >
            Browse Marketplace
          </a>
        </div>

        {/* Trust pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          {[
            { icon: <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />, text: 'Escrow on every trade' },
            { icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />, text: 'Instant delivery' },
            { icon: <Star className="w-3.5 h-3.5 text-brand-light" />, text: 'Verified sellers' },
          ].map((pill) => (
            <div key={pill.text} className="flex items-center gap-1.5 bg-card/80 border border-border rounded-full px-4 py-2 text-xs font-semibold text-gray-400">
              {pill.icon} {pill.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
