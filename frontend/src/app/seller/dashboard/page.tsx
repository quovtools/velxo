'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Star,
  Plus,
  BarChart3,
  AlertCircle,
} from 'lucide-react'

interface SellerStats {
  completedOrders: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
  activeListings: number
  successRate: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  createdAt: string
  listing: { title: string }
}

export default function SellerDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { data: statsData, loading: statsLoading } = useApi<SellerStats>(
    '/sellers/me',
    { skip: user?.role !== 'seller' }
  )
  const { data: ordersData, loading: ordersLoading } = useApi<{ orders: RecentOrder[] }>(
    '/orders/seller/recent',
    { skip: user?.role !== 'seller' }
  )

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
    if (!isLoading && isAuthenticated && user?.role !== 'seller') {
      router.push('/profile')
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading || statsLoading) {
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

  const stats = statsData
  const orders = ordersData?.orders || []

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-black mb-2">Seller Dashboard</h1>
              <p className="text-zinc-400">Manage your store and track sales</p>
            </div>
            <Link href="/listings/new">
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="w-5 h-5" />
                Create Listing
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                label: 'Total Revenue',
                value: stats?.totalRevenue || 0,
                icon: TrendingUp,
                color: 'from-green-600 to-green-700',
              },
              {
                label: 'Completed Orders',
                value: stats?.completedOrders || 0,
                icon: ShoppingBag,
                color: 'from-blue-600 to-blue-700',
                format: 'number',
              },
              {
                label: 'Active Listings',
                value: stats?.activeListings || 0,
                icon: BarChart3,
                color: 'from-purple-600 to-purple-700',
                format: 'number',
              },
              {
                label: 'Rating',
                value: stats?.averageRating || 0,
                icon: Star,
                color: 'from-yellow-600 to-yellow-700',
                format: 'rating',
              },
              {
                label: 'Success Rate',
                value: stats?.successRate || 0,
                icon: TrendingUp,
                color: 'from-pink-600 to-pink-700',
                format: 'percent',
              },
              {
                label: 'Total Reviews',
                value: stats?.totalReviews || 0,
                icon: Users,
                color: 'from-cyan-600 to-cyan-700',
                format: 'number',
              },
            ].map((stat, i) => {
              const Icon = stat.icon
              const displayValue = stat.format === 'number'
                ? stat.value
                : stat.format === 'rating'
                  ? `${stat.value.toFixed(1)}/5`
                  : stat.format === 'percent'
                    ? `${stat.value}%`
                    : formatPrice(stat.value)

              return (
                <Card key={i} className="border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
                      <p className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {displayValue}
                      </p>
                    </div>
                    <Icon className="w-6 h-6 text-zinc-600" />
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Recent Orders */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>

            {ordersLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">
                        Order
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">
                        Product
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">
                        Amount
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/30 transition"
                      >
                        <td className="py-4 px-4 text-sm font-medium">#{order.orderNumber}</td>
                        <td className="py-4 px-4 text-sm text-zinc-300">{order.listing?.title}</td>
                        <td className="py-4 px-4 text-sm font-bold text-blue-400">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              order.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-zinc-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No orders yet</p>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/listings/new">
              <Card className="border-zinc-800 bg-zinc-900/50 p-8 cursor-pointer hover:border-blue-500 transition">
                <Plus className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Create New Listing</h3>
                <p className="text-zinc-400">Add a new product to your store</p>
              </Card>
            </Link>
            <Link href="/seller/analytics">
              <Card className="border-zinc-800 bg-zinc-900/50 p-8 cursor-pointer hover:border-purple-500 transition">
                <BarChart3 className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">View Analytics</h3>
                <p className="text-zinc-400">Check detailed sales analytics</p>
              </Card>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
