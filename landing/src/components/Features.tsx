import React from 'react';
import {
  ShieldCheck, Zap, MessageSquare, BarChart3,
  Globe, CreditCard, AlertTriangle, Star
} from 'lucide-react';

const FEATURES = [
  {
    icon: <ShieldCheck className="h-6 w-6 text-brand-400" />,
    title: 'Escrow Protection',
    desc: 'Every single trade is protected. Funds are held until you confirm delivery — 100% of the time, no exceptions.',
    highlight: true,
  },
  {
    icon: <Zap className="h-6 w-6 text-yellow-400" />,
    title: 'Instant Delivery',
    desc: 'Most accounts, coins, and top-ups are delivered within minutes. Sellers who delay get flagged automatically.',
    highlight: false,
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-accent" />,
    title: 'Encrypted Messaging',
    desc: 'Communicate directly with buyers and sellers through our real-time encrypted chat — no phone numbers needed.',
    highlight: false,
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-accent-emerald" />,
    title: 'Seller Analytics',
    desc: 'Track your store performance, earnings, ratings, and order history from a clean, powerful seller dashboard.',
    highlight: false,
  },
  {
    icon: <Globe className="h-6 w-6 text-brand-light" />,
    title: 'African Payment Methods',
    desc: 'Paystack, Flutterwave, mobile money, and crypto — we support the way Africans actually pay.',
    highlight: false,
  },
  {
    icon: <AlertTriangle className="h-6 w-6 text-orange-400" />,
    title: 'Dispute Resolution',
    desc: 'Our moderation team reviews all disputes within 24–48 hours and issues evidence-based, fair resolutions.',
    highlight: false,
  },
  {
    icon: <Star className="h-6 w-6 text-yellow-400" />,
    title: 'Verified Sellers',
    desc: 'Every seller builds a public reputation score. Ratings, response rate, and order history are all visible.',
    highlight: false,
  },
  {
    icon: <CreditCard className="h-6 w-6 text-accent" />,
    title: 'Instant Payouts',
    desc: 'Sellers receive earnings in their Velxo wallet within seconds of escrow release. Withdraw in 1–3 days.',
    highlight: false,
  },
];

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="section container-x">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="eyebrow">Platform Features</span>
        <h2 id="features-heading" className="heading-xl">
          Everything you need to{' '}
          <span className="text-gradient">trade safely</span>
        </h2>
        <p className="text-lg text-gray-400">
          Velxo is built from the ground up for African gamers — with tools that make trading as easy and safe as buying from a real store.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <li key={f.title} className={f.highlight ? 'card-highlight' : 'card-surface'}>
            {f.highlight && (
              <span className="absolute -top-3 left-5 rounded-full bg-brand-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-glow">
                Core Feature
              </span>
            )}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              {f.icon}
            </div>
            <h3 className="font-bold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
