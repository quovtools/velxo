import type { Metadata } from 'next';
import GameCatalogContent from './game-catalog-content';

const SITE_URL = 'https://market.velxo.shop';

export const dynamic = 'force-dynamic';

const GAME_SLUG_TO_NAME: Record<string, string> = {
  'free-fire': 'Free Fire',
  'cod-mobile': 'COD Mobile',
  'blood-strike': 'Blood Strike',
  'delta-force': 'Delta Force',
  'pubg-mobile': 'PUBG Mobile',
  valorant: 'Valorant',
  roblox: 'Roblox',
  'mobile-legends': 'Mobile Legends',
  efootball: 'eFootball',
};

function formatGameName(slug: string) {
  return (
    GAME_SLUG_TO_NAME[slug] ||
    slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gameName = formatGameName(slug);
  return {
    title: `${gameName} Accounts, Coins & Top-Ups`,
    description: `Buy and sell ${gameName} accounts, UC/diamonds top-ups, gift cards and boosting services on Velxo. Verified sellers and escrow-protected trades.`,
    keywords: [
      `${gameName} accounts`,
      `${gameName} top up`,
      `${gameName} coins`,
      `${gameName} marketplace`,
      'escrow gaming',
    ],
    alternates: { canonical: `${SITE_URL}/games/${slug}` },
    openGraph: {
      title: `${gameName} Marketplace | Velxo`,
      description: `Buy and sell ${gameName} accounts, coins and top-ups with escrow protection.`,
      url: `${SITE_URL}/games/${slug}`,
      siteName: 'Velxo Market',
      type: 'website',
    },
  };
}

export default async function GameCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gameName = formatGameName(slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${gameName} Marketplace`,
    url: `${SITE_URL}/games/${slug}`,
    description: `Browse ${gameName} accounts, coins and top-ups on Velxo Market.`,
  };

  return (
    <>
      <GameCatalogContent slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
