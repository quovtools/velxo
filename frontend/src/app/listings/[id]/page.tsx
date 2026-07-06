'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useApi } from '@/hooks/useApi'
import { Listing } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Footer } from '@/components/layout/footer'
import { ChevronLeft, Heart, Share2, Shield, Clock, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/format'

export default function ListingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: listing } = useApi<{ listing: Listing }>(`/listings/${id}`)
  const [selectedImage, setSelectedImage] = useState(0)

  if (!listing?.listing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  const product = listing.listing

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link href="/search" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back to listings
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Images */}
          <div className="lg:col-span-2">
            <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden mb-4">
              {product.images?.[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <p className="text-zinc-500">No image available</p>
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            {product.images && product.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                      selectedImage === i ? 'border-blue-400' : 'border-zinc-700'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${i + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <Card className="mt-8 p-6 border-zinc-700 bg-zinc-900/50">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-zinc-300 leading-relaxed">{product.description}</p>
            </Card>

            {/* Details */}
            <Card className="mt-8 p-6 border-zinc-700 bg-zinc-900/50">
              <h2 className="text-xl font-bold mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {product.game && (
                  <>
                    <div className="text-sm text-zinc-400">Game</div>
                    <div className="font-semibold">{product.game}</div>
                  </>
                )}
                {product.platform && (
                  <>
                    <div className="text-sm text-zinc-400">Platform</div>
                    <div className="font-semibold">{product.platform}</div>
                  </>
                )}
                {product.rank && (
                  <>
                    <div className="text-sm text-zinc-400">Rank</div>
                    <div className="font-semibold">{product.rank}</div>
                  </>
                )}
                {product.level && (
                  <>
                    <div className="text-sm text-zinc-400">Level</div>
                    <div className="font-semibold">{product.level}</div>
                  </>
                )}
                {product.region && (
                  <>
                    <div className="text-sm text-zinc-400">Region</div>
                    <div className="font-semibold">{product.region}</div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Price and seller */}
            <Card className="p-6 border-zinc-700 bg-zinc-900/50 mb-6">
              <div className="mb-6">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {formatPrice(product.price)}
                </div>
              </div>

              <Link href={`/sellers/${product.seller.id}`}>
                <div className="mb-6 p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{product.seller.storeName}</div>
                    {product.seller.verificationStatus === 'verified' && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm">{product.seller.averageRating.toFixed(1)}</span>
                    <span className="text-zinc-500 text-sm">({product.seller.completedOrders} sales)</span>
                  </div>
                </div>
              </Link>

              <Link href={`/checkout/${product.id}`} className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-3">
                  Buy Now
                </Button>
              </Link>

              <Button variant="outline" className="w-full mb-3">
                <Heart className="w-4 h-4 mr-2" />
                Add to Favorites
              </Button>

              <Button variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </Card>

            {/* Security info */}
            <Card className="p-4 border-green-500/30 bg-green-500/5">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-green-400 mb-1">Protected Purchase</div>
                  <p className="text-zinc-400">
                    Your payment is held safely in escrow until you confirm receipt
                  </p>
                </div>
              </div>
            </Card>

            {/* Delivery info */}
            {product.deliveryTime && (
              <Card className="mt-4 p-4 border-zinc-700 bg-zinc-900/50">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Delivery Time</div>
                    <p className="text-zinc-400">Usually within {product.deliveryTime} minutes</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews section */}
        {product.listingReviews && product.listingReviews.length > 0 && (
          <Card className="mt-12 p-6 border-zinc-700 bg-zinc-900/50">
            <h2 className="text-xl font-bold mb-6">Reviews</h2>
            <div className="space-y-4">
              {product.listingReviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-t border-zinc-700 pt-4 first:border-0 first:pt-0">
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold">{review.buyer?.firstName} {review.buyer?.lastName}</div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-400' : 'text-zinc-600'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  )
}
