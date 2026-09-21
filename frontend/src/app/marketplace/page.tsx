import type { Metadata } from 'next';
import MarketplaceContent from './content';

const SITE_URL = 'https://app.piyrox.shop';

export const metadata: Metadata = {
  title: 'Marketplace | Buy & Sell Game Accounts, Coins, Top-Ups & Boosting',
  description:
    'Discover verified gaming deals on Piyrox — Free Fire, PUBG Mobile, COD Mobile accounts, UC & diamonds top-ups, gift cards and rank boosting. Every trade secured by Piyrox Escrow.',
  alternates: { canonical: `${SITE_URL}/marketplace` },
  openGraph: {
    title: 'Piyrox Marketplace | Buy & Sell Game Accounts',
    description: 'Verified gaming accounts, top-ups and boosting services. Every trade secured by Piyrox Escrow.',
    url: `${SITE_URL}/marketplace`,
    siteName: 'Piyrox',
    type: 'website',
  },
};

export default function MarketplacePage() {
  return <MarketplaceContent />;
}
