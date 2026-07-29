'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScrollText, Clock, ChevronRight, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const PAGE_LABELS: Record<string, string> = {
  terms:   'Terms of Service',
  privacy: 'Privacy Policy',
  refund:  'Refund Policy',
  cookies: 'Cookie Policy',
};

const FALLBACK_CONTENT: Record<string, string> = {
  terms: `<h2>1. Acceptance of Terms</h2>
<p>By accessing Velxo Market you agree to be bound by these Terms of Service and all applicable laws.</p>
<h2>2. Platform Use</h2>
<p>Velxo Market is a peer-to-peer gaming marketplace. You must be 13 years or older to use this platform.</p>
<h2>3. Escrow &amp; Payments</h2>
<p>All transactions are processed through Velxo Escrow. Funds are held securely until both parties confirm successful delivery.</p>
<h2>4. Prohibited Items</h2>
<p>Accounts obtained via cheating, hacking, or in violation of the originating game's Terms of Service are strictly forbidden.</p>
<h2>5. Dispute Resolution</h2>
<p>In the event of a dispute, Velxo Admin will investigate the transaction and make a final binding decision.</p>
<h2>6. Termination</h2>
<p>We reserve the right to suspend or terminate accounts that violate these terms at any time without prior notice.</p>`,

  privacy: `<h2>1. Information We Collect</h2>
<p>We collect your email address, name, and payment information when you create an account or make a purchase.</p>
<h2>2. How We Use Your Information</h2>
<p>Your data is used to process transactions, verify your identity, prevent fraud, and improve the platform experience.</p>
<h2>3. Data Sharing</h2>
<p>We do not sell your personal data. Data is shared only with payment processors required to complete transactions.</p>
<h2>4. Cookies</h2>
<p>We use cookies to keep you logged in and remember your preferences across sessions.</p>
<h2>5. Your Rights</h2>
<p>You may request deletion of your account and associated data at any time by contacting our support team.</p>`,

  refund: `<h2>Refund Eligibility</h2>
<p>Refunds are handled through the Velxo Escrow dispute process. Once a buyer confirms delivery, funds are released to the seller and no refund is possible.</p>
<h2>Dispute Window</h2>
<p>Buyers have 72 hours after delivery to raise a dispute before funds are automatically released to the seller.</p>`,

  cookies: `<h2>What Are Cookies?</h2>
<p>Cookies are small text files stored on your device used to keep you logged in and remember your preferences.</p>
<h2>Essential Cookies</h2>
<p>Session tokens and authentication cookies are required for the platform to function correctly.</p>`,
};

const RELATED_PAGES = [
  { type: 'terms',   href: '/terms',   label: 'Terms of Service' },
  { type: 'privacy', href: '/privacy', label: 'Privacy Policy' },
  { type: 'refund',  href: '/refund',  label: 'Refund Policy' },
];

interface LegalPageData {
  title: string;
  content: string;
  version: string;
  publishedAt?: string;
  updatedAt?: string;
}

interface Props {
  pageType: string;
  fallbackTitle?: string;
}

export default function LegalPageContent({ pageType, fallbackTitle }: Props) {
  const [page,    setPage]    = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/legal/${pageType}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setPage(d.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [pageType]);

  const title   = page?.title   ?? fallbackTitle ?? PAGE_LABELS[pageType] ?? 'Legal';
  const content = page?.content ?? FALLBACK_CONTENT[pageType] ?? '';
  const version = page?.version;
  const updated = page?.updatedAt ?? page?.publishedAt;

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-400">{PAGE_LABELS[pageType] ?? 'Legal'}</span>
        </nav>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
              {version && <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">v{version}</span>}
              {updated && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last updated {new Date(updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-8">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : error && !FALLBACK_CONTENT[pageType] ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-sm">This page hasn't been published yet. Check back soon.</p>
          </div>
        ) : (
          <div
            className="prose prose-invert prose-sm max-w-none
              prose-h2:text-white prose-h2:font-extrabold prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
              prose-p:text-gray-400 prose-p:leading-relaxed
              prose-a:text-brand prose-a:no-underline hover:prose-a:underline
              prose-li:text-gray-400
              prose-strong:text-white
              first:prose-h2:mt-0"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>

      {/* Related pages */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Related Documents</p>
        <div className="flex flex-wrap gap-2">
          {RELATED_PAGES.filter(p => p.type !== pageType).map(p => (
            <Link
              key={p.type}
              href={p.href}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:border-brand/40 px-3 py-1.5 rounded-xl transition"
            >
              <ScrollText className="w-3.5 h-3.5" /> {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Contact */}
      <p className="text-xs text-gray-600 text-center">
        Questions about this policy?{' '}
        <Link href="/support" className="text-brand hover:text-brand-light transition">Contact Support</Link>
      </p>
    </div>
  );
}
