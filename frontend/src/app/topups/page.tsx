'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Footer } from '@/components/Footer';
import { Zap, ShieldCheck, Loader2, ChevronRight, Check } from 'lucide-react';

const GAMES = [
  'Free Fire', 'COD Mobile', 'Blood Strike', 'Delta Force',
  'PUBG Mobile', 'Valorant', 'Roblox', 'Mobile Legends', 'eFootball',
];

export default function TopupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState('');
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async (game?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (game) params.append('game', game);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/topups?${params.toString()}`);
      const data = await res.json();
      setProducts(data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleBuy = async (id: string) => {
    if (!user) { router.push('/auth/login?redirect=/topups'); return; }
    setBuyingId(id);
    try {
      const res = await api.post<{ success: boolean; data: any }>(`/topups/${id}/purchase`, { quantity: 1 });
      if (res.success && res.data?.id) {
        router.push(`/checkout/order/${res.data.id}`);
      }
    } catch (e: any) {
      alert(e.message || 'Purchase failed');
    } finally {
      setBuyingId(null);
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
                  <button onClick={() => handleBuy(p.id)} disabled={buyingId === p.id}
                    className="flex items-center gap-1 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50">
                    {buyingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Buy
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
    </div>
  );
}
