"use client"
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('gameName', query)
    fetch(`/api/v1/listings?${params.toString()}`)
      .then(r => r.json())
      .then(res => { setListings(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [query])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">{query ? `Search: ${query}` : 'All Listings'}</h1>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing: any) => (
              <a key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
                  <div className="aspect-square bg-zinc-800 flex items-center justify-center">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-600 text-sm">No image</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-sm line-clamp-1">{listing.title}</h4>
                    <p className="text-zinc-400 text-xs mt-1">{listing.gameName}</p>
                    <p className="text-lg font-bold mt-2">${listing.price}</p>
                  </div>
                </Card>
              </a>
            ))}
            {!listings.length && <p className="text-zinc-400 col-span-full">No listings found.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
