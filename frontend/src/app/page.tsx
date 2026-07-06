'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useApi } from '@/hooks/useApi'
import { Listing } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Footer } from '@/components/layout/footer'
import { Search, Shield, Zap, TrendingUp } from 'lucide-react'
import { LISTING_TYPES } from '@/lib/constants'
import { formatPrice } from '@/lib/format'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: listings } = useApi<{ listings: Listing[] }>('/listings?limit=8')

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Trade Gaming Products Safely
            </h1>
            <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
              Buy and sell gaming accounts, in-game currency, and digital services with escrow protection. Join thousands of gamers in the world's most trusted gaming marketplace.
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search games, accounts, currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <Link href={`/search?q=${searchQuery}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 px-6">Search</Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <div className="text-3xl font-bold text-blue-400">100K+</div>
                <div className="text-sm text-zinc-400">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-400">50K+</div>
                <div className="text-sm text-zinc-400">Daily Listings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">$10M+</div>
                <div className="text-sm text-zinc-400">GMV</div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative h-96 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10" />
            <Shield className="w-48 h-48 text-blue-400/30" />
          </div>
        </div>
      </section>

      {/* Why Velxo Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Velxo?</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Escrow Protected', desc: 'Money is held securely until delivery is confirmed' },
            { icon: Zap, title: 'Instant Delivery', desc: 'Most products delivered in minutes, not hours' },
            { icon: TrendingUp, title: 'Verified Sellers', desc: 'Only trusted sellers with proven track records' },
            { icon: Search, title: 'Easy to Use', desc: 'Intuitive interface designed for gamers, by gamers' },
          ].map((item, i) => (
            <Card key={i} className="p-6 border-zinc-700 bg-zinc-900/50 backdrop-blur">
              <item.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Product Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold mb-12">What You Can Buy & Sell</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {LISTING_TYPES.map((type) => (
            <Link key={type.id} href={`/search?type=${type.id}`}>
              <Card className="p-6 text-center border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 transition cursor-pointer">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-sm font-semibold">{type.label}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold">Featured Listings</h2>
          <Link href="/search">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {listings?.listings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="overflow-hidden border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 transition cursor-pointer h-full">
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    {listing.images?.[0] ? (
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Search className="w-12 h-12 text-zinc-600" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate mb-1">{listing.title}</h3>
                    <p className="text-sm text-zinc-400 mb-3">{listing.game}</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-lg font-bold text-blue-400">
                          {formatPrice(listing.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
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
            <p className="text-zinc-400">No listings available yet.</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-20">
        <Card className="p-12 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
            <p className="text-zinc-300 mb-8">Join thousands of gamers buying and selling safely on Velxo.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Create Account
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline">
                  Start Browsing
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  )
}
