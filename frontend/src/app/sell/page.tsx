import type { Metadata } from 'next';

const SITE_URL = 'https://app.piyrox.shop';

export const metadata: Metadata = {
  title: 'Sell Your Game Accounts, Coins & Services',
  description:
    'List your game accounts, in-game currency, top-ups, gift cards and boosting services on Piyrox. Reach thousands of African gamers and get paid safely through piyrox escrow.',
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
    title: 'Sell on piyrox market',
    description: 'List your gaming products and get paid safely through piyrox escrow.',
    url: `${SITE_URL}/sell`,
    siteName: 'piyrox market',
    type: 'website',
  },
};

export { default } from './sell-content';
