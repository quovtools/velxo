import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Lock, CheckCircle, AlertTriangle, ArrowRight, Clock, Banknote, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How Velxo Escrow Works',
  description: 'Learn how Velxo Escrow protects every gaming transaction — funds are held securely until you confirm delivery. Dispute resolution, fees, and buyer protection explained.',
  alternates: { canonical: 'https://velxo.shop/escrow' },
  openGraph: {
    title: 'How Velxo Escrow Works | Safe Gaming Trades',
    description: 'Your money is locked in escrow until you confirm delivery. Learn how Velxo keeps every trade safe.',
    url: 'https://velxo.shop/escrow',
    siteName: 'Velxo',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Velxo Escrow' }],
  },
};

const steps = [
  { step: '01', icon: <Banknote className="w-6 h-6 text-brand-light" />, title: 'Buyer Places Order', desc: 'The buyer pays for the item. Funds are immediately locked in Velxo Escrow — not sent to the seller yet.' },
  { step: '02', icon: <Lock className="w-6 h-6 text-brand-light" />, title: 'Seller Accepts', desc: 'The seller accepts the paid order, which starts a 60-minute delivery timer. Funds stay locked in escrow the whole time.' },
  { step: '03', icon: <ArrowRight className="w-6 h-6 text-brand-light" />, title: 'Seller Delivers (within 60 min)', desc: 'The seller has 60 minutes to hand over the account, coins, gift card, or complete the service. Miss the window and both parties can open a dispute or complaint.' },
  { step: '04', icon: <CheckCircle className="w-6 h-6 text-brand-light" />, title: 'Buyer Confirms (within 60 min)', desc: 'Delivery resets the clock: the buyer has a fresh 60 minutes to log in and click "Confirm Receipt", which releases the escrow funds.' },
  { step: '05', icon: <Banknote className="w-6 h-6 text-brand-light" />, title: 'Seller Gets Paid', desc: "The funds (minus the 10% service fee) are credited to the seller's Velxo wallet, ready for withdrawal." },
];

const disputeSteps = [
  { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, title: 'Open a Dispute or Complaint', desc: 'When a 60-minute window is missed, go to your Order page and click "File a Dispute" or "File a Complaint". Choose a reason and describe the issue clearly.' },
  { icon: <Clock className="w-5 h-5 text-yellow-400" />, title: 'Moderation Review', desc: 'Our team reviews evidence from both parties — chat logs, delivery screenshots, and order details — within 24–72 hours.' },
  { icon: <ArrowRight className="w-5 h-5 text-brand-light" />, title: 'Resolution Issued', desc: 'We issue a fair decision: full refund to buyer, partial refund, or full release to seller. Both parties are notified immediately.' },
];

const faqs = [
  { q: "What happens if the seller doesn't deliver?", a: 'Once the seller accepts, they have 60 minutes to deliver. If that window passes without delivery, both the buyer and seller get buttons to File a Dispute or File a Complaint. If the seller cannot prove delivery, the buyer receives a full refund. Funds are never automatically released without buyer confirmation.' },
  { q: 'How long do I have to confirm receipt?', a: 'When the seller marks the order as delivered, a fresh 60-minute window starts for you to log in and click "Confirm Receipt". If you don’t confirm in time, the seller can file a complaint to escalate — but you can still confirm receipt afterwards to release the funds.' },
  { q: 'How long does escrow hold the funds?', a: 'Funds are held until the buyer confirms delivery or a dispute is resolved. Nothing is released automatically — if a 60-minute window lapses, either party can raise a dispute or complaint and our team steps in to resolve it.' },
  { q: 'Can the seller cancel and take my money?', a: 'No. Once a payment is locked in escrow, the seller cannot access it. Only buyer confirmation or a dispute resolution releases the funds.' },
  { q: 'What is the escrow service fee?', a: 'Velxo charges a 10% service fee on each completed transaction, deducted from the seller’s payout. There are no fees for buyers.' },
  { q: 'Is my payment safe?', a: 'Yes. All payments are processed through Paystack or Flutterwave and held in a segregated escrow wallet. We use TLS encryption and bank-grade security standards.' },
];

