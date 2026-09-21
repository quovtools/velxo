import React from 'react';
import { ShieldCheck, Zap, Globe, Users } from 'lucide-react';

const VALUES = [
  { icon: ShieldCheck, color: 'text-brand', bg: 'bg-brand/10 border-brand/20', title: 'Trust First', desc: 'Every decision puts trader safety above everything else.' },
  { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', title: 'Built for Speed', desc: 'Instant listings, fast payouts, real-time chat — built for the pace of gaming.' },
  { icon: Globe, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', title: 'Africa-Focused', desc: 'Local payments, regional games, and African currencies — no workarounds needed.' },
  { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', title: 'Community Driven', desc: 'Built by gamers, for gamers. The platform evolves with our community.' },
];

export default function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="section container-x">
      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">

          {/* Story */}
          <div className="space-y-6 border-b border-[var(--border)] p-10 lg:border-b-0 lg:border-r lg:p-14">
            <span className="eyebrow">Our Story</span>
            <h2 id="about-heading" className="heading-md">
              Built by a gamer,{' '}
              <span className="text-gradient">for gamers.</span>
            </h2>
            <p className="leading-relaxed text-gray-400">
              Piyrox was founded by{' '}
              <span className="font-bold text-white">Badeji Precious</span> — a gamer who experienced first-hand how broken and dangerous gaming trade was across Africa. Telegram scams, Discord fraudsters, and no recourse when things went wrong.
            </p>
            <p className="leading-relaxed text-gray-400">
              The vision was simple: build one trusted, Africa-first marketplace where gamers can buy and sell accounts, coins, top-ups, and services — with a real escrow system, real dispute resolution, and real accountability.
            </p>
            <p className="leading-relaxed text-gray-400">
              Today, thousands of traders across Nigeria, Ghana, Kenya, Uganda, and beyond use Piyrox every day. And we&apos;re just getting started.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a href="/about" className="btn-primary">Read Full Story</a>
              <a href="/careers" className="btn-secondary">Join the Team</a>
            </div>
          </div>

          {/* Values */}
          <div className="space-y-6 p-10 lg:p-14">
            <h3 className="text-lg font-bold text-white">What drives us</h3>
            <ul className="space-y-5">
              {VALUES.map((v) => {
                const Icon = v.icon;
                return (
                  <li key={v.title} className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${v.bg}`}>
                      <Icon className={`h-4.5 w-4.5 ${v.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{v.title}</p>
                      <p className="text-sm leading-relaxed text-gray-400">{v.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Founder card */}
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white/[0.03] p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/15 border border-brand/25 text-sm font-black text-brand">
                BP
              </div>
              <div>
                <p className="font-black text-white">Badeji Precious</p>
                <p className="text-xs font-semibold text-brand">Founder &amp; CEO, Piyrox</p>
                <p className="mt-0.5 text-xs text-gray-500">Building Africa&apos;s gaming economy, one safe trade at a time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
