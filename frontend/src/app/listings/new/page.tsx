"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useApi, apiCall } from '@/hooks/useApi'
import { ListingType } from '@/types'
import Link from 'next/link'
import { ChevronRight, Upload, X } from 'lucide-react'

const GAMES = [
  'Valorant',
  'CS:GO',
  'League of Legends',
  'Dota 2',
  'Fortnite',
  'Minecraft',
  'Steam',
  'Epic Games',
]

const PLATFORMS = ['PC', 'PS5', 'Xbox', 'Nintendo Switch', 'Mobile']

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'account', label: 'Account' },
  { value: 'coins', label: 'Coins/Currency' },
  { value: 'topup', label: 'Top-up' },
  { value: 'boost', label: 'Boost/Leveling' },
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'service', label: 'Service' },
]

export default function CreateListingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'account' as ListingType,
    game: '',
    platform: '',
    price: '',
    quantity: '1',
    region: '',
    rank: '',
    level: '',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages = [...images, ...files].slice(0, 5)
    setImages(newImages)

    const urls = newImages.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    
    const newUrls = previewUrls.filter((_, i) => i !== index)
    setPreviewUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.price || !formData.game) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const listingData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
      }

      await apiCall('/listings', {
        method: 'POST',
        body: listingData,
      })

      alert('Listing created successfully!')
      router.push('/seller/dashboard')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/seller/dashboard" className="hover:text-white">Seller</Link>
          <ChevronRight className="w-4 h-4" />
          <span>Create Listing</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Listing</h1>
          <p className="text-zinc-400">List a product on Velxo marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Level 50 LoL Account"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your listing in detail"
                  rows={5}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Listing Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ListingType })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {LISTING_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Game <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="">Select a game</option>
                    {GAMES.map(game => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Details */}
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Product Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="">Select platform</option>
                    {PLATFORMS.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Region</label>
                  <Input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g., NA, EU, ASIA"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Rank (if applicable)</label>
                  <Input
                    type="text"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    placeholder="e.g., Platinum"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Level</label>
                  <Input
                    type="text"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    placeholder="e.g., 150"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Pricing & Quantity</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Price (USD) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-400">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="pl-8 bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-300">Click or drag images here</p>
                  <p className="text-xs text-zinc-500">Max 5 images</p>
                </label>
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 p-1 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Listing'}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
