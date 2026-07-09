'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Plus, RefreshCw, Trash2, Save, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, EmptyState, ErrorBanner, ActionButton } from '@/components/admin/ui';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  coverImage?: string;
  readTime?: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
}

export default function AdminBlogPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<Post>>({ title: '', slug: '', excerpt: '', content: '', category: 'Platform', coverImage: '', readTime: '5 min read', isFeatured: false });
  const [editing, setEditing] = useState<Post | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/blog');
      setItems(res.data || res || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const save = async (publish?: boolean) => {
    if (!form.title || !form.slug || !form.content) { setError('Title, slug and content are required'); return; }
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, isPublished: publish !== undefined ? publish : (editing?.isPublished ?? false) };
      if (editing) {
        await api.patch(`/admin/blog/${editing.id}`, payload);
      } else {
        await api.post('/admin/blog', payload);
      }
      setForm({ title: '', slug: '', excerpt: '', content: '', category: 'Platform', coverImage: '', readTime: '5 min read', isFeatured: false });
      setEditing(null);
      await fetchItems();
    } catch (e: any) { setError(e.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this blog post?')) return;
    setError('');
    try { await api.delete(`/admin/blog/${id}`); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const setPublish = async (p: Post, value: boolean) => {
    setError('');
    try { await api.patch(`/admin/blog/${p.id}`, { isPublished: value }); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  const toggleFeature = async (p: Post) => {
    setError('');
    try { await api.patch(`/admin/blog/${p.id}`, { isFeatured: !p.isFeatured }); await fetchItems(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" /> Blog Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Write and publish platform news &amp; guides.</p>
        </div>
        <button onClick={fetchItems} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-white">{editing ? `Edit ${editing.title}` : 'New Post'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Category" value={form.category || ''} onChange={v => setForm(f => ({ ...f, category: v }))} />
          <Input label="Author" value={form.author || ''} onChange={v => setForm(f => ({ ...f, author: v }))} />
          <Input label="Cover image URL" value={form.coverImage || ''} onChange={v => setForm(f => ({ ...f, coverImage: v }))} />
          <Input label="Read time" value={form.readTime || ''} onChange={v => setForm(f => ({ ...f, readTime: v }))} />
        </div>
        <Input label="Excerpt" value={form.excerpt || ''} onChange={v => setForm(f => ({ ...f, excerpt: v }))} />
        <label className="flex items-center gap-2 text-sm text-gray-300 mt-1">
          <input type="checkbox" checked={!!form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="accent-brand" />
          Mark as featured
        </label>
        <label className="block">
          <span className="text-xs text-gray-400">Content (Markdown)</span>
          <textarea
            value={form.content || ''}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={6}
            className="mt-1 w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
          />
        </label>
        <div className="flex gap-2 flex-wrap">
          <ActionButton variant="brand" loading={busy} onClick={() => save()}>Save Draft</ActionButton>
          <ActionButton variant="success" loading={busy} onClick={() => save(true)}><Send className="w-3.5 h-3.5" /> Publish</ActionButton>
          {editing && <ActionButton variant="default" onClick={() => { setEditing(null); setForm({ title: '', slug: '', excerpt: '', content: '', category: 'Platform', coverImage: '', readTime: '5 min read', isFeatured: false }); }}>Cancel</ActionButton>}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="No blog posts" />
      ) : (
        <div className="space-y-3">
          {items.map(p => (
            <div key={p.id} className="bg-cardBg border border-borderBg rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white truncate">{p.title}</h3>
                  {p.isPublished ? <Badge color="green">Published</Badge> : <Badge color="gray">Draft</Badge>}
                  {p.isFeatured && <Badge color="brand">Featured</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{p.slug} · {p.category}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <ActionButton variant="default" onClick={() => { setEditing(p); setForm(p); }}>Edit</ActionButton>
                {p.isPublished ? (
                  <ActionButton variant="warning" onClick={() => setPublish(p, false)}>Unpublish</ActionButton>
                ) : (
                  <ActionButton variant="success" onClick={() => setPublish(p, true)}>Publish</ActionButton>
                )}
                <ActionButton variant="brand" onClick={() => toggleFeature(p)}>Feature</ActionButton>
                <ActionButton variant="danger" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5" /></ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
      />
    </label>
  );
}
