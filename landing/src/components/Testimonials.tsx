import React from 'react';
import { ShieldCheck, Lock, Users, Zap, MessageSquare, BadgeCheck } from 'lucide-react';

const TRUST_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Escrow Protection',
    desc: 'Payment is held securely until the buyer confirms delivery. Zero risk of losing money or goods.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Sellers',
    desc: 'Sellers go through KYC verification. View ratings, completed orders, and full history.',
  },
  {
    icon: Lock,
    title: 'Secure Transactions',
    desc: 'All payments run through the platform with industry-standard security and fraud detection.',
  },
  {
    icon: MessageSquare,
    title: 'Encrypted Chat',
    desc: 'Communicate in real-time through our built-in messenger. No external contacts required.',
  },
  {
    icon: Zap,
    title: 'Fast Delivery',
    desc: 'Sellers deliver accounts, top-ups and services directly through the platform — tracked live.',
  },
  {
    icon: Users,
    title: 'Dispute Resolution',
    desc: 'Our team reviews disputes and works toward evidence-based, fair resolutions for both parties.',
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="trust-heading" className="section container-x">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="eyebrow">Why Piyrox</span>
        <h2 id="trust-heading" className="heading-lg">
          Built around <span className="text-gradient">trust &amp; safety</span>
        </h2>
        <p className="text-lg text-gray-400">
          Every feature on Piyrox is designed to protect both buyers and sellers.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <li key={f.title} className="card-surface">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand/20 bg-brand/8">
                <Icon className="h-5 w-5 text-brand" />
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
