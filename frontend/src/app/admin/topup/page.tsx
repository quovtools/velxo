'use client';

import React, { useEffect, useState } from 'react';
import { Gamepad2, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, EmptyState, ErrorBanner, ActionButton, formatMoney } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Topup {
  id: string;
  gameName: string;
  gameSlug?: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  region?: string;
  stock?: number;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminTopupPage() {
  const [items, setItems] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<Topup>>({ gameName: '', title: '', price: 0 });
  const [editing, setEditing] = useState<Topup | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/topup');
      setItems(res.data || res || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load topups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const save = async () => {
    if (!form.gameName || !form.title || form.price === undefined) { setError('Game, title and price are required'); return; }
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await api.patch(`/admin/topup/${editing.id}`, form);
      } else {
        await api.post('/admin/topup', form);
      }
      setForm({ gameName: '', title: '', price: 0 });
      setEditing(null);
      await fetchItems();
    } catch (e: any) { setError(e.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this topup product?')) return;
    setError('');
    try { await api.delete(`/admin/topup/${id}`); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const toggleActive = async (t: Topup) => {
    setError('');
    try { await api.patch(`/admin/topup/${t.id}`, { isActive: !t.isActive }); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-brand" /> Topup Products
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage in-game currency &amp; topup listings.</p>
        </div>
        <button onClick={fetchItems} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-white">{editing ? `Edit ${editing.title}` : 'New Topup Product'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Game" value={form.gameName || ''} onChange={v => setForm(f => ({ ...f, gameName: v }))} />
          <Input label="Title" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))} />
          <Input label="Price" type="number" value={form.price || 0} onChange={v => setForm(f => ({ ...f, price: Number(v) }))} />
          <Input label="Game Slug" value={form.gameSlug || ''} onChange={v => setForm(f => ({ ...f, gameSlug: v }))} />
          <Input label="Region" value={form.region || ''} onChange={v => setForm(f => ({ ...f, region: v }))} />
          <Input label="Stock (-1 = infinite)" type="number" value={form.stock ?? -1} onChange={v => setForm(f => ({ ...f, stock: Number(v) }))} />
          <Input label="Image URL" value={form.imageUrl || ''} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} />
          <Input label="Sort order" type="number" value={form.sortOrder ?? 0} onChange={v => setForm(f => ({ ...f, sortOrder: Number(v) }))} />
        </div>
        <Input label="Description" value={form.description || ''} onChange={v => setForm(f => ({ ...f, description: v }))} />
        <div className="flex gap-2">
          <ActionButton variant="brand" loading={busy} onClick={save}>{editing ? 'Update' : 'Create'}</ActionButton>
          {editing && <ActionButton variant="default" onClick={() => { setEditing(null); setForm({ gameName: '', title: '', price: 0 }); }}>Cancel</ActionButton>}
        </div>
      </div>

      {loading ? (
        <LoadingArea label="Loading topups..." />
      ) : items.length === 0 ? (
        <EmptyState icon={Gamepad2} title="No topup products" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(t => (
            <div key={t.id} className="bg-cardBg border border-borderBg rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {t.imageUrl ? <img src={t.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-white/5" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.gameName} · {t.region || 'Global'}</p>
                  <p className="text-sm text-brand font-semibold mt-1">{formatMoney(t.price, t.currency)}</p>
                </div>
                {t.isActive ? <Badge color="green">Live</Badge> : <Badge color="gray">Hidden</Badge>}
              </div>
              <div className="flex gap-2 flex-wrap mt-auto">
                <ActionButton variant="default" onClick={() => { setEditing(t); setForm(t); }}>Edit</ActionButton>
                <ActionButton variant="warning" onClick={() => toggleActive(t)}>{t.isActive ? 'Hide' : 'Show'}</ActionButton>
                <ActionButton variant="danger" onClick={() => remove(t.id)}><Trash2 className="w-3.5 h-3.5" /></ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
      />
    </label>
  );
}
