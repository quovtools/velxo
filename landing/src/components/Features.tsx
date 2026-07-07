import React from 'react';
import {
  ShieldCheck, Zap, MessageSquare, BarChart3,
  Globe, CreditCard, AlertTriangle, Star
} from 'lucide-react';

const FEATURES = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-[#8B5CF6]" />,
    title: 'Escrow Protection',
    desc: 'Every single trade is protected. Funds are held until you confirm delivery — 100% of the time, no exceptions.',
    highlight: true,
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: 'Instant Delivery',
    desc: 'Most accounts, coins, and top-ups are delivered within minutes. Sellers who delay get flagged automatically.',
    highlight: false,
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-[#06B6D4]" />,
    title: 'Encrypted Messaging',
    desc: 'Communicate directly with buyers and sellers through our real-time encrypted chat — no phone numbers needed.',
    highlight: false,
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
    title: 'Seller Analytics',
    desc: 'Track your store performance, earnings, ratings, and order history from a clean, powerful seller dashboard.',
    highlight: false,
  },
  {
    icon: <Globe className="w-6 h-6 text-[#A78BFA]" />,
    title: 'African Payment Methods',
    desc: 'Paystack, Flutterwave, mobile money, and crypto — we support the way Africans actually pay.',
    highlight: false,
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-orange-400" />,
    title: 'Dispute Resolution',
    desc: 'Our moderation team reviews all disputes within 24–48 hours and issues evidence-based, fair resolutions.',
    highlight: false,
  },
  {
    icon: <Star className="w-6 h-6 text-yellow-400" />,
    title: 'Verified Sellers',
    desc: 'Every seller builds a public reputation score. Ratings, response rate, and order history are all visible.',
    highlight: false,
  },
  {
    icon: <CreditCard className="w-6 h-6 text-[#06B6D4]" />,
    title: 'Instant Payouts',
    desc: 'Sellers receive earnings in their Velxo wallet within seconds of escrow release. Withdraw in 1–3 days.',
    highlight: false,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <span className="inline-block text-xs font-bold text-[#A78BFA] uppercase tracking-widest bg-[#8B5CF6]/10 px-4 py-2 rounded-full border border-[#8B5CF6]/20">
          Platform Features
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-white">
          Everything you need to{' '}
          <span className="text-gradient">trade safely</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Velxo is built from the ground up for African gamers — with tools that make trading as easy and safe as buying from a real store.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className={`relative bg-[#111827] rounded-2xl p-6 transition-all duration-300 card-glow ${
              f.highlight
                ? 'border border-[#8B5CF6]/40 ring-1 ring-[#8B5CF6]/20'
                : 'border border-[#1F2937] hover:border-[#8B5CF6]/20'
            }`}
          >
            {f.highlight && (
              <div className="absolute -top-3 left-5">
                <span className="bg-[#8B5CF6] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-[#8B5CF6]/30">
                  Core Feature
                </span>
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-[#0b0f19] border border-[#1F2937] flex items-center justify-center mb-4">
              {f.icon}
            </div>
            <h3 className="font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
