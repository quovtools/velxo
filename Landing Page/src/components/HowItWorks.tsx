import React from 'react';
import { Search, Lock, Zap, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: <Search className="w-7 h-7 text-[#8B5CF6]" />,
    title: 'Find Your Listing',
    desc: 'Browse thousands of verified listings. Filter by game, rank, region, platform, and price to find exactly what you need.',
    color: 'from-[#8B5CF6]/20 to-transparent',
    border: 'border-[#8B5CF6]/20',
  },
  {
    step: '02',
    icon: <Lock className="w-7 h-7 text-[#06B6D4]" />,
    title: 'Pay Into Escrow',
    desc: 'Your payment is instantly locked in Velxo Escrow. The seller cannot touch it until you confirm successful delivery.',
    color: 'from-[#06B6D4]/20 to-transparent',
    border: 'border-[#06B6D4]/20',
  },
  {
    step: '03',
    icon: <Zap className="w-7 h-7 text-yellow-400" />,
    title: 'Seller Delivers',
    desc: 'The seller transfers accounts, coins, or completes the boost. Chat in real-time through our encrypted messenger.',
    color: 'from-yellow-500/20 to-transparent',
    border: 'border-yellow-500/20',
  },
  {
    step: '04',
    icon: <CheckCircle className="w-7 h-7 text-emerald-400" />,
    title: 'Confirm & Release',
    desc: 'Happy with the delivery? Confirm receipt and funds release instantly. Not satisfied? Open a dispute — we step in.',
    color: 'from-emerald-500/20 to-transparent',
    border: 'border-emerald-500/20',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <span className="inline-block text-xs font-bold text-[#A78BFA] uppercase tracking-widest bg-[#8B5CF6]/10 px-4 py-2 rounded-full border border-[#8B5CF6]/20">
          How It Works
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-white">
          Trade in <span className="text-gradient">4 simple steps</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Every transaction is protected from start to finish. Your money never touches the seller until you&apos;re satisfied.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step, i) => (
          <div key={i} className={`relative bg-[#111827] border ${step.border} rounded-3xl p-7 card-glow overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color}`} />
            <div className="absolute top-5 right-5 text-5xl font-black text-white/5 leading-none select-none">
              {step.step}
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#0b0f19] border border-[#1F2937] flex items-center justify-center mb-5">
              {step.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Connector line on desktop */}
      <div className="hidden lg:flex justify-center mt-8">
        <div className="flex items-center gap-0 w-full max-w-3xl px-12">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-px bg-gradient-to-r from-[#8B5CF6]/40 to-[#06B6D4]/40" />
          ))}
        </div>
      </div>
    </section>
  );
}
