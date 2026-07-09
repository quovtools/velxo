import type { Metadata } from 'next';

const SITE_URL = 'https://market.velxo.shop';

export const metadata: Metadata = {
  title: 'Sell Your Game Accounts, Coins & Services',
  description:
    'List your game accounts, in-game currency, top-ups, gift cards and boosting services on Velxo. Reach thousands of African gamers and get paid safely through Velxo Escrow.',
  keywords: [
    'sell game account',
    'sell game coins',
    'sell top up service',
    'become a seller',
    'gaming marketplace seller',
    'escrow payouts',
  ],
  alternates: {
    canonical: `${SITE_URL}/sell`,
  },
  openGraph: {
    title: 'Sell on Velxo Market',
    description: 'List your gaming products and get paid safely through Velxo Escrow.',
    url: `${SITE_URL}/sell`,
    siteName: 'Velxo Market',
    type: 'website',
  },
};

export { default } from './sell-content';
