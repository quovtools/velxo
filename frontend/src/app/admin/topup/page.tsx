'use client';

import React, { useEffect, useState } from 'react';
import { Gamepad2, Trash2, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { GAME_NAMES, getGameSlug, getGameConfig } from '@/lib/games';
import { Badge, EmptyState, ErrorBanner, ActionButton, PageHeader, RefreshButton, AdminInput, AdminSelect, Card, formatMoney } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Topup {
  id: string; gameName: string; gameSlug?: string; title: string; description?: string;
  price: number; currency: string; imageUrl?: string; region?: string;
  stock?: number; isActive: boolean; sortOrder: number;
}

const emptyForm: Partial<Topup> = { gameName:'', title:'', price:0, sortOrder:0, stock:-1 };

export default function AdminTopupPage() {
  const [items, setItems]     = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState<Partial<Topup>>(emptyForm);
  const [editing, setEditing] = useState<Topup | null>(null);
  const [busy, setBusy]       = useState(false);
  const [showForm, setShowForm] = useState(false);

  const gameCfg = getGameConfig(form.gameName || '');
  const currencyName = gameCfg?.currency.plural;
  const packagePresets = gameCfg?.topupPackages ?? [];

  const fetchItems = async () => {
    setLoading(true); setError('');
    try { const res: any = await api.get('/admin/topup'); setItems(res.data || res || []); }
    catch (e: any) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const F = (k: keyof Topup) => (v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.gameName || !form.title || form.price === undefined) { setError('Game, title and price are required'); return; }
    setBusy(true); setError('');
    try {
      if (editing) { await api.patch(`/admin/topup/${editing.id}`, form); }
      else { await api.post('/admin/topup', form); }
      setForm(emptyForm); setEditing(null); setShowForm(false); await fetchItems();
    } catch (e: any) { setError(e.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this topup product?')) return;
    try { await api.delete(`/admin/topup/${id}`); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const toggleActive = async (t: Topup) => {
    try { await api.patch(`/admin/topup/${t.id}`, { isActive: !t.isActive }); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={Gamepad2} title="Topup Products" subtitle="Manage in-game currency & topup listings."
        action={
          <div className="flex gap-2">
            <RefreshButton onClick={fetchItems} loading={loading} />
            <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm shadow-violet-500/20">
              <Plus className="w-3.5 h-3.5" />New Product
            </button>
          </div>
        } />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {showForm && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{editing ? `Edit ${editing.title}` : 'New Topup Product'}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} className="p-1 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Game *</p>
              <AdminSelect value={form.gameName||''} onChange={e => {
                const name = e.target.value;
                setForm(f => ({ ...f, gameName: name, gameSlug: name ? (getGameSlug(name) ?? f.gameSlug) : f.gameSlug }));
              }}>
                <option value="">Select a game…</option>
                {GAME_NAMES.map(g => <option key={g} value={g}>{g}</option>)}
                <option value="Other">Other</option>
              </AdminSelect>
            </div>
            <AdminInput label="Title *" value={form.title||''} onChange={e => F('title')(e.target.value)} />
            <AdminInput label="Price *" type="number" value={form.price||0} onChange={e => F('price')(Number(e.target.value))} />
            <AdminInput label="Region" value={form.region||''} onChange={e => F('region')(e.target.value)} placeholder="Global" />
            <AdminInput label="Stock (-1 = infinite)" type="number" value={form.stock??-1} onChange={e => F('stock')(Number(e.target.value))} />
            <AdminInput label="Sort order" type="number" value={form.sortOrder??0} onChange={e => F('sortOrder')(Number(e.target.value))} />
          </div>
          <AdminInput label="Image URL" value={form.imageUrl||''} onChange={e => F('imageUrl')(e.target.value)} placeholder="https://…" />
          <AdminInput label="Description" value={form.description||''} onChange={e => F('description')(e.target.value)} />

          {currencyName && packagePresets.length > 0 && (
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-3 space-y-2">
              <p className="text-[11px] text-gray-500">Presets for <span className="text-white font-medium">{form.gameName}</span> ({currencyName}):</p>
              <div className="flex flex-wrap gap-1.5">
                {packagePresets.map((p: any) => (
                  <button key={p.amount} type="button" onClick={() => F('title')(p.label)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0a0a0f] border border-white/10 text-gray-300 hover:border-violet-500/40 hover:text-white transition">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <ActionButton variant="brand" loading={busy} onClick={save}>{editing ? 'Update' : 'Create'}</ActionButton>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} className="text-gray-500 hover:text-white text-xs px-3 py-1.5 rounded-xl transition">Cancel</button>
          </div>
        </Card>
      )}

      {loading ? <LoadingArea label="Loading topups…" /> : items.length === 0 ? (
        <EmptyState icon={Gamepad2} title="No topup products" subtitle="Create your first product above." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map(t => (
            <div key={t.id} className="bg-[#111118] border border-white/8 rounded-2xl p-4 flex flex-col gap-3 hover:border-white/16 transition-colors">
              <div className="flex items-start gap-3">
                {t.imageUrl
                  ? <img src={t.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-white/8" />
                  : <div className="w-12 h-12 rounded-xl bg-white/5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{t.title}</p>
                  <p className="text-[11px] text-gray-600">{t.gameName} · {t.region || 'Global'}</p>
                  <p className="text-sm font-semibold text-violet-400 mt-0.5">{formatMoney(t.price, t.currency)}</p>
                </div>
                {t.isActive ? <Badge color="green">Live</Badge> : <Badge color="gray">Hidden</Badge>}
              </div>
              <div className="flex gap-1.5 flex-wrap pt-2 border-t border-white/6">
                <ActionButton variant="default" onClick={() => { setEditing(t); setForm(t); setShowForm(true); }}>Edit</ActionButton>
                <ActionButton variant="warning" onClick={() => toggleActive(t)}>{t.isActive ? 'Hide' : 'Show'}</ActionButton>
                <ActionButton variant="danger" onClick={() => remove(t.id)}><Trash2 className="w-3 h-3" /></ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
