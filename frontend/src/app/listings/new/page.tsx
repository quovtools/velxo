'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiCall } from '@/hooks/useApi'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GAMES, LISTING_TYPES, PLATFORMS } from '@/lib/constants'
import { Upload, Loader2 } from 'lucide-react'

export default function CreateListingPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    game: '',
    type: '',
    platform: '',
    price: '',
    quantity: '1',
    region: '',
    rank: '',
    level: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
    if (!isLoading && isAuthenticated && user?.role !== 'seller') {
      router.push('/profile')
    }
  }, [isAuthenticated, isLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await apiCall('/listings', {
        method: 'POST',
        body: {
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
        },
      })
      router.push(`/listings/${response.id}`)
    } catch (error) {
      console.error('Failed to create listing:', error)
      alert('Failed to create listing. Please try again.')
      setIsSaving(false)
    }
  }

  if (isLoading) {
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black mb-8">Create New Listing</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <Card className="border-zinc-800 bg-zinc-900/50 p-8">
              <h2 className="text-2xl font-bold mb-6">Product Information</h2>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Product Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E.g., Valorant Radiant Account"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your product in detail..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Game & Type */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Game</label>
                    <select
                      value={formData.game}
                      onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select a game</option>
                      {GAMES.map((game) => (
                        <option key={game.id} value={game.id}>
                          {game.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Product Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      {LISTING_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Platform & Price */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Platform</label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select platform</option>
                      {PLATFORMS.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Details */}
            <Card className="border-zinc-800 bg-zinc-900/50 p-8">
              <h2 className="text-2xl font-bold mb-6">Product Details</h2>
              <div className="space-y-6">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity Available</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Region & Rank */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Region (Optional)</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="E.g., NA, EU, ASIA"
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Rank (Optional)</label>
                    <input
                      type="text"
                      value={formData.rank}
                      onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                      placeholder="E.g., Radiant, Diamond"
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium mb-2">Level (Optional)</label>
                  <input
                    type="text"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    placeholder="E.g., Level 30, Prestige 10"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </Card>

            {/* Images */}
            <Card className="border-zinc-800 bg-zinc-900/50 p-8">
              <h2 className="text-2xl font-bold mb-6">Product Images</h2>
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition">
                <Upload className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="font-semibold mb-2">Click to upload images</p>
                <p className="text-sm text-zinc-400">PNG, JPG up to 10MB</p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 py-3 text-lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Listing'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-3 text-lg"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
