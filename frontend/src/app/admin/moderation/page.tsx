"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminModerationPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/listings?status=PENDING_APPROVAL', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then(res => { setListings(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleModerate = async (id: string, status: string) => {
    const token = localStorage.getItem('token')
    await fetch(`/api/v1/admin/listings/${id}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, notes: `Moderated to ${status}` }),
    })
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Listing Moderation</h1>
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing: any) => (
              <Card key={listing.id} className="p-4 bg-zinc-900 border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="font-medium">{listing.title}</p>
                  <p className="text-sm text-zinc-400">{listing.gameName} — {listing.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-white text-black hover:bg-zinc-200" onClick={() => handleModerate(listing.id, 'ACTIVE')}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleModerate(listing.id, 'REJECTED')}>Reject</Button>
                </div>
              </Card>
            ))}
            {!listings.length && <p className="text-zinc-400">No listings awaiting moderation.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
