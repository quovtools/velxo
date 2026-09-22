'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Gamepad2, Star, Flame, Clock, ShieldCheck, Zap,
  Monitor, Smartphone, Globe, Crown, Award,
} from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

export interface ListingCardData {
  id: string;
  title: string;
  price: string | number;
  currency?: string;
  gameName: string;
  platform?: string;
  rank?: string;
  level?: number | null;
  region?: string;
  images?: string[];
  status?: string;
  isSold?: boolean;
  isFeatured?: boolean;
  salesCount?: number;
  viewCount?: number;
  deliveryTime?: number | null;
  seller?: {
    id?: string;
    storeName?: string;
    averageRating?: number | string;
    verified?: boolean;
    isVerified?: boolean;
    responseTime?: number | null;
    sellerLevel?: string;
    totalSales?: number;
  };
}

// ── Platform icon helper ───────────────────────────────────────────────────────
function PlatformIcon({ platform }: { platform?: string }) {
  if (!platform) return null;
  const p = platform.toLowerCase();
  if (p.includes('pc') || p.includes('window'))   return <Monitor className="w-3 h-3" />;
  if (p.includes('ios') || p.includes('iphone'))  return <Smartphone className="w-3 h-3" />;
  if (p.includes('android'))                      return <Smartphone className="w-3 h-3" />;
  if (p.includes('mobile'))                       return <Smartphone className="w-3 h-3" />;
  return <Globe className="w-3 h-3" />;
}

// ── Seller level colour ────────────────────────────────────────────────────────
function levelColor(level?: string): string {
  switch ((level || '').toUpperCase()) {
    case 'GOLD':     return 'text-amber-400';
    case 'SILVER':   return 'text-gray-300';
    case 'PLATINUM': return 'text-cyan-300';
    case 'DIAMOND':  return 'text-blue-300';
    case 'ELITE':    return 'text-yellow-300';
    default:         return 'text-orange-400'; // BRONZE
  }
}

