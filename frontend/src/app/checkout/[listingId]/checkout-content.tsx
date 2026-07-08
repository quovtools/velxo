'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { CreditCard, ShieldCheck, Wallet, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
}

export default function CheckoutContent({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [paymentProvider, setPaymentProvider] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'CRYPTO'>('PAYSTACK');
  const [buyerNote, setBuyerNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadListing() {
      try {
        const response = await fetch(`${API_BASE}/listings/${listingId}`);
        if (!response.ok) throw new Error('Listing details not found');
        const result = await response.json();
        setListing(result.data);
      } catch (err: any) {
        setError(err.message || 'Failed to resolve offer info');
      } finally {
        setLoadingListing(false);
      }
    }
    loadListing();
  }, [listingId, user, router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<{ success: boolean; data: any }>('/orders', {
        listingId,
        quantity: 1,
        buyerNote,
      });

      if (response.success && response.data) {
        const orderId = response.data.id;

        await api.post(`/payments`, {
          orderId,
          provider: paymentProvider,
          amount: parseFloat(listing?.price || '0'),
          currency: 'USD',
        });

        router.push(`/orders/${orderId}`);
      } else {
        throw new Error('Could not establish escrow holding order');
      }
    } catch (err: any) {
      setError(err.message || 'Payment execution failed');
    } finally {
      setLoading(false);
    }
  };

  if (loadingListing) {
    return <div className="text-center py-20 text-gray-400">Loading escrow checkout console...</div>;
  }

  if (error || !listing) {
    return (
      <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
        <p className="text-red-400 text-lg font-semibold">{error || 'Invalid checkout reference'}</p>
      </div>
    );
  }

  const subtotal = Number(listing.price);
  const fee = subtotal * 0.10; // 10% service fee
  const total = subtotal + fee;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
          <h1 className="text-3xl font-extrabold text-white">Escrow Checkout</h1>
          <p className="text-gray-400 text-sm">Select payment provider to process and lock funds in escrow.</p>

          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setPaymentProvider('PAYSTACK')}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition ${
                  paymentProvider === 'PAYSTACK'
                    ? 'border-brand bg-brand/5 text-white'
                    : 'border-borderBg bg-background text-gray-400 hover:border-brand/40'
                }`}
              >
                <CreditCard className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Paystack</span>
                <span className="text-[10px] text-gray-500 mt-1">Cards / Bank Transfers</span>
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

              <button
                type="button"
                onClick={() => setPaymentProvider('CRYPTO')}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition ${
                  paymentProvider === 'CRYPTO'
                    ? 'border-brand bg-brand/5 text-white'
                    : 'border-borderBg bg-background text-gray-400 hover:border-brand/40'
                }`}
              >
                <Sparkles className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Crypto</span>
                <span className="text-[10px] text-gray-500 mt-1">Bitcoin, USDT, Solana</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Delivery Note (Optional)</label>
              <textarea
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand h-28 resize-none"
                placeholder="Include custom specifications, delivery preference, or Discord tag..."
                value={buyerNote}
                onChange={(e) => setBuyerNote(e.target.value)}
              />
            </div>

            <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 items-center text-xs text-gray-400">
              <ShieldCheck className="w-6 h-6 text-brand flex-shrink-0" />
              <span>Funds are locked securely in Velxo Escrow until seller transfers the details and you confirm receipt.</span>
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
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Item Info</p>
              <p className="font-bold text-white mt-1 line-clamp-2">{listing.title}</p>
              <p className="text-xs text-brand-light font-semibold mt-1">{listing.gameName} • {listing.platform}</p>
            </div>

            <div className="border-t border-borderBg pt-4 space-y-2 text-gray-400">
              <div className="flex justify-between">
                <span>Base Price</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Escrow Service Fee (10%)</span>
                <span className="text-white">${fee.toFixed(2)}</span>
              </div>
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
