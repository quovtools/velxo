import React from 'react';
import { Twitter, Instagram, Youtube, MessageCircle } from 'lucide-react';

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
    { label: 'Help Center', href: 'https://market.velxo.shop/support' },
    { label: 'How Escrow Works', href: 'https://market.velxo.shop/escrow' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Community', href: '/community' },
    { label: 'Responsible Gaming', href: '/responsible-gaming' },
  ],
  Company: [
    { label: 'About Velxo', href: 'https://market.velxo.shop/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
    { label: 'Careers', href: 'https://market.velxo.shop/careers' },
    { label: 'Terms of Service', href: 'https://market.velxo.shop/terms' },
    { label: 'Privacy Policy', href: 'https://market.velxo.shop/privacy' },
  ],
};

const SOCIALS = [
  { icon: <Twitter className="w-4 h-4" />, href: 'https://twitter.com/velxoshop', label: 'Twitter' },
  { icon: <Instagram className="w-4 h-4" />, href: 'https://instagram.com/velxoshop', label: 'Instagram' },
  { icon: <Youtube className="w-4 h-4" />, href: 'https://youtube.com/@velxo', label: 'YouTube' },
  { icon: <MessageCircle className="w-4 h-4" />, href: 'https://discord.gg/velxo', label: 'Discord' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <a href="#" className="flex items-center gap-2">
              <img src="/logo.png" alt="Velxo" className="w-9 h-9 rounded-xl object-cover" />
              <span className="text-2xl font-black tracking-wider">VELXO</span>
            </a>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Africa&apos;s most trusted escrow-backed gaming marketplace. Buy and sell safely — every trade, every time.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-gray-500 hover:text-white hover:border-brand/40 transition">
                  {s.icon}
                </a>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-brand-accent text-xs font-semibold">Escrow Protected Platform</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section} className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-500 hover:text-white text-sm transition">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Velxo.shop — All rights reserved. Built for Africa&apos;s gaming community.</p>
          <div className="flex gap-5">
            <a href="https://market.velxo.shop/terms" className="hover:text-white transition">Terms</a>
            <a href="https://market.velxo.shop/privacy" className="hover:text-white transition">Privacy</a>
            <a href="https://market.velxo.shop/support" className="hover:text-white transition">Support</a>
          </div>
          <div className="flex items-center gap-2">
            <span>Founder:</span>
            <span className="text-brand-light font-semibold">Badeji Precious</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
