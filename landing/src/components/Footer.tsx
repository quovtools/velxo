'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Twitter, Instagram, Youtube, MessageCircle, ShieldCheck, ChevronDown } from 'lucide-react';

const isInternal = (href: string) => href.startsWith('/');

const LINKS = {
  Marketplace: [
    { label: 'Browse All Listings', href: 'https://market.velxo.shop' },
    { label: 'Game Accounts', href: 'https://market.velxo.shop/?category=accounts' },
    { label: 'Top-Ups & Coins', href: 'https://market.velxo.shop/?category=topups' },
    { label: 'Gift Cards', href: 'https://market.velxo.shop/?category=giftcards' },
    { label: 'Boosting Services', href: 'https://market.velxo.shop/?category=boosting' },
  ],
  Sellers: [
    { label: 'Start Selling', href: 'https://market.velxo.shop/sell' },
    { label: 'Seller Dashboard', href: 'https://market.velxo.shop/seller/dashboard' },
    { label: 'Seller Guidelines', href: 'https://market.velxo.shop/seller/guidelines' },
    { label: 'Pricing & Fees', href: 'https://market.velxo.shop/pricing' },
    { label: 'Affiliate Program', href: '/affiliate' },
  ],
  Support: [
    { label: 'Help Center', href: '/support' },
    { label: 'How Escrow Works', href: '/escrow' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Community', href: '/community' },
    { label: 'Responsible Gaming', href: '/responsible-gaming' },
  ],
  Company: [
    { label: 'About Velxo', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
    { label: 'Careers', href: '/careers' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

const SOCIALS = [
  { icon: <Twitter className="h-4 w-4" />, href: 'https://twitter.com/velxoshop', label: 'Twitter' },
  { icon: <Instagram className="h-4 w-4" />, href: 'https://instagram.com/velxoshop', label: 'Instagram' },
  { icon: <Youtube className="h-4 w-4" />, href: 'https://youtube.com/@velxo', label: 'YouTube' },
  { icon: <MessageCircle className="h-4 w-4" />, href: 'https://discord.gg/velxo', label: 'Discord' },
];

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
    <footer className="border-t border-white/10 bg-[#080b14]">
      <div className="container-x py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-6">
          {/* Brand */}
          <div className="space-y-5 md:col-span-2">
            <Link href="/" className="flex items-center gap-2" aria-label="Velxo home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent shadow-glow">
                <ShieldCheck className="h-5 w-5 text-white" />
              </span>
              <span className="text-2xl font-black tracking-wider text-white">VELXO</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              Africa&apos;s most trusted escrow-backed gaming marketplace. Buy and sell safely — every trade, every time.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-400 transition hover:border-brand/40 hover:text-brand-light">
                  {s.icon}
                </a>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-accent-emerald/20 bg-accent-emerald/10 px-3 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emerald opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald" />
              </span>
              <span className="text-xs font-semibold text-accent-emerald">Escrow Protected Platform</span>
            </div>
          </div>

          {/* Link sections */}
          {Object.entries(LINKS).map(([section, links]) => {
            const expanded = isDesktop || !!open[section];
            return (
              <div key={section} className="space-y-4">
                {isDesktop ? (
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">{section}</h4>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpen((p) => ({ ...p, [section]: !p[section] }))}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between text-sm font-bold uppercase tracking-wider text-white"
                  >
                    {section}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
                {expanded && (
                  <ul className="space-y-2.5">
                    {links.map((link) => (
                      <li key={link.label}>
                        {isInternal(link.href) ? (
                          <Link href={link.href} className="text-sm text-gray-400 transition hover:text-brand-light">
                            {link.label}
                          </Link>
                        ) : (
                          <a href={link.href} className="text-sm text-gray-400 transition hover:text-brand-light">
                            {link.label}
                          </a>
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
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-gray-500 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Velxo.shop — All rights reserved. Built for Africa&apos;s gaming community.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="transition hover:text-brand-light">Terms</Link>
            <Link href="/privacy" className="transition hover:text-brand-light">Privacy</Link>
            <Link href="/support" className="transition hover:text-brand-light">Support</Link>
          </div>
          <div className="flex items-center gap-2">
            <span>Founder:</span>
            <span className="font-semibold text-brand-light">Badeji Precious</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
