'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  orderItems: Array<{
    listing: {
      title: string;
      gameName: string;
    };
  }>;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadOrders() {
      try {
        const response = await api.get<{ success: boolean; data: Order[] }>('/orders/me');
        if (response.success) {
          setOrders(response.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user, authLoading, router]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading order history...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-borderBg pb-6">
        <h1 className="text-3xl font-extrabold text-white">Your Orders</h1>
        <p className="text-gray-400 mt-2">Track deliveries, release escrow funds, and view receipts.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <p className="text-gray-400">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/search"
            className="mt-4 inline-block bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const item = order.orderItems?.[0];
            return (
              <div key={order.id} className="bg-cardBg border border-borderBg rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand/30 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-sm">Order #{order.orderNumber.slice(-8).toUpperCase()}</span>
                    <span className="text-xs text-gray-500 font-semibold">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-200">
                    {item?.listing?.title || 'Gaming Assets Pack'}
                  </h3>
                  <p className="text-xs text-brand-light font-semibold">{item?.listing?.gameName}</p>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between border-t border-borderBg pt-4 md:border-t-0 md:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="text-xl font-black text-white">${Number(order.totalAmount).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      order.status === 'COMPLETED'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                        : order.status === 'DISPUTED'
                        ? 'bg-red-950/40 text-red-400 border border-red-500/20'
                        : 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {order.status}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="bg-brand/10 hover:bg-brand/20 text-brand-light font-bold px-4 py-2 rounded-lg text-xs border border-brand/20 transition"
                    >
                      Track Order
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
