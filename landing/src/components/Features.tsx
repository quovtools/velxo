import React from 'react';
import {
  ShieldCheck, Zap, MessageSquare, BarChart3,
  Globe, CreditCard, AlertTriangle, Star
} from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldCheck,
    color: 'text-brand',
    bg: 'bg-brand/10 border-brand/20',
    title: 'Escrow Protection',
    desc: 'Every trade is protected. Funds are held until you confirm delivery — 100% of the time.',
    highlight: true,
  },
  {
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    title: 'Instant Delivery',
    desc: 'Most accounts and top-ups are delivered within minutes. Late sellers get flagged automatically.',
    highlight: false,
  },
  {
    icon: MessageSquare,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Encrypted Messaging',
    desc: 'Real-time encrypted chat between buyers and sellers. No phone numbers needed.',
    highlight: false,
  },
  {
    icon: BarChart3,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    title: 'Seller Analytics',
    desc: 'Track earnings, ratings, and order history from a powerful seller dashboard.',
    highlight: false,
  },
  {
    icon: Globe,
    color: 'text-brand',
    bg: 'bg-brand/10 border-brand/20',
    title: 'African Payments',
    desc: 'Paystack, Flutterwave, mobile money, and crypto — we support how Africans actually pay.',
    highlight: false,
  },
  {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    title: 'Dispute Resolution',
    desc: 'Our moderation team resolves all disputes within 24–48 hours with fair, evidence-based outcomes.',
    highlight: false,
  },
  {
    icon: Star,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    title: 'Verified Sellers',
    desc: 'Every seller builds a public reputation. Ratings, response rate, and order history are visible.',
    highlight: false,
  },
  {
    icon: CreditCard,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Instant Payouts',
    desc: 'Earnings hit your wallet the second escrow releases. Withdraw in 1–3 business days.',
    highlight: false,
  },
];

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="section container-x">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="eyebrow">Platform Features</span>
        <h2 id="features-heading" className="heading-lg">
          Everything you need to{' '}
          <span className="text-gradient">trade safely</span>
        </h2>
        <p className="text-lg text-gray-400">
          Built from the ground up for African gamers — tools that make trading as easy and safe as buying from a real store.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <li key={f.title}
              className={f.highlight ? 'card-highlight' : 'card-surface'}>
              {f.highlight && (
                <span className="absolute -top-3 left-5 rounded-full bg-brand px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-glow">
                  Core Feature
                </span>
              )}
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${f.bg}`}>
                <Icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.desc}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
