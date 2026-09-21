'use client';

import React from 'react';
import { getGameLogo } from '@/lib/games';

interface GameIconProps {
  /** Game slug or display name. Resolved to the canonical logo path. */
  game: string;
  className?: string;
  /** Contain (default) shows the whole logo letterboxed; cover fills and crops. */
  fit?: 'contain' | 'cover';
}

// Tried in order when the canonical logo 404s. Extensions present in /public/games.
const FALLBACK_EXTS = ['png', 'jpg', 'svg'];

export default function GameIcon({ game, className = 'w-10 h-10', fit = 'contain' }: GameIconProps) {
  const base = `/games/${(game || '').trim().toLowerCase().replace(/\s+/g, '-')}`;
  const startSrc = getGameLogo(game);

  return (
    <div
      className={`${className} relative rounded-xl overflow-hidden flex-shrink-0 bg-[#0d0d16] flex items-center justify-center`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={startSrc}
        alt={game}
        className={`w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain p-[12%]'}`}
        draggable={false}
        onError={(e) => {
          const target = e.currentTarget;
          const tried = target.src;
          const nextExt = FALLBACK_EXTS.find((ext) => !tried.includes(`.${ext}`));
          if (nextExt) {
            target.src = `${base}.${nextExt}`;
            return;
          }
          // All asset extensions failed — hide the broken image and show the
          // game's initial on the brand-tinted tile instead of a generic icon.
          target.style.display = 'none';
          const el = target.parentElement;
          if (el && !el.querySelector('[data-game-fallback]')) {
            const letter = (game || '?').trim().charAt(0).toUpperCase();
            const span = document.createElement('span');
            span.setAttribute('data-game-fallback', 'true');
            span.className =
              'absolute inset-0 flex items-center justify-center text-white font-black select-none';
            span.style.fontSize = '45%';
            span.textContent = letter;
            el.appendChild(span);
          }
        }}
      />
    </div>
  );
}
