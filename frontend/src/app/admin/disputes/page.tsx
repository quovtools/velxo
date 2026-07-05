"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/disputes', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then(res => { setDisputes(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Disputes</h1>
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : (
          <div className="space-y-4">
            {disputes.map((d: any) => (
              <Card key={d.id} className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{d.reason}</p>
                    <p className="text-sm text-zinc-400">Order #{d.orderId?.slice(-6)} — {d.initiatedById}</p>
                  </div>
                  <Badge variant={d.status === 'OPEN' ? 'destructive' : 'secondary'}>{d.status}</Badge>
                </div>
              </Card>
            ))}
            {!disputes.length && <p className="text-zinc-400">No open disputes.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
