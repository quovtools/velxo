'use client';

import React, { useEffect, useState } from 'react';
import { FolderTree, RefreshCw, Trash2, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, EmptyState, ErrorBanner, ActionButton, Modal } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  subcategories: Subcategory[];
  _count?: { listings: number };
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<Category>>({});
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [subForm, setSubForm] = useState<{ categoryId: string; name: string; slug: string }>({ categoryId: '', name: '', slug: '' });

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/categories');
      setItems(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const save = async () => {
    if (!form.name || !form.slug) { setError('Name and slug are required'); return; }
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await api.patch(`/admin/categories/${editing.id}`, form);
      } else {
        await api.post('/admin/categories', form);
      }
      setForm({});
      setEditing(null);
      await fetchItems();
    } catch (e: any) { setError(e.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this category and its subcategories?')) return;
    setError('');
    try { await api.delete(`/admin/categories/${id}`); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const addSub = async () => {
    if (!subForm.categoryId || !subForm.name || !subForm.slug) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/admin/categories/${subForm.categoryId}/subcategories`, subForm);
      setSubForm({ categoryId: '', name: '', slug: '' });
      await fetchItems();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const removeSub = async (id: string) => {
    if (!window.confirm('Delete subcategory?')) return;
    setError('');
    try { await api.delete(`/admin/subcategories/${id}`); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const toggleActive = async (c: Category) => {
    setError('');
    try { await api.patch(`/admin/categories/${c.id}`, { isActive: !c.isActive }); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-brand" /> Categories &amp; Subcategories
          </h1>
          <p className="text-gray-400 text-sm mt-1">Structure the marketplace catalog.</p>
        </div>
        <button onClick={fetchItems} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-white">{editing ? `Edit ${editing.name}` : 'New Category'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input label="Name" value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Input label="Slug" value={form.slug || ''} onChange={v => setForm(f => ({ ...f, slug: v }))} />
          <Input label="Icon" value={form.icon || ''} onChange={v => setForm(f => ({ ...f, icon: v }))} />
          <Input label="Image URL" value={form.imageUrl || ''} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Description" value={form.description || ''} onChange={v => setForm(f => ({ ...f, description: v }))} />
          <Input label="Sort order" type="number" value={form.sortOrder ?? 0} onChange={v => setForm(f => ({ ...f, sortOrder: Number(v) }))} />
        </div>
        <div className="flex gap-2">
          <ActionButton variant="brand" loading={busy} onClick={save}>{editing ? 'Update' : 'Create'}</ActionButton>
          {editing && <ActionButton variant="default" onClick={() => { setEditing(null); setForm({}); }}>Cancel</ActionButton>}
        </div>
      </div>

      {loading ? (
        <LoadingArea label="Loading categories..." />
      ) : items.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories yet" />
      ) : (
        <div className="space-y-4">
          {items.map(c => (
            <div key={c.id} className="bg-cardBg border border-borderBg rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{c.name}</h3>
                    {c.isActive ? <Badge color="green">Active</Badge> : <Badge color="red">Hidden</Badge>}
                    <Badge color="gray">{c._count?.listings ?? 0} listings</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">/{c.slug} · {c.description || 'No description'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <ActionButton variant="default" onClick={() => { setEditing(c); setForm(c); }}>Edit</ActionButton>
                  <ActionButton variant="warning" onClick={() => toggleActive(c)}>{c.isActive ? 'Hide' : 'Show'}</ActionButton>
                  <ActionButton variant="danger" onClick={() => remove(c.id)}><Trash2 className="w-3.5 h-3.5" /></ActionButton>
                </div>
              </div>

              {c.subcategories?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.subcategories.map(s => (
                    <span key={s.id} className="inline-flex items-center gap-2 bg-white/5 border border-borderBg rounded-full px-3 py-1 text-xs text-gray-300">
                      {s.name}
                      <button onClick={() => removeSub(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-white">Add Subcategory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={subForm.categoryId} onChange={e => setSubForm(f => ({ ...f, categoryId: e.target.value }))} className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
            <option value="">Select category...</option>
            {items.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input label="Name" value={subForm.name} onChange={v => setSubForm(f => ({ ...f, name: v }))} />
          <Input label="Slug" value={subForm.slug} onChange={v => setSubForm(f => ({ ...f, slug: v }))} />
        </div>
        <ActionButton variant="brand" loading={busy} onClick={addSub}>Add Subcategory</ActionButton>
      </div>
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
