'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import Link from 'next/link';
import VerifiedBadge from '@/components/VerifiedBadge';
import SellerLevelBadge, { SellerLevelProgress } from '@/components/SellerLevelBadge';
import { useCurrency } from '@/lib/useCurrency';
import {
  LayoutDashboard, Package, DollarSign, Store, Star, TrendingUp, Wallet, MessageSquare,
  CreditCard, PlusCircle, CheckCircle, X, Menu, Eye, Truck, Trash2, Edit3, Loader2,
  ShieldCheck, Award, ArrowUpRight, Calendar, Filter, Image, Clock, Send, Banknote,
  ChevronRight, RefreshCw, AlertCircle, ListChecks, BarChart3, Copy, Share2, ExternalLink,
  AlertTriangle, Bell,
} from 'lucide-react';

/* ------------------------------------------------------------------ types */
interface Seller {
  id: string;
  userId: string;
  storeName: string;
  storeDescription: string;
  isVerified: boolean;
  kycStatus?: string;
  reputationScore: number;
  totalSales: number;
  totalRevenue: string | number;
  averageRating: number;
  responseRate: number;
  responseTime: number;
  subscriptionTier: string;
  sellerLevel?: string;
  avgResponseTimeHours?: number;
  deliverySuccessRate?: number;
  verifiedAt?: string;
  storeSlug?: string | null;
}
interface SellerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string | number;
  currency?: string;
  createdAt: string;
  buyer: { id: string; firstName: string; lastName: string };
  orderItems: Array<{ listing?: { title: string; gameName: string; images?: string[] } }>;
}
interface SellerListing {
  id: string;
  title: string;
  price: string | number;
  currency?: string;
  status: string;
  salesCount: number;
  viewCount: number;
  images?: string[];
  gameName?: string;
}
interface Wallet {
  id: string;
  balance: string | number;
  currency: string;
  totalEarnings: string | number;
  totalWithdrawn: string | number;
}
interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  sellerResponse?: string | null;
  isHidden?: boolean;
  buyer?: { firstName: string; lastName: string };
}

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'listings', label: 'Listings', icon: Image },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'store', label: 'Store', icon: Store },
  { id: 'reviews', label: 'Reviews', icon: Star },
] as const;

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PAID: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_PROGRESS: 'bg-brand/10 text-brand border-brand/30',
  DELIVERED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  REFUNDED: 'bg-red-500/10 text-red-400 border-red-500/20',
  DISPUTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  // listing statuses
  DRAFT: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  PENDING_APPROVAL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  SUSPENDED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  SOLD: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  EXPIRED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

/* ------------------------------------------------------------------ helpers */
function statusPill(status: string) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${ORDER_STATUS_COLORS[status] || 'bg-gray-500/10 text-gray-300 border-gray-500/20'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
function money(n: string | number, currency = 'USD') {
  // Format an amount that is already in `currency` (not USD) — used for
  // wallet balances and order amounts stored in their native currency.
  const v = typeof n === 'string' ? Number(n) : n;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `${currency} ${v.toFixed(2)}`;
  }
}
function initials(name?: string) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

