'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Star, Package, BadgeCheck, Clock, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface SellerPublic {
  id: string;
  storeName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  averageRating: number;
  totalSales: number;
  totalReviews: number;
  memberSince?: string | null;
  games?: string[];
}

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  rank?: string;
  images?: string[];
  isSold: boolean;
  status: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: { firstName?: string; lastName?: string } | null;
}

interface Props {
  username: string;
  initialSeller: SellerPublic | null;
}

export default function SellerProfileContent({ username, initialSeller }: Props) {
  const { fmt } = useCurrency();
  const [seller, setSeller] = useState<SellerPublic | null>(initialSeller);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [notFound, setNotFound] = useState(!initialSeller);

  useEffect(() => {
    if (!initialSeller) {
      fetch(`${API_BASE}/sellers/profile/${encodeURIComponent(username)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.data) setSeller(d.data);
          else setNotFound(true);
        })
        .catch(() => setNotFound(true));
    }
  }, [username, initialSeller]);

  useEffect(() => {
    if (!seller?.id) return;
    // Load listings
    fetch(`${API_BASE}/listings?sellerId=${seller.id}&limit=12`)
      .then((r) => (r.ok ? r.json() : { data: { listings: [] } }))
      .then((d) => setListings(d.data?.listings ?? d.data ?? []))
      .catch(() => setListings([]))
      .finally(() => setLoadingListings(false));

    // Load reviews
    fetch(`${API_BASE}/reviews/seller/${seller.id}?limit=6`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setReviews(d.data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [seller?.id]);

  if (notFound) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-2xl font-black text-white">Seller not found</p>
        <p className="text-gray-400">This seller profile doesn&apos;t exist or has been removed.</p>
        <Link href="/top-sellers" className="inline-block mt-2 text-brand hover:underline text-sm font-semibold">
          Browse top sellers →
        </Link>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-cardBg border border-borderBg rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const memberYear = seller.memberSince
    ? new Date(seller.memberSince).getFullYear()
    : null;

  return (
    <div className="space-y-8">
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <Link href="/top-sellers" className="hover:text-white transition">Sellers</Link>
        <span>/</span>
        <span className="text-gray-300">{seller.storeName}</span>
      </nav>

      {/* ── Profile header ── */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative flex-shrink-0">
          {seller.avatarUrl ? (
            <Image
              src={seller.avatarUrl}
              alt={seller.storeName}
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-borderBg"
              unoptimized
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand/10 border-2 border-brand/20 flex items-center justify-center">
              <span className="text-2xl font-black text-brand">
                {seller.storeName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {seller.isVerified && (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-cardBg">
              <BadgeCheck className="w-3.5 h-3.5 text-white" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-white">{seller.storeName}</h1>
            {seller.isVerified && (
              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                KYC Verified
              </span>
            )}
          </div>
          {seller.bio && (
            <p className="text-sm text-gray-400 mt-1 leading-relaxed line-clamp-3">{seller.bio}</p>
          )}
          {seller.games && seller.games.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {seller.games.map((g) => (
                <Link
                  key={g}
                  href={`/games/${g.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-[10px] font-semibold bg-background border border-borderBg text-gray-400 hover:text-white px-2 py-0.5 rounded-lg transition"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-cardBg border border-borderBg rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{seller.totalSales}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
            <Package className="w-3 h-3" /> Sales
          </p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">
            {seller.averageRating > 0 ? seller.averageRating.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
            <Star className="w-3 h-3" /> Avg Rating
          </p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{seller.totalReviews}</p>
          <p className="text-xs text-gray-500 mt-0.5">Reviews</p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{memberYear ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Member Since
          </p>
        </div>
      </div>

      {/* ── Listings ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-white">Active Listings</h2>
        {loadingListings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : listings.filter((l) => !l.isSold && l.status !== 'SOLD').length === 0 ? (
          <div className="text-center py-12 bg-cardBg border border-borderBg rounded-2xl">
            <p className="text-gray-400">No active listings at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings
              .filter((l) => !l.isSold && l.status !== 'SOLD')
              .map((item) => (
                <Link
                  key={item.id}
                  href={`/listings/${item.id}`}
                  className="group bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition"
                >
                  <div className="h-28 bg-gradient-to-br from-brand/20 to-background relative overflow-hidden">
                    {item.images?.[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-brand uppercase tracking-wide">{item.gameName}</p>
                    <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{item.title}</p>
                    {item.rank && (
                      <p className="text-[11px] text-gray-500">Rank: {item.rank}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto border-t border-borderBg pt-2">
                      <span className="text-base font-black text-white">{fmt(item.price)}</span>
                      <span className="text-xs font-bold text-brand group-hover:underline flex items-center gap-0.5">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </section>

      {/* ── Reviews ── */}
      {(reviews.length > 0 || !loadingReviews) && (
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white">
            Reviews{seller.totalReviews > 0 ? ` (${seller.totalReviews})` : ''}
          </h2>
          {loadingReviews ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-cardBg border border-borderBg rounded-xl animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-cardBg border border-borderBg rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {r.reviewer
                        ? `${r.reviewer.firstName ?? ''} ${(r.reviewer.lastName ?? '').charAt(0)}.`.trim()
                        : 'Verified Buyer'}{' '}
                      · {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-400 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Trust badge ── */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        All transactions with {seller.storeName} are protected by Piyrox Trust-Trade escrow. Your payment is never released until you confirm delivery.
      </div>
    </div>
  );
}
