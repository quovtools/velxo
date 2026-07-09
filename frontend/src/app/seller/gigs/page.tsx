'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { fileToDataUrl } from '@/lib/file';
import Footer from '@/components/Footer';
import { Gamepad2, Plus, Trash2, Loader2, Check, AlertCircle } from 'lucide-react';

const GAMES = [
  'Free Fire', 'PUBG Mobile', 'COD Mobile', 'Mobile Legends',
  'Blood Strike', 'Delta Force', 'Valorant', 'Roblox', 'eFootball', 'Other',
];
const PLATFORMS = ['Android', 'iOS', 'PC', 'PlayStation', 'Xbox', 'Cross-Platform'];
const REGIONS = ['Africa', 'Europe', 'North America', 'Asia', 'Middle East', 'Global'];
const SERVICE_TYPES = [
  { value: 'RANK_BOOST', label: 'Rank Boost' },
  { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
  { value: 'SOLO', label: 'Solo Carry' },
  { value: 'DUO', label: 'Duo Boost' },
  { value: 'COACHING', label: 'Coaching' },
];

export default function SellerGigsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [isSeller, setIsSeller] = useState(false);
  const [checking, setChecking] = useState(true);
  const [gigs, setGigs] = useState<any[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', gameName: 'Free Fire',
    rankFrom: '', rankTo: '', platform: 'Android', region: 'Africa',
    accountType: 'RANK_BOOST', price: '', deliveryTime: '24', imageUrl: '',
  });

  const loadGigs = useCallback(async () => {
    setLoadingGigs(true);
    try {
      const res = await api.get<{ data: any[] }>('/gigs/me/listings');
      setGigs((res as any).data || []);
    } catch {
      setGigs([]);
    } finally {
      setLoadingGigs(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login?redirect=/seller/gigs'); return; }
    api.get<{ success?: boolean; data: any }>('/sellers/me')
      .then(res => { setIsSeller(!!(res.success && res.data)); })
      .catch(() => setIsSeller(false))
      .finally(() => setChecking(false));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isSeller) loadGigs();
  }, [isSeller, loadGigs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim() || !form.price || parseFloat(form.price) <= 0) {
      setError('Title, description and a valid price are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>('/gigs', {
        title: form.title.trim(),
        description: form.description.trim(),
        gameName: form.gameName,
        rankFrom: form.rankFrom || undefined,
        rankTo: form.rankTo || undefined,
        platform: form.platform,
        region: form.region,
        accountType: form.accountType,
        price: parseFloat(form.price),
        currency: 'USD',
        deliveryTime: parseInt(form.deliveryTime) || 24,
        imageUrl: form.imageUrl || undefined,
      });
      if (res.success) {
        setShowForm(false);
        setForm({ title: '', description: '', gameName: 'Free Fire', rankFrom: '', rankTo: '', platform: 'Android', region: 'Africa', accountType: 'RANK_BOOST', price: '', deliveryTime: '24', imageUrl: '' });
        loadGigs();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to post gig.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gig?')) return;
    try {
      await api.delete(`/gigs/${id}`);
      setGigs(g => g.filter(x => x.id !== id));
    } catch (e: any) {
      alert(e.message || 'Failed to delete.');
    }
  };

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6">
        <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto">
          <Gamepad2 className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-2xl font-black text-white">Become a Booster</h2>
        <p className="text-gray-400 text-sm">You need a seller store to post rank-boosting gigs. Create one for free.</p>
        <button onClick={() => router.push('/sell')} className="px-6 py-3 bg-brand hover:bg-brand-dark rounded-xl font-bold text-white transition">
          Create Seller Store
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-brand" /> My Boosting Gigs
          </h1>
          <p className="text-gray-400 text-sm mt-1">Post rank-boosting services for buyers to hire.</p>
        </div>
        <button onClick={() => { setShowForm(s => !s); setError(''); }}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition">
          <Plus className="w-4 h-4" /> Post Gig
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-cardBg border border-brand/30 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white">New Boosting Gig</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Free Fire Rank Boost to Heroic"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                placeholder="Describe your service, what you need from the buyer, and guarantees..."
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Game *</label>
              <select value={form.gameName} onChange={e => setForm(f => ({ ...f, gameName: e.target.value }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                {GAMES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Service Type *</label>
              <select value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rank From</label>
              <input value={form.rankFrom} onChange={e => setForm(f => ({ ...f, rankFrom: e.target.value }))} placeholder="e.g. Gold"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rank To</label>
              <input value={form.rankTo} onChange={e => setForm(f => ({ ...f, rankTo: e.target.value }))} placeholder="e.g. Heroic"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Platform</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Region</label>
              <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Price (USD) *</label>
              <input type="number" step="0.01" min="0.5" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Delivery Time (hours)</label>
              <input type="number" min="1" value={form.deliveryTime} onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cover Image</label>
              <label className="flex items-center gap-2 cursor-pointer bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-gray-400 focus-within:border-brand transition overflow-hidden">
                {form.imageUrl ? <span className="truncate text-white">Image selected</span> : <span>Choose image…</span>}
                <input type="file" accept="image/*" className="hidden" onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const dataUrl = await fileToDataUrl(file);
                  setForm(f => ({ ...f, imageUrl: dataUrl }));
                }} />
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="bg-brand hover:bg-brand-dark text-white text-sm font-bold px-5 py-2 rounded-xl transition disabled:opacity-50 flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {submitting ? 'Posting...' : 'Post Gig'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl transition">Cancel</button>
          </div>
        </form>
      )}

      {loadingGigs ? (
        <div className="text-center py-16 text-gray-500">Loading gigs...</div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-16 bg-cardBg border border-borderBg rounded-2xl">
          <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">You haven&apos;t posted any boosting gigs yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gigs.map((g) => (
            <div key={g.id} className="bg-cardBg border border-borderBg rounded-2xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/30 to-background flex items-center justify-center flex-shrink-0 overflow-hidden">
                {g.imageUrl ? <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" /> : <Gamepad2 className="w-6 h-6 text-purple-400/60" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{g.title}</p>
                <p className="text-xs text-gray-500 truncate">{g.gameName} · {g.accountType}</p>
                <span className="mt-1 inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{g.status}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-lg font-black text-white">${Number(g.price).toFixed(2)}</span>
                <button onClick={() => handleDelete(g.id)} className="text-red-400 hover:text-red-300 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
}
