import Link from 'next/link';
import { Twitter, Instagram, Youtube, MessageCircle, ShieldCheck } from 'lucide-react';

const footerLinks = {
  marketplace: {
    label: 'Marketplace',
    links: [
      { name: 'All Listings', href: '/' },
      { name: 'Game Accounts', href: '/?category=accounts' },
      { name: 'Top-Ups & Coins', href: '/?category=topups' },
      { name: 'Gift Cards', href: '/?category=giftcards' },
      { name: 'Boosting Services', href: '/?category=boosting' },
    ],
  },
  sellers: {
    label: 'Sellers',
    links: [
      { name: 'Start Selling', href: '/sell' },
      { name: 'Seller Dashboard', href: '/seller/dashboard' },
      { name: 'Pricing & Fees', href: '/pricing' },
      { name: 'Seller Guidelines', href: '/seller/guidelines' },
    ],
  },
  support: {
    label: 'Support',
    links: [
      { name: 'Help Center', href: '/support' },
      { name: 'How Escrow Works', href: '/escrow' },
      { name: 'Dispute Resolution', href: '/escrow#disputes' },
      { name: 'Contact Us', href: '/support#contact' },
    ],
  },
  company: {
    label: 'Company',
    links: [
      { name: 'About Velxo', href: '/about' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Careers', href: '/careers' },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="border-t border-borderBg bg-cardBg mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Velxo" className="w-7 h-7 rounded-lg" />
              <span className="text-white font-black text-xl tracking-wider">VELXO</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Africa&apos;s trusted gaming marketplace. Buy and sell game accounts, top-ups and more — all escrow-protected.
            </p>
            <div className="flex gap-2">
              {[
                { href: 'https://twitter.com', icon: <Twitter className="w-4 h-4" />, label: 'Twitter' },
                { href: 'https://instagram.com', icon: <Instagram className="w-4 h-4" />, label: 'Instagram' },
                { href: 'https://youtube.com', icon: <Youtube className="w-4 h-4" />, label: 'YouTube' },
                { href: 'https://discord.com', icon: <MessageCircle className="w-4 h-4" />, label: 'Discord' },
              ].map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-surface border border-borderBg flex items-center justify-center text-gray-500 hover:text-white hover:border-brand/40 transition">
                  {s.icon}
                </a>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-lg px-3 py-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-light" />
              <span className="text-brand-light text-xs font-semibold">Escrow Protected</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.label} className="space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">{section.label}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-500 hover:text-white text-sm transition">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-borderBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Velxo.shop — Built for Africa&apos;s gaming community</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/support" className="hover:text-white transition">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
