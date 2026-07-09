'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Star, ShieldCheck, ShieldAlert, MessageSquare, Flag, Loader2,
  Package, ShoppingBag, Timer, Award, CalendarDays, TrendingUp,
  ChevronRight, Crown, BadgeCheck, MapPin, Sparkles, Store,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import SellerReportModal from '@/components/SellerReportModal';
import VerifiedBadge from '@/components/VerifiedBadge';

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
  isSuspended: boolean;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  stats: SellerStats;
  listings: SellerListing[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function StarRating({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
        />
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatResponseTime(mins: number | null) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function ListingCard({ item }: { item: SellerListing }) {
  const img = item.images?.[0];
  return (
    <Link
      href={`/listings/${item.id}`}
      className="group bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:shadow-lg hover:shadow-brand/10"
    >
      <div className="h-36 bg-gradient-to-br from-background to-cardBg flex items-center justify-center relative overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{item.gameName}</span>
        )}
        {item.status !== 'ACTIVE' && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-black/60 text-gray-300">
            {item.status.replace('_', ' ').toLowerCase()}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand/10 text-brand-light text-[10px] font-bold px-2 py-0.5 rounded border border-brand/20 uppercase tracking-wide truncate max-w-[120px]">
              {item.gameName}
            </span>
            {item.platform && <span className="text-[10px] text-gray-600 truncate">{item.platform}</span>}
          </div>
          <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-brand transition">
            {item.title}
          </h3>
        </div>
        <div className="flex items-center justify-between border-t border-borderBg pt-3">
          <span className="text-lg font-black text-white tracking-tight">${Number(item.price).toFixed(2)}</span>
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" /> {item.salesCount || 0} sold
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function SellerProfileContent({ id }: { id: string }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwn = !!user && !!profile && user.id === profile.user.id;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sellers/${id}`);
      if (!res.ok) throw new Error('Seller not found');
      const data = await res.json();
      setProfile(data.data);
      setListings(data.data.listings || []);
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
      const params = new URLSearchParams();
      params.append('sellerId', profile.user.id);
      params.append('limit', '60');
      params.append('sortBy', 'newest');
      const res = await fetch(`${API_BASE}/listings?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        const mapped = (result.data?.listings || []).map((l: any) => ({
          ...l,
          price: Number(l.price),
        }));
        setListings(mapped);
        setAllLoaded(true);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="h-40 sm:h-52 skeleton rounded-3xl" />
        <div className="-mt-14 sm:-mt-16 ml-5 w-28 h-28 skeleton rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-24 bg-cardBg border border-borderBg rounded-3xl fade-in">
        <Store className="w-14 h-14 text-gray-700 mx-auto mb-4" />
        <p className="text-red-400 font-semibold mb-2">{error || 'Seller not found'}</p>
        <Link href="/" className="text-brand hover:text-brand-light font-semibold text-sm transition">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const s = profile.stats;
  const displayName =
    profile.user.firstName && profile.user.lastName
      ? `${profile.user.firstName} ${profile.user.lastName}`
      : profile.storeName;

  const statCards = [
    { icon: <ShoppingBag className="w-5 h-5 text-brand" />, label: 'Items Sold', value: s.totalSales.toLocaleString() },
    { icon: <Star className="w-5 h-5 text-yellow-400" />, label: 'Rating', value: s.averageRating ? s.averageRating.toFixed(1) : 'New' },
    { icon: <Package className="w-5 h-5 text-cyan-400" />, label: 'Active Listings', value: s.activeListings.toLocaleString() },
    { icon: <Timer className="w-5 h-5 text-emerald-400" />, label: 'Response Time', value: formatResponseTime(s.responseTime) },
    { icon: <Award className="w-5 h-5 text-purple-400" />, label: 'Reputation', value: profile.reputationScore.toFixed(1) },
    { icon: <CalendarDays className="w-5 h-5 text-orange-400" />, label: 'Member Since', value: formatMemberSince(s.memberSince) },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Cover banner */}
      <div className="relative h-40 sm:h-52 rounded-3xl overflow-hidden border border-borderBg">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/30 via-purple-700/20 to-background" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div
          className="absolute -right-6 -bottom-10 text-[180px] sm:text-[240px] font-black text-white/5 leading-none select-none"
          aria-hidden
        >
          V
        </div>
        <Link
          href="/"
          className="absolute top-4 left-4 text-xs font-bold text-white/80 bg-black/30 hover:bg-black/50 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur transition"
        >
          ← Marketplace
        </Link>
        {profile.subscriptionTier && profile.subscriptionTier !== 'FREE' && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-bold text-yellow-300 bg-black/30 border border-yellow-400/20 px-3 py-1.5 rounded-lg backdrop-blur">
            <Crown className="w-3.5 h-3.5" /> {profile.subscriptionTier}
          </div>
        )}
      </div>

      {/* Header */}
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
          {profile.isVerified && (
            <span className="absolute -bottom-1 -right-1">
              <VerifiedBadge size="lg" variant="badge" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">{profile.storeName}</h1>
            {profile.isVerified && (
              <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">@{displayName.toLowerCase().replace(/\s+/g, '')} · Joined {formatMemberSince(profile.createdAt)}</p>
        </div>

        {/* Actions */}
        {!isOwn && (
          <div className="flex items-center gap-2 pb-1">
            {user && (
              <Link
                href={`/messages?userId=${profile.user.id}`}
                className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand/20"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
            )}
            <button
              onClick={() => setReportOpen(true)}
              title="Report seller"
              className="flex items-center justify-center gap-2 bg-background border border-borderBg hover:border-red-500/40 text-gray-300 hover:text-red-400 font-bold px-4 py-2.5 rounded-xl transition"
            >
              <Flag className="w-4 h-4" /> Report
            </button>
          </div>
        )}
        {!user && !isOwn && (
          <div className="flex items-center gap-2 pb-1">
            <Link
              href={`/auth/login?redirect=/seller/${profile.id}`}
              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand/20"
            >
              <MessageSquare className="w-4 h-4" /> Message
            </Link>
            <button
              onClick={() => setReportOpen(true)}
              title="Report seller"
              className="flex items-center justify-center gap-2 bg-background border border-borderBg hover:border-red-500/40 text-gray-300 hover:text-red-400 font-bold px-4 py-2.5 rounded-xl transition"
            >
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((c, i) => (
          <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-4 hover:border-brand/30 transition group">
            <div className="mb-2">{c.icon}</div>
            <p className="text-xl font-black text-white">{c.value}</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* About */}
      {profile.storeDescription && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand" />
            <h2 className="font-bold">About this store</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{profile.storeDescription}</p>
        </div>
      )}

      {/* Listings */}
      <div id="listings" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-white">Store Listings</h2>
            <span className="text-xs text-gray-500 bg-background px-2 py-0.5 rounded-full border border-borderBg">
              {s.totalListings}
            </span>
          </div>
          {!allLoaded && listings.length > 0 && (
            <button
              onClick={loadAllListings}
              disabled={loadingMore}
              className="text-xs font-bold text-brand hover:text-brand-light flex items-center gap-1 transition disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              View all listings
            </button>
          )}
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 bg-cardBg border border-borderBg rounded-3xl space-y-3">
            <Package className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-gray-400 font-semibold">No active listings yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {allLoaded && listings.length > 12 && (
          <div className="text-center">
            <Link
              href={`/listings?seller=${profile.user.id}`}
              className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-light transition"
            >
              Browse full store <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      <SellerReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        sellerId={profile.id}
        sellerName={profile.storeName}
      />
    </div>
  );
}
