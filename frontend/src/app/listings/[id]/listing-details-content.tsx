'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Sparkles, UserCheck, MessageSquare, Star,
  ChevronLeft, ChevronRight, Clock, MapPin, Monitor,
  Award, ShoppingCart, Flag, Store, Zap, Heart,
  Video, Image, Package, Gamepad2,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import SellerReportModal from '@/components/SellerReportModal';
import VerifiedBadge from '@/components/VerifiedBadge';
import SellerLevelBadge from '@/components/SellerLevelBadge';
import ListingCard from '@/components/ListingCard';
import { useCurrency } from '@/lib/useCurrency';
import GameListingTemplate from '@/components/GameListingTemplate';

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
  videos?: string[];
  status: string;
  isSold: boolean;
  seller: {
    id: string;
    userId: string;
    storeName: string;
    averageRating: number;
    totalSales: number;
    isVerified: boolean;
    sellerLevel?: string;
    responseTime?: number | null;
    deliverySuccessRate?: number;
    isOnline?: boolean;
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
const WISHLIST_KEY = 'piyrox_wishlist';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-brand text-brand' : 'text-gray-600'}`} />
      ))}
    </div>
  );
}

function readWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

type Tab = 'description' | 'details' | 'reviews' | 'similar';

export default function ListingDetailsContent({ id, initialData }: { id: string; initialData?: Listing | null }) {
  const { user } = useAuth();
  const { fmt } = useCurrency();
  const [listing, setListing] = useState<Listing | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [mediaTab, setMediaTab] = useState<'images' | 'video'>('images');
  const [tab, setTab] = useState<Tab>('description');
  const [reportOpen, setReportOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [similar, setSimilar] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    setWishlisted(readWishlist().includes(id));
  }, [id]);

  useEffect(() => {
    if (initialData) return;
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
  }, [id, initialData]);

  useEffect(() => {
    if (!listing?.gameName) return;
    setSimilarLoading(true);
    fetch(`${API_BASE}/listings?gameName=${encodeURIComponent(listing.gameName)}&limit=8&sortBy=popular`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const items = (data?.data || data?.listings || []).filter((l: any) => l.id !== listing.id);
        setSimilar(items.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setSimilarLoading(false));
  }, [listing?.id, listing?.gameName]);

  const toggleWishlist = () => {
    const list = readWishlist();
    const next = wishlisted ? list.filter(w => w !== id) : [...list, id];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    setWishlisted(!wishlisted);
  };

  if (loading) return (
    <div className="space-y-6 py-8 fade-in">
      <div className="h-4 skeleton rounded w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-80 skeleton rounded-2xl" />
          <div className="h-40 skeleton rounded-2xl" />
        </div>
        <div className="space-y-4">
          <div className="h-72 skeleton rounded-2xl" />
          <div className="h-40 skeleton rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (error || !listing) return (
    <div className="text-center py-20 bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl fade-in">
      <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
      <p className="text-red-400 font-semibold mb-3">{error || 'Listing not found'}</p>
      <Link href="/listings" className="text-brand hover:text-brand-light font-semibold transition text-sm">← Back to marketplace</Link>
    </div>
  );

  const images = listing.images?.length ? listing.images : [];
  const videos = listing.videos?.length ? listing.videos : [];
  const hasVideo = videos.length > 0;
  const sold = listing.isSold || listing.status === 'SOLD';
  const avgRating = listing.seller?.averageRating || 0;
  const isOwnListing = user && (user as any).id === listing.seller?.userId;

  const detailRows = [
    { label: 'Rank', val: listing.rank || 'Unranked', icon: Award },
    { label: 'Level', val: listing.level ? `Level ${listing.level}` : 'N/A', icon: Gamepad2 },
    { label: 'Platform', val: listing.platform || 'Any', icon: Monitor },
    { label: 'Region', val: listing.region || 'Global', icon: MapPin },
    { label: 'Login Method', val: listing.loginMethod || 'Escrow transfer', icon: Shield },
    { label: 'Delivery', val: listing.deliveryTime ? `~${listing.deliveryTime} min` : 'Instant', icon: Clock },
  ];

  return (
    <div className="space-y-6 fade-in pb-24 sm:pb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-white transition">Marketplace</Link>
        <span>/</span>
        <Link href={`/games/${listing.gameName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-brand transition">{listing.gameName}</Link>
        <span>/</span>
        <span className="text-gray-400 truncate max-w-[180px]">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: gallery ── */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl overflow-hidden">
            {hasVideo && (
              <div className="flex border-b border-[var(--border-bg)]">
                {(['images', 'video'] as const).map(t => (
                  <button key={t} onClick={() => setMediaTab(t)}
                    className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold transition border-b-2 ${
                      mediaTab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}>
                    {t === 'images' ? <><Image className="w-3.5 h-3.5" /> Photos{images.length > 0 && ` (${images.length})`}</> : <><Video className="w-3.5 h-3.5" /> Video</>}
                  </button>
                ))}
              </div>
            )}

            {mediaTab === 'video' && hasVideo ? (
              <div className="bg-black aspect-video flex items-center justify-center">
                <video src={videos[0]} controls className="w-full h-full object-contain" playsInline />
              </div>
            ) : (
              <>
                <div className="relative aspect-video sm:aspect-[16/10] bg-black flex items-center justify-center">
                  {images.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={images[imgIdx]} alt={listing.title} loading="lazy" referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      {sold && (
                        <span className="absolute top-3 left-3 bg-black/80 text-gray-300 text-xs font-bold px-3 py-1 rounded-full border border-white/10">Sold</span>
                      )}
                      {listing.seller?.isVerified && !sold && (
                        <span className="absolute top-3 left-3 flex items-center gap-1 bg-brand text-black text-[10px] font-bold px-2.5 py-1 rounded-full">
                          <Shield className="w-3 h-3" /> Escrow Protected
                        </span>
                      )}
                      {images.length > 1 && (
                        <>
                          <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)} aria-label="Previous image"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full flex items-center justify-center transition">
                            <ChevronLeft className="w-4 h-4 text-white" />
                          </button>
                          <button onClick={() => setImgIdx(i => (i + 1) % images.length)} aria-label="Next image"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full flex items-center justify-center transition">
                            <ChevronRight className="w-4 h-4 text-white" />
                          </button>
                          <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {imgIdx + 1} / {images.length}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-12">
                      <Package className="w-16 h-16 mx-auto text-brand/20 mb-3" />
                      <p className="text-gray-500 text-sm">No preview available</p>
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none bg-black/20">
                    {images.map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={img} alt="" loading="lazy" referrerPolicy="no-referrer" onClick={() => setImgIdx(i)}
                        className={`h-16 w-24 object-cover rounded-lg cursor-pointer flex-shrink-0 transition border-2 ${
                          i === imgIdx ? 'border-brand opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                        }`} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right: purchase panel ── */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-5 space-y-4">
            {/* Game + status chips */}
            <div className="flex flex-wrap gap-1.5">
              <Link href={`/games/${listing.gameName.toLowerCase().replace(/\s+/g, '-')}`}
                className="badge badge-gold hover:brightness-110 transition">{listing.gameName}</Link>
              {listing.rank && <span className="badge badge-neutral">{listing.rank}</span>}
              {listing.platform && <span className="badge badge-neutral">{listing.platform}</span>}
              {listing.deliveryTime === 0 && (
                <span className="badge badge-gold"><Zap className="w-3 h-3" /> Instant</span>
              )}
              {sold && <span className="badge badge-error">Sold</span>}
            </div>

            <h1 className="text-xl md:text-2xl font-black text-white leading-snug">{listing.title}</h1>

            {/* Price */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Price</p>
                <span className="text-3xl font-black text-white tracking-tight">{fmt(listing.price)}</span>
              </div>
              <button onClick={toggleWishlist} aria-label="Add to wishlist"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${
                  wishlisted
                    ? 'bg-brand/15 border-brand/40 text-brand'
                    : 'bg-[var(--surface)] border-[var(--border-bg)] text-gray-500 hover:text-brand hover:border-brand/30'
                }`}>
                <Heart className={`w-4.5 h-4.5 ${wishlisted ? 'fill-brand' : ''}`} style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Seller mini card */}
            <Link href={`/seller/${listing.seller?.id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-bg)] hover:border-brand/30 transition group">
              <div className="w-10 h-10 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-white truncate group-hover:text-brand transition">{listing.seller?.storeName}</span>
                  {listing.seller?.isVerified && <VerifiedBadge size="sm" label="" />}
                  {listing.seller?.sellerLevel && listing.seller.sellerLevel !== 'BRONZE' && (
                    <SellerLevelBadge level={listing.seller.sellerLevel} size="xs" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                  <Star className="w-3 h-3 text-brand fill-brand" />
                  <span className="font-semibold text-gray-300">{avgRating.toFixed(1)}</span>
                  <span>({listing.listingReviews?.length || 0})</span>
                  <span>·</span>
                  <span>Sales: {(listing.seller?.totalSales || 0).toLocaleString()}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand transition flex-shrink-0" />
            </Link>

            {/* CTAs */}
            <div className="space-y-2">
              {sold ? (
                <div className="flex items-center justify-center gap-2 w-full bg-[var(--surface)] border border-[var(--border-bg)] py-3.5 rounded-xl font-bold text-gray-500 cursor-not-allowed text-sm">
                  <ShoppingCart className="w-4 h-4" /> Sold Out
                </div>
              ) : (
                <Link href={`/checkout/${listing.id}`}
                  className="btn-primary w-full shadow-lg shadow-brand/20">
                  <ShoppingCart className="w-4 h-4" /> Buy Now
                </Link>
              )}
              <div className="flex gap-2">
                {user && !isOwnListing && (
                  <Link href={`/messages?sellerId=${listing.seller?.userId}`}
                    className="btn-secondary flex-1 !py-2.5 text-xs">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </Link>
                )}
                <Link href={`/seller/${listing.seller?.id}`} className="btn-secondary flex-1 !py-2.5 text-xs">
                  <Store className="w-3.5 h-3.5" /> View Store
                </Link>
                {user && !isOwnListing && (
                  <button onClick={() => setReportOpen(true)} aria-label="Report seller"
                    className="btn-secondary !px-3 !py-2.5 text-gray-500 hover:!text-red-400 hover:!border-red-500/40">
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Trust indicators */}
            <div className="space-y-2 border-t border-[var(--border-bg)] pt-4">
              {[
                { icon: Shield, text: 'Escrow protection on all orders' },
                { icon: Clock, text: listing.deliveryTime ? `Delivery in ~${listing.deliveryTime} min` : 'Instant delivery' },
                { icon: UserCheck, text: listing.seller?.isVerified ? 'Verified seller' : 'Registered seller' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-gray-400">
                  <t.icon className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─ */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl overflow-hidden">
        <div className="flex gap-1 border-b border-[var(--border-bg)] overflow-x-auto scrollbar-none px-3 pt-2">
          {([
            { id: 'description', label: 'Description' },
            { id: 'details', label: 'Details' },
            { id: 'reviews', label: `Reviews (${listing.listingReviews?.length || 0})` },
            { id: 'similar', label: 'Similar' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                tab === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">
          {tab === 'description' && (
            <div className="space-y-5 fade-in">
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{listing.description || 'No description provided.'}</p>
              <GameListingTemplate listing={listing} />
            </div>
          )}

          {tab === 'details' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 fade-in">
              {detailRows.map(m => (
                <div key={m.label} className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    <m.icon className="w-3 h-3 text-brand" /> {m.label}
                  </div>
                  <p className="text-sm font-bold text-white truncate">{m.val}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="space-y-4 fade-in">
              {listing.listingReviews?.length ? (
                listing.listingReviews.map(r => (
                  <div key={r.id} className="border-b border-[var(--border-bg)] pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                          {r.buyer?.firstName?.[0]}{r.buyer?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{r.buyer?.firstName} {r.buyer?.lastName}</p>
                          <StarRating rating={r.rating} />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 ml-10 leading-relaxed">{r.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Star className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No reviews yet for this listing.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'similar' && (
            <div className="fade-in">
              {similarLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
                </div>
              ) : similar.length === 0 ? (
                <div className="text-center py-10">
                  <Gamepad2 className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No similar listings found.</p>
                  <Link href="/listings" className="text-brand hover:text-brand-light text-sm font-semibold transition">Browse marketplace</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {similar.map(item => <ListingCard key={item.id} item={item} />)}
                </div>
              )}
            </div>
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
  );
}
