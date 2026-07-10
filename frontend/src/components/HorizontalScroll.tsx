'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A container that renders children in a horizontal scroll row with
 * left / right arrow buttons (visible on hover on desktop).
 */
export default function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!ref.current) return;
    const amount = ref.current.clientWidth * 0.75;
    ref.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className={`relative group/hscroll ${className}`}>
      {/* Left button */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-cardBg border border-borderBg shadow-lg flex items-center justify-center text-white opacity-0 group-hover/hscroll:opacity-100 transition -translate-x-1/2 hover:bg-brand hover:border-brand"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Scroll track */}
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth -mx-1 px-1"
      >
        {children}
      </div>

      {/* Right button */}
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-cardBg border border-borderBg shadow-lg flex items-center justify-center text-white opacity-0 group-hover/hscroll:opacity-100 transition translate-x-1/2 hover:bg-brand hover:border-brand"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
