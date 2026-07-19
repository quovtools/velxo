'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Star, ShieldCheck, ShieldAlert, MessageSquare, Flag, Loader2,
  Package, ShoppingBag, Timer, Award, CalendarDays, TrendingUp,
  ChevronRight, Crown, MapPin, Sparkles, Store, Zap, BarChart2,
  Clock, CheckCircle, ThumbsUp, ArrowRight, Activity,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import SellerReportModal from '@/components/SellerReportModal';
import VerifiedBadge from '@/components/VerifiedBadge';
import SellerLevelBadge, { SellerLevel } from '@/components/SellerLevelBadge';
import { useCurrency } from '@/lib/useCurrency';

interface SellerListing {
  id: string;
  title: string;
  price: number;
  gameName: string;
  platform?: string | null;
  region?: string | null;
  images: string[];
  status: string;
  salesCount: number;
  createdAt: string;
}

interface SellerStats {
  totalListings: number;
  activeListings: number;
  totalSales: number;
  averageRating: number;
  responseTime: number | null;
  responseRate: number;
  memberSince: string;
  sellerLevel?: string;
  avgResponseTimeHours?: number;
  deliverySuccessRate?: number;
}

interface SellerProfile {
  id: string;
  storeName: string;
  storeDescription: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  averageRating: number;
  totalSales: number;
  responseTime: number | null;
  responseRate: number;
  reputationScore: number;
  subscriptionTier: string;
  sellerLevel?: string;
  avgResponseTimeHours?: number;
  deliverySuccessRate?: number;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  isSuspended: boolean;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  stats: SellerStats;
  listings: SellerListing[];
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  buyer?: { firstName: string; lastName: string };
  sellerResponse?: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function StarRating({ rating, max = 5, size = 'w-3.5 h-3.5' }: { rating: number; max?: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`${size} ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

function fmtMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function fmtResponseTime(hrs: number | null | undefined, mins: number | null | undefined) {
  if (hrs && hrs > 0) {
    if (hrs < 1) return `${Math.round(hrs * 60)}m`;
    if (hrs < 24) return `${hrs.toFixed(1)}h`;
    return `${Math.round(hrs / 24)}d`;
  }
  if (!mins) return '< 1h';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function ratingDistribution(reviews: Review[]) {
  const dist = [0, 0, 0, 0, 0];
  reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
  const total = reviews.length || 1;
  return dist.map((count, i) => ({ stars: i + 1, count, pct: Math.round((count / total) * 100) })).reverse();
}

function ListingCard({ item, fmt }: { item: SellerListing; fmt: (p: string | number) => string }) {
  const img = item.images?.[0];
  return (
    <Link href={`/listings/${item.id}`}
      className="group bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:shadow-lg hover:shadow-brand/10 hover:-translate-y-0.5">
      <div className="h-36 bg-gradient-to-br from-background to-cardBg relative overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{item.gameName}</span>
          </div>
        )}
        {item.status !== 'ACTIVE' && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-black/70 text-gray-300 backdrop-blur-sm">
            {item.status.replace('_', ' ')}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold text-brand-light bg-brand/10 border border-brand/20 px-2 py-0.5 rounded uppercase tracking-wide">{item.gameName}</span>
          <h3 className="font-bold text-sm mt-2 line-clamp-2 leading-snug group-hover:text-brand transition">{item.title}</h3>
        </div>
        <div className="flex items-center justify-between border-t border-borderBg/60 pt-2.5">
          <span className="text-base font-black text-white">{fmt(item.price)}</span>
          <span className="text-[11px] text-gray-500 flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{item.salesCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}

export default function SellerProfileContent({ id }: { id: string }) {
  const { user } = useAuth();
  const { fmt } = useCurrency();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  const isOwn = !!user && !!profile && user.id === profile.user.id;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sellers/${id}`);
      if (!res.ok) throw new Error('Seller not found');
      const data = await res.json();
      const p: SellerProfile = data.data;
      setProfile(p);
      setListings(p.listings || []);
      // Also fetch reviews
      const rRes = await fetch(`${API_BASE}/reviews/seller/${p.id}`);
      if (rRes.ok) {
        const rData = await rRes.json();
        setReviews(rData.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load seller');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const loadAllListings = async () => {
    if (!profile) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sellerId: profile.user.id, limit: '60', sortBy: 'newest' });
      const res = await fetch(`${API_BASE}/listings?${params}`);
      if (res.ok) {
        const result = await res.json();
        setListings((result.data?.listings || []).map((l: any) => ({ ...l, price: Number(l.price) })));
        setAllLoaded(true);
      }
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  };

