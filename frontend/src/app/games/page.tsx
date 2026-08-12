import type { Metadata } from 'next';
import Link from 'next/link';
import { GAME_LIST, GAME_CONFIG } from '@/lib/games';

const SITE_URL = 'https://app.piyrox.shop';

export const metadata: Metadata = {
  title: 'Game Marketplaces | Buy & Sell Accounts by Game | Piyrox',
  description:
    'Browse every game marketplace on Piyrox — Free Fire, eFootball, PUBG Mobile, COD Mobile and Blood Strike. Buy verified accounts, top-ups and boosting services. All trades escrow-protected.',
  keywords: [
    'game account marketplace',
    'buy game accounts',
    'free fire accounts for sale',
    'efootball accounts',
    'pubg mobile accounts',
    'cod mobile accounts',
    'blood strike accounts',
    'mobile game account trading',
    'gaming marketplace africa',
    'piyrox games',
  ],
  alternates: { canonical: `${SITE_URL}/games` },
  openGraph: {
    title: 'Game Marketplaces | Piyrox Market',
    description:
      'Browse verified accounts, top-ups and boosting for every supported game on Piyrox. All trades escrow-protected.',
    url: `${SITE_URL}/games`,
    siteName: 'Piyrox Market',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Piyrox Game Marketplaces' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@piyroxshop',
    title: 'Game Marketplaces | Piyrox Market',
    description: 'Buy and sell game accounts for Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball.',
    images: ['/opengraph-image'],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Games', item: `${SITE_URL}/games` },
  ],
};

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Game Marketplaces on Piyrox',
  url: `${SITE_URL}/games`,
  description:
    'Browse verified accounts, in-game currency top-ups and rank boosting services for every game on Piyrox Market.',
  inLanguage: 'en',
  breadcrumb: breadcrumbJsonLd,
  hasPart: GAME_LIST.map((g) => ({
    '@type': 'WebPage',
    name: `${g.name} Marketplace`,
    url: `${SITE_URL}/games/${g.slug}`,
    description: `Buy and sell verified ${g.name} accounts and services on Piyrox.`,
  })),
};

// ── Service type labels shown on each card ──────────────────────────────────
const SERVICE_LABELS = ['Accounts', 'Top-Ups', 'Rank Boosting'];

export default function GamesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="space-y-10">
        {/* ── Header ── */}
        <div className="space-y-2">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <span className="text-gray-300">Games</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Game Marketplaces</h1>
          <p className="text-gray-400 max-w-2xl">
            Every game on Piyrox has its own dedicated marketplace. Browse verified accounts, buy in-game currency top-ups and hire rank boosters — all protected by Trust-Trade escrow.
          </p>
        </div>

        {/* ── Game grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_LIST.map((game) => {
            const cfg = GAME_CONFIG[game.name];
            return (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                className="group bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-0.5"
              >
                {/* Colour band */}
                <div
                  className="h-2 w-full"
                  style={{ background: game.color }}
                />
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-white group-hover:text-brand transition">
                        {game.name}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">{cfg?.genre ?? 'Mobile Game'}</p>
                    </div>
                    {cfg?.hasRanked && (
                      <span className="flex-shrink-0 text-[10px] font-bold bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-full">
                        Ranked
                      </span>
                    )}
                  </div>

                  {/* Currency callout */}
                  {cfg?.currency && (
                    <p className="text-xs text-gray-400">
                      Premium currency:{' '}
                      <span className="text-gray-200 font-semibold">{cfg.currency.plural}</span>
                    </p>
                  )}

                  {/* Service tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {SERVICE_LABELS.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-semibold bg-background border border-borderBg text-gray-400 px-2 py-0.5 rounded-lg"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Rank preview */}
                  {cfg?.ranks && cfg.ranks.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Top rank:{' '}
                      <span className="text-gray-200 font-semibold">
                        {cfg.ranks[cfg.ranks.length - 1]}
                      </span>
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-borderBg flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {cfg?.platforms?.join(' · ') ?? 'Mobile'}
                    </span>
                    <span className="text-xs font-bold text-brand group-hover:underline">
                      Browse listings →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Why Piyrox trust section ── */}
        <section className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-black text-white">Why trade on Piyrox?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-400">
            <div className="space-y-1">
              <p className="text-white font-bold">Trust-Trade Escrow</p>
              <p>Your payment is held securely and only released to the seller after you confirm you have the account or service.</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">KYC-Verified Sellers</p>
              <p>Every seller on Piyrox goes through identity verification before they can list — no anonymous sellers.</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">24-Hour Dispute Resolution</p>
              <p>If anything goes wrong, our team reviews disputes within 24 hours and protects buyers from loss.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
