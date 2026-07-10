'use client';

/**
 * ActiveOrderBanner
 * Shows a sticky dismissible banner to remind the logged-in user about their
 * in-flight orders that need action.
 *
 * – Buyer:  PENDING (need to pay) or IN_PROGRESS (need to confirm receipt)
 * – Seller: PAID (need to accept/deliver) — most urgent when they're offline
 *
 * The banner is shown at most once per browser session per order to avoid
 * fatigue. It links directly to the order tracking page.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Clock, Package, X, ShieldCheck, Truck, AlertTriangle } from 'lucide-react';

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string | number;
  buyerId: string;
  seller?: { userId: string; storeName: string };
  buyer?: { id: string };
  sellerDeliverDeadline?: string | null;
  buyerConfirmDeadline?: string | null;
  orderItems?: Array<{ listing?: { title: string } }>;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Overdue';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export default function ActiveOrderBanner() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const [buyerRes, sellerRes] = await Promise.allSettled([
        api.get<{ success: boolean; data: ActiveOrder[] }>('/orders/me'),
        api.get<{ success: boolean; data: ActiveOrder[] }>('/orders/seller'),
      ]);
      const buyerOrders: ActiveOrder[] = buyerRes.status === 'fulfilled' && buyerRes.value.success
        ? (buyerRes.value.data || [])
        : [];
      const sellerOrders: ActiveOrder[] = sellerRes.status === 'fulfilled' && sellerRes.value.success
        ? (sellerRes.value.data || [])
        : [];

      // Merge, deduplicate and filter to only actionable statuses
      const seen = new Set<string>();
      const actionable: ActiveOrder[] = [];
      for (const o of [...buyerOrders, ...sellerOrders]) {
        if (seen.has(o.id)) continue;
        seen.add(o.id);
        const isBuyer = o.buyerId === user.id;
        const isSeller = o.seller?.userId === user.id;
        if (isBuyer && (o.status === 'PENDING' || o.status === 'IN_PROGRESS')) actionable.push(o);
        if (isSeller && (o.status === 'PAID')) actionable.push(o);
      }
      setOrders(actionable);
    } catch {
      /* silent */
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 60_000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchOrders]);

  const visible = orders.filter(o => !dismissed.has(o.id));
  if (!visible.length || !user) return null;

  // Show only the most urgent one at a time
  const order = visible[0];
  const isBuyer = order.buyerId === user.id;
  const isSeller = order.seller?.userId === user.id;
  const product = order.orderItems?.[0]?.listing?.title || `Order #${order.orderNumber.slice(-8).toUpperCase()}`;

  let color = 'bg-yellow-950/80 border-yellow-500/40 text-yellow-200';
  let Icon = Clock;
  let message = '';
  let urgency = '';

  if (isBuyer && order.status === 'PENDING') {
    color = 'bg-brand/15 border-brand/40 text-white';
    Icon = Package;
    message = `Complete payment for "${product}"`;
    urgency = 'Payment pending';
  } else if (isBuyer && order.status === 'IN_PROGRESS') {
    const deadline = order.buyerConfirmDeadline ? new Date(order.buyerConfirmDeadline).getTime() : null;
    const remaining = deadline ? deadline - now : null;
    color = remaining != null && remaining < 600_000
      ? 'bg-red-950/80 border-red-500/40 text-red-200'
      : 'bg-brand/15 border-brand/40 text-white';
    Icon = ShieldCheck;
    message = `Confirm receipt of "${product}"`;
    urgency = remaining != null ? formatCountdown(remaining) : 'Action needed';
  } else if (isSeller && order.status === 'PAID') {
    const deadline = order.sellerDeliverDeadline ? new Date(order.sellerDeliverDeadline).getTime() : null;
    const remaining = deadline ? deadline - now : null;
    color = remaining != null && remaining < 600_000
      ? 'bg-red-950/80 border-red-500/40 text-red-200'
      : 'bg-yellow-950/80 border-yellow-500/40 text-yellow-200';
    Icon = Truck;
    message = `Deliver "${product}" to buyer`;
    urgency = remaining != null ? formatCountdown(remaining) : 'Delivery needed';
  }

  return (
    <div className={`${color} border-b px-4 py-2.5 flex items-center gap-3 text-sm backdrop-blur-sm`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <span className="font-semibold truncate">{message}</span>
        <span className="text-xs opacity-70 font-medium flex-shrink-0">{urgency}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {visible.length > 1 && (
          <span className="text-xs opacity-60 hidden sm:inline">{visible.length} active orders</span>
        )}
        <Link
          href={`/orders/${order.id}`}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap"
        >
          View Order →
        </Link>
        <button
          onClick={() => setDismissed(prev => new Set([...prev, order.id]))}
          className="p-1 opacity-60 hover:opacity-100 transition rounded"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
