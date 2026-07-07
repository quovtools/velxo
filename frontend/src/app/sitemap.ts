import { MetadataRoute } from 'next';
const BASE_URL = 'https://market.velxo.shop';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/search', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/sell', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/pricing', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/escrow', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/support', priority: 0.5, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/careers', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' as const },
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
