'use client';

import React, { useEffect, useState } from 'react';
import { FolderTree, Trash2, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, EmptyState, ErrorBanner, ActionButton, PageHeader, RefreshButton, AdminInput, AdminSelect, Card } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Subcategory { id: string; name: string; slug: string; isActive: boolean; }
interface Category {
  id: string; name: string; slug: string; description?: string; icon?: string;
  imageUrl?: string; isActive: boolean; sortOrder: number;
  subcategories: Subcategory[]; _count?: { listings: number };
}

export default function AdminCategoriesPage() {
  const [items, setItems]     = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState<Partial<Category>>({});
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy]       = useState(false);
  const [subForm, setSubForm] = useState({ categoryId:'', name:'', slug:'' });
  const [showCatForm, setShowCatForm] = useState(false);

  const fetchItems = async () => {
    setLoading(true); setError('');
    try { const res: any = await api.get('/admin/categories'); setItems(Array.isArray(res.data) ? res.data : []); }
    catch (e: any) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const save = async () => {
    if (!form.name || !form.slug) { setError('Name and slug are required'); return; }
    setBusy(true); setError('');
    try {
      if (editing) { await api.patch(`/admin/categories/${editing.id}`, form); }
      else { await api.post('/admin/categories', form); }
      setForm({}); setEditing(null); setShowCatForm(false); await fetchItems();
    } catch (e: any) { setError(e.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this category and all its subcategories?')) return;
    try { await api.delete(`/admin/categories/${id}`); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const addSub = async () => {
    if (!subForm.categoryId || !subForm.name || !subForm.slug) return;
    setBusy(true);
    try { await api.post(`/admin/categories/${subForm.categoryId}/subcategories`, subForm); setSubForm({ categoryId:'', name:'', slug:'' }); await fetchItems(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const removeSub = async (id: string) => {
    if (!window.confirm('Delete subcategory?')) return;
    try { await api.delete(`/admin/subcategories/${id}`); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const toggleActive = async (c: Category) => {
    try { await api.patch(`/admin/categories/${c.id}`, { isActive: !c.isActive }); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const F = (k: keyof Category) => (v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <PageHeader icon={FolderTree} title="Categories" subtitle="Structure the marketplace catalog."
        action={
          <div className="flex gap-2">
            <RefreshButton onClick={fetchItems} loading={loading} />
            <button onClick={() => { setShowCatForm(true); setEditing(null); setForm({}); }}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm shadow-violet-500/20">
              <Plus className="w-3.5 h-3.5" />New Category
            </button>
          </div>
        } />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {showCatForm && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{editing ? `Edit ${editing.name}` : 'New Category'}</h2>
            <button onClick={() => { setShowCatForm(false); setEditing(null); setForm({}); }} className="p-1 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <AdminInput label="Name *" value={form.name||''} onChange={e => F('name')(e.target.value)} />
            <AdminInput label="Slug *" value={form.slug||''} onChange={e => F('slug')(e.target.value)} />
            <AdminInput label="Icon"   value={form.icon||''} onChange={e => F('icon')(e.target.value)} />
            <AdminInput label="Sort order" type="number" value={form.sortOrder??0} onChange={e => F('sortOrder')(Number(e.target.value))} />
          </div>
          <AdminInput label="Description" value={form.description||''} onChange={e => F('description')(e.target.value)} />
          <div className="flex gap-2">
            <ActionButton variant="brand" loading={busy} onClick={save}>{editing ? 'Update' : 'Create'}</ActionButton>
            <button onClick={() => { setShowCatForm(false); setEditing(null); setForm({}); }} className="text-gray-500 hover:text-white text-xs px-3 py-1.5 rounded-xl transition">Cancel</button>
          </div>
        </Card>
      )}

      {loading ? <LoadingArea label="Loading categories…" /> : items.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories yet" />
      ) : (
        <div className="space-y-3">
          {items.map(c => (
            <div key={c.id} className="bg-[#111118] border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    {c.isActive ? <Badge color="green">Active</Badge> : <Badge color="gray">Hidden</Badge>}
                    <Badge color="gray">{c._count?.listings ?? 0} listings</Badge>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">/{c.slug}{c.description ? ` · ${c.description}` : ''}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap flex-shrink-0">
                  <ActionButton variant="default" onClick={() => { setEditing(c); setForm(c); setShowCatForm(true); }}>Edit</ActionButton>
                  <ActionButton variant="warning" onClick={() => toggleActive(c)}>{c.isActive ? 'Hide' : 'Show'}</ActionButton>
                  <ActionButton variant="danger" onClick={() => remove(c.id)}><Trash2 className="w-3 h-3" /></ActionButton>
                </div>
              </div>
              {c.subcategories?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.subcategories.map(s => (
                    <span key={s.id} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1 text-[11px] text-gray-300">
                      {s.name}
                      <button onClick={() => removeSub(s.id)} className="text-red-400 hover:text-red-300 transition"><Trash2 className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add subcategory */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Add Subcategory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AdminSelect value={subForm.categoryId} onChange={e => setSubForm(f => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Select category…</option>
            {items.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </AdminSelect>
          <AdminInput placeholder="Name" value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} />
          <AdminInput placeholder="Slug" value={subForm.slug} onChange={e => setSubForm(f => ({ ...f, slug: e.target.value }))} />
        </div>
        <ActionButton variant="brand" loading={busy} onClick={addSub}>Add Subcategory</ActionButton>
      </Card>
    </div>
  );
}
