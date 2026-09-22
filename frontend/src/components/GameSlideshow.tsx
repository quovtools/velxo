'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, ShieldCheck, ArrowRight, Zap,
} from 'lucide-react';
import { GAME_LIST, GAME_CONFIG } from '@/lib/games';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkHref?: string;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
  logo?: string;
  color?: string;
}

const SLIDE_BADGES = ['Most Popular', 'Top Seller', 'New Listings', 'Trending', 'Hot Deals'];

const FALLBACK_SLIDES: Slide[] = GAME_LIST.map((g, i) => {
  const cfg = GAME_CONFIG[g.name];
  return {
    id: `f-${g.slug}`,
    title: `${g.name} Accounts & ${cfg?.currency.plural ?? 'Top-Ups'}`,
    subtitle: `Buy verified ${g.name} accounts, ${cfg?.currency.plural ?? 'currency'} top-ups and rank boosting. Every trade protected by Piyrox Escrow.`,
    imageUrl: '',
    linkHref: `/games/${g.slug}`,
    badge: SLIDE_BADGES[i % SLIDE_BADGES.length],
    isActive: true,
    sortOrder: i,
    logo: g.logo,
    color: g.color,
  };
});

const GRADIENT_FALLBACKS = [
  'from-amber-600/70 via-brand/40 to-black',
  'from-orange-600/70 via-brand/40 to-black',
  'from-yellow-600/70 via-amber-800/40 to-black',
  'from-brand/70 via-amber-700/40 to-black',
  'from-amber-700/70 via-orange-900/40 to-black',
];

/** The hero text "slide" that is always prepended as slide index 0 */
function HeroSlide() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20">
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,160,23,0.18),transparent)]" />
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-brand text-xs font-semibold px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Trust-Trade Escrow
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3 text-orange-400" /> Africa&apos;s #1 Gaming Marketplace
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4">
          Buy, Sell &amp; Trade<br />
          <span className="text-brand">Gaming Accounts</span><br />
          Without the Risk.
        </h1>

        <p className="text-sm md:text-base text-gray-400 mb-8 max-w-lg leading-relaxed">
          Accounts, top-ups and boosting for every major game — every trade held in
          escrow until you confirm delivery.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-brand hover:bg-amber-400 text-black font-bold px-7 py-3 rounded-xl transition shadow-lg shadow-brand/30 text-sm"
          >
            Browse Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-brand/30 text-white font-semibold px-7 py-3 rounded-xl transition text-sm"
          >
            Start Selling
          </Link>
        </div>
      </div>
    </div>
  );
}

/** A single fetched/fallback slide panel */
function GameSlidePannel({ slide, gradient }: { slide: Slide; gradient: string }) {
  return (
    <div className="absolute inset-0">
      {slide.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.imageUrl})` }}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
          {slide.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.logo}
              alt=""
              aria-hidden="true"
              className="absolute right-8 sm:right-16 top-1/2 -translate-y-1/2 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 object-contain opacity-20 drop-shadow-2xl pointer-events-none select-none"
              draggable={false}
            />
          )}
        </div>
      )}

      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

      {/* content */}
      <div className="relative h-full flex flex-col justify-end px-6 sm:px-12 lg:px-20 pb-16 sm:pb-20">
        {slide.badge && (
          <span className="inline-flex items-center gap-1.5 bg-brand/20 border border-brand/30 text-brand text-xs font-bold px-3 py-1 rounded-full mb-4 w-fit backdrop-blur-sm">
            {slide.badge}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-2xl mb-3">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="text-sm sm:text-base text-gray-300 max-w-lg mb-6 line-clamp-2 leading-relaxed">
            {slide.subtitle}
          </p>
        )}
        <div className="flex items-center gap-4">
          {slide.linkHref && (
            <Link
              href={slide.linkHref}
              className="inline-flex items-center gap-2 bg-brand hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-brand/25 text-sm"
            >
              Browse Listings <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Escrow Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameSlideshow() {
  const [uploadedSlides, setUploadedSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // total slides = hero (index 0) + uploaded/fallback slides
  const totalCount = 1 + uploadedSlides.length;

  useEffect(() => {
    async function fetchSlides() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const res = await fetch(`${apiBase}/slides`);
        if (res.ok) {
          const data = await res.json();
          const active = (data.data || []).filter((s: Slide) => s.isActive);
          setUploadedSlides(active.length > 0 ? active : FALLBACK_SLIDES);
        } else {
          setUploadedSlides(FALLBACK_SLIDES);
        }
      } catch {
        setUploadedSlides(FALLBACK_SLIDES);
      }
    }
    fetchSlides();
  }, []);

  const goTo = useCallback((index: number, dir: 'left' | 'right' = 'right') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 500);
  }, [animating]);

  const next = useCallback(() => {
    goTo(current === totalCount - 1 ? 0 : current + 1, 'right');
  }, [current, totalCount, goTo]);

  const prev = useCallback(() => {
    goTo(current === 0 ? totalCount - 1 : current - 1, 'left');
  }, [current, totalCount, goTo]);

  // auto-advance
  useEffect(() => {
    if (totalCount <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, totalCount]);

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[640px] overflow-hidden group">
      {/* ── Slides ── */}
      {/* Slide 0: Hero CTA */}
      <div
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          current === 0
            ? 'opacity-100 translate-x-0 z-10'
            : direction === 'right'
            ? 'opacity-0 -translate-x-16 z-0 pointer-events-none'
            : 'opacity-0 translate-x-16 z-0 pointer-events-none'
        }`}
      >
        <HeroSlide />
      </div>

      {/* Slides 1+: uploaded / fallback */}
      {uploadedSlides.map((slide, i) => {
        const slideIndex = i + 1;
        const isActive = current === slideIndex;
        const gradient = GRADIENT_FALLBACKS[i % GRADIENT_FALLBACKS.length];
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isActive
                ? 'opacity-100 translate-x-0 z-10'
                : direction === 'right'
                ? 'opacity-0 -translate-x-16 z-0 pointer-events-none'
                : 'opacity-0 translate-x-16 z-0 pointer-events-none'
            }`}
          >
            <GameSlidePannel slide={slide} gradient={gradient} />
          </div>
        );
      })}

      {/* ── Prev / Next ── */}
      {totalCount > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-brand/40 flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-brand/40 flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {totalCount > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {Array.from({ length: totalCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 'right' : 'left')}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2.5 bg-brand shadow-lg shadow-brand/40'
                  : 'w-2.5 h-2.5 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* slide counter top-right */}
      <div className="absolute top-5 right-5 z-20 text-[11px] font-bold text-white/40 tabular-nums select-none">
        {String(current + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
      </div>
    </div>
  );
}
