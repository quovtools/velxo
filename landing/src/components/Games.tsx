'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';

const GAMES = [
  { name: 'Free Fire',   slug: 'free-fire',   tag: 'Battle Royale', color: '#FF4500' },
  { name: 'PUBG Mobile', slug: 'pubg-mobile', tag: 'Battle Royale', color: '#F5A623' },
  { name: 'COD Mobile',  slug: 'cod-mobile',  tag: 'FPS Shooter',   color: '#00CC66' },
  { name: 'Blood Strike',slug: 'blood-strike',tag: 'FPS Shooter',   color: '#CC0000' },
  { name: 'eFootball',   slug: 'efootball',   tag: 'Sports',        color: '#00C8FF' },
];

export default function Games() {
  return (
    <section id="games" aria-labelledby="games-heading" className="section container-x">
      <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <span className="eyebrow">Popular Games</span>
          <h2 id="games-heading" className="heading-xl">
            Your favourite games,{' '}
            <span className="text-gradient">all in one place</span>
          </h2>
        </div>
        <a href="https://app.piyrox.shop/games"
          className="group inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-brand-light transition hover:text-white">
          Browse all games <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {GAMES.map((game) => (
          <li key={game.slug}>
            <a href={`https://app.piyrox.shop/games/${game.slug}`} className="card-surface group block h-full">
              <div
                className="absolute inset-x-0 top-0 h-0.5 opacity-60 transition-opacity group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, ${game.color}, transparent)` }}
              />
              <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <img
                  src={`/games/${game.slug}.png`}
                  alt={`${game.name} on Piyrox`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (t.src.endsWith('.png')) t.src = `/games/${game.slug}.jpg`;
                    else if (t.src.endsWith('.jpg')) t.src = `/games/${game.slug}.svg`;
                    else t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231a1a2e'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              <h3 className="text-sm font-bold text-white transition-colors group-hover:text-brand-light">{game.name}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{game.tag}</p>
              <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100">
                Browse listings <ArrowRight className="h-3 w-3" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
