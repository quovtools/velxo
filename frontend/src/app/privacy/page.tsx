import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: '1. Introduction',
    content: `Velxo ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data. By using the Velxo platform, you consent to the practices described in this policy.`,
  },
  {
    title: '2. Information We Collect',
    content: `We collect the following types of information:\n\n• Account Information: name, email address, username, and password when you register.\n• Profile Information: store name, profile photo, and other seller/buyer profile details you choose to provide.\n• Transaction Data: order history, payment amounts, escrow activity, dispute records, and wallet balances.\n• Communication Data: messages exchanged between buyers and sellers on the platform.\n• Device & Usage Data: IP address, browser type, device identifiers, pages visited, and timestamps.\n• Payment Data: payment method details processed through our third-party payment providers (Paystack, Flutterwave). We do not store full card numbers or banking credentials.`,
  },
  {
    title: '3. How We Use Your Information',
    content: `We use your information to:\n\n• Operate and improve the Velxo platform and its features.\n• Process transactions and manage escrow services.\n• Verify identities and prevent fraud or abuse.\n• Send transactional emails (order confirmations, dispute updates, password resets).\n• Send marketing communications, which you may opt out of at any time.\n• Resolve disputes and enforce our Terms of Service.\n• Comply with legal obligations and respond to lawful requests from authorities.`,
  },
  {
    title: '4. How We Share Your Information',
    content: `We do not sell your personal data. We may share information with:\n\n• Payment Processors: Paystack and Flutterwave receive necessary payment information to process transactions.\n• Service Providers: Supabase (authentication & database), hosting providers, and analytics tools operate under strict data processing agreements.\n• Other Users: Your public profile, store name, and ratings are visible to other users. Transaction details are shared between the buyer and seller involved in an order.\n• Legal Authorities: We may disclose information when required by law, court order, or to protect the rights and safety of Velxo and its users.`,
  },
  {
    title: '5. Data Retention',
    content: `We retain your personal data for as long as your account is active or as needed to provide services. Transaction records are retained for 7 years to comply with financial regulations. You may request deletion of your account and associated data at any time, subject to legal retention requirements.`,
  },
  {
    title: '6. Cookies & Tracking',
    content: `Velxo uses cookies and similar technologies to:\n\n• Maintain your login session.\n• Remember your preferences.\n• Analyze platform usage and improve performance.\n• Enable security features.\n\nYou can control cookie settings through your browser. Disabling cookies may affect platform functionality. We do not use third-party advertising cookies.`,
  },
  {
    title: '7. Cookie Policy',
    content: `We use the following types of cookies:\n\n• Essential Cookies: Required for platform operation, including authentication and security. Cannot be disabled.\n• Functional Cookies: Remember your preferences such as language and display settings.\n• Analytics Cookies: Help us understand how users interact with the platform. These are anonymized and aggregated.\n\nWe do not use cookies for cross-site advertising or sell cookie data to third parties.`,
  },
  {
    title: '8. Data Security',
    content: `We implement industry-standard security measures including:\n\n• TLS encryption for all data in transit.\n• AES-256 encryption for sensitive data at rest.\n• Row-level security and access controls on our database.\n• Regular security audits and vulnerability assessments.\n• Two-factor authentication availability for user accounts.\n\nWhile we take significant precautions, no system is completely secure. We encourage users to use strong, unique passwords and to report any suspected security issues to security@velxo.shop.`,
  },
  {
    title: '9. Your Rights',
    content: `Depending on your jurisdiction, you may have the following rights:\n\n• Access: Request a copy of the personal data we hold about you.\n• Correction: Request that inaccurate data be corrected.\n• Deletion: Request deletion of your personal data, subject to legal retention requirements.\n• Portability: Request your data in a machine-readable format.\n• Objection: Object to certain types of data processing.\n• Withdraw Consent: Withdraw consent for marketing communications at any time.\n\nTo exercise these rights, contact us at privacy@velxo.shop.`,
  },
  {
    title: '10. Children\'s Privacy',
    content: `Velxo is not intended for users under the age of 16. We do not knowingly collect personal data from children. If we become aware that a child under 16 has provided us with personal data, we will delete it promptly. If you believe a child has created an account on Velxo, please contact us at privacy@velxo.shop.`,
  },
  {
    title: '11. International Data Transfers',
    content: `Velxo operates primarily in Africa with infrastructure hosted by providers that may store data in multiple regions. By using the platform, you consent to your data being transferred to and processed in countries that may have different data protection laws than your country of residence. We ensure appropriate safeguards are in place for such transfers.`,
  },
  {
    title: '12. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes via email or a prominent notice on the platform. Continued use of Velxo after changes are posted constitutes your acceptance of the updated policy. The "last updated" date at the top of this page reflects the most recent revision.`,
  },
  {
    title: '13. Contact Us',
    content: `For privacy-related questions, requests, or concerns, contact our Data Protection team at:\n\nEmail: privacy@velxo.shop\nGeneral Support: support@velxo.shop\n\nWe aim to respond to all privacy inquiries within 5 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 my-10">
      {/* Header */}
      <div className="space-y-3 border-b border-borderBg pb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-brand" />
          <h1 className="text-4xl font-extrabold text-white">Privacy Policy</h1>
        </div>
        <p className="text-gray-400 text-sm">Last updated: January 2025</p>
        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-5 py-3 text-sm text-emerald-300">
          Your data is never sold to third parties. We use it only to run the platform and keep your transactions safe.
        </div>
      </div>

      {/* Quick nav */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3">
        <p className="text-sm font-bold text-white uppercase tracking-wider">Quick Navigation</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {sections.map((s, i) => (
            <a
              key={i}
              href={`#section-${i}`}
              className="text-sm text-gray-400 hover:text-brand transition truncate"
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, i) => (
          <div key={i} id={`section-${i}`} className="space-y-3">
            <h2 className="text-lg font-bold text-white">{section.title}</h2>
            <div className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Footer links */}
      <div className="border-t border-borderBg pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
        <p>Questions? <a href="mailto:privacy@velxo.shop" className="text-brand hover:underline">privacy@velxo.shop</a></p>
        <div className="flex gap-5">
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/support" className="hover:text-white transition">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
