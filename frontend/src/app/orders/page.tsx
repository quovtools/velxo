'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import Link from 'next/link';
import { LoadingArea } from '@/components/LoadingLogo';
import {
  AlertTriangle, Clock, CheckCircle, ShieldCheck, Package,
  ExternalLink, Zap, Search, Filter, ChevronDown,
} from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';
import SellerLevelBadge from '@/components/SellerLevelBadge';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  buyerId: string;
  deliveredAt?: string;
  acceptedAt?: string;
  sellerDeliverDeadline?: string;
  buyerConfirmDeadline?: string;
  seller?: { userId: string; storeName: string; isVerified?: boolean; sellerLevel?: string };
  orderItems: Array<{ listing?: { title: string; gameName: string; images?: string[] } | null; metadata?: any }>;
}

const STATUS_META: Record<string, { label: string; badge: string; icon: any; action?: string; urgent?: boolean }> = {
  PENDING:     { label: 'Awaiting Payment',   badge: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/25', icon: Clock,        action: 'Pay Now', urgent: true },
  PAID:        { label: 'Funds in Escrow',    badge: 'bg-blue-950/40 text-blue-400 border-blue-500/25',      icon: ShieldCheck,  action: 'View' },
  IN_PROGRESS: { label: 'Confirm Receipt',    badge: 'bg-brand/10 text-brand-light border-brand/30',         icon: AlertTriangle, action: 'Confirm', urgent: true },
  COMPLETED:   { label: 'Completed',          badge: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/25', icon: CheckCircle },
  DISPUTED:    { label: 'In Dispute',         badge: 'bg-red-950/40 text-red-400 border-red-500/25',         icon: AlertTriangle, action: 'View' },
  CANCELLED:   { label: 'Cancelled',          badge: 'bg-gray-800/60 text-gray-400 border-borderBg',         icon: Package },
  REFUNDED:    { label: 'Refunded',           badge: 'bg-gray-800/60 text-gray-400 border-borderBg',         icon: Package },
};

function fmtCountdown(deadline: string | undefined): string | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    api.get<{ success: boolean; data: Order[] }>('/orders/me')
      .then(res => { if (res.success) setOrders(res.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (loading) return <LoadingArea label="Loading your orders..." />;

  const active = orders.filter(o => !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.status));
  const needsAction = orders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS');

  const filtered = (tab === 'active' ? active : orders).filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.seller?.storeName?.toLowerCase().includes(q) ||
      o.orderItems[0]?.listing?.title?.toLowerCase().includes(q) ||
      o.orderItems[0]?.listing?.gameName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-borderBg">
        <div>
          <h1 className="text-3xl font-black text-white">Your Orders</h1>
          <p className="text-gray-400 mt-1 text-sm">Track deliveries, release escrow, and view receipts.</p>
        </div>
        {needsAction.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-950/30 border border-yellow-500/25 px-4 py-2.5 rounded-xl text-yellow-300 text-sm font-bold">
            <AlertTriangle className="w-4 h-4" />
            {needsAction.length} order{needsAction.length > 1 ? 's need' : ' needs'} action
          </div>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(['active', 'all'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition capitalize ${tab === t ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-cardBg border border-borderBg text-gray-400 hover:text-white'}`}>
              {t === 'active' ? 'Active' : 'All Orders'}
              {t === 'active' && active.length > 0 && <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{active.length}</span>}
              {t === 'all' && orders.length > 0 && <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{orders.length}</span>}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand transition" />
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-3xl">
          <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">{tab === 'active' ? 'No active orders' : search ? 'No results found' : "You haven't placed any orders yet."}</p>
          {!search && tab !== 'active' && (
            <Link href="/search" className="mt-4 inline-block bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold text-white transition shadow-lg shadow-brand/20">
              Browse Marketplace
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const meta = STATUS_META[order.status] || { label: order.status, badge: 'bg-gray-800 text-gray-400 border-borderBg', icon: Package };
            const Icon = meta.icon;
            const item = order.orderItems?.[0];
            const title = item?.listing?.title || (item as any)?.metadata?.title || 'Gaming Assets';
            const gameName = item?.listing?.gameName || '';
            const img = item?.listing?.images?.[0];
            const needsUserAction = (order.status === 'PENDING' && order.buyerId === user?.id) || order.status === 'IN_PROGRESS';

            // Countdown for active timers
            const deadline = order.status === 'IN_PROGRESS' ? order.buyerConfirmDeadline
              : order.status === 'PAID' && order.acceptedAt ? order.sellerDeliverDeadline
              : undefined;
            const countdown = deadline ? fmtCountdown(deadline) : null;
            const countdownMs = deadline ? new Date(deadline).getTime() - now : null;
            const isUrgent = countdownMs !== null && countdownMs < 600_000;

            return (
              <div key={order.id}
                className={`bg-cardBg border rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition ${needsUserAction ? 'border-brand/40 shadow-brand/8 shadow-sm' : 'border-borderBg hover:border-brand/20'}`}>
                {/* Image */}
                <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ${needsUserAction ? 'bg-brand/15' : 'bg-background border border-borderBg'}`}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className={`w-5 h-5 ${needsUserAction ? 'text-brand' : 'text-gray-600'}`} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-black text-sm">#{order.orderNumber.slice(-8).toUpperCase()}</span>
                    <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                    {countdown && (
                      <span className={`font-mono font-black text-xs ${isUrgent ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                        ⏱ {countdown}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-200 mt-0.5 truncate">{title}</p>
                  {gameName && <p className="text-xs text-brand-light font-semibold">{gameName}</p>}
                  {order.seller?.storeName && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-gray-500">Sold by {order.seller.storeName}</p>
                      {order.seller.sellerLevel && order.seller.sellerLevel !== 'BRONZE' && (
                        <SellerLevelBadge level={order.seller.sellerLevel} size="xs" showLabel={false} />
                      )}
                    </div>
                  )}
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between border-t border-borderBg md:border-0 pt-3 md:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-lg font-black text-white">{fmt(order.totalAmount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.badge}`}>{meta.label}</span>
                    <Link href={`/orders/${order.id}`}
                      className={`flex items-center gap-1.5 font-bold px-4 py-2 rounded-xl text-xs transition ${needsUserAction ? 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20' : 'bg-brand/10 hover:bg-brand/20 text-brand-light border border-brand/20'}`}>
                      {meta.action || 'Track'} <ExternalLink className="w-3 h-3" />
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
