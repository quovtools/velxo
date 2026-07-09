'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import Footer from '@/components/Footer';
import { Zap, ShieldCheck, Loader2, ChevronRight, Check, X, Minus, Plus, AlertCircle, ArrowRight } from 'lucide-react';

const GAMES = [
  'Free Fire', 'COD Mobile', 'Blood Strike', 'Delta Force',
  'PUBG Mobile', 'Valorant', 'Roblox', 'Mobile Legends', 'eFootball',
];

interface TopupProduct {
  id: string;
  gameName: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  region?: string;
  deliveryInfo?: string;
  isActive: boolean;
  stock?: number | null;
}

export default function TopupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<TopupProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState('');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<TopupProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasedId, setPurchasedId] = useState<string | null>(null);

  const fetchProducts = useCallback(async (game?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: TopupProduct[] }>('/topups', {
        params: game ? { game } : {},
      });
      setProducts(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load top-ups');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openBuy = (p: TopupProduct) => {
    setPurchaseError(null);
    setPurchasedId(null);
    setQuantity(1);
    if (!user) {
      router.push('/auth/login?redirect=/topups');
      return;
    }
    setSelected(p);
  };

  const closeModal = () => {
    setSelected(null);
    setPurchasedId(null);
    setPurchaseError(null);
    setBuyingId(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const res = await api.post<{ success: boolean; data: { id: string } }>(
        `/topups/${selected.id}/purchase`,
        { quantity }
      );
      if (res.success && res.data?.id) {
        setPurchasedId(res.data.id);
      } else {
        setPurchaseError('Purchase failed. Please try again.');
      }
    } catch (e: any) {
      setPurchaseError(e.message || 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <Zap className="w-7 h-7 text-brand" /> Official Velxo Top-Ups
        </h1>
        <p className="text-sm text-gray-500 mt-1">100% official, escrow-protected in-game currency & diamonds — delivered by Velxo.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button onClick={() => { setActiveGame(''); fetchProducts(); }}
          className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition ${activeGame === '' ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white'}`}>
          All Games
        </button>
        {GAMES.map((g) => (
          <button key={g} onClick={() => { setActiveGame(g); fetchProducts(g); }}
            className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold transition ${activeGame === g ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white'}`}>
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-3xl">
          <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No top-ups available{activeGame ? ` for ${activeGame}` : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden flex flex-col transition">
              <div className="h-32 bg-gradient-to-br from-brand/30 to-background flex items-center justify-center relative">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" /> : <Zap className="w-8 h-8 text-brand/60" />}
                <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-brand text-white px-1.5 py-0.5 rounded">Official</span>
                {p.region && <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/60 text-white px-1.5 py-0.5 rounded">{p.region}</span>}
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{p.title}</p>
                  <p className="text-[11px] text-gray-500">{p.gameName}</p>
                  {p.description && <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
                </div>
                <div className="flex items-center justify-between border-t border-borderBg pt-2">
                  <span className="text-lg font-black text-white">${Number(p.price).toFixed(2)}</span>
                  <button onClick={() => openBuy(p)}
                    className="flex items-center gap-1 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition">
                    <Check className="w-3.5 h-3.5" /> Buy
                  </button>
                </div>
                {p.deliveryInfo && <p className="text-[10px] text-gray-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> {p.deliveryInfo}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-brand/5 border border-brand/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-brand flex-shrink-0" />
        All official top-ups are fulfilled by Velxo and protected by escrow — you only release payment after delivery.
      </div>

      <Footer />

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-cardBg border border-borderBg rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-36 bg-gradient-to-br from-brand/30 to-background flex items-center justify-center">
              {selected.imageUrl ? <img src={selected.imageUrl} alt={selected.title} className="w-full h-full object-cover" /> : <Zap className="w-10 h-10 text-brand/60" />}
              <button onClick={closeModal} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition">
                <X className="w-4 h-4" />
              </button>
              <span className="absolute top-3 left-3 text-[9px] font-bold uppercase bg-brand text-white px-1.5 py-0.5 rounded">Official</span>
            </div>

            {purchasedId ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Order placed!</p>
                  <p className="text-sm text-gray-400 mt-1">Your top-up order has been created and is protected by escrow.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => router.push('/orders')}
                    className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 text-white text-sm font-bold py-2.5 rounded-xl transition">
                    View my orders <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={closeModal} className="w-full text-gray-400 hover:text-white text-sm font-semibold py-2 transition">
                    Keep shopping
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-brand font-bold">{selected.gameName}</p>
                  <h3 className="text-white font-bold text-lg leading-snug">{selected.title}</h3>
                  {selected.description && <p className="text-sm text-gray-400 mt-1">{selected.description}</p>}
                  {selected.deliveryInfo && (
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-2"><ShieldCheck className="w-3 h-3 text-emerald-400" /> {selected.deliveryInfo}</p>
                  )}
                </div>

                <div className="flex items-center justify-between bg-background border border-borderBg rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-400">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                      className="w-7 h-7 rounded-lg bg-cardBg border border-borderBg flex items-center justify-center text-white hover:border-brand transition disabled:opacity-40">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-white font-bold w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity((q) => q + 1)}
                      className="w-7 h-7 rounded-lg bg-cardBg border border-borderBg flex items-center justify-center text-white hover:border-brand transition">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total</span>
                  <span className="text-xl font-black text-white">${(Number(selected.price) * quantity).toFixed(2)}</span>
                </div>

                {purchaseError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {purchaseError}
                  </div>
                )}

                <button onClick={handleConfirmPurchase} disabled={purchasing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 text-white text-sm font-bold py-3 rounded-xl transition disabled:opacity-50">
                  {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {purchasing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
