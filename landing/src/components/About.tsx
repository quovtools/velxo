import React from 'react';
import { ShieldCheck, Zap, Globe, Users } from 'lucide-react';

const VALUES = [
  { icon: <ShieldCheck className="h-5 w-5 text-brand-400" />, title: 'Trust First', desc: 'Every decision we make puts trader safety above everything else.' },
  { icon: <Zap className="h-5 w-5 text-yellow-400" />, title: 'Built for Speed', desc: 'Instant listings, fast payouts, real-time chat — built for the pace of gaming.' },
  { icon: <Globe className="h-5 w-5 text-accent-emerald" />, title: 'Africa-Focused', desc: 'Local payments, regional games, and African currencies — no workarounds needed.' },
  { icon: <Users className="h-5 w-5 text-brand-light" />, title: 'Community Driven', desc: 'Built by gamers, for gamers. The platform evolves with our community.' },
];

export default function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="section container-x">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          <div className="space-y-6 border-b border-white/10 p-10 lg:p-14 lg:border-b-0 lg:border-r">
            <span className="eyebrow">Our Story</span>
            <h2 id="about-heading" className="heading-lg">
              Built by a gamer,{' '}
              <span className="text-gradient">for gamers.</span>
            </h2>
            <p className="leading-relaxed text-gray-400">
              Velxo was founded by{' '}
              <span className="font-bold text-white">Badeji Precious</span> — a gamer who experienced first-hand how broken and dangerous gaming trade was across Africa. Telegram scams, Discord fraudsters, and no recourse when things went wrong.
            </p>
            <p className="leading-relaxed text-gray-400">
              The vision was simple: build one trusted, Africa-first marketplace where gamers can buy and sell accounts, coins, top-ups, and services — with a real escrow system, real dispute resolution, and real accountability.
            </p>
            <p className="leading-relaxed text-gray-400">
              Today, thousands of traders across Nigeria, Ghana, Kenya, Uganda, and beyond use Velxo every day. And we&apos;re just getting started.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a href="https://market.velxo.shop/about" className="btn-primary w-full sm:w-auto">
                Read Full Story
              </a>
              <a href="https://market.velxo.shop/careers" className="btn-secondary w-full sm:w-auto">
                Join the Team
              </a>
            </div>
          </div>

          <div className="space-y-6 p-10 lg:p-14">
            <h3 className="text-xl font-bold text-white">What drives us</h3>
            <ul className="space-y-5">
              {VALUES.map((v) => (
                <li key={v.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    {v.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{v.title}</p>
                    <p className="text-sm leading-relaxed text-gray-400">{v.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-xl font-black text-white">
                BP
              </div>
              <div>
                <p className="font-black text-white">Badeji Precious</p>
                <p className="text-xs font-semibold text-brand-light">Founder & CEO, Velxo</p>
                <p className="mt-1 text-xs text-gray-500">Building Africa&apos;s gaming economy, one safe trade at a time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
