import React from 'react';
import { ShieldCheck, Lock, Users, Zap, MessageSquare, BadgeCheck } from 'lucide-react';

// Testimonials section removed — replaced with factual trust features.
// Per Piyrox product spec: do not display unverified user testimonials.
// When real user reviews are available via the API, this section
// should be re-enabled using live data from app.piyrox.shop/api/v1/reviews.

const TRUST_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Escrow Protection',
    desc: 'Payment is held securely until the buyer confirms delivery. No risk of losing money or goods.',
    color: '#D4A017',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Sellers',
    desc: 'Sellers go through a verification process. View ratings, completed orders, and history before buying.',
    color: '#D4A017',
  },
  {
    icon: Lock,
    title: 'Secure Transactions',
    desc: 'All payments are processed through our platform with standard security practices.',
    color: '#D4A017',
  },
  {
    icon: MessageSquare,
    title: 'Encrypted Chat',
    desc: 'Communicate directly with buyers and sellers in real-time through our built-in messenger.',
    color: '#D4A017',
  },
  {
    icon: Zap,
    title: 'Fast Delivery',
    desc: 'Sellers deliver accounts, top-ups and services directly through the platform.',
    color: '#D4A017',
  },
  {
    icon: Users,
    title: 'Dispute Resolution',
    desc: 'Our team reviews disputes and works toward evidence-based, fair resolutions for both parties.',
    color: '#D4A017',
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="trust-heading" className="section container-x">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="eyebrow">Why Piyrox</span>
        <h2 id="trust-heading" className="heading-xl">
          Built around <span className="text-gradient">trust & safety</span>
        </h2>
        <p className="text-lg text-gray-400">
          Every feature on Piyrox is designed to protect both buyers and sellers.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <li key={f.title} className="card-surface">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-brand/20 bg-brand/8">
                <Icon className="h-6 w-6 text-brand" />
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
