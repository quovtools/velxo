import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const BUYER_FEATURES = [
  'Browse all listings for free',
  'Escrow protection on every order',
  'Dispute resolution support',
  'Real-time chat with sellers',
  'Order tracking dashboard',
  'Zero buyer fees — always',
];

const SELLER_FEATURES = [
  'Create unlimited listings',
  'Escrow-backed payments',
  'Seller dashboard & analytics',
  'Reputation & review system',
  'Instant wallet with withdrawals',
  '10% service fee on sales only',
  'No monthly or listing fees',
  'Verified seller badge available',
];

const FEE_EXAMPLES = [
  { sale: '$10', fee: '$1.00', payout: '$9.00' },
  { sale: '$25', fee: '$2.50', payout: '$22.50' },
  { sale: '$50', fee: '$5.00', payout: '$45.00' },
  { sale: '$100', fee: '$10.00', payout: '$90.00' },
  { sale: '$200', fee: '$20.00', payout: '$180.00' },
];

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="section container-x">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="eyebrow">Pricing</span>
        <h2 id="pricing-heading" className="heading-xl">
          Simple, <span className="text-gradient">transparent pricing</span>
        </h2>
        <p className="text-lg text-gray-400">
          No subscriptions. No hidden fees. Buyers always free. Sellers pay only when they earn.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card-surface flex flex-col">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">For Buyers</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-5xl font-black text-white">Free</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Zero fees. Always.</p>
          <ul className="mt-6 flex-1 space-y-3">
            {BUYER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 shrink-0 text-accent-emerald" />
                {f}
              </li>
            ))}
          </ul>
          <a href="https://market.velxo.shop/auth/register" className="btn-secondary mt-8 w-full">
            Create Buyer Account
          </a>
        </div>

        <div className="card-highlight flex flex-col">
          <span className="absolute -top-3 left-7 rounded-full bg-brand-500 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-glow">
            Sellers
          </span>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-500">Per Sale</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-5xl font-black text-white">10%</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Only pay when you earn.</p>
          <ul className="mt-6 flex-1 space-y-3">
            {SELLER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 shrink-0 text-accent-emerald" />
                {f}
              </li>
            ))}
          </ul>
          <a href="https://market.velxo.shop/sell" className="btn-primary mt-8 w-full">
            Start Selling Today
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <h3 className="mb-4 text-center text-lg font-bold text-white">Fee Calculator</h3>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-xs font-bold uppercase text-gray-500">
                <th className="px-6 py-4 text-left">Sale Price</th>
                <th className="px-6 py-4 text-left">Velxo Fee (10%)</th>
                <th className="px-6 py-4 text-left text-accent-emerald">You Receive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {FEE_EXAMPLES.map((row) => (
                <tr key={row.sale} className="transition hover:bg-white/[0.04]">
                  <td className="px-6 py-4 font-bold text-white">{row.sale}</td>
                  <td className="px-6 py-4 text-gray-500">{row.fee}</td>
                  <td className="px-6 py-4 font-bold text-accent-emerald">{row.payout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
