'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useApi } from '@/hooks/useApi'
import { Listing, ListingFilters } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Footer } from '@/components/layout/footer'
import { Search, ChevronDown } from 'lucide-react'
import { GAMES, LISTING_TYPES, PLATFORMS } from '@/lib/constants'
import { formatPrice } from '@/lib/format'

function SearchContent() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<ListingFilters>({
    game: searchParams.get('game') || undefined,
    type: (searchParams.get('type') as any) || undefined,
    sortBy: 'newest',
  })
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const params = new URLSearchParams()
  if (query) params.append('search', query)
  if (filters.game) params.append('game', filters.game)
  if (filters.type) params.append('type', filters.type)
  params.append('sortBy', filters.sortBy || 'newest')

  const { data: results } = useApi<{ listings: Listing[]; total: number }>(`/listings?${params}`)

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search listings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Search</Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-zinc-700 bg-zinc-900/50 sticky top-20">
              <h3 className="font-semibold mb-4">Filters</h3>

              {/* Type Filter */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2 block text-zinc-300">Type</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => setFilters({ ...filters, type: (e.target.value as any) || undefined })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="">All Types</option>
                  {LISTING_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Game Filter */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2 block text-zinc-300">Game</label>
                <select
                  value={filters.game || ''}
                  onChange={(e) => setFilters({ ...filters, game: e.target.value || undefined })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="">All Games</option>
                  {GAMES.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform Filter */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2 block text-zinc-300">Platform</label>
                <select
                  value={filters.platform || ''}
                  onChange={(e) => setFilters({ ...filters, platform: e.target.value || undefined })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="">All Platforms</option>
                  {PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2 block text-zinc-300">Sort By</label>
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Best Rated</option>
                </select>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-zinc-400">
                Found {results?.total || 0} listing{results?.total !== 1 ? 's' : ''}
              </p>
            </div>

            {results?.listings && results.listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.listings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="overflow-hidden border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 transition cursor-pointer h-full">
                      <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center relative">
                        {listing.images?.[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Search className="w-12 h-12 text-zinc-600" />
                        )}
                        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold text-blue-400">
                          {listing.type}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold truncate mb-1">{listing.title}</h3>
                        <p className="text-sm text-zinc-400 mb-2">{listing.game}</p>
                        <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{listing.description}</p>
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-lg font-bold text-blue-400">
                              {formatPrice(listing.price)}
                            </div>
                            <div className="text-xs text-zinc-500">{listing.platform}</div>
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
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                <p className="text-zinc-400">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <SearchContent />
    </Suspense>
  )
}
