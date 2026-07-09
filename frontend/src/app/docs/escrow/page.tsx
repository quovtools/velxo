import type { Metadata } from 'next';
import { ShieldCheck, Lock, HandCoins, FileWarning } from 'lucide-react';
import { DocHeader, DocSection, Steps, Callout, FeatureGrid, RelatedLinks, DocShell } from '../components/doc-ui';

export const metadata: Metadata = {
  title: 'Escrow & Buyer Protection — Velxo Documentation',
  description:
    'Understand how Velxo Escrow protects buyers and sellers, how funds are held and released, and what happens in a dispute.',
  alternates: { canonical: 'https://market.velxo.shop/docs/escrow' },
};

export default function DocsEscrow() {
  return (
    <DocShell>
      <DocHeader
        icon={<ShieldCheck className="w-6 h-6" />}
        title="Escrow & Buyer Protection"
        description="Velxo Escrow is the trust layer that makes trading safe. Your money is held by Velxo until the deal is done right — protecting both sides from scams."
      />

      <DocSection title="How escrow works">
        <Steps
          items={[
            { title: 'Buyer pays', body: 'Payment is captured via the secure payment link and held in escrow — not sent to the seller.' },
            { title: 'Seller delivers', body: 'The seller fulfills the order through the protected order chat.' },
            { title: 'Buyer verifies', body: 'The buyer confirms the delivery matches the listing.' },
            { title: 'Funds released', body: 'On confirmation, escrow releases payment to the seller. If not, a dispute can be opened.' },
          ]}
        />
      </DocSection>

      <DocSection title="Why it protects you">
        <FeatureGrid
          items={[
            { icon: <Lock className="w-5 h-5" />, title: 'Funds are locked', body: 'Sellers can’t run off with your money before delivering.' },
            { icon: <HandCoins className="w-5 h-5" />, title: 'Sellers get paid', body: 'Buyers can’t receive goods and then refuse to pay — escrow guarantees payout on release.' },
            { icon: <FileWarning className="w-5 h-5" />, title: 'Disputes resolved', body: 'If delivery fails, our team reviews chat evidence and decides fairly.' },
          ]}
        />
      </DocSection>

      <DocSection title="Release vs. dispute">
        <p>
          Release escrow when you&apos;re satisfied. If the delivery is wrong, incomplete, or never
          arrives, open a dispute before releasing. Once released, the trade is final — so verify
          carefully.
        </p>
        <Callout type="warning" title="Release only when satisfied">
          After release, funds go to the seller and recovery is only possible through a formal dispute
          with strong evidence. Always confirm delivery first.
        </Callout>
      </DocSection>

      <DocSection title="What escrow does NOT cover">
        <p>
          Escrow protects trades made through Velxo. It does not cover payments sent outside the
          platform, trades arranged in chat without an order, or chargebacks filed with your bank
          after release.
        </p>
        <Callout type="info" title="Keep it on-platform">
          Every protected trade starts with a real order and an in-app payment link. Anything else is
          at your own risk.
        </Callout>
      </DocSection>

      <RelatedLinks links={[{ label: 'How to Buy', href: '/docs/buy' }, { label: 'Disputes & Support', href: '/docs/disputes' }, { label: 'Safety & Verification', href: '/docs/safety' }]} />
    </DocShell>
  );
}
