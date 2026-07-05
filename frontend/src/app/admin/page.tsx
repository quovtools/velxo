"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/admin/dashboard', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: null }))
      .then(res => { setDashboard(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : dashboard?.totalUsers ?? 0}</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : dashboard?.totalOrders ?? 0}</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm">Revenue</p>
            <p className="text-2xl font-bold">${loading ? <Skeleton className="h-8 w-20" /> : dashboard?.totalRevenue?.toFixed(2) ?? '0.00'}</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm">Active Listings</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : '—'}</p>
          </Card>
        </div>
        <div className="mt-8 flex gap-4">
          <Link href="/admin/moderation"><Button variant="outline">Moderation</Button></Link>
          <Link href="/admin/disputes"><Button variant="outline">Disputes</Button></Link>
          <Link href="/admin/analytics"><Button variant="outline">Analytics</Button></Link>
        </div>
      </div>
    </div>
  )
}
