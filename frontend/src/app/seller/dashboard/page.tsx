"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/sellers/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: null }))
      .then(res => { setStats(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Sales</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats?.totalSales ?? 0}</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm">Revenue</p>
            <p className="text-2xl font-bold">${loading ? <Skeleton className="h-8 w-20" /> : stats?.totalRevenue?.toFixed(2) ?? '0.00'}</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm">Reputation</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : (stats?.reputationScore ?? 0).toFixed(1)}</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm">Rating</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : (stats?.averageRating ?? 0).toFixed(1)}</p>
          </Card>
        </div>
        <div className="mt-8">
          <Link href="/sell">
            <Button className="bg-white text-black hover:bg-zinc-200">Create New Listing</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
