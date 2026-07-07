import React from 'react';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Emeka O.',
    handle: '@emeka_plays',
    location: 'Lagos, Nigeria',
    text: 'Sold my Free Fire account in under 2 hours and got paid instantly into my wallet. I\'ll never go back to Telegram groups.',
    rating: 5,
    initials: 'EO',
    color: '#FF4500',
  },
  {
    name: 'Amina K.',
    handle: '@aminagames',
    location: 'Nairobi, Kenya',
    text: 'The escrow is a genuine game changer. Bought a Valorant account and the seller couldn\'t scam me even if they tried.',
    rating: 5,
    initials: 'AK',
    color: '#8B5CF6',
  },
  {
    name: 'Kwame A.',
    handle: '@kwame_ff',
    location: 'Accra, Ghana',
    text: 'Spent 2 years getting scammed on Discord. Velxo is the first platform where I actually feel safe trading.',
    rating: 5,
    initials: 'KA',
    color: '#06B6D4',
  },
  {
    name: 'Fatima B.',
    handle: '@fatima_pubg',
    location: 'Abuja, Nigeria',
    text: 'I listed 3 PUBG accounts and all 3 sold within a week. The seller dashboard is clean and payouts are fast.',
    rating: 5,
    initials: 'FB',
    color: '#F5A623',
  },
  {
    name: 'Chidi N.',
    handle: '@chidi_roblox',
    location: 'Port Harcourt, Nigeria',
    text: 'Bought Robux top-up from a verified seller. Delivered in 10 minutes. Everything was exactly as described.',
    rating: 5,
    initials: 'CN',
    color: '#CC0000',
  },
  {
    name: 'Zara M.',
    handle: '@zara_gaming',
    location: 'Kampala, Uganda',
    text: 'Finally a marketplace built for Africa. Flutterwave payments work perfectly and I got my payout the same day.',
    rating: 5,
    initials: 'ZM',
    color: '#9B59B6',
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <span className="inline-block text-xs font-bold text-[#A78BFA] uppercase tracking-widest bg-[#8B5CF6]/10 px-4 py-2 rounded-full border border-[#8B5CF6]/20">
          Testimonials
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-white">
          Trusted by gamers{' '}
          <span className="text-gradient">across Africa</span>
        </h2>
        <p className="text-gray-400 text-lg">Real traders. Real transactions. Real results.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="bg-[#111827] border border-[#1F2937] hover:border-[#8B5CF6]/20 rounded-2xl p-6 space-y-4 transition-all duration-300 card-glow"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
              ))}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-3 pt-2 border-t border-[#1F2937]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: `${t.color}30`, border: `1.5px solid ${t.color}50` }}
              >
                {t.initials}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-xs text-gray-600">{t.handle} · {t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
