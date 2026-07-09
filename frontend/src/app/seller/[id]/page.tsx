import type { Metadata } from 'next';
import SellerProfileContent from './seller-profile-content';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = 'https://market.velxo.shop';

export const dynamic = 'force-dynamic';

type SellerProfile = {
  id: string;
  storeName: string;
  storeDescription: string | null;
  isVerified?: boolean;
  averageRating?: number;
  totalSales?: number;
  listings?: Array<{ id: string; title: string; price: number | string }>;
};

async function fetchSeller(id: string): Promise<SellerProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/sellers/${id}`, { cache: 'no-store' });
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
  const seller = await fetchSeller(id);
  if (!seller) {
    return {
      title: 'Seller Not Found',
      robots: { index: false, follow: true },
    };
  }
  return {
    title: `${seller.storeName} — Verified Seller | Velxo Market`,
    description:
      seller.storeDescription?.slice(0, 160) ||
      `Shop ${seller.storeName} on Velxo Market. ${(seller.totalSales || 0)} sales, ${
        (seller.averageRating || 0).toFixed(1)
      }★ rating. Escrow-protected trades.`,
    keywords: [seller.storeName, 'verified seller', 'gaming marketplace', 'escrow'],
    alternates: { canonical: `${SITE_URL}/seller/${id}` },
    openGraph: {
      title: `${seller.storeName} | Velxo Market`,
      description: `Shop ${seller.storeName} — escrow-protected gaming trades.`,
      url: `${SITE_URL}/seller/${id}`,
      siteName: 'Velxo Market',
      type: 'profile',
    },
  };
}

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await fetchSeller(id);

  const jsonLd = seller
    ? {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: seller.storeName,
        url: `${SITE_URL}/seller/${id}`,
        description: seller.storeDescription || undefined,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: seller.averageRating || 0,
          reviewCount: seller.totalSales || 0,
        },
      }
    : null;

  return (
    <>
      <SellerProfileContent id={id} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
