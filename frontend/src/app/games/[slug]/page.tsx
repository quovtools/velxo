import type { Metadata } from 'next';
import GameCatalogContent from './game-catalog-content';
import { slugToGameName } from '@/lib/games';

const SITE_URL = 'https://market.piyrox.shop';

export const dynamic = 'force-dynamic';

function formatGameName(slug: string) {
  return slugToGameName(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gameName = formatGameName(slug);
  return {
    title: `${gameName} Accounts & Boosting`,
      description: `Buy and sell ${gameName} accounts and boosting services on Piyrox. Verified sellers and escrow-protected trades.`,
    keywords: [
      `${gameName} accounts`,
      `${gameName} marketplace`,
      'escrow gaming',
    ],
    alternates: { canonical: `${SITE_URL}/games/${slug}` },
    openGraph: {
      title: `${gameName} Marketplace | Piyrox`,
    description: `Buy and sell ${gameName} accounts and boosting services with escrow protection.`,
      url: `${SITE_URL}/games/${slug}`,
      siteName: 'Piyrox Market',
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
      description: `Browse ${gameName} accounts and boosting services on Piyrox Market.`,

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