export default function EscrowPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">

          {/* Hero */}
          <div className="text-center space-y-5 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto border border-brand/20">
              <ShieldCheck className="w-8 h-8 text-brand-light" />
            </div>
            <h1 className="heading-lg sm:heading-xl">
              How Velxo <span className="text-gradient">Escrow Works</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">
              Velxo Escrow protects every transaction. Your money never touches the seller until you confirm you&apos;ve received exactly what was promised.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-white text-center">The escrow process</h2>
            <div className="relative space-y-4 max-w-2xl mx-auto">
              {steps.map((step) => (
                <div key={step.step} className="flex items-start gap-5 bg-surface border border-border rounded-2xl p-6 hover:border-brand/40 transition card-glow">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center">{step.icon}</div>
                  <div className="flex-1">
                    <span className="text-xs font-black text-brand-light">STEP {step.step}</span>
                    <h3 className="font-bold text-white mt-1">{step.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: <Lock className="w-8 h-8 text-brand-light mx-auto" />, title: 'Funds Always Protected', desc: 'Money is locked the moment payment is made. Sellers cannot withdraw until you confirm.' },
              { icon: <ShieldCheck className="w-8 h-8 text-brand-light mx-auto" />, title: 'Neutral Moderation', desc: 'Our team reviews disputes fairly with evidence from both parties before making any decision.' },
              { icon: <CheckCircle className="w-8 h-8 text-brand-light mx-auto" />, title: 'You Control Release', desc: 'Funds are only released when you click confirm. Never automatically. Never without your approval.' },
            ].map((b) => (
              <div key={b.title} className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
                {b.icon}
                <h3 className="font-bold text-white">{b.title}</h3>
                <p className="text-sm text-gray-400">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Dispute section */}
          <div id="disputes" className="space-y-6 scroll-mt-28">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Dispute Resolution</h2>
              <p className="text-gray-400 text-sm">Something went wrong? Here&apos;s how we handle it.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-3xl mx-auto">
              {disputeSteps.map((step) => (
                <div key={step.title} className="bg-surface border border-border rounded-2xl p-6 space-y-3 text-center">
                  <div className="w-11 h-11 bg-background rounded-xl flex items-center justify-center mx-auto border border-border">{step.icon}</div>
                  <h3 className="font-bold text-white text-sm">{step.title}</h3>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 max-w-2xl mx-auto text-sm text-gray-400 space-y-2">
              <p className="font-bold text-red-300">Important:</p>
              <p>Velxo runs on tight <strong className="text-white">60-minute</strong> windows: the seller has 60 minutes to deliver after accepting, and the buyer has 60 minutes to confirm after delivery. If either window is missed, the affected party can open a dispute or complaint straight from the order page. Funds are <strong className="text-white">never</strong> released automatically without buyer confirmation or a support decision.</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-5 max-w-2xl mx-auto">
            <h2 className="text-2xl font-extrabold text-white text-center">Common Questions</h2>
            {faqs.map((faq, i) => (
              <details key={i} className="bg-surface border border-border rounded-2xl group open:border-brand/40 transition">
                <summary className="flex justify-between items-center px-5 sm:px-6 py-4 cursor-pointer list-none">
                  <span className="font-semibold text-white text-sm pr-4">{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-5 sm:px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-border pt-4">{faq.a}</div>
              </details>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-surface border border-border rounded-3xl p-8 sm:p-10 text-center space-y-4">
            <h3 className="text-2xl font-extrabold text-white">Ready to trade safely?</h3>
            <p className="text-gray-400 text-sm">Every trade on Velxo is protected. Start buying or selling with confidence.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://market.velxo.shop/search" className="btn-primary">Browse Listings</a>
              <a href="https://velxo.shop/support" className="btn-secondary">Get Help</a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
