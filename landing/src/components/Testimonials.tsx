import React from 'react';
import { Star, Quote } from 'lucide-react';

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
    <section aria-labelledby="testimonials-heading" className="section container-x">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="eyebrow">Testimonials</span>
        <h2 id="testimonials-heading" className="heading-xl">
          Trusted by gamers{' '}
          <span className="text-gradient">across Africa</span>
        </h2>
        <p className="text-lg text-gray-400">Real traders. Real transactions. Real results.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.handle} className="card-surface flex flex-col">
            <Quote className="h-6 w-6 text-brand-500/60" />
            <div className="mt-3 flex items-center gap-1" aria-label={`${t.rating} out of 5 stars`}>
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-gray-300">
              &ldquo;{t.text}&rdquo;
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ background: `${t.color}30`, border: `1.5px solid ${t.color}50` }}
                aria-hidden="true"
              >
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{t.name}</p>
                <p className="text-xs text-gray-500">{t.handle} · {t.location}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
