import React from 'react';
import { ShieldCheck } from 'lucide-react';

const ITEMS = [
  'Free Fire', 'COD Mobile', 'PUBG Mobile', 'Blood Strike', 'Delta Force',
  'Valorant', 'Roblox', 'Mobile Legends', 'Fortnite', 'Clash of Clans',
  'Genshin Impact', 'FIFA Mobile', 'Brawl Stars', 'League of Legends',
];

export default function Marquee() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <section aria-label="Supported games" className="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-4">
      <div className="flex animate-marquee whitespace-nowrap will-change-transform">
        {doubled.map((item, i) => (
          <span key={i} aria-hidden={i >= ITEMS.length} className="inline-flex items-center gap-2 px-6 text-sm font-semibold text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
