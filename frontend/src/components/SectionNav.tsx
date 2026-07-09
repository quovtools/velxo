'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
  { label: 'Home', href: '/' },
  { label: 'Top-Ups', href: '/topups' },
  { label: 'Boosting', href: '/boosting' },
  { label: 'New Listings', href: '/new-listings' },
  { label: 'Top Sellers', href: '/top-sellers' },
];

export default function SectionNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="bg-cardBg border-b border-borderBg">
      <style>{`.section-nav-scroll::-webkit-scrollbar{display:none;}`}</style>
      <div
        className="section-nav-scroll max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto whitespace-nowrap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {SECTIONS.map((section) => {
          const active = isActive(section.href);
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`px-4 py-2.5 text-sm font-semibold rounded-full transition whitespace-nowrap ${
                active
                  ? 'text-white bg-brand shadow-sm shadow-brand/30'
                  : 'text-gray-400 hover:text-white hover:bg-hoverBg/50'
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
