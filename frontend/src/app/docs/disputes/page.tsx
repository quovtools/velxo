import type { Metadata } from 'next';
import { LifeBuoy, MessageSquareWarning, Scale, Headphones } from 'lucide-react';
import { DocHeader, DocSection, Steps, Callout, FeatureGrid, RelatedLinks, DocShell } from '../components/doc-ui';

export const metadata: Metadata = {
  title: 'Disputes & Support — Velxo Documentation',
  description:
    'How to open a dispute, what evidence the team reviews, expected resolution times, and how to contact Velxo Support.',
  alternates: { canonical: 'https://market.velxo.shop/docs/disputes' },
};

export default function DocsDisputes() {
  return (
    <DocShell>
      <DocHeader
        icon={<LifeBuoy className="w-6 h-6" />}
        title="Disputes & Support"
        description="If a trade doesn't go as described, escrow protection means you're not alone. Here's how to open a dispute and how our team resolves it."
      />

      <DocSection title="When to open a dispute">
        <p>Open a dispute (instead of releasing escrow) when:</p>
        <FeatureGrid
          items={[
            { icon: <MessageSquareWarning className="w-5 h-5" />, title: 'No delivery', body: 'You paid but the seller never delivered.' },
            { icon: <Scale className="w-5 h-5" />, title: 'Wrong / fake goods', body: 'The account or item doesn’t match the listing.' },
            { icon: <Headphones className="w-5 h-5" />, title: 'Unresponsive seller', body: 'The seller goes silent after payment.' },
          ]}
        />
        <Callout type="warning" title="Before you dispute">
          Try resolving in the order chat first — most issues are fixed quickly with a quick message.
        </Callout>
      </DocSection>

      <DocSection title="How a dispute is resolved">
        <Steps
          items={[
            { title: 'Open the dispute', body: 'From the order page, select “Open dispute” and describe the issue.' },
            { title: 'Both sides respond', body: 'Buyer and seller submit statements and evidence.' },
            { title: 'Team reviews', body: 'Velxo reviews the order chat and proof (screenshots, login attempts).' },
            { title: 'Decision', body: 'Funds are released to the buyer (refund) or seller based on evidence.' },
          ]}
        />
      </DocSection>

      <DocSection title="Evidence that helps">
        <p>
          The order chat is the single most important source of truth. Keep all communication and
          delivery inside Velxo. Screenshots of login attempts, mismatched details, or broken promises
          strengthen your case.
        </p>
        <Callout type="info" title="Be honest & prompt">
          Respond to dispute messages quickly. Ignoring requests can lead to a decision against you by
          default.
        </Callout>
      </DocSection>

      <DocSection title="Contacting Support">
        <p>
          For non-dispute help — account issues, verification, or general questions — visit the{' '}
          <span className="text-white font-semibold">Support</span> page or email{' '}
          <a href="mailto:support@velxo.shop" className="text-brand underline">support@velxo.shop</a>.
          We aim to reply within business hours.
        </p>
      </DocSection>

      <RelatedLinks links={[{ label: 'Escrow & Buyer Protection', href: '/docs/escrow' }, { label: 'Safety & Verification', href: '/docs/safety' }, { label: 'Support', href: '/support' }]} />
    </DocShell>
  );
}
