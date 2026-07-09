'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import Footer from '@/components/Footer';
import { Gamepad2, Loader2, Check, Search, ShieldCheck, Clock } from 'lucide-react';

const GAMES = [
  'Free Fire', 'COD Mobile', 'Blood Strike', 'Delta Force',
  'PUBG Mobile', 'Valorant', 'Roblox', 'Mobile Legends', 'eFootball',
];

const SERVICE_TYPES = [
  { value: '', label: 'All Services' },
  { value: 'RANK_BOOST', label: 'Rank Boost' },
  { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
  { value: 'SOLO', label: 'Solo Carry' },
  { value: 'DUO', label: 'Duo Boost' },
  { value: 'COACHING', label: 'Coaching' },
];

export default function BoostingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState('');
  const [activeType, setActiveType] = useState('');
  const [search, setSearch] = useState('');
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: any[] }>('/gigs', {
        params: {
          ...(activeGame ? { game: activeGame } : {}),
          ...(activeType ? { accountType: activeType } : {}),
          ...(search ? { search } : {}),
        },
      });
      setGigs((res as any).data || []);
    } catch {
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, [activeGame, activeType, search]);

  useEffect(() => {
    const t = setTimeout(fetchGigs, 250);
    return () => clearTimeout(t);
  }, [fetchGigs]);

  const handleBuy = async (id: string) => {
    if (!user) { router.push('/auth/login?redirect=/boosting'); return; }
    setBuyingId(id);
    try {
      const res = await api.post<{ success: boolean; data: any }>(`/gigs/${id}/purchase`, { quantity: 1 });
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
          <Gamepad2 className="w-7 h-7 text-brand" /> Rank Boosting Services
        </h1>
        <p className="text-sm text-gray-500 mt-1">Hire verified boosters to rank up your account — escrow-protected, delivered by Velxo sellers.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search boosting services..."
          className="w-full bg-cardBg border border-borderBg rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button onClick={() => setActiveGame('')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition ${activeGame === '' ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white'}`}>
          All Games
        </button>
        {GAMES.map((g) => (
          <button key={g} onClick={() => setActiveGame(g)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold transition ${activeGame === g ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white'}`}>
            {g}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {SERVICE_TYPES.map((t) => (
          <button key={t.value} onClick={() => setActiveType(t.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition ${activeType === t.value ? 'bg-purple-500 border-purple-500 text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />)}
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-3xl">
          <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No boosting services available{activeGame ? ` for ${activeGame}` : ''}.</p>
          {user && (
            <button onClick={() => router.push('/seller/gigs')} className="mt-4 inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition">
              Post a Boosting Gig
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gigs.map((g) => (
            <div key={g.id} className="bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden flex flex-col transition">
              <div className="h-32 bg-gradient-to-br from-purple-500/30 to-background flex items-center justify-center relative">
                {g.imageUrl ? <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" /> : <Gamepad2 className="w-8 h-8 text-purple-400/60" />}
                <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-purple-500 text-white px-1.5 py-0.5 rounded">{g.accountType || 'Boost'}</span>
                {g.region && <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/60 text-white px-1.5 py-0.5 rounded">{g.region}</span>}
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{g.title}</p>
                  <p className="text-[11px] text-gray-500">{g.gameName}</p>
                  {(g.rankFrom || g.rankTo) && (
                    <p className="text-[11px] text-purple-300 mt-1 font-semibold">
                      {g.rankFrom || '?'} → {g.rankTo || '?'}
                    </p>
                  )}
                  {g.description && <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{g.description}</p>}
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> {g.seller?.storeName || 'Velxo Seller'}</span>
                    {g.deliveryTime && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {g.deliveryTime}h</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-borderBg pt-2">
                  <span className="text-lg font-black text-white">${Number(g.price).toFixed(2)}</span>
                  <button onClick={() => handleBuy(g.id)} disabled={buyingId === g.id}
                    className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-brand hover:from-purple-700 hover:to-brand-dark px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50">
                    {buyingId === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Hire
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
        Every boosting gig is escrow-protected — your payment is only released to the seller after you confirm the rank-up was completed.
      </div>

      <Footer />
    </div>
  );
}
