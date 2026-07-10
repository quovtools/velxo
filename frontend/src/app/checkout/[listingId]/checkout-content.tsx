'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import LoadingLogo from '@/components/LoadingLogo';
import { ShieldCheck, Wallet, Sparkles, ImageIcon, Check, Lock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  images?: string[];
  seller?: { id?: string; storeName?: string };
}

const PLACEHOLDER_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#1b1c2e"/><text x="50%" y="50%" fill="#5b5d7a" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">No image</text></svg>`,
  );

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [current, setCurrent] = useState(src || PLACEHOLDER_SRC);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      loading="lazy"
      onError={() => setCurrent(PLACEHOLDER_SRC)}
      className="w-full h-full object-cover"
    />
  );
}

const PROVIDERS = [
  {
    id: 'FLUTTERWAVE' as const,
    name: 'Flutterwave',
    description: 'Cards, bank transfer & Mobile Money',
    icon: Wallet,
    accent: 'text-brand',
  },
  {
    id: 'PAYMENT_IO' as const,
    name: 'Payment.io',
    description: 'Crypto (BTC, USDT, SOL)',
    icon: Sparkles,
    accent: 'text-brand-accent',
  },
];

export default function CheckoutContent({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [paymentProvider, setPaymentProvider] = useState<'FLUTTERWAVE' | 'PAYMENT_IO'>('PAYMENT_IO');
  const [providerConfig, setProviderConfig] = useState<{
    flutterwave?: { configured: boolean };
    paymentio?: { configured: boolean };
  } | null>(null);
  const [buyerNote, setBuyerNote] = useState('');

  const isProviderConfigured = (id: 'FLUTTERWAVE' | 'PAYMENT_IO') => {
    const cfg = providerConfig as any;
    return id === 'FLUTTERWAVE'
      ? Boolean(cfg?.flutterwave?.configured)
      : Boolean(cfg?.paymentIo?.configured ?? cfg?.paymentio?.configured);
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
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

      // Determine which payment providers are actually configured on the
      // server and default the selection to a working one so the buyer never
      // checks out with an unconfigured provider (which can't generate a link).
      try {
        const cfgRes = await api.get<{ data: any }>('/payments/config');
        const cfg = (cfgRes as any).data;
        setProviderConfig(cfg);
        const fw = Boolean(cfg?.flutterwave?.configured);
        const pio = Boolean(cfg?.paymentIo?.configured ?? (cfg as any)?.paymentio?.configured);
        if (pio) setPaymentProvider('PAYMENT_IO');
        else if (fw) setPaymentProvider('FLUTTERWAVE');
      } catch {
        // leave default; provider buttons will still render (and disable if unconfigured)
      }
    }
    loadListing();
  }, [listingId, user, authLoading, router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<{ success: boolean; data: any }>('/orders', {
        listingId,
        quantity: 1,
        buyerNote,
        paymentMethodId: paymentProvider,
      });

      if (!response.success || !response.data) {
        throw new Error('Could not establish escrow holding order');
      }

      const orderId = response.data.id;

      // The order is now created and held in escrow. Send the buyer to the
      // track-order page where they complete payment via the hosted link and
      // watch the escrow status update live.
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      setError(err.message || 'Payment execution failed');
    } finally {
      setLoading(false);
    }
  };

  if (loadingListing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingLogo label="Loading escrow checkout console..." size="lg" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
        <p className="text-red-400 text-lg font-semibold">{error || 'Invalid checkout reference'}</p>
      </div>
    );
  }

  const subtotal = Number(listing.price);
  // Per the escrow model (see /escrow), the 10% platform fee is deducted
  // from the SELLER's payout — buyers pay the listed price only.
  const total = subtotal;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 my-6">
        {/* Payment form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 sm:p-8 space-y-7">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Escrow Checkout</h1>
              <p className="text-gray-400 text-sm mt-1">
                Pay securely — your funds stay locked in Velxo Escrow until delivery is confirmed.
              </p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-7">
              <div>
                <p className="text-sm font-semibold text-gray-200 mb-3">Choose payment method</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROVIDERS.map((p) => {
                    const selected = paymentProvider === p.id;
                    const Icon = p.icon;
                    const configured = isProviderConfigured(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!configured}
                        aria-pressed={selected}
                        onClick={() => setPaymentProvider(p.id)}
                        className={`relative flex items-start gap-3 p-4 rounded-2xl border text-left transition ${
                          !configured
                            ? 'opacity-50 cursor-not-allowed border-borderBg bg-background'
                            : selected
                              ? 'border-brand bg-brand/5 ring-1 ring-brand/40'
                              : 'border-borderBg bg-background hover:border-brand/40'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 ${p.accent}`}
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${selected ? 'text-white' : 'text-gray-300'}`}>
                              {p.name}
                            </span>
                            {!configured && (
                              <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded">
                                Not configured
                              </span>
                            )}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">{p.description}</span>
                        </span>
                        <span
                          className={`flex items-center justify-center w-5 h-5 rounded-full border flex-shrink-0 ${
                            selected ? 'bg-brand border-brand text-white' : 'border-borderBg text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="buyerNote" className="block text-sm font-semibold text-gray-300 mb-2">
                  Delivery Note <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="buyerNote"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand h-28 resize-none"
                  placeholder="Include custom specifications, delivery preference, or Discord tag..."
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

        {/* Product + price summary */}
        <div className="lg:col-span-2">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 sm:p-8 lg:sticky lg:top-6 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-borderBg pb-4">Order Summary</h3>

            <div className="flex gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-background border border-borderBg flex-shrink-0">
                {listing.images?.[0] ? (
                  <ProductImage src={listing.images[0]} alt={listing.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white leading-snug line-clamp-2">{listing.title}</p>
                <p className="text-xs text-brand-light font-semibold mt-1">
                  {listing.gameName} • {listing.platform}
                </p>
                {listing.seller?.storeName && (
                  <p className="text-xs text-gray-500 mt-1 truncate">Sold by {listing.seller.storeName}</p>
                )}
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
                <span>Listing Price</span>
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
