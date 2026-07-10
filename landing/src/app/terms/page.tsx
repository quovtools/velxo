import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of the Velxo gaming marketplace, including accounts, escrow, fees, prohibited activities, and dispute resolution.',
  alternates: { canonical: 'https://velxo.shop/terms' },
  openGraph: {
    title: 'Terms of Service | Velxo',
    description: 'The rules of trading safely on Velxo.',
    url: 'https://velxo.shop/terms',
    siteName: 'Velxo',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Velxo Terms' }],
  },
};

const sections = [
  { title: '1. Acceptance of Terms', content: `By accessing or using Velxo ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform. Velxo reserves the right to update these terms at any time, and continued use of the Platform after changes are posted constitutes your acceptance of the revised terms.` },
  { title: '2. Platform Overview', content: `Velxo is a peer-to-peer gaming marketplace that facilitates the buying and selling of digital gaming assets including game accounts, in-game currencies, top-ups, gift cards, and boosting services. All transactions are protected by Velxo Escrow, which holds buyer funds until the buyer confirms successful delivery.` },
  { title: '3. User Accounts', content: `You must be at least 16 years of age to create an account on Velxo. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify Velxo immediately of any unauthorized use of your account. Velxo reserves the right to suspend or terminate accounts that violate these terms.` },
  { title: '4. Buyer Responsibilities', content: `Buyers agree to: (a) provide accurate payment information; (b) confirm delivery only after satisfactorily receiving the purchased item; (c) not abuse the dispute system or attempt fraudulent chargebacks; (d) communicate in good faith with sellers. Releasing escrow funds confirms acceptance of the delivered item. Velxo is not liable for buyer errors in confirming delivery.` },
  { title: '5. Seller Responsibilities', content: `Sellers agree to: (a) list only items they legally own or have rights to sell; (b) provide accurate, complete listing descriptions; (c) deliver items within the stated timeframe; (d) not engage in scam, misrepresentation, or account recovery after sale; (e) comply with all applicable laws. Velxo may suspend or permanently ban sellers who violate these obligations.` },
  { title: '6. Escrow Service', content: `Velxo Escrow holds buyer payments until the buyer confirms delivery or a dispute is resolved. A 10% escrow service fee is deducted from each completed transaction. Velxo acts as an independent intermediary and does not take sides in disputes. All dispute decisions made by Velxo moderation are final. Funds held in escrow are not interest-bearing.` },
  { title: '7. Prohibited Activities', content: `The following are strictly prohibited on Velxo: (a) selling hacked, stolen, or fraudulently obtained accounts; (b) account recovery or chargebacks after a completed sale; (c) harassment, threatening, or abusive behavior toward other users; (d) creating fake listings or manipulating reviews; (e) using the platform for money laundering or any illegal activity; (f) attempting to circumvent fees by transacting outside the platform.` },
  { title: '8. Fees & Payments', content: `Velxo charges a 10% service fee on each completed sale, deducted from the seller's payout. There are no listing fees. Payouts to sellers are processed within 1–3 business days of escrow release. Payment processing is handled by Paystack, Flutterwave, and supported crypto providers. Velxo is not responsible for delays caused by third-party payment processors.` },
  { title: '9. Dispute Resolution', content: `Either party may open a dispute within 7 days of order creation if a delivery issue arises. Velxo moderation will review evidence from both parties and issue a resolution within 24–72 hours. Decisions may result in a full refund to the buyer, partial refund, or full release to the seller. Repeated false or abusive disputes may result in account suspension.` },
  { title: '10. Intellectual Property', content: `All content on Velxo, including logos, interface design, and written content, is the property of Velxo and protected by applicable copyright and trademark laws. Users may not reproduce, distribute, or create derivative works from Velxo content without express written permission. Game names, logos, and trademarks belong to their respective owners; Velxo claims no affiliation with game developers or publishers.` },
  { title: '11. Limitation of Liability', content: `Velxo is a marketplace platform and is not a party to transactions between buyers and sellers. To the maximum extent permitted by law, Velxo shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Platform, including lost profits, data loss, or service interruption. Velxo's total liability in connection with any claim shall not exceed the transaction value in dispute.` },
  { title: '12. Termination', content: `Velxo reserves the right to suspend or terminate your account at any time, with or without notice, for violations of these terms or behavior deemed harmful to the platform or its users. Upon termination, any pending escrow funds will be handled in accordance with applicable dispute resolution policies.` },
  { title: '13. Governing Law', content: `These Terms of Service are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Nigeria. Velxo operates under Nigerian digital commerce regulations and complies with applicable data protection laws.` },
  { title: '14. Contact', content: `For questions about these Terms of Service, contact us at legal@velxo.shop or through our Support page.` },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">

          {/* Header */}
          <div className="space-y-3 border-b border-border pb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Terms of Service</h1>
            <p className="text-gray-400 text-sm">Last updated: January 2025</p>
            <p className="text-gray-400 leading-relaxed text-sm">
              Please read these Terms of Service carefully before using the Velxo platform. By creating an account or making a transaction, you agree to be bound by these terms.
            </p>
          </div>

          {/* Quick nav */}
          <details className="bg-surface border border-border rounded-2xl p-5 group open:border-brand/40 sm:open:border-brand/40">
            <summary className="flex justify-between items-center cursor-pointer list-none text-sm font-bold text-white uppercase tracking-wider">
              Quick Navigation
              <span className="text-gray-500 sm:hidden">Tap to expand</span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-4">
              {sections.map((s, i) => (
                <a key={i} href={`#section-${i}`} className="text-sm text-gray-400 hover:text-brand-light transition truncate">{s.title}</a>
              ))}
            </div>
          </details>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i} id={`section-${i}`} className="space-y-3 scroll-mt-28">
                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                <p className="text-gray-400 leading-relaxed text-sm">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Footer links */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>Questions? <a href="mailto:legal@velxo.shop" className="text-brand-light hover:underline">legal@velxo.shop</a></p>
            <div className="flex gap-5">
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/support" className="hover:text-white transition">Help Center</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
