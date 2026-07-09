import type { Metadata } from 'next';
import { Users, Link2, Percent, Wallet } from 'lucide-react';
import { DocHeader, DocSection, Steps, Callout, FeatureGrid, RelatedLinks, DocShell } from '../components/doc-ui';

export const metadata: Metadata = {
  title: 'Affiliate Program — Velxo Documentation',
  description:
    'Earn commissions by referring new buyers and sellers to Velxo through your personal affiliate link.',
  alternates: { canonical: 'https://market.velxo.shop/docs/affiliate' },
};

export default function DocsAffiliate() {
  return (
    <DocShell>
      <DocHeader
        icon={<Users className="w-6 h-6" />}
        title="Affiliate Program"
        description="Love Velxo? Share it and earn. Our affiliate program pays you a commission when people you refer trade on the platform."
      />

      <DocSection title="How it works">
        <Steps
          items={[
            { title: 'Get your link', body: 'Generate your unique affiliate link from the affiliate dashboard.' },
            { title: 'Share it', body: 'Post it on social media, streams, communities, or your content.' },
            { title: 'Friends sign up & trade', body: 'Referred users are tagged to you when they register and trade.' },
            { title: 'Earn commission', body: 'You earn a percentage of eligible trade fees, paid to your wallet.' },
          ]}
        />
      </DocSection>

      <DocSection title="Program benefits">
        <FeatureGrid
          items={[
            { icon: <Link2 className="w-5 h-5" />, title: 'Unique tracking', body: 'Every referral is credited automatically via your link.' },
            { icon: <Percent className="w-5 h-5" />, title: 'Recurring earnings', body: 'Earn on ongoing activity from your referred users, per program terms.' },
            { icon: <Wallet className="w-5 h-5" />, title: 'Wallet payouts', body: 'Commissions land in your Velxo wallet and withdraw like sales.' },
          ]}
        />
      </DocSection>

      <DocSection title="Rules & best practices">
        <p>
          Promote Velxo honestly. Don&apos;t spam, use misleading claims, or create fake accounts to
          generate commissions — such activity is disqualified and may lead to removal.
        </p>
        <Callout type="info" title="Transparency wins">
          Tell your audience you may earn from referrals. Authentic recommendations convert far better
          and keep your account in good standing.
        </Callout>
      </DocSection>

      <RelatedLinks links={[{ label: 'VelxoCoins & Rewards', href: '/docs/rewards' }, { label: 'Payments & Wallets', href: '/docs/payments' }, { label: 'Affiliate Page', href: '/affiliate' }]} />
    </DocShell>
  );
}
