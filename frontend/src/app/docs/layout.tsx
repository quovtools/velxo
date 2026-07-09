import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Home } from 'lucide-react';
import DocsSidebar from './components/DocsSidebar';

export const metadata: Metadata = {
  title: 'Velxo Documentation',
  description:
    'Everything you need to buy, sell, and trade safely on Velxo — escrow protection, payments, wallets, rewards, the affiliate program, disputes, and verification.',
  alternates: { canonical: 'https://market.velxo.shop/docs' },
  openGraph: {
    title: 'Velxo Documentation',
    description:
      'Guides for buying, selling, escrow, payments, rewards and staying safe on Velxo.',
    url: 'https://market.velxo.shop/docs',
    siteName: 'Velxo Market',
    type: 'website',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb / top bar */}
      <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 pb-4">
        <Link href="/" className="flex items-center gap-1.5 hover:text-white transition">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <span>/</span>
        <span className="flex items-center gap-1.5 text-brand">
          <BookOpen className="w-4 h-4" />
          Docs
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside className="md:w-64 lg:w-72 shrink-0">
          <div className="md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pb-8 md:pr-1">
            <DocsSidebar />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 pb-16">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
