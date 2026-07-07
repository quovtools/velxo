'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';

const GAMES = [
  { name: 'Free Fire', slug: 'free-fire', tag: 'Battle Royale', color: '#FF4500', listings: '2,400+' },
  { name: 'COD Mobile', slug: 'cod-mobile', tag: 'FPS Shooter', color: '#00CC66', listings: '1,800+' },
  { name: 'PUBG Mobile', slug: 'pubg-mobile', tag: 'Battle Royale', color: '#F5A623', listings: '3,100+' },
  { name: 'Blood Strike', slug: 'blood-strike', tag: 'FPS Shooter', color: '#CC0000', listings: '900+' },
  { name: 'Delta Force', slug: 'delta-force', tag: 'Tactical', color: '#4A9EFF', listings: '600+' },
  { name: 'Valorant', slug: 'valorant', tag: 'Tactical FPS', color: '#FF4655', listings: '1,200+' },
  { name: 'Roblox', slug: 'roblox', tag: 'Sandbox', color: '#CC0000', listings: '2,000+' },
  { name: 'Mobile Legends', slug: 'mobile-legends', tag: 'MOBA', color: '#9B59B6', listings: '1,600+' },
  { name: 'eFootball', slug: 'efootball', tag: 'Sports', color: '#00C8FF', listings: '500+' },
];

export default function Games() {
  return (
    <section id="games" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
        <div className="space-y-3">
          <span className="inline-block text-xs font-bold text-[#A78BFA] uppercase tracking-widest bg-[#8B5CF6]/10 px-4 py-2 rounded-full border border-[#8B5CF6]/20">
            Top Games
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Your favourite games,{' '}
            <span className="text-gradient">all in one place</span>
          </h2>
        </div>
        <a
          href="https://market.velxo.shop"
          className="flex items-center gap-2 text-[#A78BFA] hover:text-white font-semibold text-sm transition whitespace-nowrap group"
        >
          Browse all games
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {GAMES.map((game) => (
          <a
            key={game.slug}
            href={`https://market.velxo.shop/games/${game.slug}`}
            className="group relative bg-[#111827] border border-[#1F2937] hover:border-[#8B5CF6]/40 rounded-2xl p-5 transition-all duration-300 card-glow overflow-hidden"
          >
            {/* Colored top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(90deg, ${game.color}, transparent)` }}
            />

            {/* Icon using local SVG */}
            <div className="w-14 h-14 rounded-xl overflow-hidden mb-4 bg-[#0b0f19] border border-[#1F2937]">
              <img
                src={`/games/${game.slug}.png`}
                alt={game.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  const tried = target.src;
                  const base = `/games/${game.slug}`;
                  if (!tried.includes('.jpg')) {
                    target.src = `${base}.jpg`;
                    return;
                  }
                  if (!tried.includes('.svg')) {
                    target.src = `${base}.svg`;
                    return;
                  }
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="14" fill="%231a1a2e"/%3E%3C/svg%3E';
                }}
              />
            </div>

            <h3 className="font-bold text-white text-sm mb-1 group-hover:text-[#A78BFA] transition-colors">
              {game.name}
            </h3>
            <p className="text-xs text-gray-600 mb-2">{game.tag}</p>
            <p className="text-xs font-bold" style={{ color: game.color }}>
              {game.listings} listings
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
