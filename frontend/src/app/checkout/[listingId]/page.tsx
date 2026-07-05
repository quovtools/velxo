"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function CheckoutPage() {
  const params = useParams()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/v1/listings/${params.listingId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: null }))
      .then(res => { setListing(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.listingId])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Back to marketplace</Link>
        <h1 className="text-3xl font-bold mt-4 mb-6">Checkout</h1>
        {loading ? (
          <Card className="p-6 bg-zinc-900 border-zinc-800"><div className="h-24 bg-zinc-800 animate-pulse rounded" /></Card>
        ) : listing ? (
          <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-4">
            <h2 className="text-xl font-bold">{listing.title}</h2>
            <p className="text-zinc-400">{listing.description}</p>
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <p className="text-sm text-zinc-400">Total</p>
              <p className="text-2xl font-bold">${listing.price}</p>
            </div>
            <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={() => alert('Payment integration: Flutterwave / Payment.io (crypto) checkout would open here')}>
              Pay Securely (Escrow Protected)
            </Button>
            <p className="text-xs text-zinc-500 text-center">Your payment is held securely in escrow until delivery is confirmed</p>
          </Card>
        ) : (
          <p className="text-zinc-400">Listing not found.</p>
        )}
      </div>
    </div>
  )
}
