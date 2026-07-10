import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Fees | Velxo Market',
  description: 'Simple, transparent pricing. Buyers pay zero fees; sellers pay a flat 10% escrow service fee only when they make a sale. No subscriptions, no listing fees.',
  alternates: { canonical: 'https://market.velxo.shop/pricing' },
  openGraph: {
    title: 'Pricing & Fees | Velxo Market',
    description: 'No hidden fees. Buyers pay nothing — sellers pay 10% only when they sell.',
    url: 'https://market.velxo.shop/pricing',
    type: 'website',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
