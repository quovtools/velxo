'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useApi } from '@/hooks/useApi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import {
  Search,
  Shield,
  Zap,
  Users,
  TrendingUp,
  ChevronRight,
  Star,
  AlertCircle,
} from 'lucide-react'
import { GAMES } from '@/lib/constants'
import { formatPrice } from '@/lib/format'

interface Listing {
  id: string
  title: string
  game: string
  platform: string
  price: number
  images: string[]
  seller: { storeName: string; averageRating: number }
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { data: listingsData, loading: listingsLoading, error: listingsError } = useApi<{ listings: Listing[] }>(
    '/listings?limit=8&sortBy=popular'
  )
  const { data: statsData } = useApi<{ totalListings: number; totalUsers: number; totalOrders: number }>(
    '/admin/dashboard',
    { skip: true }
  )

  const listings = listingsData?.listings || []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="block mb-2">Trade Gaming</span>
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Products Safely
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-zinc-300 mb-8">
                Buy and sell gaming accounts, in-game currency, and digital services with escrow protection.
                Join 10,000+ verified users in the world&apos;s most trusted gaming marketplace.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-2xl mx-auto">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for games, accounts, currency..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg"
                  />
                </div>
                <Button type="submit" className="px-8 bg-blue-600 hover:bg-blue-700 h-14 text-lg">
                  Search
                </Button>
              </form>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <div className="text-2xl font-bold text-blue-400">10K+</div>
                  <div className="text-sm text-zinc-400">Products Listed</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <div className="text-2xl font-bold text-cyan-400">5M+</div>
                  <div className="text-sm text-zinc-400">Volume Traded</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <div className="text-2xl font-bold text-green-400">4.8★</div>
                  <div className="text-sm text-zinc-400">User Rating</div>
                </div>
              </div>
            </div>

            {/* Browse Categories */}
            <div className="mt-20">
              <h2 className="text-2xl font-bold mb-6">Browse Popular Games</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {GAMES.slice(0, 6).map((game) => (
                  <Link
                    key={game.id}
                    href={`/search?game=${game.id}`}
                    className="group p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-blue-500 transition text-center"
                  >
                    <div className="text-2xl mb-2">{game.icon}</div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition">{game.name}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Safety Section */}
        <section className="py-20 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Velxo?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Escrow Protection',
                  desc: 'All transactions are protected with escrow. Sellers release funds only after you confirm delivery.',
                },
                {
                  icon: Zap,
                  title: 'Instant Delivery',
                  desc: 'Get your gaming products instantly. Most sellers deliver within 5 minutes of payment confirmation.',
                },
                {
                  icon: Users,
                  title: 'Verified Community',
                  desc: 'Trade with confidence. All sellers are verified with multiple authentication layers.',
                },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <Card key={i} className="border-zinc-700 bg-zinc-900/30 p-6 hover:bg-zinc-900/60 transition">
                    <Icon className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-zinc-400">{item.desc}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-20 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold">Featured Listings</h2>
                <p className="text-zinc-400 mt-2">Popular products listed today</p>
              </div>
              <Link href="/search">
                <Button variant="outline" className="gap-2">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {listingsError && (
              <div className="flex gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-8">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-400">Could not load listings. Please refresh.</p>
              </div>
            )}

            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-zinc-700 bg-zinc-800/50 h-80 animate-pulse" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {listings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="border-zinc-700 bg-zinc-900/50 overflow-hidden hover:border-blue-500 transition group h-full flex flex-col cursor-pointer">
                      {/* Image */}
                      <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-cyan-600/20 overflow-hidden relative group-hover:scale-105 transition">
                        {listing.images?.[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="w-12 h-12 text-zinc-600" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">{listing.game}</p>
                        <p className="text-xs text-zinc-500 mt-1">{listing.platform}</p>

                        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                          <div>
                            <div className="text-xl font-bold text-blue-400">{formatPrice(listing.price)}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-zinc-400">
                              {listing.seller?.averageRating || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
                <p className="text-zinc-400">Be the first to list your gaming products!</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Trading?</h2>
            <p className="text-xl text-zinc-400 mb-8">
              Join thousands of gamers buying and selling with confidence on Velxo.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" className="px-8 py-3 text-lg">
                  Browse Listings
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
