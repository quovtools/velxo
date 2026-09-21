import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

const PERKS = [
  'Free to browse',
  '10% fee on sales only',
  'No listing fees',
  'Escrow on every order',
];

export default function CTA() {
  return (
    <section aria-labelledby="cta-heading" className="section container-x">
      <div className="relative overflow-hidden rounded-3xl border border-brand/25 p-12 text-center md:p-20"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(212,160,23,0.10), transparent 70%), #050505' }}>

        {/* Glow orbs */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-72 w-72 rounded-full bg-brand/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-brand/6 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30" />

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Turn your gaming assets into money
            </span>
          </div>

          <h2 id="cta-heading"
            className="mx-auto max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
            Ready to trade{' '}
            <span className="text-gradient">without fear?</span>
          </h2>

          <p className="mx-auto max-w-xl text-lg text-gray-400">
            Create your free account. Browse listings, sell your gaming assets, and experience trading the way it should be — safe, fast, and fair.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="https://app.piyrox.shop/auth/register" className="btn-primary px-10 py-4 text-base rounded-2xl">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </a>
            <a href="https://app.piyrox.shop" className="btn-secondary px-10 py-4 text-base rounded-2xl">
              Browse Marketplace
            </a>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-gray-500">
            {PERKS.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
