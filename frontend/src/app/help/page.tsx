'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Search, BookOpen, ShieldCheck, TrendingUp, HelpCircle } from 'lucide-react'
import { useState } from 'react'

const HELP_ARTICLES = [
  {
    category: 'Getting Started',
    icon: BookOpen,
    articles: [
      { title: 'How to Create an Account', slug: 'create-account' },
      { title: 'How to Verify Your Identity', slug: 'verify-identity' },
      { title: 'Setting Up Your Profile', slug: 'setup-profile' },
      { title: 'How to Upload Photos', slug: 'upload-photos' },
    ],
  },
  {
    category: 'Buying',
    icon: TrendingUp,
    articles: [
      { title: 'How to Buy Safely', slug: 'buy-safely' },
      { title: 'Understanding Escrow', slug: 'escrow' },
      { title: 'Making an Offer', slug: 'make-offer' },
      { title: 'Confirming Delivery', slug: 'confirm-delivery' },
    ],
  },
  {
    category: 'Selling',
    icon: ShieldCheck,
    articles: [
      { title: 'How to Create a Listing', slug: 'create-listing' },
      { title: 'Pricing Your Items', slug: 'pricing' },
      { title: 'Getting Verified as a Seller', slug: 'seller-verification' },
      { title: 'Managing Your Store', slug: 'manage-store' },
    ],
  },
  {
    category: 'Safety & Trust',
    icon: ShieldCheck,
    articles: [
      { title: 'Escrow Protection Explained', slug: 'escrow-explained' },
      { title: 'Dispute Resolution Process', slug: 'dispute-process' },
      { title: 'How to Report Fraud', slug: 'report-fraud' },
      { title: 'Account Security Best Practices', slug: 'security-tips' },
    ],
  },
  {
    category: 'Payments & Wallet',
    icon: TrendingUp,
    articles: [
      { title: 'Payment Methods', slug: 'payment-methods' },
      { title: 'How to Withdraw Funds', slug: 'withdraw-funds' },
      { title: 'Understanding Fees', slug: 'fees' },
      { title: 'Transaction History', slug: 'transaction-history' },
    ],
  },
  {
    category: 'Account & Profile',
    icon: BookOpen,
    articles: [
      { title: 'Updating Your Profile', slug: 'update-profile' },
      { title: 'Changing Your Password', slug: 'change-password' },
      { title: 'Two-Factor Authentication', slug: '2fa' },
      { title: 'Deactivating Your Account', slug: 'deactivate-account' },
    ],
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const filteredArticles = searchQuery.trim()
    ? HELP_ARTICLES.map((category) => ({
        ...category,
        articles: category.articles.filter((article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.articles.length > 0)
    : HELP_ARTICLES

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-20">
        <Link href="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back Home
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-zinc-400">Find answers to common questions about Velxo</p>
        </div>

        {/* Search */}
        <Card className="p-6 border-zinc-700 bg-zinc-900/50 mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </Card>

        {/* Articles */}
        <div className="space-y-6">
          {filteredArticles.map((category, i) => {
            const Icon = category.icon
            const isExpanded = expandedCategory === category.category

            return (
              <Card
                key={i}
                className="border-zinc-700 bg-zinc-900/50 overflow-hidden hover:border-blue-500/50 transition cursor-pointer"
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : category.category)
                }
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Icon className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                    <h2 className="text-lg font-bold">{category.category}</h2>
                  </div>
                  <div
                    className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-3 border-t border-zinc-700 pt-6">
                    {category.articles.map((article, j) => (
                      <Link
                        key={j}
                        href={`#article-${article.slug}`}
                        className="block p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition"
                      >
                        <p className="text-blue-400 hover:text-blue-300 font-medium">
                          {article.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Still Need Help */}
        <Card className="p-12 border-zinc-700 bg-zinc-900/50 mt-16 text-center">
          <HelpCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Can&apos;t find what you&apos;re looking for?</h2>
          <p className="text-zinc-400 mb-8">Our support team is here to help you 24/7</p>
          <Link href="/contact">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8 py-3">
              Contact Support
            </Button>
          </Link>
        </Card>

        {/* Quick Tips */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <Card className="p-6 border-cyan-500/20 bg-cyan-500/5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span> Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>✓ Always verify seller reputation before buying</li>
              <li>✓ Use escrow for all transactions</li>
              <li>✓ Keep detailed records of all conversations</li>
              <li>✓ Report suspicious activity immediately</li>
            </ul>
          </Card>

          <Card className="p-6 border-green-500/20 bg-green-500/5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">🚀</span> Quick Start
            </h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>1. Create and verify your account</li>
              <li>2. Browse listings or create one</li>
              <li>3. Make an offer or purchase</li>
              <li>4. Release escrow after delivery</li>
            </ul>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
