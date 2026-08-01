import type { Metadata } from 'next';
import GameCatalogContent from './game-catalog-content';
import { GAME_LIST, GAME_CONFIG, slugToGameName } from '@/lib/games';

const SITE_URL = 'https://market.piyrox.shop';

// Pre-render every known game at build time for best performance + SEO.
// New slugs added to GAME_LIST will be server-rendered on first request (ISR).
export async function generateStaticParams() {
  return GAME_LIST.map((g) => ({ slug: g.slug }));
}

// Pages are statically generated; revalidate every 6 hours in case listings change.
export const revalidate = 21600;

// ─── Per-game currency / keyword helpers ──────────────────────────────────────

function getCurrencyLabel(slug: string): string {
  const name = slugToGameName(slug);
  return GAME_CONFIG[name]?.currency.plural ?? 'in-game currency';
}

function getGenre(slug: string): string {
  const name = slugToGameName(slug);
  return GAME_CONFIG[name]?.genre ?? 'mobile game';
}

function getTopRank(slug: string): string {
  const name = slugToGameName(slug);
  const ranks = GAME_CONFIG[name]?.ranks ?? [];
  return ranks[ranks.length - 1] ?? '';
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gameName = slugToGameName(slug);
  const currency = getCurrencyLabel(slug);
  const topRank = getTopRank(slug);
  const rankSuffix = topRank ? ` ${topRank} accounts,` : '';

  const title = `Buy & Sell ${gameName} Accounts | Piyrox Market`;
  const description = `Browse verified ${gameName} accounts, ${currency} top-ups and rank boosting on Piyrox Market.${rankSuffix ? ` Find${rankSuffix} starter accounts and more.` : ''} All trades protected by Trust-Trade escrow.`;

  return {
    title,
    description,
    keywords: [
      `${gameName} accounts for sale`,
      `buy ${gameName} account`,
      `sell ${gameName} account`,
      `${gameName} ${currency} buy`,
      `${gameName} rank boost`,
      `${gameName} marketplace`,
      `${gameName} escrow`,
      `${gameName} account nigeria`,
      `${gameName} account ghana`,
      'piyrox',
      'trust-trade escrow',
      'gaming marketplace africa',
    ],
    alternates: { canonical: `${SITE_URL}/games/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/games/${slug}`,
      siteName: 'Piyrox Market',
      type: 'website',
      images: [
        {
          url: `/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${gameName} Marketplace on Piyrox`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@piyroxshop',
      creator: '@piyroxshop',
      title,
      description: `Buy and sell ${gameName} accounts and ${currency} top-ups with Trust-Trade escrow protection on Piyrox.`,
      images: [`/opengraph-image`],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GameCatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gameName = slugToGameName(slug);
  const currency = getCurrencyLabel(slug);
  const genre = getGenre(slug);
  const topRank = getTopRank(slug);

  // CollectionPage gives Google a strong signal that this is a browsable category
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${gameName} Accounts & Services Marketplace`,
    url: `${SITE_URL}/games/${slug}`,
    description: `Browse and buy verified ${gameName} accounts, ${currency} top-ups and rank boosting services. All trades protected by Piyrox Trust-Trade escrow.`,
    inLanguage: 'en',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Games', item: `${SITE_URL}/games` },
        { '@type': 'ListItem', position: 3, name: gameName, item: `${SITE_URL}/games/${slug}` },
      ],
    },
  };

  // VideoGame entity — links the page to a real game entity Google knows
  const videoGameJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: gameName,
    genre,
    gamePlatform: ['Android', 'iOS'],
    ...(topRank ? { description: `Competitive ${genre} game with ranks up to ${topRank}.` } : {}),
  };

  // Offer catalogue — ItemList of the service types available for this game
  const offerListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${gameName} Services on Piyrox`,
    url: `${SITE_URL}/games/${slug}`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: `${gameName} Accounts`,
        url: `${SITE_URL}/games/${slug}?type=account`,
        description: `Buy and sell verified ${gameName} accounts with varying ranks and items.`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${gameName} ${currency} Top-Up`,
        url: `${SITE_URL}/games/${slug}?type=topup`,
        description: `Purchase ${currency} for ${gameName} safely via Piyrox.`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${gameName} Rank Boosting`,
        url: `${SITE_URL}/games/${slug}?type=boosting`,
        description: `Hire a verified booster to rank up your ${gameName} account.`,
      },
    ],
  };

  return (
    <>
      <GameCatalogContent slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerListJsonLd) }}
      />
    </>
  );
}
