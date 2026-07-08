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
    <div className="relative overflow-hidden border-y border-[#1F2937] bg-[#111827]/50 py-4">
      <div className="flex animate-marquee whitespace-nowrap gap-0">
        {doubled.map((item, i) => (
          <span key={i} aria-hidden={i >= ITEMS.length} className="inline-flex items-center gap-2 px-6 text-sm font-semibold text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
