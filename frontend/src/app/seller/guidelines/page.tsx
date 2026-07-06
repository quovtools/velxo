import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Star, Zap } from 'lucide-react';

const rules = [
  {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    title: 'List only what you own',
    desc: 'You must have legitimate ownership or rights to sell any item listed on Velxo. Listing stolen, hacked, or fraudulently obtained accounts is strictly prohibited and will result in a permanent ban.',
    type: 'required',
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    title: 'Accurate listing descriptions',
    desc: 'Your listing title, description, screenshots, rank, and game details must accurately represent the actual item. Misleading descriptions — including inflated stats, fake screenshots, or wrong region — are grounds for dispute and suspension.',
    type: 'required',
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    title: 'Deliver within stated timeframe',
    desc: 'Set a realistic delivery time in your listing and honor it. Buyers will be able to open a dispute if delivery is not made within the stated window. Consistently late deliveries affect your reputation score.',
    type: 'required',
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    title: 'Respond to buyers promptly',
    desc: 'Use the Velxo messaging system to communicate with buyers. Respond to order-related messages within 24 hours. Ignoring buyers or going offline after receiving an order will result in automatic dispute escalation.',
    type: 'required',
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    title: 'No account recovery after sale',
    desc: 'Once an account is sold and the buyer has confirmed delivery, you must not attempt to recover, reclaim, or access the account in any way. Account recovery after a completed sale is fraud and results in a permanent ban with no appeal.',
    type: 'required',
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    title: 'No off-platform deals',
    desc: 'Attempting to move buyers outside Velxo to avoid escrow protection and fees is strictly prohibited. All transactions must be completed on the platform. Violations result in account suspension.',
    type: 'prohibited',
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    title: 'No fake reviews or manipulation',
    desc: 'Creating fake buyer accounts to leave positive reviews, offering incentives for reviews, or asking buyers to cancel disputes in exchange for partial refunds are all prohibited.',
    type: 'prohibited',
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    title: 'No harmful or illegal content',
    desc: 'Listings for hacked accounts, cheating software, ban bypass tools, phishing assets, or any illegal digital goods are strictly forbidden and will be removed immediately.',
    type: 'prohibited',
  },
];

const tips = [
  {
    icon: <Star className="w-5 h-5 text-brand" />,
    title: 'Use real screenshots',
    desc: 'Upload actual screenshots of the account stats, skins, or balance you\'re selling. Listings with clear images get significantly more views and conversions.',
  },
  {
    icon: <Zap className="w-5 h-5 text-brand" />,
    title: 'Price competitively',
    desc: 'Browse similar listings before setting your price. Overpriced listings sit unsold. Use the search page to gauge current market rates for your game and asset type.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-brand" />,
    title: 'Build your reputation',
    desc: 'Complete orders on time, communicate well, and ask satisfied buyers to leave a review. A strong reputation score unlocks more visibility in search results.',
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-brand" />,
    title: 'Be specific in descriptions',
    desc: 'Include the game server, region, ranked tier, skins count, account level, and login method. The more specific you are, the fewer disputes you\'ll face.',
  },
];

const penalties = [
  { offense: 'Misleading listing description', consequence: 'Listing removed + warning' },
  { offense: 'Late delivery (first time)', consequence: 'Warning + reputation penalty' },
  { offense: 'Repeated late deliveries', consequence: 'Temporary suspension' },
  { offense: 'Account recovery after sale', consequence: 'Permanent ban (no appeal)' },
  { offense: 'Off-platform transaction attempt', consequence: 'Account suspension' },
  { offense: 'Selling stolen/hacked accounts', consequence: 'Permanent ban + report to authorities' },
  { offense: 'Fake review manipulation', consequence: 'Account suspension' },
  { offense: 'Fraud / intentional scam', consequence: 'Permanent ban + funds withheld' },
];

export default function SellerGuidelinesPage() {
  return (
    <div className="space-y-14 my-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-4 border-b border-borderBg pb-8">
        <h1 className="text-4xl font-extrabold text-white">Seller Guidelines</h1>
        <p className="text-gray-400 leading-relaxed">
          These guidelines exist to protect buyers, maintain trust on the platform, and ensure Velxo remains a safe marketplace for everyone. All sellers agree to these rules when creating an account.
        </p>
        <div className="inline-flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm text-emerald-300">
          <ShieldCheck className="w-4 h-4" />
          Last updated: January 2025
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-5">
        <h2 className="text-xl font-extrabold text-white">Rules & Requirements</h2>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.title}
              className={`bg-cardBg border rounded-2xl p-6 space-y-2 ${
                rule.type === 'prohibited' ? 'border-red-500/20' : 'border-borderBg'
              }`}
            >
              <div className="flex items-center gap-2">
                {rule.icon}
                <h3 className="font-bold text-white">{rule.title}</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Best practices */}
      <div className="space-y-5">
        <h2 className="text-xl font-extrabold text-white">Tips for Success</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tips.map((tip) => (
            <div key={tip.title} className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                {tip.icon}
                <h3 className="font-bold text-white text-sm">{tip.title}</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Penalty table */}
      <div className="space-y-5">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Violation Consequences
        </h2>
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-borderBg">
              <tr className="text-xs text-gray-500 uppercase font-bold">
                <th className="px-6 py-4 text-left">Offense</th>
                <th className="px-6 py-4 text-left">Consequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderBg">
              {penalties.map((row) => (
                <tr key={row.offense} className="hover:bg-background/20 transition">
                  <td className="px-6 py-4 text-gray-300">{row.offense}</td>
                  <td className="px-6 py-4 font-semibold text-red-400">{row.consequence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-cardBg border border-borderBg rounded-3xl p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Ready to start selling?</h3>
        <p className="text-gray-400 text-sm">Create your seller profile and list your first item in minutes.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/sell" className="bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white text-sm">
            Start Selling
          </Link>
          <Link href="/pricing" className="bg-background border border-borderBg hover:border-brand/40 px-6 py-3 rounded-xl font-bold transition text-gray-300 text-sm">
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
