import type { Metadata } from 'next';
import { Coins, Gift, TrendingUp, Percent } from 'lucide-react';
import { DocHeader, DocSection, Steps, Callout, FeatureGrid, RelatedLinks, DocShell } from '../components/doc-ui';

export const metadata: Metadata = {
  title: 'VelxoCoins & Rewards — Velxo Documentation',
  description:
    'Earn VelxoCoins through activity and redeem them for fee discounts, perks, and rewards on the marketplace.',
  alternates: { canonical: 'https://market.velxo.shop/docs/rewards' },
};

export default function DocsRewards() {
  return (
    <DocShell>
      <DocHeader
        icon={<Coins className="w-6 h-6" />}
        title="VelxoCoins & Rewards"
        description="VelxoCoins are our loyalty currency. Earn them by being active on the platform and redeem them for real perks like fee discounts and boosted listings."
      />

      <DocSection title="How to earn VelxoCoins">
        <FeatureGrid
          items={[
            { icon: <Gift className="w-5 h-5" />, title: 'Daily activity', body: 'Earn coins for logging in and engaging with the marketplace.' },
            { icon: <TrendingUp className="w-5 h-5" />, title: 'Completed trades', body: 'Earn coins on every successful purchase or sale.' },
            { icon: <Percent className="w-5 h-5" />, title: 'Referrals & reviews', body: 'Get bonus coins for referring friends and leaving honest reviews.' },
          ]}
        />
      </DocSection>

      <DocSection title="Ways to redeem">
        <Steps
          items={[
            { title: 'Fee discounts', body: 'Apply coins to reduce the platform fee on a sale or purchase.' },
            { title: 'Boosted listings', body: 'Promote your listing to the top of search results.' },
            { title: 'Perks & badges', body: 'Unlock cosmetic perks and recognition on your profile.' },
          ]}
        />
        <Callout type="tip" title="Stack your savings">
          Regular traders who redeem coins on fees can meaningfully lower their overall costs.
        </Callout>
      </DocSection>

      <DocSection title="Coin balance & history">
        <p>
          Your VelxoCoins balance and earning history are available on the{' '}
          <span className="text-white font-semibold">Rewards</span> page. Coins may expire per the
          active rewards terms, so redeem them before they lapse.
        </p>
        <Callout type="info" title="Fair use">
          Coin earning is monitored for abuse. Artificial activity to farm coins may be reversed.
        </Callout>
      </DocSection>

      <RelatedLinks links={[{ label: 'Affiliate Program', href: '/docs/affiliate' }, { label: 'Payments & Wallets', href: '/docs/payments' }, { label: 'Rewards Page', href: '/rewards' }]} />
    </DocShell>
  );
}
