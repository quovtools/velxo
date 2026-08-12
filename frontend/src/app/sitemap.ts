import { MetadataRoute } from 'next';
import { GAME_LIST } from '@/lib/games';

const BASE_URL = 'https://app.piyrox.shop';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const GAME_SLUGS = GAME_LIST.map((g) => g.slug);

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchBlogSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/blog`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).map((p: { slug: string }) => p.slug).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchTopSellerUsernames(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/sellers?limit=50`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const sellers: Array<{ username?: string; storeName?: string }> = data.data ?? [];
    return sellers
      .map((s) => s.username ?? s.storeName)
      .filter((u): u is string => Boolean(u))
      .map((u) => encodeURIComponent(u.toLowerCase().replace(/\s+/g, '-')));
  } catch {
    return [];
  }
}

// ── Sitemap ───────────────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/games', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
    { path: '/search', priority: 0.8, changeFrequency: 'daily' },
    { path: '/sell', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/topups', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/boosting', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/new-listings', priority: 0.8, changeFrequency: 'daily' },
    { path: '/top-sellers', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/store', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/affiliate', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/rewards', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/careers', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  ];

  // Per-game routes
  const gameRoutes = GAME_SLUGS.map((slug) => ({
    path: `/games/${slug}`,
    priority: 0.9,
    changeFrequency: 'daily' as const,
  }));

  // Blog post routes (fetched at build / revalidation time)
  const blogSlugs = await fetchBlogSlugs();
  const blogRoutes = blogSlugs.map((slug) => ({
    path: `/blog/${slug}`,
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  }));

  // Seller profile routes
  const sellerUsernames = await fetchTopSellerUsernames();
  const sellerRoutes = sellerUsernames.map((username) => ({
    path: `/sellers/${username}`,
    priority: 0.6,
    changeFrequency: 'weekly' as const,
  }));

  const allRoutes = [...staticRoutes, ...gameRoutes, ...blogRoutes, ...sellerRoutes];

  return allRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
