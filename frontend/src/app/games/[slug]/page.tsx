"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function GamePage() {
  const params = useParams()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/listings?gameName=${encodeURIComponent(params.slug as string)}`)
      .then(r => r.json())
      .then(res => { setListings(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.slug])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Back</Link>
          <h1 className="text-3xl font-bold capitalize">{params.slug}</h1>
        </div>
        <p className="text-zinc-400 mb-8">Browse {params.slug} listings from top sellers</p>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
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
                    <div className="flex items-center gap-2 mt-1">
                      {listing.region && <Badge variant="outline" className="text-xs">{listing.region}</Badge>}
                      {listing.platform && <Badge variant="outline" className="text-xs">{listing.platform}</Badge>}
                    </div>
                    <p className="text-lg font-bold mt-2">${listing.price}</p>
                  </div>
                </Card>
              </a>
            ))}
            {!listings.length && <p className="text-zinc-400 col-span-full">No listings found for {params.slug}.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
