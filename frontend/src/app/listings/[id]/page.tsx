import type { Metadata } from 'next';
import ListingDetailsContent from './listing-details-content';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = 'https://market.velxo.shop';

export const dynamic = 'force-dynamic';

type Listing = {
  id: string;
  title: string;
  description: string;
  price: string | number;
  gameName: string;
  images?: string[];
  seller?: { storeName?: string; isVerified?: boolean; averageRating?: number };
};

async function fetchListing(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${API_BASE}/listings/${id}`, { cache: 'no-store' });
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
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id);
  if (!listing) {
    return {
      title: 'Listing Not Found',
      description: 'This listing is no longer available on Velxo Market.',
      robots: { index: false, follow: true },
    };
  }
  const price = Number(listing.price || 0).toFixed(2);
  return {
    title: `${listing.title} — ${listing.gameName} | Velxo Market`,
    description:
      listing.description?.slice(0, 160) ||
      `Buy ${listing.title} (${listing.gameName}) on Velxo Market. Escrow-protected trade with ${listing.seller?.storeName || 'a verified seller'}.`,
    keywords: [listing.gameName, 'buy game account', 'escrow gaming', listing.title],
    alternates: { canonical: `${SITE_URL}/listings/${id}` },
    openGraph: {
      title: `${listing.title} — ${listing.gameName} | Velxo Market`,
      description: `Escrow-protected ${listing.gameName} listing for $${price}.`,
      url: `${SITE_URL}/listings/${id}`,
      siteName: 'Velxo Market',
      type: 'website',
      images: listing.images?.length ? [{ url: listing.images[0] }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title} | Velxo Market`,
      description: `Escrow-protected ${listing.gameName} listing for $${price}.`,
    },
  };
}

export default async function ListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await fetchListing(id);

  const jsonLd = listing
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: listing.title,
        description: listing.description,
        image: listing.images || [],
        offers: {
          '@type': 'Offer',
          price: Number(listing.price || 0).toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: listing.seller?.storeName || 'Velxo Seller',
          },
        },
      }
    : null;

  return (
    <>
      <ListingDetailsContent id={id} initialData={listing as any} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
