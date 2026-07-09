import { MetadataRoute } from 'next';

const BASE_URL = 'https://market.velxo.shop';

const GAME_SLUGS = [
  'free-fire',
  'cod-mobile',
  'blood-strike',
  'delta-force',
  'pubg-mobile',
  'valorant',
  'roblox',
  'mobile-legends',
  'efootball',
  'fortnite',
  'clash-of-clans',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
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

  const gameRoutes = GAME_SLUGS.map((slug) => ({
    path: `/games/${slug}`,
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  }));

  const allRoutes = [...staticRoutes, ...gameRoutes];

  return allRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
