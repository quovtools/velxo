import type { Metadata } from 'next';
import { Wallet, CreditCard, Smartphone, Banknote, ArrowDownToLine } from 'lucide-react';
import { DocHeader, DocSection, Steps, Callout, FeatureGrid, RelatedLinks, DocShell } from '../components/doc-ui';

export const metadata: Metadata = {
  title: 'Payments & Wallets — Velxo Documentation',
  description:
    'How payments, the Velxo wallet, payouts, and withdrawals work — supported methods, processing, and fees.',
  alternates: { canonical: 'https://market.velxo.shop/docs/payments' },
};

export default function DocsPayments() {
  return (
    <DocShell>
      <DocHeader
        icon={<Wallet className="w-6 h-6" />}
        title="Payments & Wallets"
        description="Velxo supports local payment methods across Africa through Paystack and Flutterwave, plus an in-platform wallet for sellers to manage earnings."
      />

      <DocSection title="Supported payment methods">
        <FeatureGrid
          items={[
            { icon: <CreditCard className="w-5 h-5" />, title: 'Cards', body: 'Visa and Mastercard debit/credit cards.' },
            { icon: <Banknote className="w-5 h-5" />, title: 'Bank transfer', body: 'Direct transfers via supported local banks.' },
            { icon: <Smartphone className="w-5 h-5" />, title: 'Mobile money', body: 'MTN, Airtel, and other mobile money options where available.' },
          ]}
        />
        <Callout type="info" title="Method availability">
          Available methods depend on your country and provider. The payment link shows only what
          works for your location.
        </Callout>
      </DocSection>

      <DocSection title="How a payment flows">
        <Steps
          items={[
            { title: 'Order created', body: 'Escrow is initiated when you start checkout.' },
            { title: 'Payment link generated', body: 'A secure link is created by our payment partner.' },
            { title: 'You pay', body: 'Complete payment with your chosen method.' },
            { title: 'Confirmation', body: 'Payment is confirmed and funds are held in escrow.' },
            { title: 'Payout on release', body: 'When the buyer releases, funds move to the seller wallet.' },
          ]}
        />
      </DocSection>

      <DocSection title="The Velxo wallet">
        <p>
          Sellers receive released funds in their Velxo wallet. From the wallet you can track balances,
          view transaction history, and request withdrawals. Buyers don&apos;t need a funded wallet —
          payment is made per order.
        </p>
        <Callout type="tip" title="Track everything">
          Your wallet shows escrow holds, completed payouts, and pending withdrawals so there are no
          surprises.
        </Callout>
      </DocSection>

      <DocSection title="Withdrawals">
        <Steps
          items={[
            { title: 'Verify your account', body: 'KYC must be complete before any withdrawal.' },
            { title: 'Link a payout method', body: 'Add your bank account or mobile money number.' },
            { title: 'Request withdrawal', body: 'Withdraw available balance from your wallet.' },
            { title: 'Processing', body: 'Funds are sent in batches and arrive within a few business days.' },
          ]}
        />
        <Callout type="warning" title="Fees & limits">
          Platform and provider fees may apply. Minimum withdrawal amounts and processing times vary
          by method and region.
        </Callout>
      </DocSection>

      <RelatedLinks links={[{ label: 'How to Sell', href: '/docs/sell' }, { label: 'Escrow & Buyer Protection', href: '/docs/escrow' }, { label: 'VelxoCoins & Rewards', href: '/docs/rewards' }]} />
    </DocShell>
  );
}
