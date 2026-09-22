import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck, ArrowRight, Gamepad2, Zap, BadgeCheck, Users,
  Star, Lock, DollarSign, Send, Check,
  Twitter, Instagram, Youtube, Twitch, Store, Headphones,
} from 'lucide-react';
import { GAME_LIST } from '@/lib/games';
import GameSlideshow from '@/components/GameSlideshow';
import GameIcon from '@/components/GameIcon';
import { FeaturedListingsRow, TopupsRow, GigsRow } from './home-rows';

const SITE_URL = 'https://app.piyrox.shop';

export const metadata: Metadata = {
  title: 'Piyrox | Africa\'s Gaming Marketplace — Buy, Sell & Trade Safely',
  description:
    'Buy and sell gaming accounts, top-ups, boosting services on Piyrox. Free Fire, PUBG Mobile, COD Mobile and more. Every transaction secured by Trust-Trade Escrow.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Piyrox | Africa\'s Gaming Marketplace',
    description: 'The safe way to buy and sell gaming accounts, top-ups and boosting. Escrow protected.',
    url: SITE_URL,
    siteName: 'Piyrox',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Piyrox | Africa\'s Gaming Marketplace',
    description: 'Buy, sell & trade gaming accounts safely with escrow protection.',
  },
};

const GAMES = GAME_LIST.map((g) => ({ name: g.name, slug: g.slug }));

/* ── Testimonials ── */
const TESTIMONIALS = [
  {
    name: 'Tunde A.',
    location: 'Lagos, Nigeria',
    text: 'Sold my Free Fire account in 48 hours. The escrow system gave me confidence the buyer would actually pay.',
    rating: 5,
    game: 'Free Fire',
  },
  {
    name: 'Kwame O.',
    location: 'Accra, Ghana',
    text: 'Bought a Heroic PUBG account. The seller delivered within the hour. Smooth process, will buy again.',
    rating: 5,
    game: 'PUBG Mobile',
  },
  {
    name: 'Amara C.',
    location: 'Nairobi, Kenya',
    text: 'Used the boosting service for COD Mobile ranked. Went from Gold to Legendary in a week. Worth every coin.',
    rating: 5,
    game: 'COD Mobile',
  },
  {
    name: 'Chidi E.',
    location: 'Lagos, Nigeria',
    text: 'Was skeptical at first but the escrow actually works. No scams, no stress. This is how gaming trade should work.',
    rating: 5,
    game: 'Free Fire',
  },
];

/* ── How escrow works steps ── */
const HOW_IT_WORKS = [
  {
    icon: Gamepad2,
    step: '01',
    title: 'Browse Listings',
    desc: 'Search thousands of verified gaming accounts, top-ups and services. Filter by game, rank, price and more.',
  },
  {
    icon: Lock,
    step: '02',
    title: 'Pay into Escrow',
    desc: 'Your payment is held securely by Piyrox Trust-Trade. The seller is notified but cannot access funds yet.',
  },
  {
    icon: Send,
    step: '03',
    title: 'Seller Delivers',
    desc: 'The seller delivers your account or service directly to you within the agreed timeframe.',
  },
  {
    icon: Check,
    step: '04',
    title: 'Confirm & Release',
    desc: 'Verify everything is as described. Confirm delivery and the seller gets paid instantly.',
  },
];

/* ── Seller benefits ── */
const SELLER_BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Escrow-Protected Payouts',
    desc: 'Buyer funds are locked in escrow before you deliver. Complete the order and your payout is released — no chargeback scams.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Seller Badge',
    desc: 'Pass KYC once and earn the verified badge. Build reputation with ratings, seller levels and a public storefront.',
  },
  {
    icon: DollarSign,
    title: 'Low 5% Fees',
    desc: 'Keep more of every sale. Transparent flat pricing with no listing fees and no hidden charges.',
  },
];

/* ── Payment methods ── */
const PAYMENTS = ['MTN MoMo', 'Airtel Money', 'M-Pesa', 'Vodafone Cash', 'Orange Money', 'Visa', 'Mastercard'];

/* ── Social links ── */
const SOCIALS = [
  { label: 'X (Twitter)', href: '#', icon: Twitter },
  { label: 'Instagram', href: '#', icon: Instagram },
  { label: 'YouTube', href: '#', icon: Youtube },
  { label: 'Twitch', href: '#', icon: Twitch },
];

