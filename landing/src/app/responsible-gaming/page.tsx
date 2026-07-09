import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, AlertTriangle, Phone, Heart, CheckCircle, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: "Responsible Gaming",
  description: "Velxo is a safe, fair, and transparent peer-to-peer gaming marketplace — not a gambling platform. Learn about our safety principles and commitments.",
  keywords: ["responsible gaming", "safe gaming marketplace", "velxo safety", "anti scam gaming"],
  alternates: { canonical: "https://velxo.shop/responsible-gaming" },
  openGraph: {
    title: "Responsible Gaming — Velxo",
    description: "Safe trading, always. How Velxo protects its community.",
    url: "https://velxo.shop/responsible-gaming",
    siteName: "Velxo",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Velxo Responsible Gaming" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Responsible Gaming — Velxo",
    description: "Safe trading, always. How Velxo protects its community.",
    images: ["/og.png"],
  },
};

const PRINCIPLES = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
    title: 'Age Verification',
    desc: 'Velxo requires all users to be at least 16 years old. We actively review accounts and remove underage users from the platform.',
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-[#8B5CF6]" />,
    title: 'Transparent Pricing',
    desc: 'All fees, commissions, and charges are clearly disclosed before any transaction. No hidden costs, ever.',
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
    title: 'Fraud Prevention',
    desc: 'Our escrow system and moderation team actively protect buyers and sellers from fraudulent listings, account recovery scams, and bad actors.',
  },
  {
    icon: <Heart className="w-6 h-6 text-red-400" />,
    title: 'Player Wellbeing',
    desc: 'We encourage healthy gaming habits. Velxo is a marketplace, not a gambling platform — no loot boxes, no random chance mechanics.',
  },
  {
    icon: <BookOpen className="w-6 h-6 text-[#06B6D4]" />,
    title: 'Education First',
    desc: 'We publish guides, safety tips, and scam alerts to help our community stay informed and trade safely.',
  },
  {
    icon: <Phone className="w-6 h-6 text-[#A78BFA]" />,
    title: 'Support Access',
    desc: 'Our support team is available 7 days a week. Any user can report a concern, dispute an order, or request account help at any time.',
  },
];

const COMMITMENTS = [
  'We will never facilitate or encourage addictive spending behavior',
  'We enforce strict seller guidelines to prevent deceptive listings',
  'All disputes are handled fairly and transparently by human moderators',
  'We respond to all safety reports within 24 hours',
  'We cooperate with authorities when fraud or illegal activity is reported',
  'We maintain a safe and respectful platform for all ages 16 and above',
];

export default function ResponsibleGamingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0b0f19] pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          {/* Header */}
          <div className="text-center space-y-4">
            <span className="inline-block text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
              Responsible Gaming
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              Safe trading,{' '}
              <span className="text-gradient">always.</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Velxo is committed to providing a safe, fair, and transparent marketplace. Here&apos;s how we protect our community.
            </p>
          </div>

          {/* Notice box */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">Velxo is NOT a gambling platform</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Velxo is a peer-to-peer marketplace for gaming digital assets. There are no loot boxes, no random chance mechanics, and no gambling of any kind. All transactions are fixed-price, transparent, and escrow-protected.
              </p>
            </div>
          </div>

          {/* Principles */}
          <div className="space-y-5">
            <h2 className="text-2xl font-black text-white">Our safety principles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-3 card-glow">
                  <div className="w-11 h-11 rounded-xl bg-[#0b0f19] border border-[#1F2937] flex items-center justify-center">
                    {p.icon}
                  </div>
                  <h3 className="font-bold text-white">{p.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Commitments */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8 space-y-5">
            <h2 className="text-xl font-black text-white">Our commitments to you</h2>
            <ul className="space-y-3">
              {COMMITMENTS.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Report & Help */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 space-y-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h3 className="font-bold text-white">Report a safety concern</h3>
              <p className="text-sm text-gray-400">If you encounter a scam, underage user, harassment, or any safety issue on Velxo, report it immediately.</p>
              <a href="https://market.velxo.shop/support" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition">
                Report Now
              </a>
            </div>
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-4">
              <Phone className="w-8 h-8 text-[#8B5CF6]" />
              <h3 className="font-bold text-white">Need help?</h3>
              <p className="text-sm text-gray-400">Our support team is here 7 days a week. Contact us for any platform concern or question.</p>
              <a href="mailto:safety@velxo.shop" className="inline-block bg-[#8B5CF6] hover:bg-[#6D28D9] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition">
                safety@velxo.shop
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
