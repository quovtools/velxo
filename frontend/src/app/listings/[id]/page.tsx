"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function ListingPage() {
  const params = useParams()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/v1/listings/${params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: null }))
      .then(res => { setListing(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Back to marketplace</Link>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? (
              <>
                <Skeleton className="aspect-video w-full" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </>
            ) : listing ? (
              <>
                <Card className="aspect-video bg-zinc-900 border-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-zinc-600">No image</span>
                  )}
                </Card>
                <div className="mt-4">
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{listing.gameName}</Badge>
                    {listing.region && <Badge variant="outline">{listing.region}</Badge>}
                    {listing.platform && <Badge variant="outline">{listing.platform}</Badge>}
                  </div>
                  <p className="text-zinc-400 mt-4">{listing.description}</p>
                </div>
              </>
            ) : (
              <p className="text-zinc-400">Listing not found.</p>
            )}
          </div>
          <div>
            <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-4 sticky top-20">
              {loading ? (
                <Skeleton className="h-12 w-24" />
              ) : listing ? (
                <>
                  <p className="text-3xl font-bold">${listing.price}</p>
                  <Button className="w-full bg-white text-black hover:bg-zinc-200">Buy Now — Escrow Protected</Button>
                  <p className="text-xs text-zinc-500 text-center">Your payment is held securely until delivery is confirmed</p>
                </>
              ) : (
                <p className="text-zinc-400">—</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
