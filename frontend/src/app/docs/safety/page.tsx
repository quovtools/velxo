import type { Metadata } from 'next';
import { BadgeCheck, Fingerprint, ScanFace, ShieldAlert } from 'lucide-react';
import { DocHeader, DocSection, Steps, Callout, FeatureGrid, RelatedLinks, DocShell } from '../components/doc-ui';

export const metadata: Metadata = {
  title: 'Safety & Verification — Velxo Documentation',
  description:
    'How Velxo verifies sellers with KYC, trust badges, and anti-fraud measures to keep the marketplace safe.',
  alternates: { canonical: 'https://market.velxo.shop/docs/safety' },
};

export default function DocsSafety() {
  return (
    <DocShell>
      <DocHeader
        icon={<BadgeCheck className="w-6 h-6" />}
        title="Safety & Verification"
        description="Trust is the foundation of Velxo. Learn how verification, trust signals, and our anti-fraud systems keep trades safe."
      />

      <DocSection title="Seller verification (KYC)">
        <p>
          Sellers complete Know-Your-Customer verification before they can withdraw earnings. This
          includes identity documents and a selfie check, and may include ownership proof for valuable
          accounts.
        </p>
        <Steps
          items={[
            { title: 'Submit ID', body: 'Upload a government-issued photo ID.' },
            { title: 'Selfie check', body: 'Complete a liveness/selfie match.' },
            { title: 'Review', body: 'Our team verifies the documents.' },
            { title: 'Verified badge', body: 'Approved sellers get a visible trust badge.' },
          ]}
        />
      </DocSection>

      <DocSection title="Trust signals to look for">
        <FeatureGrid
          items={[
            { icon: <BadgeCheck className="w-5 h-5" />, title: 'Verified badge', body: 'Confirms the seller passed KYC.' },
            { icon: <Fingerprint className="w-5 h-5" />, title: 'Ratings & reviews', body: 'Read feedback from past buyers.' },
            { icon: <ScanFace className="w-5 h-5" />, title: 'Sales history', body: 'More completed sales usually means more reliability.' },
          ]}
        />
      </DocSection>

      <DocSection title="Staying safe as a buyer">
        <Callout type="warning" title="Red flags">
          <ul className="list-disc pl-5 space-y-1">
            <li>Sellers asking to pay outside the platform.</li>
            <li>Listings priced far below market “too good to be true” value.</li>
            <li>Pressure to release escrow before verifying delivery.</li>
            <li>Requests for your account password or 2FA codes.</li>
          </ul>
        </Callout>
        <p className="pt-2">
          If you see a red flag, report the listing or user and our trust &amp; safety team will
          investigate.
        </p>
      </DocSection>

      <DocSection title="Our anti-fraud systems">
        <p>
          Velxo monitors logins, payments, and behavior for suspicious patterns. Accounts showing
          fraudulent signals can be limited or suspended. Combined with escrow, this creates multiple
          layers of protection.
        </p>
        <Callout type="info" title="Your role">
          Keep your password strong, enable available 2FA, and report anything suspicious — safety is
          a shared effort.
        </Callout>
      </DocSection>

      <RelatedLinks links={[{ label: 'Disputes & Support', href: '/docs/disputes' }, { label: 'How to Sell', href: '/docs/sell' }, { label: 'Escrow & Buyer Protection', href: '/docs/escrow' }]} />
    </DocShell>
  );
}
