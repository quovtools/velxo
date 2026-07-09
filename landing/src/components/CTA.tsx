import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

const PERKS = [
  'No credit card required',
  'Free to browse',
  '10% fee on sales only',
  'Cancel anytime',
];

export default function CTA() {
  return (
    <section aria-labelledby="cta-heading" className="section container-x">
      <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/20 via-surface to-accent/10 p-12 text-center md:p-20">
        <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-accent-emerald" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-light">Join traders worldwide</span>
          </div>

          <h2 id="cta-heading" className="mx-auto max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
            Ready to trade{' '}
            <span className="text-gradient">without fear?</span>
          </h2>

          <p className="mx-auto max-w-xl text-lg text-gray-400">
            Create your free account today. Browse listings, sell your assets, and experience trading the way it should be — safe, fast, and fair.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="https://market.velxo.shop/auth/register" className="btn-primary text-base">
              Create Free Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="https://market.velxo.shop" className="btn-secondary text-base">
              Browse Marketplace
            </a>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-xs text-gray-500">
            {PERKS.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-accent-emerald" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
