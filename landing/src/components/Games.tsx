'use client';
import React from 'react';
import { ArrowRight, ShoppingBag, Zap, Gift } from 'lucide-react';

const GAMES = [
  {
    name: 'Free Fire',
    slug: 'free-fire',
    tag: 'Battle Royale',
    color: '#FF4500',
    services: ['Accounts', 'Top-Ups', 'Boosting'],
  },
  {
    name: 'PUBG Mobile',
    slug: 'pubg-mobile',
    tag: 'Battle Royale',
    color: '#F5A623',
    services: ['Accounts', 'UC Top-Up', 'Boosting'],
  },
  {
    name: 'COD Mobile',
    slug: 'cod-mobile',
    tag: 'FPS Shooter',
    color: '#00CC66',
    services: ['Accounts', 'CP Top-Up', 'Boosting'],
  },
  {
    name: 'Blood Strike',
    slug: 'blood-strike',
    tag: 'FPS Shooter',
    color: '#CC0000',
    services: ['Accounts', 'Gold Top-Up'],
  },
  {
    name: 'eFootball',
    slug: 'efootball',
    tag: 'Sports',
    color: '#00C8FF',
    services: ['Accounts', 'Coin Top-Up'],
  },
];

export default function Games() {
  return (
    <section id="games" aria-labelledby="games-heading" className="section container-x">
      <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <span className="eyebrow">Popular Games</span>
          <h2 id="games-heading" className="heading-lg">
            Your favourite games,{' '}
            <span className="text-gradient">all in one place</span>
          </h2>
          <p className="text-gray-400 max-w-lg">
            Buy accounts, in-game currency top-ups and boosting services for every major mobile title.
          </p>
        </div>
        <a href="https://app.piyrox.shop/games"
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-light whitespace-nowrap">
          Browse all games <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {GAMES.map((game) => (
          <li key={game.slug}>
            <a href={`https://app.piyrox.shop/games/${game.slug}`} className="card-surface group block h-full">
              {/* Top color accent */}
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl opacity-60 transition-opacity group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, ${game.color}, transparent)` }}
              />

              {/* Game logo */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                style={{ boxShadow: `0 0 20px ${game.color}15` }}>
                <img
                  src={`/games/${game.slug}.png`}
                  alt={`${game.name} on Piyrox`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (!t.dataset.fallback) {
                      t.dataset.fallback = '1';
                      t.src = `/games/${game.slug}.jpg`;
                    }
                  }}
                />
              </div>

              <h3 className="text-sm font-bold text-white transition-colors group-hover:text-brand">{game.name}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{game.tag}</p>

              {/* Service chips */}
              <div className="mt-3 flex flex-wrap gap-1">
                {game.services.map(s => (
                  <span key={s} className="rounded-md border border-white/8 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition-opacity group-hover:opacity-100">
                View listings <ArrowRight className="h-3 w-3" />
              </div>
            </a>
          </li>
        ))}
      </ul>

      {/* Service type cards below games */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: ShoppingBag,
            title: 'Game Accounts',
            desc: 'Buy verified gaming accounts with rare skins, high rank and progression — all escrow protected.',
            href: 'https://app.piyrox.shop/listings',
            color: 'text-brand',
            bg: 'bg-brand/8 border-brand/20',
          },
          {
            icon: Gift,
            title: 'Top-Ups & Coins',
            desc: 'Instantly top up your in-game currency — Diamonds, UC, CP, Gold and more.',
            href: 'https://app.piyrox.shop/topups',
            color: 'text-blue-400',
            bg: 'bg-blue-500/8 border-blue-500/20',
          },
          {
            icon: Zap,
            title: 'Boosting Services',
            desc: 'Rank up fast with professional boosters. Conqueror, Heroic, Global Elite — we deliver.',
            href: 'https://app.piyrox.shop/boosting',
            color: 'text-purple-400',
            bg: 'bg-purple-500/8 border-purple-500/20',
          },
        ].map(({ icon: Icon, title, desc, href, color, bg }) => (
          <a key={title} href={href}
            className="group flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-brand/20 hover:bg-brand/[0.03]">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-brand transition-colors">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