function SectionHeader({
  title, subtitle, seeMoreHref, seeMoreLabel = 'See More',
}: { title: string; subtitle?: string; seeMoreHref?: string; seeMoreLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {seeMoreHref && (
        <Link
          href={seeMoreHref}
          className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white/5 hover:bg-brand/10 border border-white/10 hover:border-brand/30 text-brand text-xs font-bold px-4 py-2 rounded-xl transition"
        >
          {seeMoreLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ── Hero Slideshow ──────────────────────────────────────── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 mb-0 overflow-hidden">
        <GameSlideshow />
      </section>

      {/* ── Game Marquee ────────────────────────────────────────── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 border-y border-[var(--border-bg)] bg-black/60 mb-16">
        <div className="marquee-wrap overflow-hidden py-4">
          <div className="marquee-track marquee-track-slow">
            {[...GAMES, ...GAMES].map((g, i) => (
              <Link
                key={`${g.slug}-${i}`}
                href={`/games/${g.slug}`}
                className="mx-3 flex-shrink-0 inline-flex items-center gap-2.5 bg-white/[0.03] hover:bg-brand/10 border border-white/8 hover:border-brand/30 rounded-2xl pl-2 pr-5 py-2 transition group"
              >
                <GameIcon game={g.name} className="w-8 h-8" />
                <span className="text-xs font-bold text-gray-300 group-hover:text-brand transition">{g.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured / Trending Listings ────────────────────────── */}
      <section className="mb-16">
        <SectionHeader
          title="Featured & Trending"
          subtitle="Hand-picked marketplace listings, escrow protected"
          seeMoreHref="/marketplace"
        />
        <FeaturedListingsRow />
      </section>

      {/* ── Top-Ups ─────────────────────────────────────────────── */}
      <section className="mb-16">
        <SectionHeader
          title="Instant Top-Ups"
          subtitle="Official game currency delivered to your player ID"
          seeMoreHref="/topups"
        />
        <TopupsRow />
      </section>

      {/* ── Gigs ────────────────────────────────────────────────── */}
      <section className="mb-16">
        <SectionHeader
          title="Boosting & Gigs"
          subtitle="Rank up with verified pro players"
          seeMoreHref="/boosting"
        />
        <GigsRow />
      </section>

      {/* ── How Piyrox Escrow Works ─────────────────────────────── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 bg-black border-y border-[var(--border-bg)] mb-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Lock className="w-3.5 h-3.5" /> Simple &amp; Secure
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">How Piyrox Escrow Works</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              We built escrow into every transaction. Here&apos;s how a safe trade works.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative bg-white/[0.02] border border-white/8 rounded-2xl p-6 group hover:border-brand/25 transition">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-5 z-10">
                      <ArrowRight className="w-4 h-4 text-gray-700" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition">
                    <Icon className="w-5 h-5 text-brand" />
                  </div>
                  <span className="text-[10px] font-black text-brand/50 tracking-widest mb-2 block">{step.step}</span>
                  <h3 className="font-bold text-sm text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/escrow" className="inline-flex items-center gap-1.5 text-brand text-sm font-semibold hover:text-brand-light transition">
              Learn more about Trust-Trade Escrow <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Seller / Trust Section ──────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Users className="w-3.5 h-3.5" /> Trusted by Sellers &amp; Buyers
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Why Gamers Trust Piyrox</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Built for safe trading across Africa — whether you&apos;re selling your first account or your hundredth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {SELLER_BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-[var(--card-bg)] border border-[var(--border-bg)] hover:border-brand/25 rounded-2xl p-6 transition group">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">{b.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white/[0.02] border border-white/8 hover:border-brand/20 rounded-2xl p-5 flex flex-col gap-3 transition">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-brand text-brand" />
                ))}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
              <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{t.name}</div>
                  <div className="text-[10px] text-gray-600">{t.location}</div>
                </div>
                <span className="text-[9px] font-bold bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-full">{t.game}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sell on Piyrox CTA ──────────────────────────────────── */}
      <section className="mb-16">
        <div className="relative rounded-2xl overflow-hidden border border-brand/20 bg-gradient-to-br from-brand/8 via-black to-black p-8 md:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,rgba(212,160,23,0.08),transparent)]" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-5">
                <Store className="w-3.5 h-3.5" /> Sell on Piyrox
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">
                Turn your accounts &amp;<br />skills into income.
              </h2>
              <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md leading-relaxed">
                List in minutes, sell with escrow protection, and get paid to mobile money.
                Thousands of buyers are waiting.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sell"
                  className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-black font-bold px-9 py-4 rounded-xl transition shadow-lg shadow-brand/25"
                >
                  Start Selling <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-brand/30 text-white font-semibold px-9 py-4 rounded-xl transition"
                >
                  Browse Marketplace
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: ShieldCheck, text: 'Funds locked in escrow before delivery — payout guaranteed' },
                { icon: BadgeCheck, text: 'Free storefront with verified badge and seller levels' },
                { icon: DollarSign, text: 'Flat 5% fee — no listing costs, no hidden charges' },
                { icon: Headphones, text: 'Dispute mediation team on every order' },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.text} className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3.5">
                    <Icon className="w-5 h-5 text-brand flex-shrink-0" />
                    <p className="text-xs text-gray-300 font-medium">{f.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-12 pb-24 sm:pb-12 bg-black border-t border-[var(--border-bg)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand + Payment methods */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo-new.png" alt="Piyrox" width={28} height={28} className="rounded-lg object-contain" />
                <span className="text-lg font-black tracking-widest text-white">PIYROX</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">
                Africa&apos;s escrow-protected gaming marketplace. Buy and sell accounts, top-ups and services safely.
              </p>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Payment Methods</h4>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENTS.map((p) => (
                  <span key={p} className="text-[10px] font-semibold text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded-md">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Supported games */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Supported Games</h4>
              <ul className="space-y-2.5">
                {GAMES.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/games/${g.slug}`} className="text-xs text-gray-500 hover:text-brand transition">{g.name}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/games" className="text-xs font-semibold text-brand hover:text-brand-light transition">All Games →</Link>
                </li>
              </ul>
            </div>

            {/* Useful links */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Useful Links</h4>
              <ul className="space-y-2.5">
                {[['Marketplace', '/marketplace'], ['Top-Ups', '/topups'], ['Boosting', '/boosting'], ['Sell', '/sell'], ['Wallet', '/wallet'], ['About', '/about'], ['Support', '/support'], ['Blog', '/blog'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-gray-500 hover:text-brand transition">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Follow Us</h4>
              <div className="flex flex-wrap gap-2 mb-5">
                {SOCIALS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      title={s.label}
                      className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-brand/15 hover:border-brand/30 flex items-center justify-center text-gray-400 hover:text-brand transition"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5">
                <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" />
                <span className="text-[10px] text-gray-400 leading-snug">Trust-Trade Escrow on every transaction</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-[var(--border-bg)] gap-3">
            <p className="text-[11px] text-gray-600">© {new Date().getFullYear()} Piyrox. All rights reserved.</p>
            <p className="text-[10px] text-gray-600 font-medium tracking-wider uppercase">Play · Trade · Earn</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
