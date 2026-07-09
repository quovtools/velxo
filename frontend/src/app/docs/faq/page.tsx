import type { Metadata } from 'next';
import { HelpCircle } from 'lucide-react';
import { DocHeader, DocSection, Callout, RelatedLinks, DocShell } from '../components/doc-ui';

export const metadata: Metadata = {
  title: 'FAQ — Velxo Documentation',
  description:
    'Frequently asked questions about buying, selling, escrow, payments, verification, rewards, and support on Velxo.',
  alternates: { canonical: 'https://market.velxo.shop/docs/faq' },
};

const FAQS = [
  {
    q: 'Is Velxo free to join?',
    a: 'Yes — creating an account is free. Fees apply only when a trade is completed, and they’re shown clearly before you pay or list.',
  },
  {
    q: 'How is my money protected?',
    a: 'Every trade is held in Velxo Escrow. The seller is only paid after you confirm delivery, and disputes are reviewed by our team using the order chat as evidence.',
  },
  {
    q: 'Can I pay outside the platform?',
    a: 'No — and you shouldn’t. Payments made outside Velxo are not covered by escrow and cannot be recovered. Always use the in-app payment link.',
  },
  {
    q: 'How do I become a verified seller?',
    a: 'Complete KYC from your seller dashboard: submit a government ID, pass the selfie check, and (for valuable accounts) provide ownership proof. Verified sellers get a trust badge.',
  },
  {
    q: 'How long do withdrawals take?',
    a: 'Withdrawals to bank or mobile money are processed in batches and typically arrive within a few business days, depending on your provider.',
  },
  {
    q: 'What if I never receive my order?',
    a: 'Open a dispute from the order page before releasing escrow. Our team reviews the evidence and, if valid, refunds you from the held escrow.',
  },
  {
    q: 'What are VelxoCoins?',
    a: 'VelxoCoins are loyalty rewards you earn through activity. Redeem them for fee discounts, boosted listings, and other perks on the Rewards page.',
  },
  {
    q: 'How does the affiliate program work?',
    a: 'Share your unique affiliate link. When referred users sign up and trade, you earn a commission paid to your Velxo wallet per the program terms.',
  },
  {
    q: 'Which games are supported?',
    a: 'Popular titles include Free Fire, PUBG Mobile, Valorant, COD Mobile, Fortnite, Roblox, and Mobile Legends, with more added over time.',
  },
  {
    q: 'How do I contact support?',
    a: 'Visit the Support page or email support@velxo.shop. For order problems, open a dispute from the order page for the fastest resolution.',
  },
];

export default function DocsFaq() {
  return (
    <DocShell>
      <DocHeader
        icon={<HelpCircle className="w-6 h-6" />}
        title="Frequently Asked Questions"
        description="Quick answers to the most common questions about trading safely on Velxo."
      />

      <DocSection title="Popular questions">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group rounded-xl border border-borderBg bg-background px-5 py-4 open:border-brand/40"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-white font-semibold text-sm">
                {f.q}
                <span className="text-gray-500 group-open:text-brand text-xl leading-none transition">+</span>
              </summary>
              <p className="text-gray-400 text-sm leading-relaxed pt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </DocSection>

      <Callout type="info" title="Still need help?">
        Browse the full guides in the sidebar, or reach our team via{' '}
        <a href="mailto:support@velxo.shop" className="text-brand underline">Support</a>.
      </Callout>

      <RelatedLinks links={[{ label: 'How to Buy', href: '/docs/buy' }, { label: 'Escrow & Buyer Protection', href: '/docs/escrow' }, { label: 'Disputes & Support', href: '/docs/disputes' }]} />
    </DocShell>
  );
}
