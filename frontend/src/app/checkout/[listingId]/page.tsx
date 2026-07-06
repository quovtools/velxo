'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi, apiCall } from '@/hooks/useApi'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import { AlertCircle, CheckCircle2, Lock, Loader2 } from 'lucide-react'

interface ListingDetail {
  id: string
  title: string
  description: string
  price: number
  game: string
  platform: string
  images: string[]
  seller?: {
    id: string
    storeName: string
    averageRating: number
    completedOrders: number
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const listingId = params.listingId as string
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { data: listingData, loading: listingLoading } = useApi<{ listing: ListingDetail }>(
    `/listings/${listingId}`
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleCheckout = async () => {
    if (!agreeTerms) {
      alert('Please agree to the terms and conditions')
      return
    }

    setIsProcessing(true)
    try {
      const response = await apiCall('/orders', {
        method: 'POST',
        body: {
          listingId,
        },
      })
      alert('Order created successfully!')
      router.push(`/orders/${response.id}`)
    } catch (error) {
      console.error('Checkout failed:', error)
      alert('Checkout failed. Please try again.')
      setIsProcessing(false)
    }
  }

  if (isLoading || listingLoading) {
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

  const listing = listingData?.listing
  if (!listing) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-xl text-zinc-400">Product not found</p>
        </main>
        <Footer />
      </>
    )
  }

  const platformFee = listing.price * 0.1
  const total = listing.price + platformFee

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left - Order Summary */}
            <div className="lg:col-span-2 space-y-8">
              {/* Product */}
              <Card className="border-zinc-800 bg-zinc-900/50 p-8">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                <div className="flex gap-6">
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
                    <p className="text-sm text-zinc-400">{listing.game} • {listing.platform}</p>
                    <p className="text-zinc-400 mt-2 line-clamp-2">{listing.description}</p>
                  </div>
                </div>
              </Card>

              {/* Seller Info */}
              <Card className="border-zinc-800 bg-zinc-900/50 p-8">
                <h2 className="text-2xl font-bold mb-6">Seller Information</h2>
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-800">
                  <div>
                    <h3 className="font-bold text-lg">{listing.seller?.storeName}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-yellow-400">⭐ {listing.seller?.averageRating?.toFixed(1)}</span>
                      <span className="text-zinc-400">({listing.seller?.completedOrders} sales)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-400 mb-1">Verified Seller</p>
                    <p className="text-zinc-400">This seller has been verified and has a great track record</p>
                  </div>
                </div>
              </Card>

              {/* Escrow Protection */}
              <Card className="border-zinc-800 bg-zinc-900/50 p-8">
                <div className="flex items-start gap-4">
                  <Lock className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Escrow Protection</h3>
                    <p className="text-zinc-400 mb-3">
                      Your payment is held securely in escrow. The seller only receives payment after you confirm delivery.
                    </p>
                    <div className="bg-zinc-800 rounded-lg p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">1. You pay Velxo</span>
                        <span>✓</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">2. Seller delivers product</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">3. You confirm delivery</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">4. Seller gets paid</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Terms */}
              <Card className="border-zinc-800 bg-zinc-900/50 p-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">I understand and agree to</p>
                    <p className="text-zinc-400">
                      The escrow process, platform terms of service, and confirm that I am purchasing this product for personal use
                    </p>
                  </div>
                </label>
              </Card>
            </div>

            {/* Right - Price Breakdown */}
            <div className="lg:col-span-1">
              <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 sticky top-24">
                <h2 className="text-2xl font-bold mb-8">Price Breakdown</h2>

                <div className="space-y-4 mb-8 pb-8 border-b border-zinc-800">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Product Price</span>
                    <span className="font-semibold">{formatPrice(listing.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Platform Fee (10%)</span>
                    <span className="font-semibold">{formatPrice(platformFee)}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-3xl font-black text-blue-400">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-zinc-500">Includes all fees</p>
                </div>

                {/* Security Info */}
                <div className="flex items-start gap-2 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-8">
                  <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-400">
                    Your payment information is encrypted and secure. Velxo never stores card details.
                  </p>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || !agreeTerms}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 text-lg gap-2 mb-4"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Complete Purchase
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>

                {/* Info */}
                <div className="mt-8 pt-8 border-t border-zinc-800 space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-400">Escrow-protected transaction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-400">30-day dispute window</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-400">Money-back guarantee</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
