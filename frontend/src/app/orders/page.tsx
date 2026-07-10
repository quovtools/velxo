'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import Link from 'next/link';
import { LoadingArea } from '@/components/LoadingLogo';
import { AlertTriangle, Clock, CheckCircle, ShieldCheck, Package, ExternalLink } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  buyerId: string;
  seller?: { userId: string; storeName: string };
  sellerDeliverDeadline?: string;
  buyerConfirmDeadline?: string;
  orderItems: Array<{ listing: { title: string; gameName: string } }>;
}

const STATUS_META: Record<string, { label: string; badge: string; icon: any; action?: string }> = {
  PENDING:     { label: 'Awaiting Payment',    badge: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20',  icon: Clock,         action: 'Pay Now' },
  PAID:        { label: 'Funds in Escrow',      badge: 'bg-blue-950/40 text-blue-400 border-blue-500/20',        icon: ShieldCheck,   action: 'View' },
  IN_PROGRESS: { label: 'Confirm Receipt',      badge: 'bg-brand/10 text-brand-light border-brand/30',           icon: AlertTriangle, action: 'Confirm Receipt' },
  COMPLETED:   { label: 'Completed',            badge: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  DISPUTED:    { label: 'Disputed',             badge: 'bg-red-950/40 text-red-400 border-red-500/20',           icon: AlertTriangle, action: 'View' },
  CANCELLED:   { label: 'Cancelled',            badge: 'bg-gray-800 text-gray-400 border-borderBg',              icon: Package },
  REFUNDED:    { label: 'Refunded',             badge: 'bg-gray-800 text-gray-400 border-borderBg',              icon: Package },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'all'>('active');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    api.get<{ success: boolean; data: Order[] }>('/orders/me')
      .then(res => { if (res.success) setOrders(res.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (loading) return <LoadingArea label="Loading order history..." />;

  const active = orders.filter(o => !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.status));
  const shown = tab === 'active' ? active : orders;
  const needsAction = orders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      <div className="border-b border-borderBg pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Your Orders</h1>
          <p className="text-gray-400 mt-1 text-sm">Track deliveries, release escrow funds, and view receipts.</p>
        </div>
        {needsAction.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-950/30 border border-yellow-500/30 px-4 py-2.5 rounded-xl text-yellow-300 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {needsAction.length} order{needsAction.length > 1 ? 's need' : ' needs'} action
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'active' ? 'bg-brand text-white' : 'bg-cardBg border border-borderBg text-gray-400 hover:text-white'}`}>
          Active {active.length > 0 && <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{active.length}</span>}
        </button>
        <button onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'all' ? 'bg-brand text-white' : 'bg-cardBg border border-borderBg text-gray-400 hover:text-white'}`}>
          All Orders {orders.length > 0 && <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{orders.length}</span>}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{tab === 'active' ? 'No active orders.' : "You haven't placed any orders yet."}</p>
          <Link href="/search" className="mt-4 inline-block bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white">
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((order) => {
            const meta = STATUS_META[order.status] || { label: order.status, badge: 'bg-gray-800 text-gray-400 border-borderBg', icon: Package };
            const Icon = meta.icon;
            const item = order.orderItems?.[0];
            const needsUserAction = (order.status === 'PENDING' && order.buyerId === user?.id) || order.status === 'IN_PROGRESS';
            return (
              <div key={order.id} className={`bg-cardBg border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${needsUserAction ? 'border-brand/40 shadow-sm shadow-brand/10' : 'border-borderBg hover:border-brand/20'}`}>
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${needsUserAction ? 'bg-brand/15' : 'bg-white/5'}`}>
                    <Icon className={`w-5 h-5 ${needsUserAction ? 'text-brand' : 'text-gray-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-sm">#{order.orderNumber.slice(-8).toUpperCase()}</span>
                      <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-base font-bold text-gray-200 mt-0.5 truncate">{item?.listing?.title || 'Gaming Assets'}</p>
                    <p className="text-xs text-brand-light font-semibold">{item?.listing?.gameName}</p>
                    {order.seller?.storeName && <p className="text-xs text-gray-500 mt-0.5">Sold by {order.seller.storeName}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t border-borderBg pt-4 md:border-t-0 md:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-lg font-black text-white">${Number(order.totalAmount).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <Link href={`/orders/${order.id}`}
                      className={`flex items-center gap-1.5 font-bold px-4 py-2 rounded-lg text-xs transition ${needsUserAction ? 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20' : 'bg-brand/10 hover:bg-brand/20 text-brand-light border border-brand/20'}`}>
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
