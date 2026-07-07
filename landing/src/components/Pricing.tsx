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
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <span className="inline-block text-xs font-bold text-[#A78BFA] uppercase tracking-widest bg-[#8B5CF6]/10 px-4 py-2 rounded-full border border-[#8B5CF6]/20">
          Pricing
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-white">
          Simple, <span className="text-gradient">transparent pricing</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          No subscriptions. No hidden fees. Buyers always free. Sellers pay only when they earn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
        {/* Buyer card */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-8 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">For Buyers</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-white">Free</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">Zero fees. Always.</p>
          </div>
          <ul className="space-y-3">
            {BUYER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <a href="https://market.velxo.shop/auth/register"
            className="block text-center py-3.5 rounded-xl border border-[#1F2937] text-gray-300 hover:border-[#8B5CF6]/40 hover:text-white font-semibold text-sm transition">
            Create Buyer Account
          </a>
        </div>

        {/* Seller card */}
        <div className="bg-[#111827] border border-[#8B5CF6]/40 rounded-3xl p-8 space-y-6 relative ring-1 ring-[#8B5CF6]/20">
          <div className="absolute -top-3.5 left-7">
            <span className="bg-[#8B5CF6] text-white text-xs font-black uppercase tracking-wide px-4 py-1.5 rounded-full shadow-lg shadow-[#8B5CF6]/30">
              Sellers
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-2">Per Sale</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-white">10%</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">Only pay when you earn.</p>
          </div>
          <ul className="space-y-3">
            {SELLER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <a href="https://market.velxo.shop/sell"
            className="group flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#8B5CF6] hover:bg-[#6D28D9] text-white font-bold text-sm transition shadow-lg shadow-[#8B5CF6]/25">
            Start Selling Today
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Fee table */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-center text-lg font-bold text-white mb-4">Fee Calculator</h3>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#1F2937]">
              <tr className="text-xs text-gray-500 uppercase font-bold">
                <th className="px-6 py-4 text-left">Sale Price</th>
                <th className="px-6 py-4 text-left">Velxo Fee (10%)</th>
                <th className="px-6 py-4 text-left text-emerald-400">You Receive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {FEE_EXAMPLES.map((row) => (
                <tr key={row.sale} className="hover:bg-[#0b0f19]/50 transition">
                  <td className="px-6 py-4 font-bold text-white">{row.sale}</td>
                  <td className="px-6 py-4 text-gray-500">{row.fee}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{row.payout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
