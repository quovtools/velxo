import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldCheck, Lock, CheckCircle, AlertTriangle, ArrowRight,
  Clock, Banknote, RefreshCcw, Zap, Star, Award,
} from 'lucide-react';
import OrderTrackingContent from '@/app/orders/[id]/order-tracking-content';
import { LoadingArea } from '@/components/LoadingLogo';

export const metadata: Metadata = {
  title: 'How Velxo Escrow Works | Safe P2P Gaming Trades',
  description: 'Velxo Escrow holds your funds securely until delivery is confirmed. Learn how our P2P escrow system, seller levels, and dispute resolution protect every trade.',
  alternates: { canonical: 'https://market.velxo.shop/escrow' },
  openGraph: {
    title: 'How Velxo Escrow Works | Safe P2P Gaming Trades',
    description: 'Your money is locked until you confirm delivery. P2P-grade protection on every trade.',
    url: 'https://market.velxo.shop/escrow',
    type: 'website',
  },
};

const steps = [
  {
    step: '01', icon: Banknote, color: 'text-brand',
    title: 'Buyer Places Order',
    desc: 'Buyer pays — funds are immediately locked in Velxo Escrow. The seller receives nothing until you confirm.',
  },
  {
    step: '02', icon: Lock, color: 'text-yellow-400',
    title: 'Seller Accepts',
    desc: 'Seller accepts the paid order, which starts a 60-minute delivery timer. Funds stay locked the entire time.',
  },
  {
    step: '03', icon: ArrowRight, color: 'text-purple-400',
    title: 'Seller Delivers',
    desc: 'The seller delivers login credentials or completes the service within 60 minutes of accepting.',
  },
  {
    step: '04', icon: CheckCircle, color: 'text-emerald-400',
    title: 'Buyer Confirms',
    desc: 'The buyer has 60 minutes to verify the delivery and click Confirm Receipt on the order page.',
  },
  {
    step: '05', icon: Banknote, color: 'text-brand',
    title: 'Seller Gets Paid',
    desc: 'Funds (minus the platform fee) are released to the seller\'s wallet, ready for withdrawal.',
  },
];

const levelBenefits = [
  {
    level: 'BRONZE', icon: '🥉', color: 'from-amber-700 to-amber-500', border: 'border-amber-600/30',
    title: 'Bronze Seller',
    desc: 'New sellers start here. Standard commission and escrow protection apply.',
    req: 'Default starting level',
  },
  {
    level: 'SILVER', icon: '🥈', color: 'from-slate-400 to-gray-300', border: 'border-slate-400/30',
    title: 'Silver Seller',
    desc: 'Proven sellers with good ratings. Shown higher in search results.',
    req: '10+ sales · 4.0★ avg',
  },
  {
    level: 'GOLD', icon: '🥇', color: 'from-yellow-500 to-amber-400', border: 'border-yellow-400/30',
    title: 'Gold Seller',
    desc: 'High-volume sellers with excellent track record. Priority placement.',
    req: '50+ sales · 4.5★ avg',
  },
  {
    level: 'ELITE', icon: '👑', color: 'from-violet-500 to-fuchsia-500', border: 'border-purple-400/30',
    title: 'Elite Seller',
    desc: 'Top-tier sellers with near-perfect stats. Max trust signal on all listings.',
    req: '200+ sales · 4.8★ avg',
  },
];

const disputeSteps = [
  {
    icon: AlertTriangle, color: 'text-red-400',
    title: 'Open a Dispute',
    desc: 'From your Order page, click File a Dispute or File a Complaint. Choose a reason and provide details.',
  },
  {
    icon: Clock, color: 'text-yellow-400',
    title: 'Moderation Review',
    desc: 'Our team reviews evidence from both parties — chat logs, delivery screenshots, and order history.',
  },
  {
    icon: RefreshCcw, color: 'text-brand',
    title: 'Resolution Issued',
    desc: 'We issue a fair decision within 24–72 hours: full refund, partial refund, or full release to seller.',
  },
];

const faqs = [
  {
    q: 'What happens if the seller doesn\'t deliver?',
    a: 'Once accepted, the seller has 60 minutes to deliver. If the window lapses without delivery, both parties can open a dispute. If the seller can\'t prove delivery, the buyer receives a full refund. Funds are never automatically released.',
  },
  {
    q: 'How long do I have to confirm receipt?',
    a: 'When the seller marks delivery, a fresh 60-minute window starts for you to verify and click Confirm Receipt. If you don\'t confirm in time, the seller can file a complaint to escalate.',
  },
  {
    q: 'Can the seller cancel and take my money?',
    a: 'No. Once payment is locked in escrow, the seller cannot access it. Only buyer confirmation or a dispute resolution releases the funds.',
  },
  {
    q: 'What is the platform fee?',
    a: 'Velxo charges a 10% service fee on completed transactions, deducted from the seller\'s payout. Buyers pay the listed price only. Seller Pro subscribers get a reduced rate (5% for Pro, 3% for Premium).',
  },
  {
    q: 'What is the seller level system?',
    a: 'Sellers earn levels (Bronze → Silver → Gold → Elite) based on completed sales, average rating, and delivery success rate. Higher-level sellers appear more prominently in search and carry a stronger trust signal for buyers.',
  },
  {
    q: 'Is my payment safe?',
    a: 'Yes. Payments are processed through Paystack or Flutterwave and held in a segregated escrow wallet. We use TLS encryption and bank-grade security standards throughout.',
  },
];