/* ------------------------------------------------------------------ page */
export default function SellerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt } = useCurrency();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>('overview');
  const [orderTab, setOrderTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [listingTab, setListingTab] = useState<'all' | 'active' | 'pending' | 'history'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const flash = (text: string, ok = true) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3200);
  };

  const [storeCopied, setStoreCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const copyStoreLink = async (path: string) => {
    try {
      const url = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url);
      setStoreCopied(true);
      setTimeout(() => setStoreCopied(false), 2000);
    } catch {}
  };

  const loadAll = useCallback(async () => {
    try {
      const [sRes, oRes, lRes, wRes] = await Promise.all([
        api.get<{ success: boolean; data: Seller }>('/sellers/me'),
        api.get<{ success: boolean; data: SellerOrder[] }>('/orders/seller'),
        api.get<{ success: boolean; data: { listings: SellerListing[] } }>('/listings', { params: { sellerId: user!.id, status: 'ALL', limit: 100 } }),
        api.get<{ success: boolean; data: Wallet }>('/wallet').catch(() => ({ success: false, data: null })),
      ]);
      if (sRes.success) setSeller(sRes.data);
      if (oRes.success) setOrders(oRes.data || []);
      if (lRes.success) setListings(lRes.data?.listings || []);
      if (wRes.success) setWallet(wRes.data);
      if (sRes.success) {
        api.get<{ success: boolean; data: Review[] }>(`/reviews/seller/${sRes.data.id}`)
          .then(r => r.success && setReviews(r.data || []))
          .catch(() => {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadAll();
  }, [user, authLoading, router, loadAll]);

  const markDelivered = async (id: string) => {
    if (!confirm('Mark this order as delivered? The buyer will be asked to confirm receipt.')) return;
    setBusyId(id);
    try {
      const res = await api.patch<{ success: boolean }>(`/orders/${id}/mark-delivered`, { deliveryData: { deliveredAt: new Date().toISOString() } });
      if (res.success) {
        flash('Order marked as delivered');
        loadAll();
      }
    } catch (e: any) {
      flash(e?.message || 'Failed to mark delivered', false);
    } finally {
      setBusyId(null);
    }
  };

  const acceptOrder = async (id: string) => {
    setBusyId(id);
    try {
      const res = await api.patch<{ success: boolean }>(`/orders/${id}/accept`);
      if (res.success) {
        flash('Order accepted — 1-hour delivery timer started');
        loadAll();
      }
    } catch (e: any) {
      flash(e?.message || 'Failed to accept order', false);
    } finally {
      setBusyId(null);
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) return;
    setBusyId(id);
    try {
      await api.delete(`/listings/${id}`);
      flash('Listing deleted');
      setListings(l => l.filter(x => x.id !== id));
    } catch (e: any) {
      flash(e?.message || 'Failed to delete', false);
    } finally {
      setBusyId(null);
    }
  };

  /* analytics */
  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(k, (map.get(k) || 0) + Number(o.totalAmount));
    });
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString('default', { month: 'short' }), value: map.get(`${d.getFullYear()}-${d.getMonth()}`) || 0 });
    }
    return months;
  }, [orders]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    orders.forEach(o => (c[o.status] = (c[o.status] || 0) + 1));
    return c;
  }, [orders]);

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + Number(o.totalAmount), 0), [orders]);
  const maxBar = Math.max(...revenueByMonth.map(m => m.value), 1);

  /* live, derived views from the seller's connected data */
  const PENDING_ORDER_STATUSES = ['PENDING', 'PAID', 'IN_PROGRESS', 'DELIVERED'];
  const pendingOrders = orders.filter(o => PENDING_ORDER_STATUSES.includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const visibleOrders =
    orderTab === 'pending' ? pendingOrders :
    orderTab === 'completed' ? completedOrders :
    orders;

  const activeListings = listings.filter(l => l.status === 'ACTIVE');
  const pendingListings = listings.filter(l => l.status === 'PENDING_APPROVAL' || l.status === 'DRAFT');
  const historyListings = listings.filter(l => !['ACTIVE', 'PENDING_APPROVAL', 'DRAFT'].includes(l.status));
  const visibleListings =
    listingTab === 'active' ? activeListings :
    listingTab === 'pending' ? pendingListings :
    listingTab === 'history' ? historyListings :
    listings;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tierColor =
    seller?.subscriptionTier === 'PREMIUM' ? 'text-yellow-400' :
    seller?.subscriptionTier === 'PRO' ? 'text-purple-400' :
    seller?.subscriptionTier === 'BASIC' ? 'text-blue-400' : 'text-gray-400';

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-4">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {SECTIONS.map(s => {
            const badge =
              s.id === 'orders' && pendingOrders.length ? pendingOrders.length :
              s.id === 'listings' && pendingListings.length ? pendingListings.length : 0;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                  section === s.id ? 'bg-brand text-white' : 'bg-cardBg border border-borderBg text-gray-400 hover:text-white'
                }`}
              >
                <s.icon className="w-4 h-4" /> {s.label}
                {badge > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black">{badge}</span>
                )}
              </button>
            );
          })}
        </div>
        <Link href="/sell" className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-brand/20 text-sm">
          <PlusCircle className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${toast.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {toast.text}
        </div>
      )}

      {/* ── Urgent action banner (shown across all sections) ── */}
      {(() => {
        const needAccept = orders.filter(o => o.status === 'PAID' && !(o as any).acceptedAt);
        const needDeliver = orders.filter(o => o.status === 'PAID' && (o as any).acceptedAt);
        if (!needAccept.length && !needDeliver.length) return null;
        return (
          <div className="mb-4 bg-yellow-950/30 border border-yellow-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-yellow-200 text-sm">
                {needAccept.length > 0 && `${needAccept.length} order${needAccept.length > 1 ? 's' : ''} need${needAccept.length === 1 ? 's' : ''} accepting`}
                {needAccept.length > 0 && needDeliver.length > 0 && ' · '}
                {needDeliver.length > 0 && `${needDeliver.length} order${needDeliver.length > 1 ? 's' : ''} pending delivery`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Buyers are waiting. Accept and deliver to keep your response rate high.</p>
            </div>
            <button onClick={() => setSection('orders')} className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition">
              View Orders →
            </button>
          </div>
        );
      })()}

      {/* ============================== OVERVIEW ============================== */}
      {section === 'overview' && (
        <div className="space-y-5">
          {/* hero */}
          <div className="relative overflow-hidden rounded-3xl border border-borderBg bg-gradient-to-br from-brand/20 via-cardBg to-purple-900/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                {initials(seller?.storeName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-white truncate">{seller?.storeName}</h1>
                  {seller?.isVerified && <VerifiedBadge size="md" />}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${tierColor} border-current/30 bg-white/5`}>{seller?.subscriptionTier} Tier</span>
                </div>
                <p className="text-gray-300 text-sm mt-1 line-clamp-1">{seller?.storeDescription || 'No store description yet.'}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/seller/${seller?.id}`} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition">
                  <Eye className="w-4 h-4" /> View Store
                </Link>
                <Link href="/seller/gigs" className="hidden sm:flex items-center gap-1.5 bg-purple-600/80 hover:bg-purple-600 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition">
                  <TrendingUp className="w-4 h-4" /> Gigs
                </Link>
              </div>
            </div>
          </div>

          {/* Seller Pro status / CTA */}
          {(() => {
            const isPro = seller?.subscriptionTier === 'PRO' || seller?.subscriptionTier === 'PREMIUM';
            const storePath = seller?.storeSlug ? `/store/${seller.storeSlug}` : null;
            if (isPro) {
              return (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm flex items-center gap-2">
                      Your Seller Pro store is live
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/30">Seller Pro</span>
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                      {storePath ? `Shareable link: ${origin}${storePath}` : 'Your public store link is active.'}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {storePath && (
                      <button onClick={() => copyStoreLink(storePath)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2 rounded-xl text-sm font-bold text-white transition">
                        {storeCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {storeCopied ? 'Copied' : 'Copy link'}
                      </button>
                    )}
                    <Link href="/seller/pro" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-semibold text-white transition">
                      Manage
                    </Link>
                  </div>
                </div>
              );
            }
            return (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-borderBg bg-cardBg p-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">Unlock your shareable Seller Pro store</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {seller?.isVerified
                      ? 'Subscribe to Seller Pro to get a public store link, lower 5% fees and featured listings.'
                      : 'Verify your identity, then subscribe to Seller Pro to launch your public storefront.'}
                  </p>
                </div>
                <Link href="/seller/pro" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition">
                  {seller?.isVerified ? 'Go Seller Pro' : 'Verify & Upgrade'}
                </Link>
              </div>
            );
          })()}

          {/* Seller Level Progress */}
          {seller && (
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5">
              <SellerLevelProgress
                level={seller.sellerLevel || 'BRONZE'}
                totalSales={seller.totalSales || 0}
                averageRating={seller.averageRating || 0}
              />
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center bg-background rounded-xl p-2.5">
                  <p className="text-sm font-black text-white">{Math.round(seller.deliverySuccessRate ?? 100)}%</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Delivery Rate</p>
                </div>
                <div className="text-center bg-background rounded-xl p-2.5">
                  <p className="text-sm font-black text-white">
                    {seller.avgResponseTimeHours && seller.avgResponseTimeHours > 0
                      ? seller.avgResponseTimeHours < 1 ? `${Math.round(seller.avgResponseTimeHours * 60)}m` : `${seller.avgResponseTimeHours.toFixed(1)}h`
                      : seller.responseTime ? `${seller.responseTime}m` : '< 1h'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Avg Response</p>
                </div>
                <div className="text-center bg-background rounded-xl p-2.5">
                  <p className="text-sm font-black text-white">{Math.round((seller.responseRate || 0) * 100)}%</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Response Rate</p>
                </div>
              </div>
            </div>
          )}

          {/* stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard title="Revenue" value={fmt(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} hint={`${orders.length} orders`} />
            <StatCard title="Pending Orders" value={pendingOrders.length} icon={<Clock className="w-5 h-5" />} hint="Awaiting action" />
            <StatCard title="Completed Orders" value={completedOrders.length} icon={<CheckCircle className="w-5 h-5" />} hint={`${seller?.totalSales || 0} lifetime`} />
            <StatCard title="Active Listings" value={activeListings.length} icon={<Image className="w-5 h-5" />} hint={`${listings.length} total`} />
            <StatCard title="Pending Listings" value={pendingListings.length} icon={<Clock className="w-5 h-5" />} hint="Awaiting approval" />
            <StatCard title="Rating" value={(seller?.averageRating || 0).toFixed(1)} icon={<Star className="w-5 h-5" />} hint={`${reviews.length} reviews`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* revenue chart */}
            <div className="lg:col-span-2 bg-cardBg border border-borderBg rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-brand" /> Revenue (last 6 months)</h2>
                <span className="text-xs text-gray-500">{fmt(totalRevenue)} total</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-44">
                {revenueByMonth.map(m => (
                  <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[10px] text-gray-400 mb-1">{m.value > 0 ? `$${Math.round(m.value)}` : ''}</span>
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-brand to-purple-400 transition-all" style={{ height: `${Math.max((m.value / maxBar) * 100, m.value > 0 ? 6 : 2)}%` }} />
                    <span className="text-[10px] text-gray-500 mt-2">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* order status breakdown */}
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5">
              <h2 className="font-bold text-white flex items-center gap-2 mb-4"><ListChecks className="w-5 h-5 text-brand" /> Order Status</h2>
              <div className="space-y-2.5">
                {Object.entries(statusCounts).length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
                {Object.entries(statusCounts).map(([st, count]) => (
                  <div key={st} className="flex items-center justify-between">
                    {statusPill(st)}
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* recent orders preview */}
          <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-borderBg flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-brand" /> Recent Orders</h2>
              <button onClick={() => setSection('orders')} className="text-sm text-brand hover:underline flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="divide-y divide-borderBg/50">
              {orders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">#{o.orderNumber.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 truncate">{o.orderItems?.[0]?.listing?.title || 'Gaming assets'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusPill(o.status)}
                    <span className="text-sm font-bold text-white">{money(o.totalAmount, o.currency)}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-500">No orders yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ============================== ORDERS ============================== */}
      {section === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Order Management</h2>
            <button onClick={loadAll} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /> Refresh</button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <TabBtn active={orderTab === 'all'} onClick={() => setOrderTab('all')} label="All" count={orders.length} />
            <TabBtn active={orderTab === 'pending'} onClick={() => setOrderTab('pending')} label="Pending" count={pendingOrders.length} />
            <TabBtn active={orderTab === 'completed'} onClick={() => setOrderTab('completed')} label="Completed" count={completedOrders.length} />
          </div>

          {orders.length === 0 ? (
            <Empty icon={Package} title="No orders yet" sub="Sales will appear here once buyers purchase your listings." />
          ) : visibleOrders.length === 0 ? (
            <Empty icon={Package} title={`No ${orderTab} orders`} sub="Try a different filter." />
          ) : (
            <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-hoverBg/30 text-xs uppercase font-semibold text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Buyer</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderBg/50">
                    {visibleOrders.map(o => {
                      const item = o.orderItems?.[0];
                      const buyer = [o.buyer?.firstName, o.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer';
                      const oAny = o as any;
                      const needsAccept = o.status === 'PAID' && !oAny.acceptedAt;
                      const needsDeliver = o.status === 'PAID' && oAny.acceptedAt;
                      const deadline = oAny.sellerDeliverDeadline ? new Date(oAny.sellerDeliverDeadline).getTime() : null;
                      const remaining = deadline ? deadline - now : null;
                      const isUrgent = remaining != null && remaining < 600_000;
                      const formatMs = (ms: number) => {
                        if (ms <= 0) return 'Overdue';
                        const h = Math.floor(ms / 3600000);
                        const m = Math.floor((ms % 3600000) / 60000);
                        const s = Math.floor((ms % 60000) / 1000);
                        const p = (n: number) => String(n).padStart(2, '0');
                        return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
                      };
                      return (
                        <tr key={o.id} className={`hover:bg-hoverBg/20 ${(needsAccept || isUrgent) ? 'bg-yellow-950/10' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">#{o.orderNumber.slice(-8).toUpperCase()}</div>
                            <div className="text-xs text-gray-500">{money(o.totalAmount, o.currency)} · {new Date(o.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{buyer}</td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <div className="font-semibold text-white truncate" title={item?.listing?.title}>{item?.listing?.title || 'Gaming Assets'}</div>
                            <div className="text-xs text-brand">{item?.listing?.gameName}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {statusPill(o.status)}
                            {needsDeliver && remaining != null && (
                              <div className={`text-[10px] font-mono font-bold mt-1 ${isUrgent ? 'text-red-400' : 'text-yellow-400'}`}>
                                ⏱ {formatMs(remaining)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <Link href={`/messages?buyerId=${o.buyer?.id}&sellerId=${user?.id}`} className="text-brand hover:underline text-xs flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Chat</Link>
                              {needsAccept && (
                                <button onClick={() => acceptOrder(o.id)} disabled={busyId === o.id}
                                  className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition">
                                  <CheckCircle className="w-3.5 h-3.5" /> {busyId === o.id ? '...' : 'Accept'}
                                </button>
                              )}
                              {needsDeliver && (
                                <button onClick={() => markDelivered(o.id)} disabled={busyId === o.id}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition">
                                  <Truck className="w-3.5 h-3.5" /> {busyId === o.id ? '...' : 'Deliver'}
                                </button>
                              )}
                              <Link href={`/orders/${o.id}`} className="text-gray-400 hover:text-white text-xs">View</Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================== LISTINGS ============================== */}
      {section === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Your Listings</h2>
            <Link href="/sell" className="flex items-center gap-1.5 bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-xl text-sm font-bold text-white"><PlusCircle className="w-4 h-4" /> New</Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <TabBtn active={listingTab === 'all'} onClick={() => setListingTab('all')} label="All" count={listings.length} />
            <TabBtn active={listingTab === 'active'} onClick={() => setListingTab('active')} label="Active" count={activeListings.length} />
            <TabBtn active={listingTab === 'pending'} onClick={() => setListingTab('pending')} label="Pending" count={pendingListings.length} />
            <TabBtn active={listingTab === 'history'} onClick={() => setListingTab('history')} label="History" count={historyListings.length} />
          </div>

          {listings.length === 0 ? (
            <Empty icon={Image} title="No listings yet" sub="Create your first listing to start selling." />
          ) : visibleListings.length === 0 ? (
            <Empty icon={Image} title={`No ${listingTab} listings`} sub="Try a different filter." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleListings.map(l => (
                <div key={l.id} className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden hover:border-brand/40 transition">
                  <div className="h-32 bg-hoverBg/40 relative">
                    {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-8 h-8 text-gray-600" /></div>}
                    <div className="absolute top-2 right-2">{statusPill(l.status)}</div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-white truncate">{l.title}</p>
                    <p className="text-xs text-gray-500">{l.gameName}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-brand font-black">{fmt(l.price)}</span>
                      <span className="text-xs text-gray-500">{l.viewCount} views · {l.salesCount} sold</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link href={`/listings/${l.id}`} className="flex-1 text-center bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" /> View</Link>
                      <button onClick={() => deleteListing(l.id)} disabled={busyId === l.id} className="text-red-400 hover:bg-red-500/10 text-xs font-semibold py-2 px-3 rounded-lg disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================== PAYOUTS ============================== */}
      {section === 'payouts' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-white">Payouts & Wallet</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold">Available Balance</p>
              <p className="text-3xl font-black text-white mt-1">{wallet ? fmt(wallet.balance) : '—'}</p>
              <p className="text-xs text-gray-500 mt-2">Total earned: {wallet ? fmt(wallet.totalEarnings) : '—'}</p>
              <p className="text-xs text-gray-500">Total withdrawn: {wallet ? fmt(wallet.totalWithdrawn) : '—'}</p>
            </div>
            <div className="md:col-span-2 bg-cardBg border border-borderBg rounded-2xl p-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3"><Banknote className="w-5 h-5 text-brand" /> Request a Payout</h3>
              <PayoutForm
                balance={wallet ? Number(wallet.balance) : 0}
                currency={wallet?.currency || 'USD'}
                onDone={(msg, ok) => { flash(msg, ok); loadAll(); }}
              />
            </div>
          </div>
          <div className="bg-cardBg border border-borderBg rounded-2xl p-5">
            <h3 className="font-bold text-white flex items-center gap-2 mb-2"><CreditCard className="w-5 h-5 text-brand" /> Payout Methods</h3>
            <p className="text-sm text-gray-400 mb-3">Manage how you get paid and your KYC verification status.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/seller/settings" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition"><CreditCard className="w-4 h-4 text-brand" /> Payment Settings</Link>
              {seller?.isVerified ? (
                <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2.5 rounded-xl text-sm font-semibold"><ShieldCheck className="w-4 h-4" /> KYC Verified</span>
              ) : (
                <Link href="/seller/kyc" className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-yellow-500/20 transition"><ShieldCheck className="w-4 h-4" /> Complete KYC to unlock payouts</Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================== STORE ============================== */}
      {section === 'store' && seller && (
        <StoreSettings seller={seller} onSaved={(s) => setSeller(s)} onToast={flash} origin={origin} />
      )}

      {/* ============================== REVIEWS ============================== */}
      {section === 'reviews' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-white">Reviews & Ratings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5 text-center">
              <p className="text-5xl font-black text-white">{(seller?.averageRating || 0).toFixed(1)}</p>
              <div className="flex justify-center gap-0.5 my-2">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(seller?.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}
              </div>
              <p className="text-xs text-gray-500">{reviews.length} reviews</p>
            </div>
            <div className="md:col-span-2 bg-cardBg border border-borderBg rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3">Rating Breakdown</h3>
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => r.rating === star).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-gray-400 w-3">{star}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-hoverBg rounded-full overflow-hidden"><div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} /></div>
                    <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-3">
            {reviews.length === 0 && <Empty icon={Star} title="No reviews yet" />}
            {reviews.map(r => (
              <div key={r.id} className="bg-cardBg border border-borderBg rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-xs font-black text-white">{initials(r.buyer ? `${r.buyer.firstName} ${r.buyer.lastName}` : 'B')}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{r.buyer ? `${r.buyer.firstName} ${r.buyer.lastName}` : 'Buyer'}</p>
                      <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-300 mt-2">{r.comment}</p>
                {r.sellerResponse ? (
                  <p className="text-sm text-brand mt-2 pl-3 border-l-2 border-brand/40">“{r.sellerResponse}”</p>
                ) : (
                  <RespondBox reviewId={r.id} onDone={(msg, ok) => { flash(msg, ok); loadAll(); }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ sub components */
function StatCard({ title, value, icon, hint }: { title: string; value: string | number; icon: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-cardBg border border-borderBg rounded-2xl p-4 hover:border-brand/30 transition">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase font-semibold">{title}</p>
        <span className="p-1.5 bg-brand/10 rounded-lg text-brand">{icon}</span>
      </div>
      <p className="text-2xl font-black text-white mt-2">{value}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function Empty({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="text-center py-16 bg-cardBg border border-borderBg rounded-2xl">
      <Icon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
      <p className="text-white font-bold">{title}</p>
      {sub && <p className="text-gray-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}

function TabBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
        active ? 'bg-brand text-white' : 'bg-cardBg border border-borderBg text-gray-400 hover:text-white'
      }`}
    >
      {label}
      <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black ${active ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'}`}>{count}</span>
    </button>
  );
}

function PayoutForm({ balance, currency, onDone }: { balance: number; currency: string; onDone: (msg: string, ok: boolean) => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [destination, setDestination] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return onDone('Enter a valid amount', false);
    if (amt > balance) return onDone('Amount exceeds available balance', false);
    setBusy(true);
    try {
      await api.post('/wallet/withdraw', { amount: amt, method, destination });
      onDone(`Payout of ${money(amt, currency)} requested`, true);
      setAmount(''); setDestination('');
    } catch (e: any) {
      onDone(e?.message || 'Payout failed', false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400">Amount ({currency})</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)} className="mt-1 w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
            <option value="bank">Bank Transfer</option>
            <option value="crypto">Crypto</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400">Destination (account / wallet address)</label>
        <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. IBAN or wallet address" className="mt-1 w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Available: {money(balance, currency)}</span>
        <button type="submit" disabled={busy} className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Request Payout
        </button>
      </div>
    </form>
  );
}

function RespondBox({ reviewId, onDone }: { reviewId: string; onDone: (msg: string, ok: boolean) => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.patch(`/reviews/${reviewId}/respond`, { response: text });
      onDone('Response published', true);
    } catch (e: any) {
      onDone(e?.message || 'Failed to respond', false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-2 flex gap-2">
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a public response..." className="flex-1 bg-background border border-borderBg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" />
      <button onClick={submit} disabled={busy} className="flex items-center gap-1 bg-brand hover:bg-brand-dark px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"><Send className="w-3.5 h-3.5" /> Reply</button>
    </div>
  );
}

function StoreSettings({ seller, onSaved, onToast, origin }: { seller: Seller; onSaved: (s: Seller) => void; onToast: (m: string, ok?: boolean) => void; origin: string }) {
  const [storeName, setStoreName] = useState(seller.storeName);
  const [storeDescription, setStoreDescription] = useState(seller.storeDescription || '');
  const [responseTime, setResponseTime] = useState(seller.responseTime || 24);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.patch<{ success: boolean; data: Seller }>('/sellers/settings', { storeName, storeDescription, responseTime });
      if (res.success) {
        onSaved(res.data);
        onToast('Store settings saved');
      }
    } catch (e: any) {
      onToast(e?.message || 'Failed to save', false);
    } finally {
      setBusy(false);
    }
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const storePath = seller.storeSlug ? `/store/${seller.storeSlug}` : `/store/${seller.id}`;
  const isPro = seller.subscriptionTier === 'PRO' || seller.subscriptionTier === 'PREMIUM';
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${origin}${storePath}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {}
  };
  const shareLink = async () => {
    const url = `${origin}${storePath}`;
    try {
      if (navigator.share) await navigator.share({ title: storeName, url });
      else await copyLink();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-white">Store Management</h2>

      {/* Shareable store link */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-5 max-w-2xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white flex items-center gap-2"><Store className="w-4 h-4 text-brand" /> Your store link</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isPro && seller.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
            {isPro && seller.isVerified ? 'Live' : 'Locked'}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-background border border-borderBg rounded-xl px-3 py-2.5">
          <span className="text-xs text-gray-400 truncate flex-1">{origin}{storePath}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-xl text-sm font-bold text-white transition">
            {linkCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {linkCopied ? 'Copied' : 'Copy link'}
          </button>
          <button onClick={shareLink} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition">
            <Share2 className="w-4 h-4" /> Share
          </button>
          {isPro && seller.isVerified && (
            <Link href={storePath} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition">
              <ExternalLink className="w-4 h-4" /> Preview
            </Link>
          )}
        </div>
        {!(isPro && seller.isVerified) && (
          <p className="text-xs text-gray-500">
            Only verified sellers subscribed to <span className="text-brand font-semibold">Seller Pro</span> get a live, shareable store.{' '}
            <Link href="/seller/pro" className="text-brand hover:underline">Upgrade now</Link>.
          </p>
        )}
      </div>

      <form onSubmit={save} className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-2xl font-black text-white">{initials(storeName)}</div>
          <div>
            <p className="text-sm text-gray-400">Store Name</p>
            <p className="text-lg font-bold text-white">{storeName}</p>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-semibold">Store Name</label>
          <input value={storeName} onChange={e => setStoreName(e.target.value)} className="mt-1 w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-semibold">Description</label>
          <textarea value={storeDescription} onChange={e => setStoreDescription(e.target.value)} rows={4} className="mt-1 w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-semibold">Avg Response Time</label>
          <select value={responseTime} onChange={e => setResponseTime(Number(e.target.value))} className="mt-1 w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand">
            {[1, 2, 4, 8, 12, 24].map(h => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <button type="submit" disabled={busy} className="flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save Changes
        </button>
      </form>
    </div>
  );
}
