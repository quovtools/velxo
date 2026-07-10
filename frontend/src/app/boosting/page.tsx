'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { GAME_NAMES, getGameConfig, REGIONS, SERVICE_TYPE_LABELS } from '@/lib/games';
import { Gamepad2, Loader2, Check, Search, ShieldCheck, Clock, X, AlertCircle, Plus, ArrowRight } from 'lucide-react';

const GAMES = GAME_NAMES;

const SERVICE_TYPES = [
  { value: '', label: 'All Services' },
  { value: 'RANK_BOOST', label: 'Rank Boost' },
  { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
  { value: 'SOLO', label: 'Solo Carry' },
  { value: 'DUO', label: 'Duo Boost' },
  { value: 'COACHING', label: 'Coaching' },
];

const ALL_PLATFORMS = ['Android', 'iOS', 'PC', 'PlayStation', 'Xbox', 'Cross-Platform'];

interface Gig {
  id: string;
  title: string;
  description?: string;
  gameName: string;
  rankFrom?: string | null;
  rankTo?: string | null;
  platform?: string | null;
  region?: string | null;
  accountType?: string | null;
  price: number;
  currency?: string;
  deliveryTime?: number | null;
  imageUrl?: string | null;
  status: string;
  isActive: boolean;
  seller?: { storeName?: string } | null;
}

export default function BoostingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSeller = user?.role === 'SELLER';
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState('');
  const [activeType, setActiveType] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Gig | null>(null);
  const [buyerNote, setBuyerNote] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasedId, setPurchasedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    gameName: GAMES[0],
    rankFrom: '',
    rankTo: '',
    platform: '',
    region: '',
    accountType: 'RANK_BOOST',
    price: '',
    currency: 'USD',
    deliveryTime: '',
    imageUrl: '',
  });

  const gameCfg = getGameConfig(form.gameName);
  const platformOptions = gameCfg?.platforms ?? ALL_PLATFORMS;
  const rankOptions = gameCfg?.ranks ?? [];
  const boostServiceTypes = gameCfg?.serviceTypes ?? [
    { value: 'RANK_BOOST', label: 'Rank Boost' },
    { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
    { value: 'SOLO', label: 'Solo Carry' },
    { value: 'DUO', label: 'Duo Boost' },
    { value: 'COACHING', label: 'Coaching' },
  ];

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: Gig[] }>('/gigs', {
        params: {
          ...(activeGame ? { game: activeGame } : {}),
          ...(activeType ? { accountType: activeType } : {}),
          ...(search ? { search } : {}),
        },
      });
      setGigs(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load boosting services');
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, [activeGame, activeType, search]);

  useEffect(() => {
    const t = setTimeout(fetchGigs, 250);
    return () => clearTimeout(t);
  }, [fetchGigs]);

  const openGig = (g: Gig) => {
    if (!user) {
      router.push('/auth/login?redirect=/boosting');
      return;
    }
    setPurchaseError(null);
    setPurchasedId(null);
    setBuyerNote('');
    setSelected(g);
  };

  const closeDetail = () => {
    setSelected(null);
    setPurchasedId(null);
    setPurchaseError(null);
  };

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const res = await api.post<{ success: boolean; data: { id: string } }>(
        `/gigs/${selected.id}/purchase`,
        { quantity: 1, buyerNote }
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

  const resetForm = () => setForm({
    title: '', description: '', gameName: GAMES[0], rankFrom: '', rankTo: '',
    platform: '', region: '', accountType: 'RANK_BOOST', price: '', currency: 'USD',
    deliveryTime: '', imageUrl: '',
  });

  const openCreate = () => {
    setCreateError(null);
    setCreating(false);
    resetForm();
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        rankFrom: form.rankFrom || undefined,
        rankTo: form.rankTo || undefined,
        platform: form.platform || undefined,
        region: form.region || undefined,
        deliveryTime: form.deliveryTime ? Number(form.deliveryTime) : undefined,
        imageUrl: form.imageUrl || undefined,
      };
      const res = await api.post<{ success: boolean; data: Gig }>('/gigs', payload);
      if (res.success) {
        setCreateOpen(false);
        fetchGigs();
      } else {
        setCreateError('Failed to create gig. Please try again.');
      }
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create gig. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const inputCls = 'w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition';
  const labelCls = 'block text-[11px] uppercase tracking-wide text-gray-400 font-bold mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-brand" /> Rank Boosting Services
          </h1>
          <p className="text-sm text-gray-500 mt-1">Hire verified boosters to rank up your account — escrow-protected, delivered by Velxo sellers.</p>
        </div>
        {isSeller && (
          <button onClick={openCreate}
            className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-brand hover:from-purple-700 hover:to-brand-dark text-white text-xs font-bold px-3 py-2 rounded-xl transition">
            <Plus className="w-4 h-4" /> Create Gig
          </button>
        )}
      </div>

      {!isSeller && user && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Become a Velxo seller to post your own boosting gigs and earn.</p>
          <button onClick={() => router.push('/seller/gigs')}
            className="flex-shrink-0 text-xs font-bold text-purple-300 hover:text-white transition">Get started →</button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

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
          {isSeller && (
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition">
              <Plus className="w-4 h-4" /> Post a Boosting Gig
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gigs.map((g) => (
            <div key={g.id} onClick={() => openGig(g)}
              className="cursor-pointer bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden flex flex-col transition">
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
                  <button onClick={(e) => { e.stopPropagation(); openGig(g); }}
                    className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-brand hover:from-purple-700 hover:to-brand-dark px-3 py-1.5 rounded-lg text-xs font-bold text-white transition">
                    <Check className="w-3.5 h-3.5" /> Hire
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeDetail}>
          <div className="bg-cardBg border border-borderBg rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-36 bg-gradient-to-br from-purple-500/30 to-background flex items-center justify-center">
              {selected.imageUrl ? <img src={selected.imageUrl} alt={selected.title} className="w-full h-full object-cover" /> : <Gamepad2 className="w-10 h-10 text-purple-400/60" />}
              <button onClick={closeDetail} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition">
                <X className="w-4 h-4" />
              </button>
              <span className="absolute top-3 left-3 text-[9px] font-bold uppercase bg-purple-500 text-white px-1.5 py-0.5 rounded">{selected.accountType || 'Boost'}</span>
            </div>

            {purchasedId ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Order placed!</p>
                  <p className="text-sm text-gray-400 mt-1">Your boosting order is created and protected by escrow.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => router.push('/orders')}
                    className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-purple-600 to-brand hover:from-purple-700 hover:to-brand-dark text-white text-sm font-bold py-2.5 rounded-xl transition">
                    View my orders <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={closeDetail} className="w-full text-gray-400 hover:text-white text-sm font-semibold py-2 transition">
                    Keep browsing
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-purple-300 font-bold">{selected.gameName}</p>
                  <h3 className="text-white font-bold text-lg leading-snug">{selected.title}</h3>
                  {(selected.rankFrom || selected.rankTo) && (
                    <p className="text-xs text-purple-300 mt-1 font-semibold">{selected.rankFrom || '?'} → {selected.rankTo || '?'}</p>
                  )}
                  {selected.description && <p className="text-sm text-gray-400 mt-2">{selected.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> {selected.seller?.storeName || 'Velxo Seller'}</span>
                    {selected.deliveryTime && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {selected.deliveryTime}h</span>}
                    {selected.region && <span>{selected.region}</span>}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Note to seller (optional)</label>
                  <textarea
                    value={buyerNote}
                    onChange={(e) => setBuyerNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. my in-game ID, preferred schedule..."
                    className={inputCls + ' resize-none'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Price</span>
                  <span className="text-xl font-black text-white">${Number(selected.price).toFixed(2)}</span>
                </div>

                {purchaseError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {purchaseError}
                  </div>
                )}

                <button onClick={handlePurchase} disabled={purchasing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-brand hover:from-purple-700 hover:to-brand-dark text-white text-sm font-bold py-3 rounded-xl transition disabled:opacity-50">
                  {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {purchasing ? 'Processing...' : 'Hire Booster'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
          <div className="bg-cardBg border border-borderBg rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-cardBg border-b border-borderBg px-5 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-purple-400" /> Create Boosting Gig</h3>
              <button onClick={() => setCreateOpen(false)} className="w-8 h-8 rounded-full bg-background hover:bg-borderBg flex items-center justify-center text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {createError}
                </div>
              )}

              <div>
                <label className={labelCls}>Title *</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Diamond to Mythic boost" />
              </div>

              <div>
                <label className={labelCls}>Description *</label>
                <textarea className={inputCls + ' resize-none'} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the service you offer..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Game *</label>
                  <select className={inputCls} value={form.gameName} onChange={(e) => {
                    const name = e.target.value;
                    const cfg = getGameConfig(name);
                    setForm({ ...form, gameName: name, platform: cfg?.platforms?.[0] ?? '' });
                  }}>
                    {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Service Type</label>
                  <select className={inputCls} value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
                    {boostServiceTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Rank From</label>
                  <input className={inputCls} value={form.rankFrom} onChange={(e) => setForm({ ...form, rankFrom: e.target.value })} list="boost-rank-options" placeholder={rankOptions.length ? `e.g. ${rankOptions[0]}` : 'e.g. Gold'} />
                </div>
                <div>
                  <label className={labelCls}>Rank To</label>
                  <input className={inputCls} value={form.rankTo} onChange={(e) => setForm({ ...form, rankTo: e.target.value })} list="boost-rank-options" placeholder={rankOptions.length ? `e.g. ${rankOptions[rankOptions.length - 1]}` : 'e.g. Diamond'} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Platform</label>
                  <select className={inputCls} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                    {platformOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Region</label>
                  <select className={inputCls} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Price (USD) *</label>
                  <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Delivery Time (hrs)</label>
                  <input className={inputCls} type="number" min="1" value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} placeholder="e.g. 24" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Image URL</label>
                <input className={inputCls} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>

              {rankOptions.length > 0 && (
                <datalist id="boost-rank-options">
                  {rankOptions.map((o) => <option key={o} value={o} />)}
                </datalist>
              )}

              <button onClick={handleCreate} disabled={creating || !form.title || !form.description || !form.price}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-brand hover:from-purple-700 hover:to-brand-dark text-white text-sm font-bold py-3 rounded-xl transition disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Submitting...' : 'Submit Gig for Review'}
              </button>
              <p className="text-[10px] text-gray-500 text-center">New gigs are submitted for admin review before going live.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
