import type { MetadataRoute } from "next";

const SITE_URL = "https://velxo.shop";
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.velxo.shop/api/v1";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/community`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/affiliate`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/press`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/responsible-gaming`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API}/blog`, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const posts = Array.isArray(data?.data) ? data.data : [];
      blogRoutes = posts.map((p: { slug: string; updatedAt?: string }) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    /* Blog posts are dynamic; fall back to static routes only. */
  }

  return [...staticRoutes, ...blogRoutes];
}
