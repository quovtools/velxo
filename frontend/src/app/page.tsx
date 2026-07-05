"use client"
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FadeIn } from '@/components/fade-in'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/listings?limit=8')
      .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then(res => { setFeatured(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <a href="/" className="text-2xl font-bold tracking-tight">Velxo</a>
          <nav className="flex items-center gap-4">
            <Link href="/search" className="text-sm hover:text-zinc-300">Browse</Link>
            <Link href="/sell" className="text-sm hover:text-zinc-300">Sell</Link>
            <Link href="/auth/login" className="text-sm hover:text-zinc-300">Sign In</Link>
          </nav>
        </div>
      </header>
      <section className="relative border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 py-24">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">Buy & Sell Gaming Products</h2>
            <p className="mt-4 text-lg text-zinc-400">Safe, fast, and secure with escrow protection</p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mx-auto mt-8 max-w-xl">
              <form action="/search" className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                <Input name="q" placeholder="Search games, accounts, coins..." className="h-12 pl-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" />
              </form>
            </div>
          </FadeIn>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold mb-6">Featured Listings</h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-64 bg-zinc-900 border-zinc-800 animate-pulse"><div className="w-full h-full bg-zinc-800" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((listing: any) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
                  <div className="aspect-square bg-zinc-800 flex items-center justify-center">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-600 text-xs">No image</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-sm line-clamp-1">{listing.title}</h4>
                    <p className="text-zinc-400 text-xs mt-1">{listing.gameName}</p>
                    <p className="text-lg font-bold mt-2">${listing.price}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-12 flex justify-center">
          <Link href="/search"><Button size="lg" className="bg-white text-black hover:bg-zinc-200">View All Listings</Button></Link>
        </div>
      </section>
    </div>
  )
}
