'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Twitter, Instagram, Youtube, MessageCircle, ShieldCheck, Zap, ChevronDown } from 'lucide-react';

const LINKS = {
  Marketplace: [
    { label: 'Browse Listings', href: 'https://app.piyrox.shop' },
    { label: 'Game Accounts', href: 'https://app.piyrox.shop/listings' },
    { label: 'Top-Ups & Coins', href: 'https://app.piyrox.shop/topups' },
    { label: 'Boosting Services', href: 'https://app.piyrox.shop/boosting' },
    { label: 'All Games', href: 'https://app.piyrox.shop/games' },
  ],
  Sellers: [
    { label: 'Start Selling', href: 'https://app.piyrox.shop/sell' },
    { label: 'Seller Dashboard', href: 'https://app.piyrox.shop/seller/dashboard' },
    { label: 'Pricing & Fees', href: '/#pricing' },
    { label: 'Affiliate Program', href: '/affiliate' },
    { label: 'KYC Verification', href: 'https://app.piyrox.shop/seller/kyc' },
  ],
  Support: [
    { label: 'Help Center', href: '/support' },
    { label: 'How Escrow Works', href: '/escrow' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Community', href: '/community' },
    { label: 'Responsible Gaming', href: '/responsible-gaming' },
  ],
  Company: [
    { label: 'About Piyrox', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
    { label: 'Careers', href: '/careers' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

const SOCIALS = [
  { icon: <Twitter className="h-4 w-4" />, href: 'https://twitter.com/piyroxshop', label: 'Twitter / X' },
  { icon: <Instagram className="h-4 w-4" />, href: 'https://instagram.com/piyroxshop', label: 'Instagram' },
  { icon: <Youtube className="h-4 w-4" />, href: 'https://youtube.com/@piyrox', label: 'YouTube' },
  { icon: <MessageCircle className="h-4 w-4" />, href: 'https://discord.gg/piyrox', label: 'Discord' },
];

const GAMES = ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'Blood Strike', 'eFootball'];

export default function Footer() {
  const [isDesktop, setIsDesktop] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <footer className="border-t border-[var(--border)] bg-black">

      {/* ── Trust banner ── */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="container-x py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-between">
            {[
              { icon: <ShieldCheck className="h-4 w-4 text-brand" />, label: 'Escrow on every trade' },
              { icon: <Zap className="h-4 w-4 text-brand" />, label: 'Instant payments' },
              { icon: <ShieldCheck className="h-4 w-4 text-brand" />, label: 'Verified sellers only' },
              { icon: <ShieldCheck className="h-4 w-4 text-brand" />, label: 'Dispute protection' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-400">
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer ── */}
      <div className="container-x py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-6">

          {/* Brand col */}
          <div className="space-y-5 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Piyrox home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 border border-brand/20 overflow-hidden">
                <img src="/logo.png" alt="Piyrox" className="h-7 w-7 object-contain" />
              </div>
              <span className="text-2xl font-black tracking-[0.15em] text-white">PIYROX</span>
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              Africa&apos;s most trusted escrow-backed gaming marketplace. Buy and sell safely — every trade, every time.
            </p>

            {/* Socials */}
            <div className="flex gap-2">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white/[0.04] text-gray-400 transition hover:border-brand/40 hover:text-brand hover:bg-brand/5">
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Status badge */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/8 px-3.5 py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <span className="text-xs font-semibold text-green-400">All systems operational</span>
            </div>

            {/* Supported games */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-600">Supported Games</p>
              <div className="flex flex-wrap gap-1.5">
                {GAMES.map(g => (
                  <a key={g} href={`https://app.piyrox.shop/games/${g.toLowerCase().replace(/\s+/g, '-')}`}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-gray-500 transition hover:border-brand/30 hover:text-brand">
                    {g}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => {
            const expanded = isDesktop || !!open[section];
            return (
              <div key={section} className="space-y-4">
                {isDesktop ? (
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">{section}</h4>
                ) : (
                  <button type="button" onClick={() => setOpen(p => ({ ...p, [section]: !p[section] }))}
                    className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-white">
                    {section}
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
                {expanded && (
                  <ul className="space-y-2.5">
                    {links.map((link) => (
                      <li key={link.label}>
                        {link.href.startsWith('http') ? (
                          <a href={link.href} className="text-sm text-gray-500 transition hover:text-brand">
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className="text-sm text-gray-500 transition hover:text-brand">
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)]">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-gray-600 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Piyrox — All rights reserved. Built for Africa&apos;s gaming community.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="transition hover:text-brand">Terms</Link>
            <Link href="/privacy" className="transition hover:text-brand">Privacy</Link>
            <Link href="/support" className="transition hover:text-brand">Support</Link>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="text-[10px] uppercase tracking-widest">PLAY · TRADE · EARN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
