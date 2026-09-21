'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import Link from 'next/link';
import {
  AlertTriangle, Clock, CheckCircle, ShieldCheck, Package,
  ExternalLink, Search, ChevronRight, ShoppingBag, DollarSign,
} from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

interface Order {
  id: string; orderNumber: string; totalAmount: string; status: string;
  createdAt: string; buyerId: string;
  deliveredAt?: string; acceptedAt?: string;
  sellerDeliverDeadline?: string; buyerConfirmDeadline?: string;
  seller?: { userId: string; storeName: string; isVerified?: boolean; sellerLevel?: string };
  orderItems: Array<{ listing?: { title: string; gameName: string; images?: string[] } | null; metadata?: any }>;
}

const STATUS: Record<string, { label: string; cls: string; icon: any; action?: string; urgent?: boolean }> = {
  PENDING:     { label: 'Awaiting Payment',   cls: 'badge-warning',   icon: Clock,        action: 'Pay Now', urgent: true },
  PAID:        { label: 'Funds in Escrow',    cls: 'badge-info',      icon: ShieldCheck,  action: 'View' },
  IN_PROGRESS: { label: 'Confirm Receipt',    cls: 'badge-gold',      icon: AlertTriangle, action: 'Confirm', urgent: true },
  COMPLETED:   { label: 'Completed',          cls: 'badge-success',   icon: CheckCircle },
  DISPUTED:    { label: 'In Dispute',         cls: 'badge',           icon: AlertTriangle, action: 'View' },
  CANCELLED:   { label: 'Cancelled',          cls: 'badge-neutral',   icon: Package },
  REFUNDED:    { label: 'Refunded',           cls: 'badge-neutral',   icon: Package },
};

function fmtCountdown(deadline?: string) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

function OrderSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-4 flex gap-4">
          <div className="w-12 h-12 skeleton rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 skeleton rounded w-1/3" />
            <div className="h-4 skeleton rounded w-2/3" />
            <div className="h-3 skeleton rounded w-1/4" />
          </div>
          <div className="w-24 space-y-2">
            <div className="h-5 skeleton rounded" />
            <div className="h-8 skeleton rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'all'>('active');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    api.get<{ success: boolean; data: Order[] }>('/orders/me')
      .then(res => { if (res.success) setOrders(Array.isArray(res.data) ? res.data : []); })
      .catch(console.error).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const active = orders.filter(o => !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.status));
  const needsAction = orders.filter(o => ['PENDING', 'IN_PROGRESS'].includes(o.status));

  const filtered = (tab === 'active' ? active : orders).filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.seller?.storeName?.toLowerCase().includes(q) ||
      o.orderItems[0]?.listing?.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 fade-in pb-24 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand" /> My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track deliveries, release escrow, and view receipts.</p>
        </div>
        {needsAction.length > 0 && (
          <div className="flex items-center gap-2 bg-[var(--warning-bg)] border border-amber-500/25 px-4 py-2.5 rounded-xl text-amber-300 text-sm font-bold">
            <AlertTriangle className="w-4 h-4" />
            {needsAction.length} order{needsAction.length > 1 ? 's need' : ' needs'} action
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-bg)]">
        {[
          { id: 'active', label: 'Active', count: active.length },
          { id: 'all', label: 'All Orders', count: orders.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition mr-4 ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-white'
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.id ? 'bg-brand/15 text-brand' : 'bg-[var(--surface-2)] text-gray-500'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..." className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select min-w-[150px]">
          <option value="">All Statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Orders list */}
      {loading ? <OrderSkeleton /> : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border-bg)] rounded-2xl text-center">
          <Package className="w-12 h-12 text-gray-700 mb-4" />
          <p className="text-gray-400 font-semibold mb-2">{search ? 'No results found' : tab === 'active' ? 'No active orders' : "No orders yet"}</p>
          {!search && (
            <Link href="/listings" className="btn-primary rounded-xl mt-3">Browse Marketplace</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const meta = STATUS[order.status] || STATUS.CANCELLED;
            const Icon = meta.icon;
            const item = order.orderItems?.[0];
            const title = item?.listing?.title || 'Gaming Assets';
            const gameName = item?.listing?.gameName || '';
            const img = item?.listing?.images?.[0];
            const needsUserAction = meta.urgent && order.buyerId === user?.id;
            const deadline = order.status === 'IN_PROGRESS' ? order.buyerConfirmDeadline
              : order.status === 'PAID' ? order.sellerDeliverDeadline : undefined;
            const countdown = deadline ? fmtCountdown(deadline) : null;
            const isUrgent = deadline ? (new Date(deadline).getTime() - now) < 600_000 : false;

            return (
              <div key={order.id}
                className={`bg-[var(--card-bg)] border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition hover:border-brand/20 ${
                  needsUserAction ? 'border-brand/35 shadow-sm shadow-brand/10' : 'border-[var(--border-bg)]'
                }`}>
                {/* Image / icon */}
                <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ${
                  needsUserAction ? 'bg-brand/15' : 'bg-[var(--surface)] border border-[var(--border-bg)]'
                }`}>
                  {img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={img} alt={title} className="w-full h-full object-cover" />
                    : <Icon className={`w-5 h-5 ${needsUserAction ? 'text-brand' : 'text-gray-600'}`} />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-black text-xs">#{order.orderNumber.slice(-8).toUpperCase()}</span>
                    <span className="text-[11px] text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                    {countdown && (
                      <span className={`font-mono text-xs font-black ${isUrgent ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                        ⏱ {countdown}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">{title}</p>
                  {gameName && <p className="text-xs text-brand font-semibold">{gameName}</p>}
                  {order.seller?.storeName && <p className="text-xs text-gray-500 mt-0.5">Seller: {order.seller.storeName}</p>}
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t border-[var(--border-bg)] sm:border-0 pt-3 sm:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500">Amount</p>
                    <p className="text-base font-black text-white">{fmt(order.totalAmount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${meta.cls} text-xs`}>{meta.label}</span>
                    <Link href={`/orders/${order.id}`}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        needsUserAction
                          ? 'bg-brand hover:bg-brand-light text-black shadow-md shadow-brand/20'
                          : 'bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20'
                      }`}>
                      {meta.action || 'Track'} <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
