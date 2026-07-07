import React from 'react';
import { ShieldCheck, Zap, Globe, Users } from 'lucide-react';

const VALUES = [
  { icon: <ShieldCheck className="w-5 h-5 text-brand" />, title: 'Trust First', desc: 'Every decision we make puts trader safety above everything else.' },
  { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: 'Built for Speed', desc: 'Instant listings, fast payouts, real-time chat — built for the pace of gaming.' },
  { icon: <Globe className="w-5 h-5 text-brand-accent" />, title: 'Africa-Focused', desc: 'Local payments, regional games, and African currencies — no workarounds needed.' },
  { icon: <Users className="w-5 h-5 text-brand-light" />, title: 'Community Driven', desc: 'Built by gamers, for gamers. The platform evolves with our community.' },
];

export default function About() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left — story */}
          <div className="p-10 lg:p-14 space-y-6 border-b lg:border-b-0 lg:border-r border-[#1F2937]">
            <span className="inline-block text-xs font-bold text-brand-light uppercase tracking-widest bg-brand/10 px-4 py-2 rounded-full border border-brand/20">
              Our Story
            </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Built by a gamer,{' '}
                <span>for gamers.</span>
              </h2>
            <p className="text-gray-400 leading-relaxed">
              Velxo was founded by{' '}
              <span className="text-white font-bold">Badeji Precious</span> — a gamer who experienced first-hand how broken and dangerous gaming trade was across Africa. Telegram scams, Discord fraudsters, and no recourse when things went wrong.
            </p>
            <p className="text-gray-400 leading-relaxed">
              The vision was simple: build one trusted, Africa-first marketplace where gamers can buy and sell accounts, coins, top-ups, and services — with a real escrow system, real dispute resolution, and real accountability.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Today, thousands of traders across Nigeria, Ghana, Kenya, Uganda, and beyond use Velxo every day. And we&apos;re just getting started.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
               <a href="https://market.velxo.shop/about"
                className="text-center px-6 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl text-sm transition">
                 Read Full Story
               </a>
               <a href="https://market.velxo.shop/careers"
                className="text-center px-6 py-3 border border-border hover:border-brand/40 text-gray-300 hover:text-white font-semibold rounded-xl text-sm transition">
                 Join the Team
               </a>
            </div>
          </div>

          {/* Right — values */}
          <div className="p-10 lg:p-14 space-y-6">
            <h3 className="text-xl font-bold text-white">What drives us</h3>
            <div className="space-y-5">
              {VALUES.map((v) => (
                <div key={v.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0b0f19] border border-[#1F2937] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {v.icon}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm mb-1">{v.title}</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Founder card */}
            <div className="mt-6 bg-background border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-accent flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                BP
              </div>
              <div>
                <p className="font-black text-white">Badeji Precious</p>
                <p className="text-xs text-brand-light font-semibold">Founder & CEO, Velxo</p>
                <p className="text-xs text-gray-500 mt-1">Building Africa's gaming economy, one safe trade at a time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
