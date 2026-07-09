'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import LoadingLogo from '@/components/LoadingLogo';
import { ShieldCheck, Wallet, Sparkles, Zap, Gamepad2 } from 'lucide-react';

export default function OrderCheckoutContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<any | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [paymentProvider, setPaymentProvider] = useState<'FLUTTERWAVE' | 'PAYMENT_IO'>('FLUTTERWAVE');
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
      const payRes = await api.post<{ success: boolean; data: { paymentUrl: string | null; configured: boolean } }>(
        `/payments`,
        {
          orderId,
          provider: paymentProvider,
          amount: parseFloat(order?.totalAmount || '0'),
          currency: order?.currency || 'USD',
        },
      );

      const paymentUrl = payRes?.data?.paymentUrl;
      const configured = payRes?.data?.configured;

      if (paymentUrl && configured) {
        window.location.href = paymentUrl;
        return;
      }

      throw new Error(
        `The selected payment method (${paymentProvider}) is currently unavailable. ` +
          `Please choose a different payment method or try again later.`,
      );
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
          <h1 className="text-3xl font-extrabold text-white">Escrow Checkout</h1>
          <p className="text-gray-400 text-sm">Select payment provider to process and lock funds in escrow.</p>

          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentProvider('PAYMENT_IO')}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition ${
                  paymentProvider === 'PAYMENT_IO'
                    ? 'border-brand bg-brand/5 text-white'
                    : 'border-borderBg bg-background text-gray-400 hover:border-brand/40'
                }`}
              >
                <Sparkles className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Payment.io</span>
                <span className="text-[10px] text-gray-500 mt-1">Crypto (BTC, USDT, SOL)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentProvider('FLUTTERWAVE')}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition ${
                  paymentProvider === 'FLUTTERWAVE'
                    ? 'border-brand bg-brand/5 text-white'
                    : 'border-borderBg bg-background text-gray-400 hover:border-brand/40'
                }`}
              >
                <Wallet className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Flutterwave</span>
                <span className="text-[10px] text-gray-500 mt-1">Mobile Money / Cards</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Delivery Note (Optional)</label>
              <textarea
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand h-28 resize-none"
                placeholder="Include custom specifications, account ID, or Discord tag..."
                value={buyerNote}
                onChange={(e) => setBuyerNote(e.target.value)}
              />
            </div>

            <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 items-center text-xs text-gray-400">
              <ShieldCheck className="w-6 h-6 text-brand flex-shrink-0" />
              <span>Funds are locked securely in Velxo Escrow until the seller fulfills and you confirm receipt.</span>
            </div>

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

      <div>
        <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-bold text-white border-b border-borderBg pb-4">Invoice Summary</h3>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                {isTopup && <Zap className="w-3.5 h-3.5 text-brand" />}
                {isGig && <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />}
                {isTopup ? 'Official Top-Up' : isGig ? 'Boosting Service' : 'Service'} Info
              </p>
              <p className="font-bold text-white mt-1 line-clamp-2">{title}</p>
              <p className="text-xs text-brand-light font-semibold mt-1">Order #{String(order.orderNumber).slice(-8).toUpperCase()}</p>
            </div>

            <div className="border-t border-borderBg pt-4 space-y-2 text-gray-400">
              <div className="flex justify-between">
                <span>Price</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-500 pt-1">
                A 10% escrow fee is deducted from the seller&apos;s payout — you pay the listed price.
              </p>
            </div>

            <div className="border-t border-borderBg pt-4 flex justify-between font-black text-white text-lg">
              <span>Total Price</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
