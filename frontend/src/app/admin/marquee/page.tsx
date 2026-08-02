'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { EmptyState, ErrorBanner, PageHeader, RefreshButton, AdminInput, AdminSelect, Card } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface MarqueeItem {
  id?: string; text: string; linkHref: string; linkText: string;
  icon: string; color: string; isActive: boolean; sortOrder: number;
}

const ICONS  = ['megaphone','zap','gift','info'];
const COLORS = ['brand','emerald','amber','purple','rose','sky'];
const empty: Omit<MarqueeItem,'id'> = { text:'', linkHref:'', linkText:'', icon:'megaphone', color:'brand', isActive:true, sortOrder:0 };

export default function MarqueeAdminPage() {
  const [items, setItems]       = useState<MarqueeItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try { const res = await api.get<any>('/marquee/all'); setItems(res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const F = (k: keyof MarqueeItem) => (v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.text.trim()) return;
    setSaving(true); setError('');
    try { await api.post('/marquee', form); setShowForm(false); setForm(empty); fetchItems(); }
    catch (e: any) { setError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    try { await api.delete(`/marquee/${id}`); setItems(s => s.filter(x => x.id !== id)); }
    catch (e: any) { setError(e.message || 'Failed'); }
  };

  const handleToggle = async (item: MarqueeItem) => {
    try {
      await api.patch(`/marquee/${item.id}`, { isActive: !item.isActive });
      setItems(s => s.map(x => x.id === item.id ? { ...x, isActive: !x.isActive } : x));
    } catch (e: any) { setError(e.message || 'Failed'); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={Megaphone} title="News Marquee" subtitle="Manage the scrolling news bar shown under the navigation."
        action={
          <div className="flex gap-2">
            <RefreshButton onClick={fetchItems} loading={loading} />
            <button onClick={() => { setShowForm(true); setError(''); }}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm shadow-violet-500/20">
              <Plus className="w-3.5 h-3.5" />Add News
            </button>
          </div>
        } />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {showForm && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">New News Item</h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
          </div>
          <AdminInput label="Text *" value={form.text} onChange={e => F('text')(e.target.value)} placeholder="e.g. New Free Fire top-ups are live!" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminInput label="Link URL" value={form.linkHref} onChange={e => F('linkHref')(e.target.value)} placeholder="/topups" />
            <AdminInput label="Link Text" value={form.linkText} onChange={e => F('linkText')(e.target.value)} placeholder="Learn more" />
            <AdminSelect label="Icon" value={form.icon} onChange={e => F('icon')(e.target.value)}>
              {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
            </AdminSelect>
            <AdminSelect label="Color" value={form.color} onChange={e => F('color')(e.target.value)}>
              {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </AdminSelect>
            <AdminInput label="Sort order" type="number" value={form.sortOrder} onChange={e => F('sortOrder')(Number(e.target.value))} />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => F('isActive')(e.target.checked)} className="w-4 h-4 accent-violet-500" />
            Active (show in marquee)
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.text.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition disabled:opacity-40">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-xl transition">Cancel</button>
          </div>
        </Card>
      )}

      {loading ? <LoadingArea label="Loading news…" /> : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No news items yet" subtitle="Add your first marquee item above." />
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-[#111118] border border-white/8 rounded-2xl p-4 flex items-center gap-4 hover:border-white/16 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.text}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-500/12 text-violet-400 border border-violet-500/20">{item.icon}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/8">{item.color}</span>
                  {item.linkHref && <span className="text-[10px] text-gray-600 truncate">→ {item.linkHref}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggle(item)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition ${
                    item.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'
                  }`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handleDelete(item.id!)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
