import React from 'react';
import { Search, Lock, Zap, CheckCircle, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: <Search className="h-7 w-7 text-brand-400" />,
    title: 'Find Your Listing',
    desc: 'Browse thousands of verified listings. Filter by game, rank, region, platform, and price to find exactly what you need.',
    color: 'from-brand-500/30 to-transparent',
  },
  {
    step: '02',
    icon: <Lock className="h-7 w-7 text-accent" />,
    title: 'Pay Into Escrow',
    desc: 'Your payment is instantly locked in Velxo Escrow. The seller cannot touch it until you confirm successful delivery.',
    color: 'from-accent/30 to-transparent',
  },
  {
    step: '03',
    icon: <Zap className="h-7 w-7 text-yellow-400" />,
    title: 'Seller Delivers',
    desc: 'The seller transfers accounts, coins, or completes the boost. Chat in real-time through our encrypted messenger.',
    color: 'from-yellow-500/30 to-transparent',
  },
  {
    step: '04',
    icon: <CheckCircle className="h-7 w-7 text-accent-emerald" />,
    title: 'Confirm & Release',
    desc: 'Happy with the delivery? Confirm receipt and funds release instantly. Not satisfied? Open a dispute — we step in.',
    color: 'from-accent-emerald/30 to-transparent',
  },
];

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div className="card-surface group">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${step.color}`} />
      <span className="absolute right-5 top-5 select-none text-5xl font-black leading-none text-white/5">
        {step.step}
      </span>
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        {step.icon}
      </div>
      <h3 className="text-lg font-bold text-white">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{step.desc}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-light opacity-0 transition group-hover:opacity-100">
        Step {step.step} <ArrowRight className="h-3 w-3" />
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="section container-x">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="eyebrow">How It Works</span>
        <h2 id="how-heading" className="heading-xl">
          Trade in <span className="text-gradient">4 simple steps</span>
        </h2>
        <p className="text-lg text-gray-400">
          Every transaction is protected from start to finish. Your money never touches the seller until you&apos;re satisfied.
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <li key={step.step}>
            <StepCard step={step} />
          </li>
        ))}
      </ol>
    </section>
  );
}
