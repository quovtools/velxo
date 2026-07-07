import { MetadataRoute } from 'next';
const BASE_URL = 'https://velxo.shop';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/community', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/affiliate', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/pricing', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/press', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/responsible-gaming', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
