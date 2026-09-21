'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Star, Flame, Clock, ShieldCheck, Zap } from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

export interface ListingCardData {
  id: string;
  title: string;
  price: string | number;
  gameName: string;
  platform?: string;
  rank?: string;
  images?: string[];
  status?: string;
  isSold?: boolean;
  isFeatured?: boolean;
  salesCount?: number;
  seller?: {
    id?: string;
    storeName?: string;
    averageRating?: number | string;
    verified?: boolean;
    isVerified?: boolean;
    responseTime?: number | null;
  };
}

export default function ListingCard({ item }: { item: ListingCardData }) {
  const [imgError, setImgError] = useState(false);
  const { fmt } = useCurrency();
  const img = item.images?.[0];
  const sold = item.isSold || item.status === 'SOLD';
  const rating = Number(item.seller?.averageRating || 0).toFixed(1);
  const verified = item.seller?.isVerified || item.seller?.verified;
  const isInstant = item.seller?.responseTime != null && item.seller.responseTime <= 10;

  return (
    <div className={`group relative bg-[var(--card-bg)] border border-[var(--border-bg)] hover:border-brand/40 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/8 ${sold ? 'opacity-60' : ''}`}>
      {/* Full-card link */}
      <Link href={`/listings/${item.id}`} aria-label={item.title} className="absolute inset-0 z-0" />

      {/* Image */}
      <div className="h-44 bg-[var(--surface)] relative overflow-hidden">
        {img && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={item.title} loading="lazy" referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand/6 via-[var(--surface)] to-[var(--surface)]">
            <Gamepad2 className="w-10 h-10 text-brand/20" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        {/* Badges */}
        {item.isFeatured && !sold && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-bold text-black bg-brand px-2 py-0.5 rounded-full shadow-sm">
            <Flame className="w-2.5 h-2.5" /> Hot
          </span>
        )}
        {sold && (
          <span className="absolute top-2 left-2 bg-black/80 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
            Sold
          </span>
        )}
        {isInstant && !sold && (
          <span className="absolute bottom-2 left-2 flex items-center gap-0.5 text-[9px] font-bold text-black bg-brand/90 px-1.5 py-0.5 rounded">
            <Zap className="w-2.5 h-2.5" /> Instant
          </span>
        )}
        {item.rank && (
          <span className="absolute bottom-2 right-2 text-[9px] font-semibold text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {item.rank}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          {/* Game badge */}
          <span className="inline-block bg-brand/8 text-brand text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand/15 uppercase tracking-wide truncate max-w-full mb-2">
            {item.gameName}
          </span>
          <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-brand transition-colors">
            {item.title}
          </h3>

          {/* Seller info */}
          {item.seller?.storeName && (
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5">
              <Link href={`/seller/${item.seller.id}`} onClick={e => e.stopPropagation()}
                className="relative z-10 flex items-center gap-1 truncate hover:text-brand transition max-w-[65%]">
                {item.seller.storeName}
                {verified && <ShieldCheck className="w-3 h-3 text-brand flex-shrink-0" />}
              </Link>
              <span className="flex items-center gap-0.5 flex-shrink-0 font-semibold">
                <Star className="w-3 h-3 text-brand fill-brand" /> {rating}
              </span>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between border-t border-[var(--border-bg)] pt-3">
          <div>
            <span className="text-[10px] text-gray-600 block leading-none mb-0.5">Price</span>
            <span className="text-lg font-black text-white tracking-tight leading-none">{fmt(item.price)}</span>
          </div>
          <Link href={`/listings/${item.id}`} onClick={e => e.stopPropagation()}
            className={`relative z-10 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              sold
                ? 'bg-white/5 text-gray-500 border border-[var(--border-bg)] cursor-not-allowed'
                : 'bg-brand hover:bg-brand-light text-black group-hover:shadow-md group-hover:shadow-brand/25'
            }`}>
            {sold ? 'Sold' : 'Buy Now'}
          </Link>
        </div>
      </div>
    </div>
  );
}
