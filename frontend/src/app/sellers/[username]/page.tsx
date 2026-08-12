import type { Metadata } from 'next';
import SellerProfileContent from './seller-profile-content';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = 'https://app.piyrox.shop';

export const dynamic = 'force-dynamic';

type SellerPublic = {
  id: string;
  storeName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  averageRating: number;
  totalSales: number;
  totalReviews: number;
  memberSince?: string | null;
  games?: string[];
};

async function fetchSeller(username: string): Promise<SellerPublic | null> {
  try {
    const res = await fetch(`${API_BASE}/sellers/profile/${encodeURIComponent(username)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const seller = await fetchSeller(username);

  if (!seller) {
    return {
      title: 'Seller Not Found',
      description: 'This seller profile is not available on Piyrox Market.',
      robots: { index: false, follow: true },
    };
  }

  const ratingText =
    seller.averageRating > 0 ? ` — ${seller.averageRating.toFixed(1)}★ rating` : '';
  const salesText = seller.totalSales > 0 ? `, ${seller.totalSales} completed sales` : '';
  const gamesText =
    seller.games && seller.games.length > 0 ? ` Specialises in ${seller.games.join(', ')}.` : '';

  const title = `${seller.storeName} | Piyrox Seller`;
  const description =
    seller.bio?.slice(0, 140) ||
    `${seller.storeName} is a${seller.isVerified ? ' KYC-verified' : ''} Piyrox seller${ratingText}${salesText}.${gamesText} Browse their active game account listings.`;

  return {
    title,
    description,
    keywords: [
      seller.storeName,
      'piyrox seller',
      'verified game account seller',
      ...(seller.games ?? []).map((g) => `buy ${g} account`),
    ],
    alternates: { canonical: `${SITE_URL}/sellers/${username}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/sellers/${username}`,
      siteName: 'Piyrox Market',
      type: 'profile',
      images: seller.avatarUrl
        ? [{ url: seller.avatarUrl, width: 400, height: 400, alt: seller.storeName }]
        : [{ url: '/opengraph-image', width: 1200, height: 630, alt: `${seller.storeName} on Piyrox` }],
    },
    twitter: {
      card: 'summary',
      site: '@piyroxshop',
      title,
      description,
      images: seller.avatarUrl ? [seller.avatarUrl] : ['/opengraph-image'],
    },
  };
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const seller = await fetchSeller(username);

  // JSON-LD: Person / LocalBusiness for the seller
  const sellerJsonLd = seller
    ? {
        '@context': 'https://schema.org',
        '@type': seller.isVerified ? 'Organization' : 'Person',
        name: seller.storeName,
        url: `${SITE_URL}/sellers/${username}`,
        ...(seller.avatarUrl ? { image: seller.avatarUrl } : {}),
        ...(seller.bio ? { description: seller.bio } : {}),
        aggregateRating:
          seller.averageRating > 0 && seller.totalReviews > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: seller.averageRating.toFixed(1),
                reviewCount: seller.totalReviews,
                bestRating: '5',
                worstRating: '1',
              }
            : undefined,
      }
    : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Sellers', item: `${SITE_URL}/top-sellers` },
      { '@type': 'ListItem', position: 3, name: seller?.storeName ?? username, item: `${SITE_URL}/sellers/${username}` },
    ],
  };

  return (
    <>
      {sellerJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sellerJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SellerProfileContent username={username} initialSeller={seller} />
    </>
  );
}
