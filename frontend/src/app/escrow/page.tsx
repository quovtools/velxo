import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, Lock, CheckCircle, AlertTriangle, ArrowRight, Clock, Banknote, RefreshCcw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How Velxo Escrow Works | Safe Gaming Trades',
  description: 'Learn how Velxo Escrow protects every gaming transaction — funds are held securely until you confirm delivery. Dispute resolution, fees, and buyer protection explained.',
  alternates: { canonical: 'https://market.velxo.shop/escrow' },
  openGraph: {
    title: 'How Velxo Escrow Works | Safe Gaming Trades',
    description: 'Your money is locked in escrow until you confirm delivery. Learn how Velxo keeps every trade safe.',
    url: 'https://market.velxo.shop/escrow',
    type: 'website',
  },
};

const steps = [
  {
    step: '01',
    icon: <Banknote className="w-6 h-6 text-brand" />,
    title: 'Buyer Places Order',
    desc: 'The buyer pays for the item. Funds are immediately locked in Velxo Escrow — not sent to the seller yet.',
  },
  {
    step: '02',
    icon: <Lock className="w-6 h-6 text-brand" />,
    title: 'Funds Held Securely',
    desc: 'The payment is held in our secure escrow wallet. Neither party can access the funds until the trade is completed.',
  },
  {
    step: '03',
    icon: <ArrowRight className="w-6 h-6 text-brand" />,
    title: 'Seller Delivers',
    desc: 'The seller transfers the game account, coins, gift card, or completes the boosting service as described in the listing.',
  },
  {
    step: '04',
    icon: <CheckCircle className="w-6 h-6 text-brand" />,
    title: 'Buyer Confirms',
    desc: 'The buyer verifies the delivery and clicks "Confirm Receipt". This releases the escrow funds to the seller.',
  },
  {
    step: '05',
    icon: <Banknote className="w-6 h-6 text-brand" />,
    title: 'Seller Gets Paid',
    desc: 'The funds (minus the 10% service fee) are credited to the seller\'s Velxo wallet, ready for withdrawal.',
  },
];

const disputeSteps = [
  {
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
    title: 'Open a Dispute',
    desc: 'Go to your Order page and click "File a Dispute". Choose a reason and describe the issue clearly.',
  },
  {
    icon: <Clock className="w-5 h-5 text-yellow-400" />,
    title: 'Moderation Review',
    desc: 'Our team reviews evidence from both parties — chat logs, delivery screenshots, and order details — within 24–72 hours.',
  },
  {
    icon: <RefreshCcw className="w-5 h-5 text-brand" />,
    title: 'Resolution Issued',
    desc: 'We issue a fair decision: full refund to buyer, partial refund, or full release to seller. Both parties are notified immediately.',
  },
];

const faqs = [
  {
    q: 'What happens if the seller doesn\'t deliver?',
    a: 'Open a dispute within 7 days of placing the order. If the seller cannot prove delivery, you will receive a full refund. Funds are never automatically released without buyer confirmation.',
  },
  {
    q: 'How long does escrow hold the funds?',
    a: 'Funds are held until the buyer confirms delivery or a dispute is resolved. If neither happens within 14 days, our team will reach out to both parties to resolve the order manually.',
  },
  {
    q: 'Can the seller cancel and take my money?',
    a: 'No. Once a payment is locked in escrow, the seller cannot access it. Only buyer confirmation or a dispute resolution releases the funds.',
  },
  {
    q: 'What is the escrow service fee?',
    a: 'Velxo charges a 10% service fee on each completed transaction, deducted from the seller\'s payout. There are no fees for buyers.',
  },
  {
    q: 'Is my payment safe?',
    a: 'Yes. All payments are processed through Paystack or Flutterwave and held in a segregated escrow wallet. We use TLS encryption and bank-grade security standards.',
  },
];

export default function EscrowPage() {
  return (
    <div className="space-y-16 my-8">
      {/* Hero */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto border border-brand/20">
          <ShieldCheck className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          How Velxo <span className="text-brand">Escrow Works</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Velxo Escrow protects every transaction. Your money never touches the seller until you confirm you&apos;ve received exactly what was promised.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-white text-center">The escrow process</h2>
        <div className="relative space-y-4 max-w-2xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-5 bg-cardBg border border-borderBg rounded-2xl p-6 hover:border-brand/30 transition">
              <div className="flex-shrink-0 w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-brand">STEP {step.step}</span>
                </div>
                <h3 className="font-bold text-white">{step.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 text-center space-y-3">
          <Lock className="w-8 h-8 text-brand mx-auto" />
          <h3 className="font-bold text-white">Funds Always Protected</h3>
          <p className="text-sm text-gray-400">Money is locked the moment payment is made. Sellers cannot withdraw until you confirm.</p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 text-center space-y-3">
          <ShieldCheck className="w-8 h-8 text-brand mx-auto" />
          <h3 className="font-bold text-white">Neutral Moderation</h3>
          <p className="text-sm text-gray-400">Our team reviews disputes fairly with evidence from both parties before making any decision.</p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 text-center space-y-3">
          <CheckCircle className="w-8 h-8 text-brand mx-auto" />
          <h3 className="font-bold text-white">You Control Release</h3>
          <p className="text-sm text-gray-400">Funds are only released when you click confirm. Never automatically. Never without your approval.</p>
        </div>
      </div>

      {/* Dispute section */}
      <div id="disputes" className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Dispute Resolution</h2>
          <p className="text-gray-400 text-sm">Something went wrong? Here&apos;s how we handle it.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {disputeSteps.map((step, i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3 text-center">
              <div className="w-11 h-11 bg-background rounded-xl flex items-center justify-center mx-auto border border-borderBg">
                {step.icon}
              </div>
              <h3 className="font-bold text-white text-sm">{step.title}</h3>
              <p className="text-xs text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 max-w-2xl mx-auto text-sm text-gray-400 space-y-2">
          <p className="font-bold text-red-300">Important:</p>
          <p>Disputes must be opened within <strong className="text-white">7 days</strong> of order creation. After that, funds are automatically released to the seller. Open a dispute immediately if there is any problem with your delivery.</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-5 max-w-2xl mx-auto">
        <h2 className="text-2xl font-extrabold text-white text-center">Common Questions</h2>
        {faqs.map((faq, i) => (
          <details key={i} className="bg-cardBg border border-borderBg rounded-2xl group open:border-brand/30 transition">
            <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none">
              <span className="font-semibold text-white text-sm">{faq.q}</span>
            </summary>
            <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-borderBg pt-4">
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-cardBg border border-borderBg rounded-3xl p-10 text-center space-y-4">
        <h3 className="text-2xl font-extrabold text-white">Ready to trade safely?</h3>
        <p className="text-gray-400 text-sm">Every trade on Velxo is protected. Start buying or selling with confidence.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="bg-brand hover:bg-brand-dark px-8 py-3.5 rounded-xl font-bold transition text-white">
            Browse Listings
          </Link>
          <Link href="/support" className="bg-background border border-borderBg hover:border-brand/40 px-8 py-3.5 rounded-xl font-bold transition text-gray-300">
            Get Help
          </Link>
        </div>
      </div>
    </div>
  );
}
