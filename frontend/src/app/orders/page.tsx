'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { ShoppingBag, ChevronRight } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  listingId: string
  totalAmount: number
  status: string
  escrowStatus: string
  createdAt: string
  listing?: {
    title: string
    game: string
    price: number
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-cyan-500/20 text-cyan-400',
  completed: 'bg-green-500/20 text-green-400',
  disputed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { data: ordersData, loading: ordersLoading } = useApi<{ orders: Order[] }>('/orders/me')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || ordersLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin">Loading...</div>
        </div>
        <Footer />
      </>
    )
  }

  const orders = ordersData?.orders || []

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <h1 className="text-4xl font-black mb-8">Your Orders</h1>

          {/* Filters */}
          <div className="flex gap-4 mb-12 overflow-x-auto pb-2">
            {['All', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((filter) => (
              <Button
                key={filter}
                variant="outline"
                className="whitespace-nowrap"
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Orders List */}
          {ordersLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin">Loading orders...</div>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="border-zinc-800 bg-zinc-900/50 p-6 hover:border-blue-500 transition cursor-pointer group">
                    <div className="flex items-center justify-between">
                      {/* Left Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-8 h-8 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg group-hover:text-blue-400 transition truncate">
                              {order.listing?.title || 'Order'}
                            </h3>
                            <p className="text-sm text-zinc-400">
                              Order #{order.orderNumber}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {order.listing?.game} • {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Content */}
                      <div className="text-right">
                        <div className="text-2xl font-black text-blue-400 mb-2">
                          {formatPrice(order.totalAmount)}
                        </div>
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              statusColors[order.status] || 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {order.status}
                          </span>
                          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition" />
                        </div>
                        <p className="text-xs text-zinc-500">
                          Escrow: {order.escrowStatus}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900/50 p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Orders Yet</h3>
              <p className="text-zinc-400 mb-6">
                Start shopping for gaming products today!
              </p>
              <Link href="/search">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Browse Listings
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
