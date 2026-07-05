"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/admin/analytics', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: null }))
      .then(res => { setStats(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Revenue', value: stats?.revenue },
            { label: 'Orders', value: stats?.orders },
            { label: 'New Users (7d)', value: stats?.users },
            { label: 'Avg Order Value', value: stats?.avgOrder },
          ].map((item, i) => (
            <Card key={i} className="p-6 bg-zinc-900 border-zinc-800">
              <p className="text-zinc-400 text-sm">{item.label}</p>
              <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : (item.value ?? '—')}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
