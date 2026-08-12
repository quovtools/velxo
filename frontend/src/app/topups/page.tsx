import type { Metadata } from 'next';
import { GAME_LIST } from '@/lib/games';
import TopupsClient from './topups-client';

const SITE_URL = 'https://app.piyrox.shop';

export const metadata: Metadata = {
  title: 'In-Game Currency Top-Ups | Piyrox Market',
  description:
    'Buy official Free Fire Diamonds, PUBG Mobile UC, COD Points, Blood Strike Golds and eFootball Coins on Piyrox. 100% legitimate, escrow-protected delivery at competitive rates.',
  keywords: [
    'buy free fire diamonds',
    'free fire diamond top up',
    'buy pubg mobile uc',
    'pubg uc top up',
    'buy cod points',
    'cod mobile cp top up',
    'blood strike golds buy',
    'efootball coins buy',
    'in-game currency top up',
    'mobile game top up africa',
    'cheap game diamonds',
    'piyrox top up',
    'escrow-protected top up',
    'official game currency',
  ],
  alternates: { canonical: `${SITE_URL}/topups` },
  openGraph: {
    title: 'In-Game Currency Top-Ups | Piyrox Market',
    description:
      'Official Free Fire Diamonds, PUBG UC, COD Points and more — escrow-protected delivery at competitive rates. No account sharing required.',
    url: `${SITE_URL}/topups`,
    siteName: 'Piyrox Market',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Piyrox Top-Up Store' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@piyroxshop',
    title: 'In-Game Currency Top-Ups | Piyrox Market',
    description:
      'Official Diamonds, UC, COD Points and more at competitive rates. Escrow-protected, instant delivery.',
    images: ['/opengraph-image'],
  },
};

// ── JSON-LD ──────────────────────────────────────────────────────────────────

const SITE = 'https://app.piyrox.shop';

const topupListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Official Game Currency Top-Ups on Piyrox',
  url: `${SITE}/topups`,
  description:
    'Buy official in-game currency for Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball with escrow-protected delivery.',
  itemListElement: GAME_LIST.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: `${g.name} Currency Top-Up`,
    url: `${SITE}/topups?game=${encodeURIComponent(g.name)}`,
    description: `Buy official ${g.name} in-game currency on Piyrox at competitive rates. Escrow-protected delivery — no account sharing required.`,
  })),
};

const topupFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Are Piyrox top-ups legitimate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. All top-ups sold directly by Piyrox are sourced through official channels. Your payment is held in Trust-Trade escrow and only released after currency is confirmed delivered to your account.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to share my account password for a top-up?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Official Piyrox top-ups are delivered via player ID or in-game purchase methods — you never share your account password for a standard top-up order.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which games does Piyrox offer top-ups for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Piyrox currently offers official top-ups for Free Fire (Diamonds), PUBG Mobile (UC), COD Mobile (COD Points), Blood Strike (Golds) and eFootball (eFootball Coins). More games are added regularly.',
      },
    },
    {
      '@type': 'Question',
      name: 'How fast is delivery?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most official top-ups are delivered within minutes to a few hours. Delivery time is shown on each product card. If delivery is delayed, our escrow system protects your payment until the issue is resolved.',
      },
    },
    {
      '@type': 'Question',
      name: 'What currencies can I pay with?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Piyrox accepts multiple payment methods including card payments and mobile money. Your local currency equivalent is shown at checkout.',
      },
    },
  ],
};

export default function TopupsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(topupListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(topupFaqJsonLd) }}
      />
      <TopupsClient />
    </>
  );
}
