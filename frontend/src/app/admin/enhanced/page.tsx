'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useApi } from '@/hooks/useApi'
import { Users, ShoppingCart, DollarSign, AlertCircle, TrendingUp, LineChart } from 'lucide-react'

export default function AdminEnhancedPage() {
  const { data: stats, loading } = useApi('/admin/dashboard')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-zinc-800 rounded w-1/4" />
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-zinc-800 rounded" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-xl text-zinc-400">Platform overview and management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">Total Users</h3>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">{stats?.totalUsers?.toLocaleString() || '0'}</p>
            <p className="text-xs text-zinc-400 mt-2">Registered accounts</p>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">Total Orders</h3>
              <ShoppingCart className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{stats?.totalOrders?.toLocaleString() || '0'}</p>
            <p className="text-xs text-zinc-400 mt-2">Completed transactions</p>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">Total Revenue</h3>
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold">${(stats?.totalRevenue || 0).toFixed(2)}</p>
            <p className="text-xs text-zinc-400 mt-2">Platform fees collected</p>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">Active Listings</h3>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold">{stats?.totalListings?.toLocaleString() || '0'}</p>
            <p className="text-xs text-zinc-400 mt-2">Products for sale</p>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <h3 className="font-bold mb-4">Metrics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Sellers</span>
                <span className="font-semibold">{stats?.totalSellers?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Average Order Value</span>
                <span className="font-semibold">${(stats?.averageOrderValue || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Dispute Rate</span>
                <span className="font-semibold">{((stats?.disputeRate || 0) * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Refund Rate</span>
                <span className="font-semibold">{((stats?.refundRate || 0) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <h3 className="font-bold mb-4">GMV (Gross Merchandise Value)</h3>
            <p className="text-3xl font-bold text-cyan-400 mb-4">${(stats?.gmv || 0).toFixed(0)}</p>
            <p className="text-sm text-zinc-400">Total value of all transactions</p>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <h3 className="font-bold mb-4">Conversion Rate</h3>
            <p className="text-3xl font-bold text-green-400 mb-4">{((stats?.conversionRate || 0) * 100).toFixed(2)}%</p>
            <p className="text-sm text-zinc-400">Views to sales ratio</p>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/admin/moderation">
            <Card className="p-6 border-zinc-700 bg-zinc-900/50 hover:border-cyan-500 transition cursor-pointer h-full">
              <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="font-bold mb-2">Listing Moderation</h3>
              <p className="text-sm text-zinc-400 mb-4">Review and moderate listings</p>
              <Button size="sm" variant="outline" className="w-full">
                Manage
              </Button>
            </Card>
          </Link>

          <Link href="/admin/disputes">
            <Card className="p-6 border-zinc-700 bg-zinc-900/50 hover:border-cyan-500 transition cursor-pointer h-full">
              <AlertCircle className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="font-bold mb-2">Dispute Management</h3>
              <p className="text-sm text-zinc-400 mb-4">Resolve open disputes</p>
              <Button size="sm" variant="outline" className="w-full">
                Manage
              </Button>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="p-6 border-zinc-700 bg-zinc-900/50 hover:border-cyan-500 transition cursor-pointer h-full">
              <LineChart className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="font-bold mb-2">Analytics</h3>
              <p className="text-sm text-zinc-400 mb-4">View detailed platform analytics</p>
              <Button size="sm" variant="outline" className="w-full">
                View
              </Button>
            </Card>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
