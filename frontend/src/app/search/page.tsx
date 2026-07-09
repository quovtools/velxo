import type { Metadata } from 'next';

const SITE_URL = 'https://market.velxo.shop';

export const metadata: Metadata = {
  title: 'Search Listings | Game Accounts, Coins & Top-Ups',
  description:
    'Search thousands of verified gaming listings on Velxo — filter by game, platform, region and price. Find the best accounts, top-ups and boosting deals with escrow protection.',
  keywords: [
    'search game accounts',
    'gaming marketplace search',
    'buy free fire account',
    'pubg mobile uc',
    'game top up',
    'rank boosting',
  ],
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
  openGraph: {
    title: 'Search Listings | Velxo Market',
    description: 'Search thousands of verified gaming listings with escrow protection.',
    url: `${SITE_URL}/search`,
    siteName: 'Velxo Market',
    type: 'website',
  },
};

export { default } from './search-content';
