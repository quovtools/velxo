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
  const [activeGameSlide, setActiveGameSlide] = useState(0)
  const router = useRouter()
  
  const { data: listingsData, loading: listingsLoading } = useApi<{ listings: Listing[] }>(
    '/listings?limit=12&sortBy=popular'
  )
  const { data: trendingData, loading: trendingLoading } = useApi<{ listings: Listing[] }>(
    '/listings?limit=8&sortBy=newest'
  )

  const listings = listingsData?.listings || []
  const trending = trendingData?.listings || []

  // Auto-rotate game slides
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGameSlide((prev) => (prev + 1) % GAMES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black">
        {/* Hero Section with Gaming Theme */}
        <section className="relative h-screen flex items-center overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-black to-blue-900/20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />

          {/* Game Logo Carousel */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="text-9xl font-black text-white/5 animate-bounce">
              {GAMES[activeGameSlide]?.icon}
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div>
                  <div className="inline-block mb-4 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span className="text-blue-400 text-sm font-semibold">Welcome to Velxo Gaming Marketplace</span>
                  </div>
                  <h1 className="text-6xl lg:text-7xl font-black mb-6 leading-tight">
                    <span className="block text-white">Trade Gaming</span>
                    <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Products Safely
                    </span>
                  </h1>
                  <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
                    The ultimate marketplace for gaming accounts, in-game currency, boosting services, and digital products. Escrow-protected transactions with verified sellers.
                  </p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search for games, accounts, currency..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-lg bg-zinc-900/80 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-base"
                    />
                  </div>
                  <Button type="submit" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8">
                    <Play className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </form>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button size="lg" variant="outline" className="px-8">
                      Browse Listings
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-8">
                  <div>
                    <div className="text-3xl font-bold text-blue-400">50K+</div>
                    <div className="text-sm text-zinc-400">Active Products</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400">100K+</div>
                    <div className="text-sm text-zinc-400">Verified Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-400">$10M+</div>
                    <div className="text-sm text-zinc-400">Traded Volume</div>
                  </div>
                </div>
              </div>

              {/* Right - Game Logo Carousel */}
              <div className="hidden lg:block">
                <div className="relative h-96 flex items-center justify-center">
                  {GAMES.map((game, i) => (
                    <div
                      key={game.id}
                      className={`absolute text-9xl transition-all duration-700 transform ${
                        i === activeGameSlide
                          ? 'opacity-100 scale-100'
                          : 'opacity-20 scale-50'
                      }`}
                    >
                      {game.icon}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-center mt-8">
                  {GAMES.slice(0, 5).map((game, i) => (
                    <button
                      key={game.id}
                      onClick={() => setActiveGameSlide(i)}
                      className={`w-3 h-3 rounded-full transition ${
                        i === activeGameSlide ? 'bg-blue-500 w-8' : 'bg-zinc-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Velxo Section */}
        <section className="py-20 border-t border-zinc-800 bg-gradient-to-b from-black to-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-black mb-4">Why Choose Velxo?</h2>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                The most trusted gaming marketplace with advanced security and community protection
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Shield,
                  title: 'Escrow Protection',
                  desc: 'All transactions are escrow-protected. Sellers only get paid after confirmed delivery.',
                  color: 'blue',
                },
                {
                  icon: Zap,
                  title: 'Instant Delivery',
                  desc: 'Most deliveries happen within 5 minutes. Fast, secure, and seamless transactions.',
                  color: 'purple',
                },
                {
                  icon: Users,
                  title: 'Verified Sellers',
                  desc: 'Multi-layer verification ensures only trusted sellers can operate on our platform.',
                  color: 'pink',
                },
                {
                  icon: Award,
                  title: '24/7 Support',
                  desc: 'Our support team is always available to help resolve disputes and answer questions.',
                  color: 'cyan',
                },
              ].map((item, i) => {
                const Icon = item.icon
                const colorMap = {
                  blue: 'from-blue-500 to-blue-600 text-blue-400',
                  purple: 'from-purple-500 to-purple-600 text-purple-400',
                  pink: 'from-pink-500 to-pink-600 text-pink-400',
                  cyan: 'from-cyan-500 to-cyan-600 text-cyan-400',
                }
                return (
                  <Card key={i} className="border-zinc-800 bg-zinc-900/40 p-6 hover:bg-zinc-900/80 transition group">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorMap[item.color as keyof typeof colorMap]} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-zinc-400">{item.desc}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Game Categories Section */}
        <section className="py-20 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black mb-12">Popular Games</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {GAMES.map((game) => (
                <Link
                  key={game.id}
                  href={`/search?game=${game.id}`}
                  className="group relative overflow-hidden rounded-lg aspect-square"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 group-hover:from-blue-600/40 group-hover:to-purple-600/40 transition" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-6xl mb-3 group-hover:scale-125 transition">{game.icon}</div>
                    <span className="text-sm font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text">
                      {game.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-20 border-t border-zinc-800 bg-gradient-to-b from-black to-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-black mb-2">Featured Listings</h2>
                <p className="text-zinc-400">Premium products from verified sellers</p>
              </div>
              <Link href="/search?sortBy=popular">
                <Button variant="outline" className="gap-2">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-zinc-800 bg-zinc-900/50 h-80 animate-pulse" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {listings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-blue-500 transition group h-full flex flex-col cursor-pointer hover:shadow-lg hover:shadow-blue-500/20">
                      {/* Image */}
                      <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 overflow-hidden relative">
                        {listing.images?.[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-110 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                            <Flame className="w-12 h-12 text-blue-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-blue-600/80 px-3 py-1 rounded-full text-xs font-bold">
                          {listing.platform}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-white truncate group-hover:text-blue-400 transition line-clamp-2">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">{listing.game}</p>

                        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              {formatPrice(listing.price)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold text-zinc-400">
                              {listing.seller?.averageRating?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-zinc-500">
                          {listing.seller?.storeName} • {listing.seller?.completedOrders || 0} sales
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Search className="w-20 h-20 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No listings available</h3>
                <p className="text-zinc-400 mb-6">Check back soon for new gaming products</p>
              </div>
            )}
          </div>
        </section>

        {/* Trending Now */}
        <section className="py-20 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-6 h-6 text-pink-400" />
                  <h2 className="text-4xl font-black">Trending Now</h2>
                </div>
                <p className="text-zinc-400">Latest additions to the marketplace</p>
              </div>
              <Link href="/search?sortBy=newest">
                <Button variant="outline" className="gap-2">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {trendingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-zinc-800 bg-zinc-900/50 h-80 animate-pulse" />
                ))}
              </div>
            ) : trending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trending.slice(0, 8).map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-purple-500 transition group h-full flex flex-col cursor-pointer hover:shadow-lg hover:shadow-purple-500/20">
                      {/* Image */}
                      <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 overflow-hidden relative">
                        {listing.images?.[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-110 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
                            <TrendingUp className="w-12 h-12 text-purple-400" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-pink-600/80 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" /> New
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-white truncate group-hover:text-purple-400 transition line-clamp-2">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">{listing.game}</p>

                        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                          <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {formatPrice(listing.price)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold text-zinc-400">
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
        <section className="py-20 border-t border-zinc-800 bg-gradient-to-b from-black to-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black mb-16 text-center">How Velxo Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Browse', desc: 'Explore thousands of gaming products from verified sellers' },
                { step: '02', title: 'Purchase', desc: 'Complete secure payment protected by our escrow system' },
                { step: '03', title: 'Receive', desc: 'Get instant delivery of your digital products' },
                { step: '04', title: 'Confirm', desc: 'Release payment to seller after confirming delivery' },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="mb-6">
                    <div className="text-6xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-zinc-400">{item.desc}</p>
                  {i < 3 && (
                    <div className="hidden md:block absolute -right-4 top-8">
                      <ChevronRight className="w-8 h-8 text-zinc-700" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black mb-12 text-center">What Gamers Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
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
                <Card key={i} className="border-zinc-800 bg-zinc-900/50 p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-6 italic">{testimonial.text}</p>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-zinc-400">{testimonial.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 border-t border-zinc-800 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl font-black mb-6">
              Ready to Level Up Your Gaming?
            </h2>
            <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
              Join thousands of gamers trading safely on Velxo. Start buying or selling gaming products today.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-10">
                  <Play className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="px-10">
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
