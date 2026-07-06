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
  Play,
  Award,
  Flame,
  Menu,
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
  seller: { storeName: string; averageRating: number; completedOrders: number }
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  
  const { data: listingsData, loading: listingsLoading } = useApi<{ listings: Listing[] }>(
    '/listings?limit=12&sortBy=popular'
  )
  const { data: trendingData, loading: trendingLoading } = useApi<{ listings: Listing[] }>(
    '/listings?limit=8&sortBy=newest'
  )

  const listings = listingsData?.listings || []
  const trending = trendingData?.listings || []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section - Mobile First */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Content */}
            <div className="mb-8 sm:mb-12">
              <div className="mb-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Trade Gaming Products Safely
                </h1>
              </div>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mb-6">
                The fastest & most secure marketplace for gaming accounts, in-game currency, and digital products. Escrow-protected transactions with verified sellers.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search games, accounts, currency..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    <Play className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </form>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/search" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full">
                    Browse Listings
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Grid - Mobile First */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">50K+</div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1">Active Products</div>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">100K+</div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1">Verified Users</div>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">$10M+</div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1">Traded Volume</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Velxo Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2">Why Choose Velxo?</h2>
              <p className="text-slate-600">The most trusted gaming marketplace with advanced security and community protection</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: Shield, title: 'Escrow Protection', desc: 'All transactions are escrow-protected. Sellers only get paid after confirmed delivery.', color: 'bg-blue-50' },
                { icon: Zap, title: 'Instant Delivery', desc: 'Most deliveries happen within 5 minutes. Fast, secure, and seamless transactions.', color: 'bg-purple-50' },
                { icon: Users, title: 'Verified Sellers', desc: 'Multi-layer verification ensures only trusted sellers can operate on our platform.', color: 'bg-pink-50' },
                { icon: Award, title: '24/7 Support', desc: 'Our support team is always available to help resolve disputes and answer questions.', color: 'bg-cyan-50' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <Card key={i} className={`p-4 sm:p-6 border border-slate-200 ${item.color}`}>
                    <Icon className="w-8 h-8 text-slate-800 mb-3" />
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Popular Games Section */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8">Popular Games</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {GAMES.map((game) => (
                <Link key={game.id} href={`/search?game=${game.id}`}>
                  <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition group cursor-pointer h-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-2 relative flex-shrink-0">
                      <Image
                        src={game.logo}
                        alt={game.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 text-center line-clamp-2 group-hover:text-blue-600">
                      {game.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-8 sm:py-12 md:py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1">Featured Listings</h2>
                <p className="text-sm sm:text-base text-slate-600">Premium products from verified sellers</p>
              </div>
              <Link href="/search?sortBy=popular">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {listingsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-slate-200 bg-slate-100 h-64 animate-pulse" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="border border-slate-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition group h-full flex flex-col cursor-pointer">
                      {/* Image */}
                      <div className="aspect-video bg-slate-100 overflow-hidden relative">
                        {listing.images?.[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                            <Flame className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                          {listing.platform}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition line-clamp-2 text-sm sm:text-base">
                          {listing.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1">{listing.game}</p>

                        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="text-lg sm:text-xl font-bold text-blue-600">
                              {formatPrice(listing.price)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs sm:text-sm font-bold text-slate-600">
                              {listing.seller?.averageRating?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                          {listing.seller?.storeName} • {listing.seller?.completedOrders || 0} sales
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">No listings available</h3>
                <p className="text-slate-600 mb-6">Check back soon for new gaming products</p>
              </div>
            )}
          </div>
        </section>

        {/* Trending Now */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">Trending Now</h2>
                </div>
                <p className="text-sm sm:text-base text-slate-600">Latest additions to the marketplace</p>
              </div>
              <Link href="/search?sortBy=newest">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {trendingLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-slate-200 bg-slate-100 h-64 animate-pulse" />
                ))}
              </div>
            ) : trending.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trending.slice(0, 8).map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="border border-slate-200 bg-white overflow-hidden hover:border-red-300 hover:shadow-md transition group h-full flex flex-col cursor-pointer">
                      {/* Image */}
                      <div className="aspect-video bg-slate-100 overflow-hidden relative">
                        {listing.images?.[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                            <TrendingUp className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" /> New
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-900 truncate group-hover:text-red-600 transition line-clamp-2 text-sm sm:text-base">
                          {listing.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1">{listing.game}</p>

                        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                          <div className="text-lg sm:text-xl font-bold text-red-600">
                            {formatPrice(listing.price)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs sm:text-sm font-bold text-slate-600">
                              {listing.seller?.averageRating?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-8 sm:py-12 md:py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-8 sm:mb-12 text-center">How Velxo Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {[
                { step: '01', title: 'Browse', desc: 'Explore thousands of gaming products from verified sellers' },
                { step: '02', title: 'Purchase', desc: 'Complete secure payment protected by our escrow system' },
                { step: '03', title: 'Receive', desc: 'Get instant delivery of your digital products' },
                { step: '04', title: 'Confirm', desc: 'Release payment to seller after confirming delivery' },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="mb-4 sm:mb-6">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-8 sm:py-12 md:py-16 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-8 sm:mb-12 text-center">What Gamers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  name: 'Alex Chen',
                  role: 'Valorant Player',
                  text: 'Fastest account transfer I\'ve ever done. Safe, secure, and the seller was incredibly helpful.',
                  rating: 5,
                },
                {
                  name: 'Jordan Smith',
                  role: 'Elden Ring Enthusiast',
                  text: 'Finally a platform I can trust. Escrow protection gives me complete peace of mind as a buyer.',
                  rating: 5,
                },
                {
                  name: 'Sarah Gaming',
                  role: 'Professional Seller',
                  text: 'Best marketplace for sellers. High visibility, easy-to-use interface, and reliable payments.',
                  rating: 5,
                },
              ].map((testimonial, i) => (
                <Card key={i} className="border border-slate-200 bg-white p-4 sm:p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic text-sm sm:text-base">"{testimonial.text}"</p>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs sm:text-sm text-slate-600">{testimonial.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-8 sm:py-12 md:py-16 bg-blue-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Ready to Level Up Your Gaming?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of gamers trading safely on Velxo. Start buying or selling gaming products today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              <Link href="/auth/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-10 w-full sm:w-auto">
                  <Play className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="px-6 sm:px-10 w-full sm:w-auto">
                  Browse Now
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
