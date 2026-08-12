import type { Metadata } from 'next';
import { GAME_LIST } from '@/lib/games';
import BoostingClient from './boosting-client';

const SITE_URL = 'https://app.piyrox.shop';

export const metadata: Metadata = {
  title: 'Game Rank Boosting Services | Piyrox Market',
  description:
    'Hire KYC-verified boosters for Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball. Rank boost, solo carry, duo boost and coaching — all escrow-protected on Piyrox.',
  keywords: [
    'game rank boosting',
    'free fire rank boost',
    'pubg mobile rank boost',
    'cod mobile rank boost',
    'efootball division boost',
    'blood strike rank boost',
    'mobile game boosting service',
    'hire game booster africa',
    'solo carry service',
    'duo boost mobile games',
    'game coaching service',
    'account leveling service',
    'piyrox boosting',
    'escrow-protected boosting',
  ],
  alternates: { canonical: `${SITE_URL}/boosting` },
  openGraph: {
    title: 'Game Rank Boosting Services | Piyrox Market',
    description:
      'Hire verified boosters for Free Fire, PUBG Mobile, COD Mobile and more. Every boosting order is escrow-protected — payment releases only after you confirm rank-up.',
    url: `${SITE_URL}/boosting`,
    siteName: 'Piyrox Market',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Piyrox Boosting Services' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@piyroxshop',
    title: 'Game Rank Boosting Services | Piyrox Market',
    description:
      'Rank boost, solo carry, duo boost and coaching for top mobile games. Escrow-protected, KYC-verified sellers.',
    images: ['/opengraph-image'],
  },
};

const SITE = 'https://app.piyrox.shop';

// ── JSON-LD ──────────────────────────────────────────────────────────────────

const serviceListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Game Boosting Services on Piyrox',
  url: `${SITE}/boosting`,
  description:
    'Rank boost, solo carry, duo boost, account leveling and coaching services for top mobile games — all escrow-protected.',
  itemListElement: GAME_LIST.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: `${g.name} Rank Boosting`,
    url: `${SITE}/boosting?game=${encodeURIComponent(g.name)}`,
    description: `Hire verified ${g.name} boosters on Piyrox. Rank boost, solo carry, duo boost and coaching with Trust-Trade escrow protection.`,
  })),
};

const boostingFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does boosting work on Piyrox?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You browse available gigs, select a booster and purchase their service. Your payment is held in Trust-Trade escrow. The booster completes the rank-up or coaching session, and you release payment only after you confirm the work is done.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are Piyrox boosters verified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. All sellers on Piyrox go through KYC identity verification before they can list services. Seller ratings and review histories are visible on every gig card.',
      },
    },
    {
      '@type': 'Question',
      name: 'What games does Piyrox offer boosting for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Piyrox currently offers boosting for Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball. More games are added regularly.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of boosting services are available?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Piyrox sellers offer rank boost (play on your behalf to reach a target rank), solo carry (you play while the booster guides the lobby), duo boost (the booster plays alongside you), account leveling and one-on-one coaching sessions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is account sharing required for boosting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For rank boost and account leveling services, yes — you share login credentials with the booster only for the duration of the service. Solo carry, duo boost and coaching do not require sharing. Confirm with the seller before purchasing.',
      },
    },
  ],
};

export default function BoostingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(boostingFaqJsonLd) }}
      />
      <BoostingClient />
    </>
  );
}