function TrackerFallback() {
  return (
    <div className="bg-cardBg border border-borderBg rounded-3xl p-8 flex items-center justify-center">
      <LoadingArea label="Loading escrow dashboard..." />
    </div>
  );
}

function EscrowInfo() {
  return (
    <div className="space-y-20 my-8">
      {/* Hero */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center mx-auto border border-brand/20 shadow-lg shadow-brand/10">
          <ShieldCheck className="w-10 h-10 text-brand" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
          How Velxo <span className="text-brand">Escrow Works</span>
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          Every trade on Velxo is backed by escrow. Your money never touches the seller until you confirm delivery — guaranteed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="bg-brand hover:bg-brand-dark px-8 py-3.5 rounded-xl font-bold text-white transition shadow-lg shadow-brand/20">
            Browse Listings
          </Link>
          <Link href="#how-it-works" className="bg-cardBg border border-borderBg hover:border-brand/40 px-8 py-3.5 rounded-xl font-bold text-gray-300 hover:text-white transition">
            See How It Works
          </Link>
        </div>
      </div>

      {/* Trust cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Lock, title: 'Funds Always Protected', desc: 'Money is locked the moment payment is made. Sellers cannot withdraw until buyer confirms.', color: 'text-brand' },
          { icon: ShieldCheck, title: 'Neutral Moderation', desc: 'Our team reviews disputes fairly — evidence from both parties before any decision.', color: 'text-emerald-400' },
          { icon: Zap, title: 'P2P Speed', desc: '60-minute delivery windows keep trades fast. Deadlines protect both buyers and sellers.', color: 'text-yellow-400' },
        ].map((c, i) => (
          <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 text-center space-y-3 hover:border-brand/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-background border border-borderBg flex items-center justify-center mx-auto">
              <c.icon className={`w-6 h-6 ${c.color}`} />
            </div>
            <h3 className="font-bold text-white">{c.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div id="how-it-works" className="space-y-6 scroll-mt-20">
        <h2 className="text-2xl font-black text-white text-center">The escrow process</h2>
        <div className="max-w-2xl mx-auto space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-5 bg-cardBg border border-borderBg rounded-2xl p-5 hover:border-brand/25 transition">
              <div className="flex-shrink-0 w-12 h-12 bg-background border border-borderBg rounded-xl flex items-center justify-center">
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-brand tracking-widest">STEP {s.step}</span>
                </div>
                <h3 className="font-bold text-white">{s.title}</h3>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seller Levels */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Seller Level System</h2>
          <p className="text-gray-400 text-sm">Sellers earn trust through performance — levels let you know exactly who you&apos;re trading with.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levelBenefits.map(l => (
            <div key={l.level} className={`bg-cardBg border ${l.border} rounded-2xl p-5 space-y-3 hover:shadow-lg transition`}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-black bg-gradient-to-r ${l.color} text-white`}>
                <span>{l.icon}</span> {l.title}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{l.desc}</p>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{l.req}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dispute section */}
      <div id="disputes" className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Dispute Resolution</h2>
          <p className="text-gray-400 text-sm">Something went wrong? Here&apos;s exactly what happens.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {disputeSteps.map((s, i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3 text-center hover:border-brand/25 transition">
              <div className="w-12 h-12 bg-background border border-borderBg rounded-xl flex items-center justify-center mx-auto">
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <h3 className="font-bold text-white text-sm">{s.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 max-w-2xl mx-auto text-sm text-gray-400 space-y-2">
          <p className="font-bold text-red-300">Important timing rules:</p>
          <p>Velxo enforces tight <strong className="text-white">60-minute</strong> windows: seller has 60 min to deliver after accepting, buyer has 60 min to confirm after delivery. Missing either window enables the affected party to open a dispute from their order page. Funds are <strong className="text-white">never</strong> released automatically without buyer confirmation or a moderator decision.</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h2 className="text-2xl font-black text-white text-center">Common Questions</h2>
        {faqs.map((faq, i) => (
          <details key={i} className="bg-cardBg border border-borderBg rounded-2xl group open:border-brand/25 transition">
            <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none">
              <span className="font-semibold text-white text-sm">{faq.q}</span>
              <span className="text-gray-500 group-open:rotate-180 transition-transform text-lg leading-none ml-2 flex-shrink-0">⌄</span>
            </summary>
            <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-borderBg pt-4">{faq.a}</div>
          </details>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-brand/15 via-cardBg to-purple-900/15 border border-borderBg rounded-3xl p-10 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-brand mx-auto" />
        <h3 className="text-2xl font-black text-white">Ready to trade safely?</h3>
        <p className="text-gray-400 text-sm">Every trade on Velxo is protected by escrow. Start buying or selling with confidence.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="bg-brand hover:bg-brand-dark px-8 py-3.5 rounded-xl font-bold text-white transition shadow-lg shadow-brand/20">
            Browse Listings
          </Link>
          <Link href="/support" className="bg-background border border-borderBg hover:border-brand/40 px-8 py-3.5 rounded-xl font-bold text-gray-300 hover:text-white transition">
            Get Help
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function EscrowPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  if (orderId) {
    return (
      <Suspense fallback={<TrackerFallback />}>
        <OrderTrackingContent id={orderId} />
      </Suspense>
    );
  }

  return <EscrowInfo />;
}
