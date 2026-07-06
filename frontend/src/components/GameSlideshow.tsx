'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkHref?: string;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
}

const FALLBACK_SLIDES: Slide[] = [
  {
    id: 'f1',
    title: 'Free Fire Accounts & Diamonds',
    subtitle: 'Africa\'s most popular battle royale — buy ranked accounts, bundles, and top-ups with full escrow protection.',
    imageUrl: '',
    linkHref: '/games/free-fire',
    badge: '🔥 Most Popular',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'f2',
    title: 'COD Mobile — Gear Up',
    subtitle: 'CP top-ups, rare operator skins, and high-ranked accounts. Safe trades, instant delivery.',
    imageUrl: '',
    linkHref: '/games/cod-mobile',
    badge: '💣 Top Seller',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'f3',
    title: 'PUBG Mobile Marketplace',
    subtitle: 'UC top-ups, high-tier accounts, and season passes. All verified, all escrowed.',
    imageUrl: '',
    linkHref: '/games/pubg-mobile',
    badge: '🔫 New Listings',
    isActive: true,
    sortOrder: 2,
  },
];

const GRADIENT_FALLBACKS = [
  'from-orange-900/80 via-red-900/60 to-background',
  'from-green-900/80 via-emerald-900/60 to-background',
  'from-blue-900/80 via-cyan-900/60 to-background',
  'from-purple-900/80 via-violet-900/60 to-background',
  'from-rose-900/80 via-pink-900/60 to-background',
];

export default function GameSlideshow() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    async function fetchSlides() {
      try {
        const res = await fetch('http://localhost:3001/api/v1/slides');
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
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Content */}
      <div
        className={`relative h-full flex flex-col justify-end p-6 sm:p-8 md:p-12 transition-all duration-400 ${
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
