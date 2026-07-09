import Link from 'next/link';
import { Twitter, Instagram, Youtube, MessageCircle } from 'lucide-react';

const footerLinks = {
  marketplace: {
    label: 'Marketplace',
    links: [
      { name: 'All Listings', href: '/' },
      { name: 'Game Accounts', href: '/?category=accounts' },
      { name: 'Top-Ups & Coins', href: '/?category=topups' },
      { name: 'Gift Cards', href: '/?category=giftcards' },
      { name: 'Boosting Services', href: '/?category=boosting' },
      { name: 'Featured Offers', href: '/?featured=true' },
    ],
  },
  sellers: {
    label: 'For Sellers',
    links: [
      { name: 'Start Selling', href: '/sell' },
      { name: 'Seller Dashboard', href: '/seller/dashboard' },
      { name: 'Seller Guidelines', href: '/seller/guidelines' },
      { name: 'Pricing & Fees', href: '/pricing' },
      { name: 'Boost Your Listing', href: '/sell' },
    ],
  },
  support: {
    label: 'Support',
    links: [
      { name: 'Help Center', href: '/support' },
      { name: 'Dispute Resolution', href: '/escrow#disputes' },
      { name: 'How Escrow Works', href: '/escrow' },
      { name: 'Report a Problem', href: '/support#report' },
      { name: 'Contact Us', href: '/support#contact' },
    ],
  },
  company: {
    label: 'Company',
    links: [
      { name: 'About Velxo', href: '/about' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Cookie Policy', href: '/privacy#cookies' },
      { name: 'Careers', href: '/careers' },
    ],
  },
};

const popularGames = [
  { name: 'Free Fire', href: '/games/free-fire' },
  { name: 'PUBG Mobile', href: '/games/pubg-mobile' },
  { name: 'Valorant', href: '/games/valorant' },
  { name: 'COD Mobile', href: '/games/cod-mobile' },
  { name: 'Fortnite', href: '/games/fortnite' },
  { name: 'Roblox', href: '/games/roblox' },
  { name: 'Mobile Legends', href: '/games/mobile-legends' },
  { name: 'Clash of Clans', href: '/games/clash-of-clans' },
];

export default function Footer() {
  return (
    <footer className="border-t border-borderBg bg-cardBg mt-12 sm:mt-16">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-white font-black text-2xl tracking-tight">Velxo</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Africa&apos;s most trusted escrow-backed gaming marketplace. Buy and sell game accounts, top-ups, coins, and boosting services with full protection.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-background border border-borderBg flex items-center justify-center text-gray-400 hover:text-white hover:border-brand/40 transition"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-background border border-borderBg flex items-center justify-center text-gray-400 hover:text-white hover:border-brand/40 transition"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-background border border-borderBg flex items-center justify-center text-gray-400 hover:text-white hover:border-brand/40 transition"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-background border border-borderBg flex items-center justify-center text-gray-400 hover:text-white hover:border-brand/40 transition"
                aria-label="Discord"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
              <span className="text-brand-accent text-xs font-semibold">Escrow Protected Platform</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.label} className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">{section.label}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white text-sm transition"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular games row */}
        <div className="mt-12 pt-8 border-t border-borderBg">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">Popular Games</p>
          <div className="flex flex-wrap gap-2">
            {popularGames.map((game) => (
              <Link
                key={game.name}
                href={game.href}
                className="text-xs text-gray-400 hover:text-white bg-background border border-borderBg hover:border-brand/30 rounded-lg px-3 py-1.5 transition"
              >
                {game.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-borderBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Velxo.shop. All rights reserved. Built for Africa&apos;s gaming community.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/support" className="hover:text-white transition">Support</Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Payments secured by</span>
            <span className="text-gray-300 font-semibold">Escrow™</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
