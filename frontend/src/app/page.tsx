import type { Metadata } from 'next';
import MarketplaceClient from './marketplace-content';

const SITE_URL = 'https://market.velxo.shop';

export const metadata: Metadata = {
  title: 'Buy & Sell Game Accounts, Coins, Top-Ups & Boosting',
  description:
    'Discover verified gaming deals on Velxo — Free Fire, PUBG Mobile, COD Mobile accounts, UC & diamonds top-ups, gift cards and rank boosting. Every trade secured by Velxo Escrow.',
  keywords: [
    'buy game accounts',
    'sell game accounts',
    'free fire accounts',
    'pubg mobile uc',
    'cod mobile top up',
    'game coins',
    'rank boosting',
    'gift cards',
    'gaming marketplace africa',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'Velxo Market | Buy & Sell Game Accounts, Coins & More',
    description:
      'Discover verified gaming deals — accounts, top-ups, gift cards and boosting. Every trade secured by Velxo Escrow.',
    url: SITE_URL,
    siteName: 'Velxo Market',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Velxo Market | Buy & Sell Game Accounts, Coins & More',
    description: 'Discover verified gaming deals with escrow protection.',
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
