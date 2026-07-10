import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MessageCircle, Twitter, Youtube, Instagram, Users, Trophy, Gamepad2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: "Community",
  description: "Join tens of thousands of African gamers, traders, and creators in the Velxo community. Discord, social channels, events, referrals, and more.",
  keywords: ["gaming community africa", "velxo discord", "esports africa", "gamer community"],
  alternates: { canonical: "https://velxo.shop/community" },
  openGraph: {
    title: "Community — Velxo",
    description: "Join Africa's fastest-growing gaming trade community.",
    url: "https://velxo.shop/community",
    siteName: "Velxo",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Velxo Community" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community — Velxo",
    description: "Join Africa's fastest-growing gaming trade community.",
    images: ["/og.png"],
  },
};

const CHANNELS = [
  {
    icon: <MessageCircle className="w-6 h-6 text-[#5865F2]" />,
    name: 'Discord Server',
    desc: 'Join 5,000+ traders in our Discord. Get trading tips, report scammers, and connect with other gamers.',
    cta: 'Join Discord',
    href: 'https://discord.gg/velxo',
    color: 'border-[#5865F2]/30 hover:border-[#5865F2]/60',
    badge: '5K+ members',
  },
  {
    icon: <Twitter className="w-6 h-6 text-[#1DA1F2]" />,
    name: 'Twitter / X',
    desc: 'Follow us for market updates, new feature drops, giveaways, and the latest gaming news across Africa.',
    cta: 'Follow @velxoshop',
    href: 'https://twitter.com/velxoshop',
    color: 'border-[#1DA1F2]/30 hover:border-[#1DA1F2]/60',
    badge: 'Daily updates',
  },
  {
    icon: <Instagram className="w-6 h-6 text-[#E1306C]" />,
    name: 'Instagram',
    desc: 'Behind the scenes, seller spotlights, game highlights, and exclusive community giveaways.',
    cta: 'Follow on Instagram',
    href: 'https://instagram.com/velxoshop',
    color: 'border-[#E1306C]/30 hover:border-[#E1306C]/60',
    badge: 'Weekly drops',
  },
  {
    icon: <Youtube className="w-6 h-6 text-red-500" />,
    name: 'YouTube',
    desc: 'Tutorials, how-to guides, marketplace reviews, and interviews with top Velxo sellers.',
    cta: 'Subscribe',
    href: 'https://youtube.com/@velxo',
    color: 'border-red-500/30 hover:border-red-500/60',
    badge: 'New videos weekly',
  },
];

const PROGRAMS = [
  {
    icon: <Trophy className="w-6 h-6 text-yellow-400" />,
    title: 'Tournaments & Events',
    desc: 'Velxo hosts WhatsApp and online gaming tournaments with real cash prizes for African gamers. Join the next event.',
  },
  {
    icon: <Users className="w-6 h-6 text-brand" />,
    title: 'Referral Program',
    desc: 'Refer a friend who completes their first trade — you both earn. No cap on referrals, no expiry on your rewards.',
  },
  {
    icon: <Gamepad2 className="w-6 h-6 text-accent" />,
    title: 'Verified Seller Community',
    desc: 'Top-performing sellers get verified badges, priority placement, and exclusive access to seller-only resources.',
  },
];

export default function CommunityPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

          {/* Header */}
          <div className="text-center space-y-5">
            <span className="inline-block text-xs font-bold text-brand-light uppercase tracking-widest bg-brand/10 px-4 py-2 rounded-full border border-brand/20">
              Community
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight">
              Africa&apos;s gaming{' '}
              <span className="text-gradient">community hub</span>
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Join tens of thousands of gamers, traders, and hustlers building the African gaming economy together.
            </p>
          </div>

          {/* Social channels */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white text-center">Join the conversation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CHANNELS.map((ch) => (
                <a key={ch.name} href={ch.href} target="_blank" rel="noopener noreferrer"
                  className={`bg-surface border ${ch.color} rounded-2xl p-6 space-y-4 transition-all duration-300 card-glow group`}>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                      {ch.icon}
                    </div>
                     <span className="text-[10px] font-bold text-gray-500 bg-background px-2 py-1 rounded-full border border-border">
                      {ch.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{ch.name}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{ch.desc}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-brand-light group-hover:gap-2 transition-all">
                    {ch.cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Community programs */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white text-center">Community programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PROGRAMS.map((p) => (
                <div key={p.title} className="bg-surface border border-border hover:border-brand/30 rounded-2xl p-7 space-y-4 transition card-glow">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                    {p.icon}
                  </div>
                  <h3 className="font-bold text-white">{p.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Join CTA */}
          <div className="relative bg-gradient-to-br from-brand/15 to-accent/10 border border-brand/25 rounded-3xl p-12 text-center space-y-6">
            <h3 className="text-3xl font-black text-white">Ready to be part of it?</h3>
            <p className="text-gray-400 max-w-md mx-auto">Create your free account and join Africa&apos;s fastest-growing gaming trade community.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://market.velxo.shop/auth/register"
                className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3.5 rounded-xl text-sm transition shadow-lg shadow-brand/25">
                Create Free Account
              </a>
              <a href="https://discord.gg/velxo" target="_blank" rel="noopener noreferrer"
                className="border border-border hover:border-brand/40 text-gray-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition">
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
