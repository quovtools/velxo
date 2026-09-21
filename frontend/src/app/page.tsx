import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck, ArrowRight, Gamepad2, Zap, BadgeCheck, Users,
  ChevronRight, Star, Lock, DollarSign, Send, Check, Award,
  TrendingUp, Flame, MessageSquare,
} from 'lucide-react';
import { GAME_LIST } from '@/lib/games';

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

/* ── Static game list for the grid ── */
const GAMES = GAME_LIST.map((g) => ({ name: g.name, slug: g.slug, color: g.color }));

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

/* ── Stats ── */
const STATS = [
  { value: '10,000+', label: 'Listings' },
  { value: '5,000+', label: 'Verified Sellers' },
  { value: '50,000+', label: 'Trades Completed' },
  { value: '4.9★', label: 'Avg. Seller Rating' },
];

/* ── How it works steps ── */
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
    title: 'Pay via Escrow',
    desc: 'Your payment is held securely by Piyrox. The seller is notified but cannot access funds yet.',
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

/* ── Features ── */
const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Trust-Trade Escrow',
    desc: 'Every transaction is escrow-protected. Funds are held until the buyer confirms delivery. Zero risk of scams.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Sellers',
    desc: 'Sellers go through identity verification. View ratings, reviews and completed orders before buying.',
  },
  {
    icon: Zap,
    title: 'Instant Delivery',
    desc: 'Most sellers deliver within hours. Real-time order tracking so you always know the status.',
  },
  {
    icon: Users,
    title: 'Dispute Resolution',
    desc: 'Run into a problem? Our team mediates disputes and ensures fair outcomes for both parties.',
  },
  {
    icon: TrendingUp,
    title: 'Account Valuation',
    desc: 'Not sure what your account is worth? Use our valuation tool to get a data-driven market estimate.',
  },
  {
    icon: DollarSign,
    title: 'Low Fees',
    desc: 'Competitive seller fees starting from 5%. Transparent pricing — no hidden charges.',
  },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[620px] flex items-center -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-16 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,160,23,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        {/* Glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-0 w-80 h-80 bg-brand/4 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full py-20 md:py-28">
          <div className="max-w-3xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-brand text-xs font-semibold px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Escrow Protected
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs font-medium px-3 py-1 rounded-full">
                <Flame className="w-3 h-3 text-orange-400" /> Africa&apos;s #1 Gaming Marketplace
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
              Buy, Sell &amp; Trade<br />
              <span className="text-brand">Gaming Accounts</span><br />
              Without the Risk.
            </h1>

            <p className="text-base md:text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
              Piyrox is Africa&apos;s trusted marketplace for gaming accounts, top-ups and boosting services.
              Every trade is backed by our Trust-Trade escrow — your money is safe until you confirm delivery.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-black font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-brand/25 text-sm"
              >
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-brand/30 text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm"
              >
                Start Selling
              </Link>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '🎮 Free Fire', href: '/games/free-fire' },
                { label: '🔫 PUBG Mobile', href: '/games/pubg-mobile' },
                { label: '💥 COD Mobile', href: '/games/cod-mobile' },
                { label: '⚡ Boosting', href: '/boosting' },
                { label: '💎 Top-Ups', href: '/topups' },
              ].map((f) => (
                <Link
                  key={f.label}
                  href={f.href}
                  className="bg-white/5 hover:bg-brand/10 border border-white/10 hover:border-brand/30 text-gray-400 hover:text-brand text-xs font-medium px-3 py-1.5 rounded-lg transition"
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 bg-black border-y border-[var(--border-bg)] mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-brand">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Games Grid ───────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">Browse by Game</h2>
            <p className="text-sm text-gray-500 mt-1">Accounts, top-ups and boosting for every game</p>
          </div>
          <Link href="/games" className="flex items-center gap-1 text-brand text-sm font-semibold hover:text-brand-light transition">
            All Games <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {GAMES.map((game) => {
            const color = game.color ?? '#888888';
            return (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                className="relative rounded-2xl overflow-hidden border border-[var(--border-bg)] hover:border-brand/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand/10 hover:-translate-y-1 group aspect-video flex items-end"
                style={{ background: `linear-gradient(135deg, ${color}28, #000)` }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition">
                  <Gamepad2 className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="relative z-10 w-full px-3 pb-3">
                  <span className="block text-xs font-extrabold text-white group-hover:text-brand transition leading-tight">{game.name}</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                    View listings <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 bg-black border-y border-[var(--border-bg)] mb-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Simple &amp; Secure
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">How Piyrox Works</h2>
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
                      <ChevronRight className="w-4 h-4 text-gray-700" />
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
              Learn more about Trust-Trade Escrow <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Built for Gamers</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Everything you need to trade gaming assets safely, quickly and confidently.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-[var(--card-bg)] border border-[var(--border-bg)] hover:border-brand/25 rounded-2xl p-6 transition group">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 bg-black border-y border-[var(--border-bg)] mb-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <MessageSquare className="w-3.5 h-3.5" /> Trusted by Gamers
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">What Players Are Saying</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">Real reviews from verified buyers and sellers across Africa.</p>
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
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="relative rounded-2xl overflow-hidden border border-brand/20 bg-gradient-to-br from-brand/8 via-black to-black p-8 md:p-14 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,rgba(212,160,23,0.08),transparent)]" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/25 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-5">
              Get Started Today
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">
              Ready to buy or sell<br />gaming assets safely?
            </h2>
            <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
              Join thousands of gamers across Africa who trade safely on Piyrox every day.
              Your first trade is just a few clicks away.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-black font-bold px-10 py-4 rounded-xl transition shadow-lg shadow-brand/25"
              >
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-brand/30 text-white font-semibold px-10 py-4 rounded-xl transition"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-12 pb-24 sm:pb-12 bg-black border-t border-[var(--border-bg)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo-new.png" alt="Piyrox" width={28} height={28} className="rounded-lg object-contain" />
                <span className="text-lg font-black tracking-widest text-white">PIYROX</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Gaming marketplace with escrow protection. Buy and sell gaming accounts, top-ups and services safely.
              </p>
              <p className="text-[10px] text-gray-600 font-medium tracking-wider uppercase">Play · Trade · Earn</p>
            </div>

            {/* Marketplace */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Marketplace</h4>
              <ul className="space-y-2.5">
                {[['Browse Listings', '/listings'], ['Marketplace', '/marketplace'], ['Games', '/games'], ['Boosting', '/boosting'], ['Top-Ups', '/topups'], ['Sell', '/sell']].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-gray-500 hover:text-brand transition">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5">
                {[['About', '/about'], ['Support', '/support'], ['Pricing', '/pricing'], ['Affiliate', '/affiliate'], ['Blog', '/blog']].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-gray-500 hover:text-brand transition">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[['Terms of Service', '/terms'], ['Privacy Policy', '/privacy'], ['Refund Policy', '/refund'], ['Escrow', '/escrow'], ['Docs', '/docs']].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-gray-500 hover:text-brand transition">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-[var(--border-bg)] gap-3">
            <p className="text-[11px] text-gray-600">© {new Date().getFullYear()} Piyrox. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              <span className="text-[11px] text-gray-500">Trust-Trade Escrow on every transaction</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
