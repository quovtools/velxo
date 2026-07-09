import type { Metadata } from 'next';
import { Tag, BadgeCheck, Package, Wallet, Star } from 'lucide-react';
import { DocHeader, DocSection, Steps, Callout, FeatureGrid, RelatedLinks, DocShell } from '../components/doc-ui';

export const metadata: Metadata = {
  title: 'How to Sell — Velxo Documentation',
  description:
    'How to create a listing, complete KYC/verification, manage orders, and withdraw earnings on Velxo.',
  alternates: { canonical: 'https://market.velxo.shop/docs/sell' },
};

export default function DocsSell() {
  return (
    <DocShell>
      <DocHeader
        icon={<Tag className="w-6 h-6" />}
        title="How to Sell"
        description="Turn your spare accounts, in-game currency, or boosting skills into cash. This guide covers listing creation, verification, order management, and getting paid."
      />

      <DocSection title="The seller journey">
        <Steps
          items={[
            { title: 'Create a listing', body: 'Describe the account, item, or service with clear photos and pricing.' },
            { title: 'Complete KYC / verification', body: 'Verify your identity to unlock selling and build buyer trust.' },
            { title: 'Manage incoming orders', body: 'Communicate with buyers and deliver through the secure order chat.' },
            { title: 'Receive escrow release', body: 'Once the buyer confirms, escrow releases funds to your wallet.' },
            { title: 'Withdraw earnings', body: 'Cash out to your bank account or mobile money.' },
          ]}
        />
      </DocSection>

      <DocSection title="1. Create a great listing">
        <p>
          A clear listing sells faster. Include the game, exact details (rank, skins, currency
          amount, region locks), delivery method, and fair pricing. Add screenshots where possible.
        </p>
        <FeatureGrid
          items={[
            { icon: <Package className="w-5 h-5" />, title: 'Be accurate', body: 'Misdescribed listings cause disputes and hurt your rating.' },
            { icon: <Star className="w-5 h-5" />, title: 'Price competitively', body: 'Check similar listings to stay competitive.' },
            { icon: <Tag className="w-5 h-5" />, title: 'Choose the right category', body: 'Accounts, top-ups, coins, or boosting — pick the best fit.' },
          ]}
        />
      </DocSection>

      <DocSection title="2. KYC / verification">
        <p>
          Before you can receive payouts, complete identity verification (KYC). You&apos;ll submit a
          government ID and a selfie, and may provide proof of ownership for high-value accounts.
          Verified sellers display a badge and rank higher in search.
        </p>
        <Callout type="info" title="Why verify?">
          Verification unlocks withdrawals, earns buyer trust, and is required to comply with
          anti-fraud and financial regulations.
        </Callout>
      </DocSection>

      <DocSection title="3. Manage orders">
        <p>
          When a buyer purchases, you&apos;ll get a notification. Deliver through the order chat only
          — never share credentials outside Velxo. Keep the buyer updated; good communication leads to
          faster escrow releases and better reviews.
        </p>
        <Callout type="warning" title="Deliver inside Velxo">
          Delivery and proof shared in the order chat is what our dispute team reviews. Off-platform
          delivery leaves you unprotected.
        </Callout>
      </DocSection>

      <DocSection title="4. Withdrawals">
        <p>
          After the buyer releases escrow, funds land in your Velxo wallet. From there you can withdraw
          to your linked bank account or mobile money. Withdrawals are processed in batches and may
          take a few business days depending on your provider.
        </p>
        <FeatureGrid
          items={[
            { icon: <Wallet className="w-5 h-5" />, title: 'Bank & mobile money', body: 'Withdraw to local accounts supported by our payment partners.' },
            { icon: <BadgeCheck className="w-5 h-5" />, title: 'Fees', body: 'A small platform fee applies per sale. See pricing for details.' },
          ]}
        />
      </DocSection>

      <RelatedLinks links={[{ label: 'How Escrow Works', href: '/docs/escrow' }, { label: 'Payments & Wallets', href: '/docs/payments' }, { label: 'Safety & Verification', href: '/docs/safety' }]} />
    </DocShell>
  );
}
