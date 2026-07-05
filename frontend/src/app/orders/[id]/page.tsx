"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/v1/orders/${params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: null }))
      .then(res => { setOrder(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto max-w-2xl">
        <Link href="/orders" className="text-sm text-zinc-400 hover:text-white">← Back to orders</Link>
        <h1 className="text-3xl font-bold mt-4 mb-6">Order {order?.orderNumber ? `#${order.orderNumber}` : params.id}</h1>
        <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : order ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-sm">Status</p>
                <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>{order.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-sm">Total</p>
                <p className="text-2xl font-bold">${order.totalAmount}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-sm">Seller Payout</p>
                <p className="text-lg font-medium">${order.sellerPayout}</p>
              </div>
              <div className="flex gap-2 pt-4">
                {order.status === 'DELIVERED' && (
                  <Button className="flex-1 bg-white text-black hover:bg-zinc-200" onClick={() => alert('Confirm delivery')}>Confirm Delivery</Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-zinc-400">Order not found.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
