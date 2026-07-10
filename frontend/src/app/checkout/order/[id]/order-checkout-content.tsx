'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import LoadingLogo from '@/components/LoadingLogo';
import { ShieldCheck, Zap, Gamepad2, Lock } from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

export default function OrderCheckoutContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt } = useCurrency();

  const [order, setOrder] = useState<any | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [buyerNote, setBuyerNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadOrder() {
      try {
        const response = await api.get<{ data: any }>(`/orders/${orderId}`);
        if (!(response as any).data) throw new Error('Order not found');
        setOrder((response as any).data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoadingOrder(false);
      }
    }
    loadOrder();
  }, [orderId, user, authLoading, router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!order) throw new Error('Order not loaded');

      // The order is already held in escrow. Send the buyer to the track order
      // page where they can complete payment from the escrow dashboard.
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      setError(err.message || 'Payment execution failed');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingLogo label="Loading escrow checkout console..." size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
        <p className="text-red-400 text-lg font-semibold">{error || 'Invalid checkout reference'}</p>
      </div>
    );
  }

  const title = order.metadata?.title || (order.metadata?.sourceType === 'TOPUP' ? 'Official Velxo Top-Up' : 'Boosting Service');
  const isTopup = order.metadata?.sourceType === 'TOPUP';
  const isGig = order.metadata?.sourceType === 'GIG';
  const subtotal = Number(order.totalAmount);
  const total = subtotal;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 my-6">
        {/* Payment form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 sm:p-8 space-y-7">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Complete Payment</h1>
              <p className="text-gray-400 text-sm mt-1">
                Finish paying for this order — your funds stay locked in Velxo Escrow until delivery is confirmed.
              </p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-7">
              <div>
                <label htmlFor="buyerNote" className="block text-sm font-semibold text-gray-300 mb-2">
                  Delivery Note <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="buyerNote"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand h-28 resize-none"
                  placeholder="Include custom specifications, account ID, or Discord tag..."
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                />
              </div>

              <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 items-start">
                <ShieldCheck className="w-6 h-6 text-brand flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-400 leading-relaxed">
                  <p className="text-white font-semibold mb-1">Protected by Velxo Escrow</p>
                  Your payment is locked in escrow the moment you pay. The seller is only paid after they
                  deliver and you confirm receipt. If something goes wrong, our dispute team steps in to keep
                  you safe.
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition disabled:opacity-50 text-white text-base shadow-lg shadow-brand/20"
              >
                {loading ? 'Processing Escrow Deposit...' : `Pay $${total.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>

        {/* Order + price summary */}
        <div className="lg:col-span-2">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 sm:p-8 lg:sticky lg:top-6 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-borderBg pb-4">Order Summary</h3>

            <div className="flex gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-background border border-borderBg flex-shrink-0 flex items-center justify-center text-gray-600">
                {isTopup ? (
                  <Zap className="w-7 h-7 text-brand" />
                ) : isGig ? (
                  <Gamepad2 className="w-7 h-7 text-purple-400" />
                ) : (
                  <Lock className="w-7 h-7 text-brand" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {isTopup && <Zap className="w-3.5 h-3.5 text-brand" />}
                  {isGig && <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />}
                  {isTopup ? 'Official Top-Up' : isGig ? 'Boosting Service' : 'Service'} Info
                </p>
                <p className="font-bold text-white mt-1 leading-snug line-clamp-2">{title}</p>
                <p className="text-xs text-brand-light font-semibold mt-1">
                  Order #{String(order.orderNumber).slice(-8).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-brand/5 border border-brand/20 px-3 py-2.5">
              <Lock className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="text-xs text-brand-light font-medium">
                Escrow-protected — funds released only after delivery
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Price</span>
                <span className="text-white font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                A 10% platform fee is paid by the <span className="text-gray-400">seller</span> — you pay the
                listed price only.
              </p>
            </div>

            <div className="border-t border-borderBg pt-4 flex justify-between items-baseline">
              <span className="font-bold text-white">Total</span>
              <span className="font-black text-white text-xl">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
