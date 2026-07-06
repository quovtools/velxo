'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useApi, apiCall } from '@/hooks/useApi'
import { Listing } from '@/types'
import { GAMES } from '@/lib/constants'
import { ChevronLeft, CheckCircle, AlertCircle, Upload } from 'lucide-react'

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'account' as any,
    game: '',
    platform: '',
    price: '',
    quantity: '',
    region: '',
    rank: '',
    level: '',
  })

  const { data: listingData, loading: listingLoading } = useApi<{ listing: Listing }>(`/listings/${id}`)

  useEffect(() => {
    if (listingData?.listing) {
      setFormData({
        title: listingData.listing.title,
        description: listingData.listing.description,
        type: listingData.listing.type,
        game: listingData.listing.game,
        platform: listingData.listing.platform,
        price: String(listingData.listing.price),
        quantity: String(listingData.listing.quantity),
        region: listingData.listing.region || '',
        rank: listingData.listing.rank || '',
        level: listingData.listing.level || '',
      })
    }
  }, [listingData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await apiCall(`/listings/${id}`, {
        method: 'PUT',
        body: {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          game: formData.game,
          platform: formData.platform,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          region: formData.region || undefined,
          rank: formData.rank || undefined,
          level: formData.level || undefined,
        },
      })
      setSuccess(true)
      setTimeout(() => router.push(`/listings/${id}`), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20">
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
      <main className="max-w-4xl mx-auto px-4 py-20">
        {/* Breadcrumb */}
        <Link href={`/listings/${id}`} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Listing
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Edit Listing</h1>
          <p className="text-zinc-400">Update your product information</p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="p-4 bg-green-500/10 border border-green-500/30 mb-6 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-400">Listing updated successfully!</h3>
              <p className="text-sm text-green-300">Redirecting you back...</p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-500/10 border border-red-500/30 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-400">Update failed</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </Card>
        )}

        {/* Form */}
        <Card className="p-8 border-zinc-700 bg-zinc-900/50">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-bold mb-6">Basic Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="League of Legends Gold Account"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="Describe your product in detail..."
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h2 className="text-xl font-bold mb-6">Product Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Listing Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="account">Account</option>
                    <option value="coins">In-Game Currency</option>
                    <option value="topup">Top-Up</option>
                    <option value="boost">Boost/Carry</option>
                    <option value="gift_card">Gift Card</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Game</label>
                  <select
                    name="game"
                    value={formData.game}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select a game</option>
                    {GAMES.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Platform</label>
                  <input
                    type="text"
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., PC, PlayStation, Xbox"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Region</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., NA, EU, APAC"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div>
              <h2 className="text-xl font-bold mb-6">Pricing & Inventory</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Account Details (if applicable) */}
            {(formData.type === 'account' || formData.type === 'boost') && (
              <div>
                <h2 className="text-xl font-bold mb-6">Account Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Rank/Level</label>
                    <input
                      type="text"
                      name="rank"
                      value={formData.rank}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., Gold 2, Level 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Level</label>
                    <input
                      type="text"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., 100, 5000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Update Listing'}
              </Button>
              <Link href={`/listings/${id}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
