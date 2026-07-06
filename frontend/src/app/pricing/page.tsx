import React from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, ShieldCheck, Zap, Award } from 'lucide-react';

const buyerFeatures = [
  { text: 'Browse and search all listings', included: true },
  { text: 'Escrow protection on every order', included: true },
  { text: 'Dispute resolution support', included: true },
  { text: 'Real-time chat with sellers', included: true },
  { text: 'Order tracking dashboard', included: true },
  { text: 'Zero buyer fees', included: true },
];

const sellerFeatures = [
  { text: 'Create unlimited listings', included: true },
  { text: 'Escrow-backed payments', included: true },
  { text: 'Seller dashboard & analytics', included: true },
  { text: 'Reputation & review system', included: true },
  { text: 'Wallet with fast withdrawals', included: true },
  { text: '10% service fee per sale only', included: true },
  { text: 'No monthly subscription', included: true },
  { text: 'No listing fees', included: true },
];

const feeExamples = [
  { salePrice: 10, fee: 1.00, payout: 9.00 },
  { salePrice: 25, fee: 2.50, payout: 22.50 },
  { salePrice: 50, fee: 5.00, payout: 45.00 },
  { salePrice: 100, fee: 10.00, payout: 90.00 },
  { salePrice: 250, fee: 25.00, payout: 225.00 },
  { salePrice: 500, fee: 50.00, payout: 450.00 },
];

const paymentMethods = [
  { name: 'Paystack', desc: 'Debit/credit cards, bank transfers', regions: 'Nigeria, Ghana, Kenya' },
  { name: 'Flutterwave', desc: 'Mobile money, cards, bank', regions: 'Pan-Africa' },
  { name: 'Bitcoin (BTC)', desc: 'Cryptocurrency transfer', regions: 'Global' },
  { name: 'USDT (TRC20)', desc: 'Stablecoin on Tron network', regions: 'Global' },
  { name: 'Solana (SOL)', desc: 'Cryptocurrency transfer', regions: 'Global' },
];

export default function PricingPage() {
  return (
    <div className="space-y-16 my-8">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          Simple, <span className="text-brand">transparent pricing</span>
        </h1>
        <p className="text-gray-400 text-lg">
          No hidden fees. No subscriptions. Buyers pay nothing — sellers pay only when they make a sale.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Buyer */}
        <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">For Buyers</p>
            <h2 className="text-3xl font-extrabold text-white mt-1">Free</h2>
            <p className="text-gray-400 text-sm mt-1">Zero fees. Always.</p>
          </div>
          <div className="space-y-3">
            {buyerFeatures.map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm">
                {f.included
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                <span className={f.included ? 'text-gray-200' : 'text-gray-600'}>{f.text}</span>
              </div>
            ))}
          </div>
          <Link href="/auth/register" className="block text-center bg-background border border-borderBg hover:border-brand/40 py-3.5 rounded-xl font-bold transition text-gray-300 text-sm">
            Create Account
          </Link>
        </div>

        {/* Seller */}
        <div className="bg-cardBg border border-brand/30 rounded-3xl p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="bg-brand/10 text-brand-light text-xs font-bold px-3 py-1 rounded-full border border-brand/20">
              Most Popular
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">For Sellers</p>
            <div className="flex items-end gap-2 mt-1">
              <h2 className="text-3xl font-extrabold text-white">10%</h2>
              <span className="text-gray-400 text-sm mb-1">per sale</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">Only pay when you make money.</p>
          </div>
          <div className="space-y-3">
            {sellerFeatures.map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm">
                {f.included
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                <span className={f.included ? 'text-gray-200' : 'text-gray-600'}>{f.text}</span>
              </div>
            ))}
          </div>
          <Link href="/sell" className="block text-center bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition text-white text-sm">
            Start Selling
          </Link>
        </div>
      </div>

      {/* Fee calculator table */}
      <div className="space-y-5 max-w-2xl mx-auto">
        <h2 className="text-2xl font-extrabold text-white text-center">Fee Examples</h2>
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-borderBg">
              <tr className="text-xs text-gray-500 uppercase font-bold">
                <th className="px-6 py-4 text-left">Sale Price</th>
                <th className="px-6 py-4 text-left">Velxo Fee (10%)</th>
                <th className="px-6 py-4 text-left text-emerald-400">You Receive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderBg">
              {feeExamples.map((row) => (
                <tr key={row.salePrice} className="hover:bg-background/30 transition">
                  <td className="px-6 py-4 font-bold text-white">${row.salePrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-400">${row.fee.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">${row.payout.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment methods */}
      <div className="space-y-5 max-w-2xl mx-auto">
        <h2 className="text-2xl font-extrabold text-white text-center">Accepted Payment Methods</h2>
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <div key={pm.name} className="bg-cardBg border border-borderBg rounded-xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">{pm.name}</p>
                <p className="text-xs text-gray-400">{pm.desc}</p>
              </div>
              <span className="text-xs text-gray-500 text-right">{pm.regions}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 text-center space-y-2">
          <ShieldCheck className="w-7 h-7 text-brand mx-auto" />
          <p className="font-bold text-white text-sm">Escrow on Every Trade</p>
          <p className="text-xs text-gray-400">Funds locked until delivery confirmed</p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 text-center space-y-2">
          <Zap className="w-7 h-7 text-brand mx-auto" />
          <p className="font-bold text-white text-sm">Fast Withdrawals</p>
          <p className="text-xs text-gray-400">1–3 business days to your account</p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 text-center space-y-2">
          <Award className="w-7 h-7 text-brand mx-auto" />
          <p className="font-bold text-white text-sm">No Hidden Charges</p>
          <p className="text-xs text-gray-400">10% fee and nothing more</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-cardBg border border-borderBg rounded-3xl p-10 text-center space-y-4 max-w-2xl mx-auto">
        <h3 className="text-2xl font-extrabold text-white">Start earning on Velxo today</h3>
        <p className="text-gray-400 text-sm">List your first item in under 5 minutes. No approval required.</p>
        <Link href="/sell" className="inline-block bg-brand hover:bg-brand-dark px-8 py-3.5 rounded-xl font-bold transition text-white">
          Create a Listing
        </Link>
      </div>
    </div>
  );
}
