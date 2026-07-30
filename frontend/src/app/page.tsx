import type { Metadata } from 'next';
import MarketplaceClient from './marketplace-content';

const SITE_URL = 'https://market.piyrox.shop';

export const metadata: Metadata = {
  title: 'Buy & Sell Game Accounts, Coins, Top-Ups & Boosting',
  description:
    'Discover verified gaming deals on Piyrox — Free Fire, PUBG Mobile, COD Mobile accounts, UC & diamonds top-ups, gift cards and rank boosting. Every trade secured by piyrox escrow.',
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
    title: 'piyrox market | Buy & Sell Game Accounts, Coins & More',
    description:
      'Discover verified gaming deals — accounts, top-ups, gift cards and boosting. Every trade secured by piyrox escrow.',
    url: SITE_URL,
    siteName: 'piyrox market',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'piyrox market | Buy & Sell Game Accounts, Coins & More',
    description: 'Discover verified gaming deals with escrow protection.',
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
