'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ShieldCheck, Zap, TrendingUp, Star } from 'lucide-react';
import { slugToGameName, getGameConfig } from '@/lib/games';
import { getGameSEOContent } from '@/lib/seo-content';
import { useCurrency } from '@/lib/useCurrency';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  seller: {
    storeName: string;
    averageRating: number;
  };
}

// ── FAQ accordion item ────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-borderBg rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white hover:bg-cardBg/60 transition"
        aria-expanded={open}
      >
        <span>{question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-borderBg pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function GameCatalogContent({ slug }: { slug: string }) {
  const { fmt } = useCurrency();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const gameName = slugToGameName(slug);
  const cfg = getGameConfig(gameName);
  const seo = getGameSEOContent(slug);

  useEffect(() => {
    async function loadListings() {
      try {
        const response = await fetch(`${API_BASE}/listings?gameName=${encodeURIComponent(gameName)}`);
        if (response.ok) {
          const result = await response.json();
          setListings(result.data?.listings || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, [gameName]);

  return (
    <div className="space-y-10">

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <Link href="/games" className="hover:text-white transition">Games</Link>
        <span>/</span>
        <span className="text-gray-300">{gameName}</span>
      </nav>

      {/* ── Hero / intro ── */}
      <div className="space-y-3 border-b border-borderBg pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{gameName} Marketplace</h1>
          {cfg?.hasRanked && (
            <span className="text-xs font-bold bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-full">
              Ranked
            </span>
          )}
        </div>
        <p className="text-gray-400 max-w-2xl leading-relaxed">
          {seo?.shortDescription ??
            `Browse active ${gameName} accounts and boosting services${cfg?.currency ? ` — ${cfg.currency.plural}` : ''}`}
        </p>
        {seo?.buyerGuide && (
          <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">{seo.buyerGuide}</p>
        )}

        {/* Quick service links */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={`/games/${slug}?type=account`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-cardBg border border-borderBg hover:border-brand/50 text-gray-300 px-3 py-1.5 rounded-lg transition"
          >
            <Star className="w-3.5 h-3.5 text-brand" /> Accounts
          </Link>
          <Link
            href={`/topups?game=${encodeURIComponent(gameName)}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-cardBg border border-borderBg hover:border-brand/50 text-gray-300 px-3 py-1.5 rounded-lg transition"
          >
            <Zap className="w-3.5 h-3.5 text-brand" />
            {cfg?.currency.plural ?? 'Top-Ups'}
          </Link>
          <Link
            href={`/boosting?game=${encodeURIComponent(gameName)}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-cardBg border border-borderBg hover:border-brand/50 text-gray-300 px-3 py-1.5 rounded-lg transition"
          >
            <TrendingUp className="w-3.5 h-3.5 text-brand" /> Rank Boosting
          </Link>
        </div>
      </div>

      {/* ── Listing grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 h-60 animate-pulse space-y-4">
              <div className="h-4 bg-gray-700 rounded w-1/3" />
              <div className="h-6 bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-700 rounded w-1/2" />
              <div className="h-10 bg-gray-700 rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <p className="text-gray-400 text-lg">No active listings found for {gameName}.</p>
          <Link
            href="/sell"
            className="mt-4 inline-block bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white"
          >
            Create first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="glow-card border border-borderBg p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="bg-brand/10 text-brand-light text-xs font-semibold px-2 py-0.5 rounded border border-brand/20">
                    {item.gameName}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {item.platform} · {item.region}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white line-clamp-2 mb-2 hover:text-brand transition">
                  <Link href={`/listings/${item.id}`}>{item.title}</Link>
                </h3>
                <div className="text-xs text-gray-400 space-y-1 mb-4">
                  <p>Rank: <span className="text-gray-200">{item.rank || 'N/A'}</span></p>
                  <p>
                    Seller:{' '}
                    <span className="text-brand-light">{item.seller?.storeName}</span>{' '}
                    ({item.seller?.averageRating?.toFixed(1) || '0.0'} ★)
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-borderBg pt-4 mt-auto">
                <span className="text-2xl font-black text-white">{fmt(item.price)}</span>
                <Link
                  href={`/listings/${item.id}`}
                  className="bg-brand hover:bg-brand-dark px-4 py-2 rounded-lg text-xs font-semibold transition text-white"
                >
                  View Offer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Value drivers (what makes an account valuable) ── */}
      {seo?.valueDrivers && seo.valueDrivers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-black text-white">What makes a {gameName} account valuable?</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {seo.valueDrivers.map((v) => (
              <li key={v} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                {v}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Rank guide ── */}
      {seo?.rankGuide && (
        <section className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-black text-white">{seo.rankGuide.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{seo.rankGuide.summary}</p>
          <div className="space-y-2">
            {seo.rankGuide.tiers.map((tier, i) => (
              <div key={tier.name} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <span className="text-sm font-bold text-white">{tier.name}</span>
                  <span className="text-sm text-gray-400"> — {tier.description}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Trust points ── */}
      {seo?.trustPoints && seo.trustPoints.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {seo.trustPoints.map((point) => (
            <div key={point} className="flex items-center gap-2 bg-cardBg border border-borderBg rounded-xl px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">{point}</span>
            </div>
          ))}
        </section>
      )}

      {/* ── FAQ ── */}
      {seo?.faqs && seo.faqs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-black text-white">{gameName} Account FAQ</h2>
          <div className="space-y-2">
            {seo.faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="bg-brand/5 border border-brand/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold">Have a {gameName} account to sell?</p>
          <p className="text-sm text-gray-400 mt-0.5">
            List it on Piyrox and reach thousands of verified buyers. Free to list — we only charge on successful sales.
          </p>
        </div>
        <Link
          href="/sell"
          className="flex-shrink-0 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
        >
          Sell your account
        </Link>
      </section>
    </div>
  );
}
