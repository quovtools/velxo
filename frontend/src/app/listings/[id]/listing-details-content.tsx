'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Sparkles, UserCheck, MessageSquare, Star,
  ChevronLeft, ChevronRight, Clock, MapPin, Monitor,
  Award, ShoppingCart, Loader2, Flag, Store,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import SellerReportModal from '@/components/SellerReportModal';
import VerifiedBadge from '@/components/VerifiedBadge';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  level: number;
  loginMethod: string;
  deliveryTime: number;
  images: string[];
  status: string;
  isSold: boolean;
  seller: {
    id: string;
    userId: string;
    storeName: string;
    averageRating: number;
    totalSales: number;
    isVerified: boolean;
  };
  listingReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    buyer: { firstName: string; lastName: string };
  }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );
}

export default function ListingDetailsContent({ id }: { id: string }) {
  const { user } = useAuth();
  const [listing, setListing]   = useState<Listing | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [imgIdx, setImgIdx]     = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/listings/${id}`);
        if (!res.ok) throw new Error('Listing not found');
        const data = await res.json();
        setListing(data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="space-y-6 py-8 fade-in">
      <div className="h-8 skeleton rounded-xl w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-80 skeleton rounded-2xl" />
          <div className="h-40 skeleton rounded-2xl" />
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </div>
  );

  if (error || !listing) return (
    <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl fade-in">
      <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
      <p className="text-red-400 font-semibold mb-3">{error || 'Listing not found'}</p>
      <Link href="/" className="text-brand hover:text-brand-light font-semibold transition text-sm">← Back to marketplace</Link>
    </div>
  );

  const images = listing.images?.length ? listing.images : [];
  const avgRating = listing.seller?.averageRating || 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-gray-400">{listing.gameName}</span>
        <span>/</span>
        <span className="text-white truncate max-w-[200px]">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Images + Details ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Image gallery */}
          <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
            <div className="relative aspect-video bg-background flex items-center justify-center">
              {images.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[imgIdx]} alt={listing.title}
                    className="w-full h-full object-cover" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition">
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, i) => (
                          <button key={i} onClick={() => setImgIdx(i)}
                            className={`w-2 h-2 rounded-full transition ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center p-12">
                  <Sparkles className="w-16 h-16 mx-auto text-brand/20 mb-3" />
                  <p className="text-gray-500 text-sm">No preview available</p>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none bg-background/30">
                {images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" onClick={() => setImgIdx(i)}
                    className={`h-14 w-20 object-cover rounded-lg cursor-pointer flex-shrink-0 transition ${
                      i === imgIdx ? 'ring-2 ring-brand opacity-100' : 'opacity-50 hover:opacity-80'
                    }`} />
                ))}
              </div>
            )}
          </div>

          {/* Title + tags */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-brand/10 text-brand-light text-xs font-bold px-3 py-1 rounded-full border border-brand/20">{listing.gameName}</span>
              {listing.platform && <span className="bg-cyan-900/20 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1"><Monitor className="w-3 h-3" />{listing.platform}</span>}
              {listing.region   && <span className="bg-emerald-950/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.region}</span>}
            </div>
            <h1 className="text-xl md:text-2xl font-bold leading-snug">{listing.title}</h1>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Rank',     val: listing.rank || 'Unranked' },
                { label: 'Level',    val: listing.level ? `Lv. ${listing.level}` : 'N/A' },
                { label: 'Login',    val: listing.loginMethod || 'Escrow transfer' },
                { label: 'Delivery', val: listing.deliveryTime ? `${listing.deliveryTime} min` : 'Instant' },
              ].map(m => (
                <div key={m.label} className="bg-background border border-borderBg rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                  <p className="text-sm font-bold mt-0.5 truncate">{m.val}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-borderBg">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{listing.description}</p>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Buyer Reviews</h3>
              <span className="text-xs text-gray-500">{listing.listingReviews?.length || 0} reviews</span>
            </div>
            {listing.listingReviews?.length ? (
              <div className="space-y-4">
                {listing.listingReviews.map(r => (
                  <div key={r.id} className="border-b border-borderBg pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand-light">
                          {r.buyer?.firstName?.[0]}{r.buyer?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.buyer?.firstName} {r.buyer?.lastName}</p>
                          <StarRating rating={r.rating} />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 ml-10">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No reviews yet for this listing.</p>
            )}
          </div>
        </div>

        {/* ── Right: Purchase card ── */}
        <div>
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5 sticky top-20">
            {/* Price */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Price</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-4xl font-black">${Number(listing.price).toFixed(2)}</span>
                <span className="text-xs text-gray-500 mb-1">USD</span>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="space-y-2.5 border-y border-borderBg py-4">
              {[
                { icon: <Shield className="w-4 h-4 text-brand" />, text: 'Escrow protection on all orders' },
                { icon: <Clock className="w-4 h-4 text-emerald-400" />, text: listing.deliveryTime ? `Delivery in ~${listing.deliveryTime} min` : 'Instant delivery' },
                { icon: <UserCheck className="w-4 h-4 text-brand" />, text: 'Verified seller account' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-300">{t.icon}{t.text}</div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="space-y-2.5">
              {listing.isSold || listing.status === 'SOLD' ? (
                <div className="flex items-center justify-center gap-2 w-full bg-background border border-borderBg py-3.5 rounded-xl font-bold text-gray-400 cursor-not-allowed">
                  <ShoppingCart className="w-4 h-4" /> Sold
                </div>
              ) : (
                <Link href={`/checkout/${listing.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition shadow-lg shadow-brand/20 text-white">
                  <ShoppingCart className="w-4 h-4" /> Buy Now
                </Link>
              )}
              {user && (user as any).id !== listing.seller?.userId && (
                <Link href={`/messages?buyerId=${user.id}&sellerId=${listing.seller?.userId}`}
                  className="flex items-center justify-center gap-2 w-full bg-background border border-borderBg hover:border-brand/40 py-3.5 rounded-xl font-bold transition text-gray-300 hover:text-white">
                  <MessageSquare className="w-4 h-4" /> Message Seller
                </Link>
              )}
            </div>

            {/* Seller card */}
            <div className="border-t border-borderBg pt-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seller</p>
              <Link href={`/seller/${listing.seller?.id}`} className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-purple-600 p-[2px] flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden">
                    <Award className="w-5 h-5 text-brand-light" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm truncate group-hover:text-brand transition">{listing.seller?.storeName}</span>
                    {listing.seller?.isVerified && (
                      <VerifiedBadge size="sm" label="Verified" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={Math.round(avgRating)} />
                    <span className="text-xs text-gray-500">{avgRating.toFixed(1)} · {listing.seller?.totalSales || 0} sales</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand transition flex-shrink-0" />
              </Link>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/seller/${listing.seller?.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-background border border-borderBg hover:border-brand/40 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition"
                >
                  <Store className="w-3.5 h-3.5" /> View store &amp; listings
                </Link>
                {user && (user as any).id !== listing.seller?.userId && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center justify-center gap-1.5 bg-background border border-borderBg hover:border-red-500/40 py-2.5 px-3 rounded-xl text-xs font-bold text-gray-300 hover:text-red-400 transition"
                    title="Report seller"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <SellerReportModal
              open={reportOpen}
              onClose={() => setReportOpen(false)}
              sellerId={listing.seller?.id || ''}
              sellerName={listing.seller?.storeName || ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
