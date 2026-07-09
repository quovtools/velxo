import Link from 'next/link';
import type { Metadata } from 'next';
import { Sparkles, ShieldCheck, Wallet, ArrowRight, Gamepad2, Store, Coins, Users } from 'lucide-react';
import { DocHeader, DocSection, FeatureGrid, Callout, RelatedLinks, DocShell } from './components/doc-ui';

export const metadata: Metadata = {
  title: 'Velxo Documentation — Introduction',
  description:
    'What is Velxo and how to get started buying, selling, and trading game accounts, top-ups, and coins safely with escrow protection.',
  alternates: { canonical: 'https://market.velxo.shop/docs' },
};

export default function DocsIntroduction() {
  return (
    <DocShell>
      <DocHeader
        icon={<Sparkles className="w-6 h-6" />}
        title="Welcome to Velxo"
        description="Velxo is Africa's trusted escrow-backed marketplace for gaming accounts, in-game items, top-ups, and boosting services. This documentation walks you through everything — from making your first purchase to becoming a verified seller and earning through our affiliate program."
      />

      <DocSection title="What is Velxo?">
        <p>
          Velxo connects gamers who want to buy or sell digital gaming assets with a layer of
          protection that traditional social-media trades lack. Every transaction is held in
          Velxo Escrow: the buyer&apos;s payment is secured, the seller delivers, and funds are
          only released once the buyer confirms everything works.
        </p>
        <Callout type="success" title="Why people choose Velxo">
          Verified sellers, escrow protection on every order, local payment methods across Africa,
          and a built-in dispute process — so you never trade with a stranger unprotected.
        </Callout>
      </DocSection>

      <DocSection title="Core principles">
        <FeatureGrid
          items={[
            {
              icon: <ShieldCheck className="w-5 h-5" />,
              title: 'Escrow protection',
              body: 'Money is locked until the buyer accepts delivery. No more &quot;paid and blocked&quot; scams.',
            },
            {
              icon: <Store className="w-5 h-5" />,
              title: 'Verified sellers',
              body: 'Sellers complete KYC verification and earn trust badges that buyers can see.',
            },
            {
              icon: <Wallet className="w-5 h-5" />,
              title: 'Local payments',
              body: 'Pay with cards, bank transfer, mobile money and more via Paystack & Flutterwave.',
            },
            {
              icon: <Coins className="w-5 h-5" />,
              title: 'VelxoCoins rewards',
              body: 'Earn coins on activity and redeem them for fee discounts and perks.',
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: 'Affiliate program',
              body: 'Share your link and earn a commission on referred trades.',
            },
            {
              icon: <Gamepad2 className="w-5 h-5" />,
              title: 'All your games',
              body: 'Free Fire, PUBG Mobile, Valorant, COD Mobile, Roblox, Mobile Legends and more.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Getting started in 3 steps">
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-brand/15 border border-brand/30 text-brand font-bold flex items-center justify-center text-sm">1</span>
            <div>
              <p className="text-white font-semibold text-sm">Create a free account</p>
              <p className="text-gray-400 text-sm">Sign up with email, verify your address, and set up your wallet in minutes.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-brand/15 border border-brand/30 text-brand font-bold flex items-center justify-center text-sm">2</span>
            <div>
              <p className="text-white font-semibold text-sm">Browse or list</p>
              <p className="text-gray-400 text-sm">
                Buy from <Link href="/" className="text-brand hover:underline">verified listings</Link> or{' '}
                <Link href="/sell" className="text-brand hover:underline">create your own</Link> after KYC.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-brand/15 border border-brand/30 text-brand font-bold flex items-center justify-center text-sm">3</span>
            <div>
              <p className="text-white font-semibold text-sm">Trade safely with escrow</p>
              <p className="text-gray-400 text-sm">Pay via secure payment link, receive delivery, then release escrow when satisfied.</p>
            </div>
          </li>
        </ol>
      </DocSection>

      <DocSection title="Explore the docs">
        <p>Pick a topic from the sidebar, or jump into the most common guides:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link href="/docs/buy" className="group flex items-center justify-between gap-3 rounded-xl border border-borderBg bg-background px-4 py-3 hover:border-brand/40 transition">
            <span className="text-white font-semibold text-sm">How to Buy</span>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand transition" />
          </Link>
          <Link href="/docs/sell" className="group flex items-center justify-between gap-3 rounded-xl border border-borderBg bg-background px-4 py-3 hover:border-brand/40 transition">
            <span className="text-white font-semibold text-sm">How to Sell</span>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand transition" />
          </Link>
          <Link href="/docs/escrow" className="group flex items-center justify-between gap-3 rounded-xl border border-borderBg bg-background px-4 py-3 hover:border-brand/40 transition">
            <span className="text-white font-semibold text-sm">How Escrow Works</span>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand transition" />
          </Link>
          <Link href="/docs/faq" className="group flex items-center justify-between gap-3 rounded-xl border border-borderBg bg-background px-4 py-3 hover:border-brand/40 transition">
            <span className="text-white font-semibold text-sm">FAQ</span>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand transition" />
          </Link>
        </div>
      </DocSection>

      <Callout type="info" title="Need help fast?">
        If something went wrong with an order, open a dispute from your order page or visit{' '}
        <Link href="/support" className="text-brand underline">Support</Link>. Our team responds within business hours.
      </Callout>

      <RelatedLinks links={[{ label: 'How to Buy', href: '/docs/buy' }, { label: 'How to Sell', href: '/docs/sell' }]} />
    </DocShell>
  );
}
