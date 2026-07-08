import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Download, Mail, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: "Press & Media — Velxo",
  description: "Velxo press releases, media resources, and brand assets for journalists covering Africa's No.1 escrow-backed gaming marketplace.",
  alternates: { canonical: "https://velxo.shop/press" },
  openGraph: {
    title: "Press & Media — Velxo",
    description: "Press releases, media resources, and brand assets.",
    url: "https://velxo.shop/press",
    siteName: "Velxo",
    type: "website",
  },
};

const PRESS_RELEASES = [
  {
    date: 'July 2025',
    title: 'Velxo Launches Africa\'s First Escrow-Backed Gaming Marketplace',
    summary: 'Velxo officially launched its peer-to-peer gaming marketplace serving buyers and sellers across 20+ African countries with built-in escrow protection.',
  },
  {
    date: 'June 2025',
    title: 'Velxo Crosses 10,000 Active Traders in First Quarter',
    summary: 'The platform hit a major milestone, with over 10,000 registered traders and $2M+ in verified transactions processed through Velxo Escrow.',
  },
  {
    date: 'May 2025',
    title: 'Velxo Adds Crypto Payment Support for African Gamers',
    summary: 'In response to demand from the crypto-native gaming community, Velxo now supports Bitcoin, USDT (TRC20), and Solana for all marketplace transactions.',
  },
];

const BRAND_ASSETS = [
  { name: 'Velxo Logo (SVG)', size: 'Vector', type: 'svg' },
  { name: 'Velxo Logo (PNG, White)', size: '1024×1024', type: 'png' },
  { name: 'Velxo Logo (PNG, Dark)', size: '1024×1024', type: 'png' },
  { name: 'Brand Guidelines', size: 'PDF', type: 'pdf' },
];

export default function PressPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0b0f19] pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          {/* Header */}
          <div className="text-center space-y-4">
            <span className="inline-block text-xs font-bold text-[#A78BFA] uppercase tracking-widest bg-[#8B5CF6]/10 px-4 py-2 rounded-full border border-[#8B5CF6]/20">
              Press &amp; Media
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              Velxo in the{' '}
              <span className="text-gradient">news</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Press releases, media resources, and brand assets for journalists and publications covering Velxo.
            </p>
          </div>

          {/* Press releases */}
          <div className="space-y-5">
            <h2 className="text-2xl font-black text-white">Press Releases</h2>
            <div className="space-y-4">
              {PRESS_RELEASES.map((pr, i) => (
                <div key={i} className="bg-[#111827] border border-[#1F2937] hover:border-[#8B5CF6]/30 rounded-2xl p-6 transition flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{pr.date}</p>
                    <h3 className="font-bold text-white">{pr.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{pr.summary}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Brand assets */}
          <div className="space-y-5">
            <h2 className="text-2xl font-black text-white">Brand Assets</h2>
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
              {BRAND_ASSETS.map((asset, i) => (
                <div key={i} className={`flex items-center justify-between px-6 py-4 hover:bg-[#0b0f19]/50 transition ${i < BRAND_ASSETS.length - 1 ? 'border-b border-[#1F2937]' : ''}`}>
                  <div>
                    <p className="font-semibold text-white text-sm">{asset.name}</p>
                    <p className="text-xs text-gray-600">{asset.size}</p>
                  </div>
                  <button className="flex items-center gap-2 text-xs font-bold text-[#A78BFA] hover:text-white transition">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600">All brand assets are for editorial use only. Do not alter logos or brand colors.</p>
          </div>

          {/* Media contact */}
          <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#06B6D4]/5 border border-[#8B5CF6]/20 rounded-3xl p-10 text-center space-y-5">
            <Mail className="w-10 h-10 text-[#8B5CF6] mx-auto" />
            <h3 className="text-2xl font-black text-white">Media Enquiries</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              For interviews, partnerships, or press coverage, reach out to our communications team. We aim to respond within 24 hours.
            </p>
            <a href="mailto:press@velxo.shop"
              className="inline-block bg-[#8B5CF6] hover:bg-[#6D28D9] text-white font-bold px-8 py-3 rounded-xl text-sm transition">
              press@velxo.shop
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
