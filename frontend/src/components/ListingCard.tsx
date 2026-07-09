'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gamepad2, Star, Flame } from 'lucide-react'

export interface ListingCardData {
  id: string
  title: string
  price: string | number
  gameName: string
  platform?: string
  images?: string[]
  status?: string
  isSold?: boolean
  isFeatured?: boolean
  salesCount?: number
  seller?: { id?: string; storeName?: string; averageRating?: number | string; verified?: boolean }
}

export default function ListingCard({ item }: { item: ListingCardData }) {
  const [imgError, setImgError] = useState(false)
  const img = item.images?.[0]
  const sold = item.isSold || item.status === 'SOLD'
  const price = Number(item.price || 0).toFixed(2)
  const rating = Number(item.seller?.averageRating || 0).toFixed(1)

  return (
    <div className="group relative bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-0.5">
      {/* Full-card navigation overlay */}
      <Link href={`/listings/${item.id}`} aria-label={item.title} className="absolute inset-0 z-0" />

      <div className="h-44 bg-gradient-to-br from-background to-cardBg relative overflow-hidden">
        {img && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand/20 via-cardBg to-background flex flex-col items-center justify-center gap-1">
            <Gamepad2 className="w-10 h-10 text-brand/40" />
            <span className="text-[10px] text-gray-500">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent pointer-events-none" />
        {item.isFeatured && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-white absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-amber-500 px-1.5 py-0.5 rounded-full shadow-md">
            <Flame className="w-3 h-3" /> Hot
          </span>
        )}
        {sold && (
          <span className="absolute top-2 left-2 bg-black/60 text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
            Sold
          </span>
        )}
        {item.platform && (
          <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/90 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
            {item.platform}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <span className="inline-block bg-brand/10 text-brand-light text-[10px] font-bold px-2 py-0.5 rounded border border-brand/20 uppercase tracking-wide truncate max-w-full mb-2">
            {item.gameName}
          </span>
          <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-brand transition">
            {item.title}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
            {item.seller?.storeName ? (
              <Link
                href={`/seller/${item.seller.id}`}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 flex items-center gap-1 truncate hover:text-brand transition max-w-[70%]"
              >
                {item.seller.storeName}
                {item.seller.verified && (
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-brand fill-brand flex-shrink-0" aria-label="Verified">
                    <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15.5l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1z" />
                    <path d="M10.5 14.6l-2.1-2.1 1.1-1.1 1 1 3-3 1.1 1.1z" fill="#fff" />
                  </svg>
                )}
              </Link>
            ) : (
              <span className="truncate">{item.seller?.storeName || 'Seller'}</span>
            )}
            <span className="flex items-center gap-0.5 flex-shrink-0 font-semibold text-gray-400">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {rating}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-borderBg pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-medium leading-none">Price</span>
            <span className="text-lg font-black text-white tracking-tight leading-tight">${price}</span>
          </div>
          <span className="bg-gradient-to-r from-brand to-brand-dark px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition group-hover:shadow-md group-hover:shadow-brand/40 group-hover:scale-[1.03]">
            Buy Now
          </span>
        </div>
      </div>
    </div>
  )
}
