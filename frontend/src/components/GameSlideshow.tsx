'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
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
  /** Optional game logo + colour used when imageUrl is empty (fallback slides). */
  logo?: string;
  color?: string;
}

const SLIDE_BADGES = ['Most Popular', 'Top Seller', 'New Listings', 'Trending', 'Hot Deals'];

// Fallback slides are derived from the canonical game list so every supported
// game (Free Fire, COD Mobile, PUBG Mobile, eFootball, Blood Strike) is
// represented with its real logo — no hardcoded 3-game subset.
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
    'from-brand/80 via-brand-dark/60 to-background',
    'from-brand-accent/80 via-brand/60 to-background',
    'from-brand-light/80 via-brand/60 to-background',
    'from-brand-dark/80 via-brand/60 to-background',
    'from-brand-accent/80 via-brand-light/60 to-background',
  ];

export default function GameSlideshow() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    async function fetchSlides() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const res = await fetch(`${apiBase}/slides`);
        if (res.ok) {
          const data = await res.json();
          const active = (data.data || []).filter((s: Slide) => s.isActive);
          setSlides(active.length > 0 ? active : FALLBACK_SLIDES);
        } else {
          setSlides(FALLBACK_SLIDES);
        }
      } catch {
        setSlides(FALLBACK_SLIDES);
      }
    }
    fetchSlides();
  }, []);

  const goTo = useCallback((index: number) => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, slides.length]);

  const prev = useCallback(() => {
    goTo(current === 0 ? slides.length - 1 : current - 1);
  }, [current, slides.length, goTo]);

  const next = useCallback(() => {
    goTo(current === slides.length - 1 ? 0 : current + 1);
  }, [current, slides.length, goTo]);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];
  const gradient = GRADIENT_FALLBACKS[current % GRADIENT_FALLBACKS.length];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-borderBg h-[280px] sm:h-[360px] md:h-[420px] group">
      {/* Background image or gradient */}
      {slide.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: `url(${slide.imageUrl})` }}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`}>
          {slide.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.logo}
              alt=""
              aria-hidden="true"
              className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 w-28 h-28 sm:w-40 sm:h-40 object-contain opacity-25 drop-shadow-2xl pointer-events-none"
              draggable={false}
            />
          )}
        </div>
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Content */}
      <div
        className={`relative h-full flex flex-col justify-end p-6 sm:p-8 md:p-12 transition-all duration-[400ms] ${
          isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {slide.badge && (
          <span className="inline-flex items-center gap-1.5 bg-brand/20 border border-brand/30 text-brand-light text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit backdrop-blur-sm">
            {slide.badge}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight max-w-xl mb-2">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="text-sm sm:text-base text-gray-300 max-w-lg mb-4 line-clamp-2">
            {slide.subtitle}
          </p>
        )}
        <div className="flex items-center gap-3">
          {slide.linkHref && (
            <Link
              href={slide.linkHref}
              className="bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl text-sm font-bold transition text-white shadow-lg shadow-brand/20"
            >
              Browse Listings
            </Link>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Escrow Protected</span>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === current ? 'w-6 h-2 bg-brand' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
