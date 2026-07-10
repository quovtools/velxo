import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Zap, Users, Globe, Award, TrendingUp, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Velxo',
  description: 'Velxo is a peer-to-peer, escrow-protected marketplace built for African gamers to safely buy and sell accounts, coins, top-ups, gift cards, and boosting services.',
  alternates: { canonical: 'https://velxo.shop/about' },
  openGraph: {
    title: 'About Velxo | Africa’s Escrow-Backed Gaming Marketplace',
    description: 'The marketplace Africa’s gamers deserve — safe, fast, escrow-protected gaming commerce.',
    url: 'https://velxo.shop/about',
    siteName: 'Velxo',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'About Velxo' }],
  },
};

const stats = [
  { label: 'Active Traders', value: '10,000+' },
  { label: 'Transactions Completed', value: '50,000+' },
  { label: 'Countries Served', value: '20+' },
  { label: 'Games Supported', value: '100+' },
];

const values = [
  { icon: <ShieldCheck className="w-6 h-6 text-brand-light" />, title: 'Trust First', desc: 'Every transaction is protected by our escrow system. Funds only move when both parties are satisfied.' },
  { icon: <Zap className="w-6 h-6 text-brand-light" />, title: 'Built for Speed', desc: 'Instant listings, fast payouts, and real-time messaging built for the pace of the gaming world.' },
  { icon: <Users className="w-6 h-6 text-brand-light" />, title: 'Community Driven', desc: "Velxo is built by gamers for gamers. Our platform evolves with the needs of Africa's gaming community." },
  { icon: <Globe className="w-6 h-6 text-brand-light" />, title: 'Africa-Focused', desc: 'We support local payment methods, regional games, and African currencies — no workarounds needed.' },
  { icon: <Award className="w-6 h-6 text-brand-light" />, title: 'Seller Reputation', desc: 'Our verified seller badges and reputation system ensure you always know who you’re trading with.' },
  { icon: <TrendingUp className="w-6 h-6 text-brand-light" />, title: 'Growing Ecosystem', desc: 'From Free Fire coins to boosting services, we’re constantly expanding to cover more games and asset types.' },
];

const team = [
  { name: 'Precious', role: 'Founder & CEO', initials: 'P' },
  { name: 'Operations Lead', role: 'Head of Operations', initials: 'O' },
  { name: 'Tech Lead', role: 'Lead Engineer', initials: 'T' },
  { name: 'Community Lead', role: 'Community & Growth', initials: 'C' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">

          {/* Hero */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <span className="eyebrow">Africa&apos;s Gaming Marketplace</span>
            <h1 className="heading-lg sm:heading-xl">
              We built the marketplace <br className="hidden sm:block" />
              <span className="text-gradient">Africa&apos;s gamers deserve.</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Velxo is a peer-to-peer escrow-backed platform where gamers buy and sell accounts, coins, top-ups, gift cards, and boosting services — safely, instantly, and without the fear of being scammed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://market.velxo.shop/search" className="btn-primary">Browse Marketplace</a>
              <a href="https://market.velxo.shop/sell" className="btn-secondary">Start Selling</a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-surface border border-border rounded-2xl p-6 text-center space-y-1">
                <p className="text-3xl font-extrabold text-gradient">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Story */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Why we built Velxo</h2>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                African gamers have always been underserved by global platforms. Payment methods don&apos;t work, platforms don&apos;t support local currencies, and scams are rampant on informal trading groups.
              </p>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                We built Velxo to fix that. A dedicated marketplace with escrow protection, local payment support, and a reputation system that makes every transaction trustworthy — whether you&apos;re buying a Free Fire account in Lagos or selling Roblox Robux in Nairobi.
              </p>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                Our mission is simple: make gaming commerce safe, fast, and accessible for every gamer on the continent.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-3xl p-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400 text-sm font-bold">Escrow Active</span>
              </div>
              <div className="space-y-3">
                {['Zero scams with escrow protection', 'Local payment methods supported', 'Instant digital delivery', 'Verified seller profiles', '24/7 dispute resolution'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <ShieldCheck className="w-4 h-4 text-brand-light flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="space-y-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">What drives us</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {values.map((v) => (
                <div key={v.title} className="bg-surface border border-border rounded-2xl p-6 space-y-3 hover:border-brand/40 transition card-glow">
                  <div className="w-11 h-11 bg-brand/10 rounded-xl flex items-center justify-center">{v.icon}</div>
                  <h3 className="font-bold text-white">{v.title}</h3>
                  <p className="text-sm text-gray-400">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">The team behind Velxo</h2>
              <p className="text-gray-400">A small, passionate team of gamers and builders.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {team.map((member) => (
                <div key={member.name} className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-brand/20 border-2 border-brand/30 flex items-center justify-center text-brand-light font-black text-xl mx-auto">{member.initials}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-surface border border-border rounded-3xl p-10 text-center space-y-5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Join Africa&apos;s gaming economy</h3>
            <p className="text-gray-400 max-w-lg mx-auto text-sm sm:text-base">
              Whether you&apos;re a buyer looking for deals or a seller building a store, Velxo is your platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://market.velxo.shop/auth/register" className="btn-primary">Create Account</a>
              <a href="https://velxo.shop/careers" className="btn-secondary">We&apos;re Hiring <ArrowRight className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