export default function ListingCard({ item, size = 'default' }: {
  item: ListingCardData;
  /** 'compact' for tighter home-row cards */
  size?: 'default' | 'compact';
}) {
  const [imgError, setImgError] = useState(false);
  const { fmt } = useCurrency();

  const img       = item.images?.[0];
  const sold      = item.isSold || item.status === 'SOLD';
  const rating    = Number(item.seller?.averageRating || 0);
  const verified  = item.seller?.isVerified || item.seller?.verified;
  const isInstant = (item.deliveryTime != null && item.deliveryTime <= 30) ||
                    (item.seller?.responseTime != null && item.seller.responseTime <= 10);
  const hasLevel  = item.seller?.sellerLevel && item.seller.sellerLevel !== 'BRONZE';
  const imgH      = size === 'compact' ? 'h-36' : 'h-44 sm:h-48';

  return (
    <article className={`
      group relative flex flex-col rounded-2xl overflow-hidden
      bg-[var(--card-bg)] border border-[var(--border-bg)]
      transition-all duration-200 ease-out
      hover:border-brand/35 hover:shadow-xl hover:shadow-brand/8 hover:-translate-y-0.5
      focus-within:ring-2 focus-within:ring-brand/40
      ${sold ? 'opacity-55' : ''}
    `}>

      {/* ── Full-card accessible link ── */}
      <Link
        href={`/listings/${item.id}`}
        aria-label={`${item.title} — ${fmt(item.price)}`}
        className="absolute inset-0 z-0 rounded-2xl"
        tabIndex={0}
      />

      {/* ── Image zone ── */}
      <div className={`${imgH} relative overflow-hidden bg-[var(--surface)] flex-shrink-0`}>
        {img && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center
            bg-gradient-to-br from-brand/6 via-[var(--surface)] to-[var(--surface-2)]">
            <Gamepad2 className="w-10 h-10 text-brand/20" />
          </div>
        )}

        {/* Gradient overlay — bottom-heavy for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* ── TOP-LEFT: Featured badge ── */}
        {item.isFeatured && !sold && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-brand text-black
            text-[10px] font-black px-2 py-0.5 rounded-full shadow-md shadow-brand/30 pointer-events-none">
            <Flame className="w-2.5 h-2.5" /> Hot
          </div>
        )}

        {/* ── TOP-RIGHT: Sold overlay ── */}
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-black/70 text-white text-xs font-black px-4 py-1.5 rounded-full
              border border-white/20 backdrop-blur-sm tracking-wide">
              SOLD
            </span>
          </div>
        )}

        {/* ── BOTTOM-LEFT: Instant / delivery pill ── */}
        {isInstant && !sold && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-brand/90 text-black
            text-[9px] font-black px-2 py-0.5 rounded-full pointer-events-none shadow-sm">
            <Zap className="w-2.5 h-2.5" /> Instant
          </div>
        )}

        {/* ── BOTTOM-RIGHT: Rank + platform chips ── */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 pointer-events-none flex-wrap justify-end">
          {item.platform && (
            <span className="flex items-center gap-1 text-[9px] font-semibold text-white/80
              bg-black/55 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
              <PlatformIcon platform={item.platform} />
              <span className="hidden sm:inline">{item.platform}</span>
            </span>
          )}
          {item.rank && (
            <span className="text-[9px] font-bold text-white/90 bg-black/55 backdrop-blur-sm
              px-1.5 py-0.5 rounded-md max-w-[80px] truncate">
              {item.rank}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-3 sm:p-3.5 flex flex-col gap-2 flex-1">

        {/* Game badge row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-brand/8 text-brand border border-brand/15
            text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide truncate max-w-[120px]">
            {item.gameName}
          </span>
          {item.level != null && (
            <span className="text-[10px] font-semibold text-gray-500 bg-[var(--surface-2)]
              border border-[var(--border-bg)] px-1.5 py-0.5 rounded-full">
              Lvl {item.level}
            </span>
          )}
          {item.region && item.region !== 'Global' && (
            <span className="text-[10px] font-semibold text-gray-500 truncate max-w-[60px]">
              {item.region}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug
          group-hover:text-brand transition-colors duration-200 flex-1">
          {item.title}
        </h3>

        {/* Seller row */}
        {item.seller?.storeName && (
          <div className="flex items-center justify-between gap-2">
            {/* Store name + trust signals */}
            <Link
              href={`/seller/${item.seller.id}`}
              onClick={e => e.stopPropagation()}
              className="relative z-10 flex items-center gap-1 min-w-0 group/seller"
            >
              <span className="text-[11px] text-gray-500 truncate max-w-[110px]
                group-hover/seller:text-brand transition-colors">
                {item.seller.storeName}
              </span>
              {verified && (
                <ShieldCheck className="w-3 h-3 text-brand flex-shrink-0" aria-label="Verified seller" />
              )}
              {hasLevel && (
                <Award className={`w-3 h-3 flex-shrink-0 ${levelColor(item.seller.sellerLevel)}`}
                  aria-label={`${item.seller.sellerLevel} seller`} />
              )}
            </Link>

            {/* Star rating */}
            <div className="flex items-center gap-0.5 flex-shrink-0" aria-label={`Rating: ${rating.toFixed(1)}`}>
              <Star className="w-3 h-3 text-brand fill-brand" />
              <span className="text-[11px] font-bold text-gray-300 tabular-nums">
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
              {(item.seller.totalSales ?? 0) > 0 && (
                <span className="text-[10px] text-gray-600 ml-0.5">
                  ({item.seller.totalSales})
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Footer: price + CTA ── */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-bg)] mt-auto">
          <div>
            <span className="text-[9px] text-gray-600 uppercase tracking-wider block leading-none mb-0.5">
              Price
            </span>
            <span className="text-base sm:text-lg font-black text-white tracking-tight leading-none tabular-nums">
              {fmt(item.price)}
            </span>
          </div>

          <Link
            href={`/listings/${item.id}`}
            onClick={e => e.stopPropagation()}
            aria-label={sold ? 'Sold out' : `Buy ${item.title}`}
            className={`
              relative z-10 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold
              transition-all duration-200 touch-manipulation
              ${sold
                ? 'bg-white/5 text-gray-500 border border-[var(--border-bg)] cursor-not-allowed pointer-events-none'
                : 'bg-brand hover:bg-brand-light text-black shadow-sm shadow-brand/20 hover:shadow-md hover:shadow-brand/30 active:scale-95'
              }
            `}
          >
            {sold ? 'Sold' : 'Buy Now'}
          </Link>
        </div>

        {/* Sales count social proof */}
        {(item.salesCount ?? 0) > 2 && !sold && (
          <p className="text-[10px] text-gray-600 leading-none -mt-1">
            🔥 {item.salesCount} sold
          </p>
        )}
      </div>
    </article>
  );
}
