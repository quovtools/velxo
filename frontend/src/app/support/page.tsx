import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, MessageSquare, AlertTriangle, HelpCircle, BookOpen, Zap, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center & Support | Velxo Market',
  description: 'Find answers to common questions about buying, selling, escrow, payments, withdrawals, and disputes on Velxo. Contact our support team 7 days a week.',
  alternates: { canonical: 'https://market.velxo.shop/support' },
  openGraph: {
    title: 'Help Center & Support | Velxo Market',
    description: 'Answers about escrow, payments, disputes, and selling on Velxo.',
    url: 'https://market.velxo.shop/support',
    type: 'website',
  },
};

const faqs = [
  {
    q: 'How does Velxo escrow work?',
    a: 'When you make a purchase, your payment is held securely in Velxo Escrow — not released to the seller until you confirm you have received exactly what was listed. If something goes wrong, you can open a dispute and our team steps in.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Delivery time depends on the seller and listing type. Most digital transfers (accounts, top-ups, gift cards) happen within minutes to a few hours. Each listing shows an estimated delivery time set by the seller.',
  },
  {
    q: 'What happens if I don\'t receive my item?',
    a: 'If the seller fails to deliver, simply open a dispute from your Order Tracking page. Our moderation team will review the case and issue a full refund if delivery is not confirmed within the agreed timeframe.',
  },
  {
    q: 'How do I become a seller on Velxo?',
    a: 'Head to the Sell page and create your seller profile. Once set up, you can list any gaming asset — accounts, coins, boosting services, gift cards — and start receiving orders immediately.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support Paystack (cards & bank transfers), Flutterwave (mobile money & cards), and crypto payments (Bitcoin, USDT, Solana). All transactions are secured and processed through verified payment providers.',
  },
  {
    q: 'What are the seller fees?',
    a: 'Velxo charges a 10% escrow service fee on each completed transaction. There are no listing fees or monthly charges — you only pay when you make a sale.',
  },
  {
    q: 'How do I withdraw my earnings?',
    a: 'Go to your Wallet page to request a withdrawal to your bank account or mobile money number. Withdrawals are processed within 1–3 business days.',
  },
  {
    q: 'Is my account information safe?',
    a: 'Yes. All user data is encrypted and stored securely. We use Supabase Auth for authentication, which follows industry-standard security practices including JWT tokens and row-level security.',
  },
  {
    q: 'Can I sell gift cards on Velxo?',
    a: 'Yes. Gift cards are a supported listing category. Make sure to provide accurate denomination, region, and redemption instructions to avoid disputes.',
  },
  {
    q: 'How does dispute resolution work?',
    a: 'Open a dispute from the Order page and provide your reason and description. Our moderation team reviews all evidence within 24–48 hours and issues a fair resolution — either releasing funds to the seller or refunding the buyer.',
  },
];

const categories = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-brand" />,
    title: 'Escrow & Payments',
    desc: 'How escrow works, payment methods, refunds, and fee structure.',
  },
  {
    icon: <Zap className="w-6 h-6 text-brand" />,
    title: 'Buying & Orders',
    desc: 'Placing orders, tracking delivery, and confirming receipt.',
  },
  {
    icon: <BookOpen className="w-6 h-6 text-brand" />,
    title: 'Selling & Listings',
    desc: 'Creating listings, seller guidelines, pricing and fees.',
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-brand" />,
    title: 'Disputes & Safety',
    desc: 'Opening disputes, reporting users, and platform safety rules.',
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-brand" />,
    title: 'Account & Profile',
    desc: 'Managing your account, wallet, KYC, and profile settings.',
  },
  {
    icon: <HelpCircle className="w-6 h-6 text-brand" />,
    title: 'General FAQ',
    desc: 'Common questions about the platform, policies, and rules.',
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-16 my-8">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          How can we <span className="text-brand">help you?</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Find answers to common questions about buying, selling, escrow, and everything in between.
        </p>
        <div className="flex items-center gap-3 bg-cardBg border border-borderBg rounded-2xl px-5 py-3.5 max-w-lg mx-auto">
          <HelpCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="text-gray-500 text-sm">Search topics below or browse the FAQ...</span>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.title}
            className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3 hover:border-brand/30 transition cursor-default"
          >
            <div className="w-11 h-11 bg-brand/10 rounded-xl flex items-center justify-center">
              {cat.icon}
            </div>
            <h3 className="font-bold text-white">{cat.title}</h3>
            <p className="text-sm text-gray-400">{cat.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-extrabold text-white text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="bg-cardBg border border-borderBg rounded-2xl group open:border-brand/30 transition"
            >
              <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none">
                <span className="font-semibold text-white text-sm">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
              </summary>
              <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-borderBg pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-cardBg border border-borderBg rounded-3xl p-10 text-center space-y-5 max-w-2xl mx-auto">
        <MessageSquare className="w-12 h-12 text-brand mx-auto" />
        <h3 className="text-2xl font-extrabold text-white">Still need help?</h3>
        <p className="text-gray-400 text-sm">
          Our support team is available 7 days a week. Reach us via live chat or email and we&apos;ll get back to you within a few hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@velxo.shop"
            className="bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white text-sm"
          >
            Email Support
          </a>
          <Link
            href="/messages"
            className="bg-background border border-borderBg hover:border-brand/40 px-6 py-3 rounded-xl font-bold transition text-gray-300 text-sm"
          >
            Live Chat
          </Link>
        </div>
        <p className="text-xs text-gray-600">support@velxo.shop • Response within 24 hours</p>
      </div>
    </div>
  );
}
