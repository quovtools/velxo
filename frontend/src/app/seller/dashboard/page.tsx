'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import Link from 'next/link';
import VerifiedBadge from '@/components/VerifiedBadge';
import {
  LayoutDashboard, Package, DollarSign, Store, Star, TrendingUp, Wallet, MessageSquare,
  CreditCard, PlusCircle, CheckCircle, X, Menu, Eye, Truck, Trash2, Edit3, Loader2,
  ShieldCheck, Award, ArrowUpRight, Calendar, Filter, Image, Clock, Send, Banknote,
  ChevronRight, RefreshCw, AlertCircle, ListChecks, BarChart3,
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
  verifiedAt?: string;
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
  const v = typeof n === 'string' ? Number(n) : n;
  return `${currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function initials(name?: string) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

/* ------------------------------------------------------------------ page */
export default function SellerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>('overview');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const flash = (text: string, ok = true) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAll = useCallback(async () => {
    try {
      const [sRes, oRes, lRes, wRes] = await Promise.all([
        api.get<{ success: boolean; data: Seller }>('/sellers/me'),
        api.get<{ success: boolean; data: SellerOrder[] }>('/orders/seller'),
        api.get<{ success: boolean; data: { listings: SellerListing[] } }>('/listings?sellerId=' + user!.id),
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
  const completedSales = orders.filter(o => o.status === 'COMPLETED').length;
  const maxBar = Math.max(...revenueByMonth.map(m => m.value), 1);

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
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                section === s.id ? 'bg-brand text-white' : 'bg-cardBg border border-borderBg text-gray-400 hover:text-white'
              }`}
            >
              <s.icon className="w-4 h-4" /> {s.label}
            </button>
          ))}
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

          {/* stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="Revenue" value={money(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} hint={`${orders.length} orders`} />
            <StatCard title="Sales" value={completedSales} icon={<Package className="w-5 h-5" />} hint={`${seller?.totalSales || 0} lifetime`} />
            <StatCard title="Rating" value={(seller?.averageRating || 0).toFixed(1)} icon={<Star className="w-5 h-5" />} hint={`${reviews.length} reviews`} />
            <StatCard title="Active Listings" value={listings.filter(l => l.status === 'ACTIVE').length} icon={<Image className="w-5 h-5" />} hint={`${listings.length} total`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* revenue chart */}
            <div className="lg:col-span-2 bg-cardBg border border-borderBg rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-brand" /> Revenue (last 6 months)</h2>
                <span className="text-xs text-gray-500">{money(totalRevenue)} total</span>
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
          {orders.length === 0 ? (
            <Empty icon={Package} title="No orders yet" sub="Sales will appear here once buyers purchase your listings." />
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
                    {orders.map(o => {
                      const item = o.orderItems?.[0];
                      const buyer = [o.buyer?.firstName, o.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer';
                      return (
                        <tr key={o.id} className="hover:bg-hoverBg/20">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">#{o.orderNumber.slice(-8).toUpperCase()}</div>
                            <div className="text-xs text-gray-500">{money(o.totalAmount, o.currency)} · {new Date(o.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{buyer}</td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <div className="font-semibold text-white truncate" title={item?.listing?.title}>{item?.listing?.title || 'Gaming Assets'}</div>
                            <div className="text-xs text-brand">{item?.listing?.gameName}</div>
                          </td>
                          <td className="px-4 py-3 text-center">{statusPill(o.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <Link href={`/messages?buyerId=${o.buyer?.id}&sellerId=${user?.id}`} className="text-brand hover:underline text-xs flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Chat</Link>
                              {o.status === 'PAID' && (
                                <button onClick={() => markDelivered(o.id)} disabled={busyId === o.id} className="text-emerald-400 hover:underline text-xs flex items-center gap-1 disabled:opacity-50">
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
          {listings.length === 0 ? (
            <Empty icon={Image} title="No listings yet" sub="Create your first listing to start selling." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(l => (
                <div key={l.id} className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden hover:border-brand/40 transition">
                  <div className="h-32 bg-hoverBg/40 relative">
                    {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-8 h-8 text-gray-600" /></div>}
                    <div className="absolute top-2 right-2">{statusPill(l.status)}</div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-white truncate">{l.title}</p>
                    <p className="text-xs text-gray-500">{l.gameName}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-brand font-black">{money(l.price, l.currency)}</span>
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
              <p className="text-3xl font-black text-white mt-1">{wallet ? money(wallet.balance, wallet.currency) : '—'}</p>
              <p className="text-xs text-gray-500 mt-2">Total earned: {wallet ? money(wallet.totalEarnings, wallet.currency) : '—'}</p>
              <p className="text-xs text-gray-500">Total withdrawn: {wallet ? money(wallet.totalWithdrawn, wallet.currency) : '—'}</p>
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
        <StoreSettings seller={seller} onSaved={(s) => setSeller(s)} onToast={flash} />
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

function StoreSettings({ seller, onSaved, onToast }: { seller: Seller; onSaved: (s: Seller) => void; onToast: (m: string, ok?: boolean) => void }) {
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-white">Store Management</h2>
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
