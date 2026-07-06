'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useApi, apiCall } from '@/hooks/useApi'
import { Listing } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Footer } from '@/components/layout/footer'
import { Shield, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/format'

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.listingId as string
  const { data: listing } = useApi<{ listing: Listing }>(`/listings/${listingId}`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [quantity, setQuantity] = useState(1)

  if (!listing?.listing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  const product = listing.listing
  const subtotal = product.price * quantity
  const commission = subtotal * 0.1
  const total = subtotal

  const handleCheckout = async () => {
    if (!agreed) {
      setError('You must agree to the terms')
      return
    }

    setLoading(true)
    setError('')

    try {
      const order = await apiCall('/orders', {
        method: 'POST',
        body: {
          listingId,
          quantity,
        },
      })

      // Redirect to payment
      router.push(`/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-zinc-400">Complete your purchase securely</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main checkout area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product summary */}
            <Card className="p-6 border-zinc-700 bg-zinc-900/50">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-zinc-800 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{product.title}</h3>
                  <p className="text-sm text-zinc-400 mb-2">{product.game}</p>
                  <p className="text-lg font-bold text-blue-400">{formatPrice(product.price)}</p>
                </div>
              </div>
            </Card>

            {/* Quantity */}
            <Card className="p-6 border-zinc-700 bg-zinc-900/50">
              <h2 className="text-lg font-bold mb-4">Quantity</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700"
                >
                  −
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700"
                >
                  +
                </button>
              </div>
            </Card>

            {/* Escrow info */}
            <Card className="p-6 border-green-500/30 bg-green-500/5">
              <div className="flex gap-4">
                <Shield className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-400 mb-2">Escrow Protection</h3>
                  <p className="text-sm text-zinc-300">
                    Your payment will be held securely by Velxo. The seller receives payment only after you confirm receipt of the product. If there&apos;s an issue, you&apos;re protected with our dispute resolution system.
                  </p>
                </div>
              </div>
            </Card>

            {/* Security note */}
            <Card className="p-6 border-zinc-700 bg-zinc-900/50">
              <div className="flex gap-3 mb-4">
                <Lock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <h3 className="font-bold">Secure Payment</h3>
              </div>
              <p className="text-sm text-zinc-400">
                All transactions are encrypted and secured with industry-standard SSL/TLS protocols.
              </p>
            </Card>

            {/* Seller info */}
            <Card className="p-6 border-zinc-700 bg-zinc-900/50">
              <h2 className="text-lg font-bold mb-4">Seller Information</h2>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{product.seller.storeName}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < Math.round(product.seller.averageRating)
                              ? 'text-yellow-400'
                              : 'text-zinc-600'
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-zinc-400">
                      {product.seller.averageRating.toFixed(1)} • {product.seller.completedOrders} sales
                    </span>
                  </div>
                  {product.seller.verificationStatus === 'verified' && (
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Verified Seller
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Terms agreement */}
            <Card className="p-6 border-zinc-700 bg-zinc-900/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I agree to the{' '}
                  <Link href="#" className="text-blue-400 hover:text-blue-300">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="#" className="text-blue-400 hover:text-blue-300">
                    Escrow Agreement
                  </Link>
                  . I understand my payment will be held in escrow until I confirm receipt.
                </span>
              </label>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-zinc-700 bg-zinc-900/50 sticky top-20">
              <h2 className="text-lg font-bold mb-6">Price Breakdown</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-zinc-700">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal ({quantity}x)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Platform fee (10%)</span>
                  <span className="text-zinc-400">Included</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-blue-400">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-zinc-500">You will be charged this amount</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                onClick={handleCheckout}
                disabled={loading || !agreed}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mb-2"
              >
                {loading ? 'Processing...' : 'Complete Purchase'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.history.back()}
              >
                Continue Shopping
              </Button>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
