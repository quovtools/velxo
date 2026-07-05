"use client"
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/orders/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then(res => { setOrders(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <a key={order.id} href={`/orders/${order.id}`} className="block">
                <Card className="p-4 bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <p className="text-sm text-zinc-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${order.totalAmount}</p>
                      <p className="text-sm text-zinc-400">{order.status}</p>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
            {!orders.length && <p className="text-zinc-400">No orders yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
