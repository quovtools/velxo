import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TrendingUp, Users, DollarSign, ArrowRight, CheckCircle, Share2 } from 'lucide-react';

export const metadata: Metadata = {
  title: "Affiliate Program",
  description: "Earn commission by referring traders to Africa's No.1 gaming marketplace. Tiered commissions up to 5% per trade, no cap, no expiry.",
  keywords: ["gaming affiliate", "earn money gaming", "velxo affiliate", "referral program africa"],
  alternates: { canonical: "https://velxo.shop/affiliate" },
  openGraph: {
    title: "Affiliate Program — Velxo",
    description: "Earn by sharing Velxo. Up to 5% commission per trade.",
    url: "https://velxo.shop/affiliate",
    siteName: "Velxo",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Velxo Affiliate Program" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Affiliate Program — Velxo",
    description: "Earn by sharing Velxo. Up to 5% commission per trade.",
    images: ["/og.png"],
  },
};

const HOW_IT_WORKS = [
  { step: '01', icon: <Share2 className="w-5 h-5 text-brand" />, title: 'Get Your Link', desc: 'Sign up and get a unique referral link tied to your account.' },
  { step: '02', icon: <Users className="w-5 h-5 text-accent" />, title: 'Share It', desc: 'Share your link on WhatsApp, TikTok, YouTube, Discord — anywhere your audience is.' },
  { step: '03', icon: <DollarSign className="w-5 h-5 text-emerald-400" />, title: 'Earn Commission', desc: 'Earn a commission on every completed trade your referrals make on Velxo.' },
  { step: '04', icon: <TrendingUp className="w-5 h-5 text-brand" />, title: 'Track & Withdraw', desc: 'Monitor clicks, signups, and earnings in your affiliate dashboard. Withdraw anytime.' },
];

const TIERS = [
  {
    name: 'Starter',
    referrals: '1–10 active users',
    commission: '2% per trade',
    perks: ['Unique referral link', 'Basic dashboard', 'Monthly payouts'],
    highlighted: false,
  },
  {
    name: 'Growth',
    referrals: '11–50 active users',
    commission: '3.5% per trade',
    perks: ['Everything in Starter', 'Priority support', 'Bi-weekly payouts', 'Co-marketing opportunities'],
    highlighted: true,
  },
  {
    name: 'Elite',
    referrals: '51+ active users',
    commission: '5% per trade',
    perks: ['Everything in Growth', 'Dedicated account manager', 'Weekly payouts', 'Custom promo materials', 'Featured in Velxo promotions'],
    highlighted: false,
  },
];

const IDEAL_PARTNERS = [
  'Gaming YouTubers & streamers',
  'TikTok gaming creators',
  'WhatsApp group admins',
  'Discord server owners',
  'Gaming bloggers & reviewers',
  'Esports commentators & casters',
  'Gaming community leaders',
  'Tech & gaming Twitter accounts',
];

export default function AffiliatePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

          {/* Header */}
          <div className="text-center space-y-5">
            <span className="inline-block text-xs font-bold text-brand-light uppercase tracking-widest bg-brand/10 px-4 py-2 rounded-full border border-brand/20">
              Affiliate Program
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight">
              Earn by sharing{' '}
              <span className="text-gradient">Velxo</span>
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Refer traders to Africa&apos;s No.1 gaming marketplace and earn commission on every trade they make. No cap. No expiry.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://market.velxo.shop/auth/register"
                className="group flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-2xl transition shadow-xl shadow-brand/25 text-base">
                Join the Program <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-white text-center">How the program works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={i} className="bg-surface border border-border rounded-2xl p-6 space-y-3 relative">
                  <div className="absolute top-4 right-4 text-4xl font-black text-white/5 leading-none select-none">{s.step}</div>
                  <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center">
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-white">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tiers */}
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-white text-center">Commission tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TIERS.map((tier) => (
                <div key={tier.name} className={`bg-surface rounded-3xl p-8 space-y-6 ${tier.highlighted ? 'border border-brand/40 ring-1 ring-brand/20' : 'border border-border'}`}>
                  {tier.highlighted && (
                    <div className="inline-block bg-brand text-white text-xs font-black uppercase tracking-wide px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-black text-white">{tier.name}</h3>
                     <p className="text-xs text-gray-500 mt-1">{tier.referrals}</p>
                    <p className="text-3xl font-black text-brand-light mt-3">{tier.commission}</p>
                  </div>
                  <ul className="space-y-2.5">
                    {tier.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Ideal partners */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white text-center">Who is this for?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {IDEAL_PARTNERS.map((p) => (
                <div key={p} className="bg-surface border border-border rounded-xl px-4 py-3 text-xs font-semibold text-gray-400 text-center">
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Apply CTA */}
          <div className="bg-gradient-to-br from-brand/15 to-accent/10 border border-brand/25 rounded-3xl p-12 text-center space-y-5">
            <h3 className="text-3xl font-black text-white">Ready to start earning?</h3>
            <p className="text-gray-400 max-w-md mx-auto">Create an account, get your link, and start referring today. No approval process needed.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://market.velxo.shop/auth/register"
                className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3.5 rounded-xl text-sm transition shadow-lg shadow-brand/25">
                Join Affiliate Program
              </a>
              <a href="mailto:affiliates@velxo.shop"
                className="border border-border hover:border-brand/40 text-gray-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition">
                affiliates@velxo.shop
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