  if (loading) return (
    <div className="space-y-5 fade-in">
      <div className="h-52 skeleton rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 skeleton rounded-2xl"/>)}</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="h-64 skeleton rounded-2xl"/>)}</div>
    </div>
  );

  if (error || !profile) return (
    <div className="text-center py-24 bg-cardBg border border-borderBg rounded-3xl fade-in">
      <Store className="w-14 h-14 text-gray-700 mx-auto mb-4" />
      <p className="text-red-400 font-semibold mb-2">{error || 'Seller not found'}</p>
      <Link href="/" className="text-brand hover:text-brand-light font-semibold text-sm transition">← Back to marketplace</Link>
    </div>
  );

  const s = profile.stats;
  const level = (profile.sellerLevel || s.sellerLevel || 'BRONZE') as SellerLevel;
  const dist = ratingDistribution(reviews);
  const avgRating = profile.averageRating || 0;
  const responseHrs = profile.avgResponseTimeHours;
  const responseMin = profile.responseTime;
  const deliveryRate = profile.deliverySuccessRate ?? 100;

  return (
    <div className="space-y-6 fade-in">
      {/* ── Cover Banner ── */}
      <div className="relative h-44 sm:h-56 rounded-3xl overflow-hidden border border-borderBg">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/25 via-cardBg to-purple-900/20" />
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute -right-8 -bottom-12 text-[220px] font-black text-white/[0.04] leading-none select-none" aria-hidden>V</div>
        <Link href="/" className="absolute top-4 left-4 text-xs font-bold text-white/80 bg-black/30 hover:bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur transition">← Marketplace</Link>
        {profile.subscriptionTier && profile.subscriptionTier !== 'FREE' && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-bold text-yellow-300 bg-black/30 border border-yellow-400/20 px-3 py-1.5 rounded-xl backdrop-blur">
            <Crown className="w-3.5 h-3.5" /> {profile.subscriptionTier}
          </div>
        )}
        {/* Level badge overlay on banner */}
        <div className="absolute bottom-4 left-5">
          <SellerLevelBadge level={level} size="md" />
        </div>
      </div>

      {/* ── Header / Avatar ── */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 sm:-mt-16 px-1 relative z-10">
        <div className="relative flex-shrink-0">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-brand to-purple-600 p-[3px] shadow-xl shadow-brand/20">
            <div className="w-full h-full rounded-[21px] bg-cardBg flex items-center justify-center overflow-hidden">
              {profile.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.user.avatarUrl} alt={profile.storeName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white/90">{initials(profile.storeName)}</span>
              )}
            </div>
          </div>
          {profile.isVerified && <span className="absolute -bottom-1 -right-1"><VerifiedBadge size="lg" variant="badge" /></span>}
        </div>

        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{profile.storeName}</h1>
            {profile.isVerified && (
              <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            )}
            {profile.isOnline && (
              <span className="text-[10px] bg-emerald-900/20 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" /> ONLINE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <StarRating rating={avgRating} size="w-4 h-4" />
            <span className="text-sm font-bold text-white">{avgRating.toFixed(1)}</span>
            <span className="text-gray-500 text-xs">({reviews.length} reviews)</span>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-400">Joined {fmtMemberSince(profile.createdAt)}</span>
          </div>
        </div>

        {!isOwn && (
          <div className="flex items-center gap-2 pb-1">
            {user ? (
              <Link href={`/messages?userId=${profile.user.id}`}
                className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand/20">
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
            ) : (
              <Link href={`/auth/login?redirect=/seller/${profile.id}`}
                className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand/20">
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
            )}
            <button onClick={() => setReportOpen(true)}
              className="flex items-center gap-2 bg-background border border-borderBg hover:border-red-500/40 text-gray-300 hover:text-red-400 font-bold px-4 py-2.5 rounded-xl transition">
              <Flag className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {profile.isSuspended && (
        <div className="flex items-center gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          This seller account is currently under review by our trust &amp; safety team.
        </div>
      )}

      {/* ── P2P Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: <ShoppingBag className="w-5 h-5 text-brand" />, label: 'Total Sales', value: s.totalSales.toLocaleString(), sub: 'lifetime' },
          { icon: <Star className="w-5 h-5 text-yellow-400" />, label: 'Rating', value: avgRating ? avgRating.toFixed(1) + '★' : 'New', sub: `${reviews.length} reviews` },
          { icon: <Package className="w-5 h-5 text-cyan-400" />, label: 'Active Listings', value: s.activeListings.toString(), sub: `${s.totalListings} total` },
          {
            icon: <Zap className="w-5 h-5 text-emerald-400" />,
            label: 'Response Time',
            value: fmtResponseTime(responseHrs, responseMin),
            sub: profile.responseRate ? `${Math.round(profile.responseRate * 100)}% rate` : 'avg reply',
          },
          { icon: <CheckCircle className="w-5 h-5 text-green-400" />, label: 'Delivery Rate', value: `${Math.round(deliveryRate)}%`, sub: 'success rate' },
          { icon: <CalendarDays className="w-5 h-5 text-orange-400" />, label: 'Member Since', value: fmtMemberSince(profile.createdAt), sub: 'joined' },
        ].map((c, i) => (
          <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-4 hover:border-brand/30 transition group">
            <div className="mb-2">{c.icon}</div>
            <p className="text-xl font-black text-white leading-none">{c.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{c.label}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── About ── */}
      {profile.storeDescription && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand" />
            <h2 className="font-bold text-white">About this store</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{profile.storeDescription}</p>
        </div>
      )}

      {/* ── Tabs: Listings / Reviews ── */}
      <div className="flex gap-2 border-b border-borderBg">
        {(['listings', 'reviews'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold capitalize transition border-b-2 -mb-px ${activeTab === tab ? 'border-brand text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {tab === 'listings' ? `Listings (${s.activeListings})` : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {/* ── Listings Tab ── */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-white">Store Listings</h2>
            </div>
            {!allLoaded && listings.length >= 12 && (
              <button onClick={loadAllListings} disabled={loadingMore}
                className="text-xs font-bold text-brand hover:text-brand-light flex items-center gap-1 transition disabled:opacity-50">
                {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                See all listings
              </button>
            )}
          </div>
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-cardBg border border-borderBg rounded-3xl">
              <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-semibold">No active listings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map(item => <ListingCard key={item.id} item={item} fmt={fmt} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Reviews Tab ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          {reviews.length > 0 && (
            <div className="bg-cardBg border border-borderBg rounded-2xl p-6 flex flex-col sm:flex-row gap-6">
              {/* Score summary */}
              <div className="text-center sm:border-r sm:border-borderBg sm:pr-6 flex-shrink-0">
                <p className="text-5xl font-black text-white">{avgRating.toFixed(1)}</p>
                <StarRating rating={avgRating} size="w-5 h-5" />
                <p className="text-xs text-gray-500 mt-1">{reviews.length} reviews</p>
              </div>
              {/* Distribution bars */}
              <div className="flex-1 space-y-2">
                {dist.map(d => (
                  <div key={d.stars} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4 text-right">{d.stars}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                    <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-7">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-cardBg border border-borderBg rounded-2xl">
              <ThumbsUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-semibold">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-cardBg border border-borderBg rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center text-xs font-bold text-brand-light flex-shrink-0">
                        {r.buyer?.firstName?.[0]}{r.buyer?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{r.buyer?.firstName} {r.buyer?.lastName}</p>
                        <StarRating rating={r.rating} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-3 leading-relaxed">{r.comment}</p>
                  {r.sellerResponse && (
                    <div className="mt-3 bg-brand/5 border border-brand/20 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-brand-light mb-1 flex items-center gap-1"><Store className="w-3 h-3" /> Seller Reply</p>
                      <p className="text-xs text-gray-300">{r.sellerResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SellerReportModal open={reportOpen} onClose={() => setReportOpen(false)} sellerId={profile.id} sellerName={profile.storeName} />
    </div>
  );
}
