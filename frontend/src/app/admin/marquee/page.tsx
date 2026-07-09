'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface MarqueeItem {
  id?: string;
  text: string;
  linkHref: string;
  linkText: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

const ICONS = ['megaphone', 'zap', 'gift', 'info'];
const COLORS = ['brand', 'emerald', 'amber', 'purple', 'rose', 'sky'];

const emptyItem: Omit<MarqueeItem, 'id'> = {
  text: '',
  linkHref: '',
  linkText: '',
  icon: 'megaphone',
  color: 'brand',
  isActive: true,
  sortOrder: 0,
};

export default function MarqueeAdminPage() {
  const [items, setItems] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<MarqueeItem, 'id'>>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: MarqueeItem[] }>('/marquee/all');
      setItems((res as any).data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!form.text.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await api.post('/marquee', form);
      setShowForm(false);
      setForm(emptyItem);
      fetchItems();
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save news item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    try {
      await api.delete(`/marquee/${id}`);
      setItems(s => s.filter(x => x.id !== id));
    } catch (e: any) {
      setSaveError(e.message || 'Failed to delete');
    }
  };

  const handleToggle = async (item: MarqueeItem) => {
    try {
      await api.patch(`/marquee/${item.id}`, { isActive: !item.isActive });
      setItems(s => s.map(x => x.id === item.id ? { ...x, isActive: !x.isActive } : x));
    } catch (e: any) {
      setSaveError(e.message || 'Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand" /> News Marquee
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage the scrolling news bar under the navigation.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowForm(true); setSaveError(''); }}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Add News
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-cardBg border border-brand/30 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white">New News Item</h2>
          {saveError && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl">{saveError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Text *</label>
              <input
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="e.g. New Free Fire top-ups are now live!"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Link URL</label>
              <input
                value={form.linkHref}
                onChange={e => setForm(f => ({ ...f, linkHref: e.target.value }))}
                placeholder="/topups"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Link Text</label>
              <input
                value={form.linkText}
                onChange={e => setForm(f => ({ ...f, linkText: e.target.value }))}
                placeholder="Learn more"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Icon</label>
              <select
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition"
              >
                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Color</label>
              <select
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition"
              >
                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-brand"
            />
            <span className="text-sm text-gray-300">Active (show in marquee)</span>
          </label>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.text.trim()} className="bg-brand hover:bg-brand-dark text-white text-sm font-bold px-5 py-2 rounded-xl transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save News'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl transition">Cancel</button>
          </div>
        </div>
      )}

      {saveError && !showForm && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl flex justify-between items-center">
          {saveError}
          <button onClick={() => setSaveError('')} className="text-red-300 hover:text-white ml-4">✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading news...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No news items yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-cardBg border border-borderBg rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{item.text}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand/20 text-brand">{item.icon}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-700/40 text-gray-300">{item.color}</span>
                  {item.linkHref && <span className="text-[10px] text-gray-500 truncate">→ {item.linkHref}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleToggle(item)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${item.isActive ? 'bg-green-500/20 text-green-300 hover:bg-red-500/20 hover:text-red-300' : 'bg-gray-700 text-gray-400 hover:bg-green-500/20 hover:text-green-300'}`}
                >
                  {item.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handleDelete(item.id!)} className="text-red-400 hover:text-red-300 transition">
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
