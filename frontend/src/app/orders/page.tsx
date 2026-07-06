"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  status: 'PENDING' | 'PAID' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  createdAt: string
  listingId: string
  listing?: { title: string; image: string }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/orders/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setOrders(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [router])

  const filteredOrders = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
      PAID: 'bg-blue-900/30 text-blue-400 border-blue-700',
      DELIVERED: 'bg-purple-900/30 text-purple-400 border-purple-700',
      COMPLETED: 'bg-green-900/30 text-green-400 border-green-700',
      CANCELLED: 'bg-red-900/30 text-red-400 border-red-700',
      DISPUTED: 'bg-orange-900/30 text-orange-400 border-orange-700',
    }
    return colors[status] || 'bg-zinc-800 text-zinc-400'
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-zinc-400">Track and manage all your purchases</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['ALL', 'PENDING', 'PAID', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full bg-zinc-800" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-blue-600 cursor-pointer transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-zinc-400 mb-2">{order.listing?.title || 'Loading...'}</p>
                      <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold mb-2">${order.totalAmount.toFixed(2)}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 bg-zinc-900 border-zinc-800 text-center">
            <p className="text-zinc-400 mb-4">No orders found</p>
            <Link href="/search" className="text-blue-400 hover:text-blue-300 font-medium">
              Start shopping →
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
