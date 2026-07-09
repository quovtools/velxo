'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ShoppingCart,
  Tag,
  ShieldCheck,
  Wallet,
  Coins,
  Users,
  LifeBuoy,
  BadgeCheck,
  HelpCircle,
} from 'lucide-react';

export const DOC_SECTIONS = [
  {
    title: 'Getting Started',
    links: [
      { label: 'Introduction', href: '/docs', icon: BookOpen },
    ],
  },
  {
    title: 'Using Velxo',
    links: [
      { label: 'How to Buy', href: '/docs/buy', icon: ShoppingCart },
      { label: 'How to Sell', href: '/docs/sell', icon: Tag },
      { label: 'Escrow & Buyer Protection', href: '/docs/escrow', icon: ShieldCheck },
      { label: 'Payments & Wallets', href: '/docs/payments', icon: Wallet },
    ],
  },
  {
    title: 'Earn with Velxo',
    links: [
      { label: 'VelxoCoins & Rewards', href: '/docs/rewards', icon: Coins },
      { label: 'Affiliate Program', href: '/docs/affiliate', icon: Users },
    ],
  },
  {
    title: 'Trust & Help',
    links: [
      { label: 'Disputes & Support', href: '/docs/disputes', icon: LifeBuoy },
      { label: 'Safety & Verification', href: '/docs/safety', icon: BadgeCheck },
      { label: 'FAQ', href: '/docs/faq', icon: HelpCircle },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/docs' ? pathname === '/docs' : pathname.startsWith(href);

  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-none md:pr-2">
      {DOC_SECTIONS.map((group) => (
        <div key={group.title} className="contents md:block">
          <p className="hidden md:block text-[11px] font-bold uppercase tracking-wider text-gray-500 pt-4 pb-2 first:pt-0">
            {group.title}
          </p>
          {group.links.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 whitespace-nowrap md:whitespace-normal rounded-lg px-3 py-2 text-sm font-semibold transition shrink-0 md:shrink ${
                  active
                    ? 'bg-brand/15 text-brand border border-brand/30'
                    : 'text-gray-400 hover:text-white hover:bg-hoverBg border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
