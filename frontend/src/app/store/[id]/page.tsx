import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = 'https://market.velxo.shop';

export const dynamic = 'force-dynamic';

type PublicStore = {
  id: string;
  storeName: string;
  storeDescription: string | null;
  isVerified?: boolean;
  averageRating?: number;
  totalSales?: number;
  listings?: Array<{ id: string; title: string; price: number | string }>;
};

async function fetchStore(id: string): Promise<PublicStore | null> {
  try {
    const res = await fetch(`${API_BASE}/sellers/${id}/store`, { cache: 'no-store' });
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
  const store = await fetchStore(id);
  if (!store) {
    return {
      title: 'Store Not Found',
      robots: { index: false, follow: true },
    };
  }
  return {
    title: `${store.storeName} Store | Velxo Market`,
    description:
      store.storeDescription?.slice(0, 160) ||
      `Browse ${store.storeName}'s gaming listings on Velxo — escrow-protected accounts, coins and top-ups.`,
    keywords: [store.storeName, 'velxo store', 'gaming marketplace', 'escrow'],
    alternates: { canonical: `${SITE_URL}/store/${id}` },
    openGraph: {
      title: `${store.storeName} Store | Velxo Market`,
      description: `Browse ${store.storeName}'s verified gaming listings.`,
      url: `${SITE_URL}/store/${id}`,
      siteName: 'Velxo Market',
      type: 'website',
    },
  };
}

export default async function PublicStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await fetchStore(id);

  const jsonLd = store
    ? {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: store.storeName,
        url: `${SITE_URL}/store/${id}`,
        description: store.storeDescription || undefined,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: store.averageRating || 0,
          reviewCount: store.totalSales || 0,
        },
      }
    : null;

  const StoreContent = (await import('./store-content')).default;

  return (
    <>
      <StoreContent />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
