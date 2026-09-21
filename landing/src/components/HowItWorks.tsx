import React from 'react';
import { Search, Lock, Zap, CheckCircle, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: Search,
    color: 'text-brand',
    bg: 'bg-brand/10 border-brand/20',
    accent: 'from-brand/20',
    title: 'Find Your Listing',
    desc: 'Browse thousands of verified listings. Filter by game, rank, region, platform, and price range.',
  },
  {
    num: '02',
    icon: Lock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    accent: 'from-blue-500/15',
    title: 'Pay Into Escrow',
    desc: 'Your payment is instantly locked in Piyrox Trust-Trade escrow. The seller cannot access funds until delivery.',
  },
  {
    num: '03',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    accent: 'from-yellow-500/15',
    title: 'Seller Delivers',
    desc: 'The seller transfers accounts or completes the boost via our encrypted real-time messaging system.',
  },
  {
    num: '04',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    accent: 'from-green-500/15',
    title: 'Confirm & Get Paid',
    desc: "Confirm receipt and funds release instantly to the seller. Not satisfied? Open a dispute — we'll resolve it.",
  },
];

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

      <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.num}>
              <div className="card-surface group h-full">
                {/* Top accent bar */}
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${step.accent} to-transparent`} />

                {/* Step number watermark */}
                <span className="absolute right-5 top-5 select-none text-6xl font-black leading-none text-white/[0.04]">
                  {step.num}
                </span>

                {/* Icon */}
                <div className={`relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${step.bg}`}>
                  <Icon className={`h-5 w-5 ${step.color}`} />
                </div>

                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-600">Step {step.num}</p>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{step.desc}</p>

                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100">
                  Learn more <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* CTA under steps */}
      <div className="mt-12 text-center">
        <a href="https://app.piyrox.shop/auth/register" className="btn-primary px-10 py-4 text-base rounded-2xl">
          Start Trading Now <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
