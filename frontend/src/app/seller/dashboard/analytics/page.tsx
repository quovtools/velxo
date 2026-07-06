'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useApi } from '@/hooks/useApi'
import { ChevronLeft, TrendingUp, TrendingDown, Eye, ShoppingCart, DollarSign, Star } from 'lucide-react'

export default function SellerAnalyticsPage() {
  const { data: analytics, loading } = useApi('/seller/analytics')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-zinc-800 rounded w-1/3" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-20">
        <Link href="/seller/dashboard" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Detailed Analytics</h1>
          <p className="text-zinc-400">Track your performance and growth</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">Total Views</h3>
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold">2,847</p>
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +12% from last month
            </p>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">Conversions</h3>
              <ShoppingCart className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">248</p>
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> 8.7% conversion rate
            </p>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">Revenue</h3>
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold">$4,280</p>
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +23% from last month
            </p>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">Rating</h3>
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold">4.8</p>
            <p className="text-xs text-zinc-400 mt-2">Based on 48 reviews</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {/* Sales Trend */}
          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <h2 className="text-lg font-bold mb-6">Sales Trend (Last 30 Days)</h2>
            <div className="space-y-3">
              {[
                { day: 'Mon', value: 245, max: 300 },
                { day: 'Tue', value: 218, max: 300 },
                { day: 'Wed', value: 320, max: 300 },
                { day: 'Thu', value: 205, max: 300 },
                { day: 'Fri', value: 298, max: 300 },
                { day: 'Sat', value: 275, max: 300 },
                { day: 'Sun', value: 340, max: 340 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <p className="w-10 text-sm font-medium text-zinc-400">{item.day}</p>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 h-full rounded-full transition"
                      style={{ width: `${(item.value / item.max) * 100}%` }}
                    />
                  </div>
                  <p className="w-12 text-right text-sm font-semibold">${item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Listings */}
          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <h2 className="text-lg font-bold mb-6">Top Performing Listings</h2>
            <div className="space-y-3">
              {[
                { title: 'LoL Gold Account Level 100', sales: 45, views: 320 },
                { title: 'Valorant Agent Bundle', sales: 32, views: 280 },
                { title: 'CS:GO Prime Status', sales: 28, views: 210 },
                { title: 'Apex Coins 1000', sales: 24, views: 180 },
              ].map((listing, i) => (
                <div key={i} className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium truncate flex-1">{listing.title}</p>
                    <span className="text-sm text-cyan-400 font-semibold ml-2">{listing.sales} sales</span>
                  </div>
                  <p className="text-xs text-zinc-400">{listing.views} views</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <h2 className="text-lg font-bold mb-6">Buyer Satisfaction</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-400 mb-2">Overall Rating</p>
                <div className="text-3xl font-bold text-yellow-400">4.8★</div>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-2">Communication</p>
                <div className="text-lg font-semibold">4.9★</div>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-2">Delivery Speed</p>
                <div className="text-lg font-semibold">4.7★</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <h2 className="text-lg font-bold mb-6">Account Health</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-400 mb-2">Positive Feedback</p>
                <p className="text-2xl font-bold text-green-400">97%</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-2">Disputes Opened</p>
                <p className="text-2xl font-bold text-cyan-400">3</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-2">Response Time</p>
                <p className="text-2xl font-bold">2.3h</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-zinc-700 bg-zinc-900/50">
            <h2 className="text-lg font-bold mb-6">Growth Metrics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-400 mb-2">Monthly Growth</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">+18%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-2">Active Listings</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-2">Followers</p>
                <p className="text-2xl font-bold">1,243</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
