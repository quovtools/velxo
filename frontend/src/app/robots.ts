import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://market.velxo.shop';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/checkout/',
          '/escrow/',
          '/auth/',
          '/profile/',
          '/wallet/',
          '/orders/',
          '/messages/',
          '/notifications/',
          '/seller/dashboard/',
          '/seller/gigs/',
          '/seller/settings/',
          '/seller/kyc/',
          '/seller/pro/',
          '/checkout/',
          '/callback/',
          '/*.json',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
