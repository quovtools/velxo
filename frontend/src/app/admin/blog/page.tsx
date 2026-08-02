'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Send, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, EmptyState, ErrorBanner, ActionButton, PageHeader, RefreshButton,
  AdminInput, AdminTextarea, Card,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Post {
  id: string; title: string; slug: string; excerpt: string; content: string;
  category: string; author: string; coverImage?: string; readTime?: string;
  isPublished: boolean; isFeatured: boolean; publishedAt?: string; createdAt: string;
}

const emptyForm: Partial<Post> = {
  title: '', slug: '', excerpt: '', content: '',
  category: 'Platform', author: '', coverImage: '', readTime: '5 min read', isFeatured: false,
};

export default function AdminBlogPage() {
  const [items, setItems]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState<Partial<Post>>(emptyForm);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy]       = useState(false);

  const fetchItems = async () => {
    setLoading(true); setError('');
    try { const res: any = await api.get('/admin/blog'); setItems(res.data || res || []); }
    catch (e: any) { setError(e.message || 'Failed to load posts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const save = async (publish?: boolean) => {
    if (!form.title || !form.slug || !form.content) { setError('Title, slug and content are required'); return; }
    setBusy(true); setError('');
    try {
      const payload = { ...form, isPublished: publish !== undefined ? publish : (editing?.isPublished ?? false) };
      if (editing) { await api.patch(`/admin/blog/${editing.id}`, payload); }
      else { await api.post('/admin/blog', payload); }
      setForm(emptyForm); setEditing(null); setShowForm(false);
      await fetchItems();
    } catch (e: any) { setError(e.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const remove  = async (id: string) => { if (!window.confirm('Delete post?')) return; try { await api.delete(`/admin/blog/${id}`); await fetchItems(); } catch (e: any) { setError(e.message); } };
  const pub     = async (p: Post, v: boolean) => { try { await api.patch(`/admin/blog/${p.id}`, { isPublished: v }); await fetchItems(); } catch (e: any) { setError(e.message); } };
  const feature = async (p: Post) => { try { await api.patch(`/admin/blog/${p.id}`, { isFeatured: !p.isFeatured }); await fetchItems(); } catch (e: any) { setError(e.message); } };

  const F = (k: keyof Post) => (v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <PageHeader icon={FileText} title="Blog" subtitle="Write and publish platform news & guides."
        action={
          <div className="flex gap-2">
            <RefreshButton onClick={fetchItems} loading={loading} />
            <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setError(''); }}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm shadow-violet-500/20">
              <Plus className="w-3.5 h-3.5" />New Post
            </button>
          </div>
        } />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {showForm && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{editing ? 'Edit Post' : 'New Post'}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }}
              className="p-1 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminInput label="Title *" value={form.title||''} onChange={e => F('title')(e.target.value)} placeholder="Post title" />
            <AdminInput label="Slug *" value={form.slug||''} onChange={e => F('slug')(e.target.value)} placeholder="post-slug" />
            <AdminInput label="Category" value={form.category||''} onChange={e => F('category')(e.target.value)} />
            <AdminInput label="Author" value={form.author||''} onChange={e => F('author')(e.target.value)} />
            <AdminInput label="Cover image URL" value={form.coverImage||''} onChange={e => F('coverImage')(e.target.value)} />
            <AdminInput label="Read time" value={form.readTime||''} onChange={e => F('readTime')(e.target.value)} placeholder="5 min read" />
          </div>
          <AdminInput label="Excerpt" value={form.excerpt||''} onChange={e => F('excerpt')(e.target.value)} placeholder="Short description…" />
          <AdminTextarea label="Content (Markdown) *" value={form.content||''} onChange={e => F('content')(e.target.value)} rows={8} placeholder="## Heading&#10;&#10;Content here…" />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
            <input type="checkbox" checked={!!form.isFeatured} onChange={e => F('isFeatured')(e.target.checked)} className="w-4 h-4 accent-violet-500" />
            Mark as featured
          </label>
          <div className="flex gap-2 flex-wrap">
            <ActionButton variant="default" loading={busy} onClick={() => save()}>Save Draft</ActionButton>
            <ActionButton variant="brand" loading={busy} onClick={() => save(true)}><Send className="w-3 h-3" />Publish</ActionButton>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-white transition">Cancel</button>
          </div>
        </Card>
      )}

      {loading ? <LoadingArea label="Loading posts…" /> : items.length === 0 ? (
        <EmptyState icon={FileText} title="No blog posts yet" subtitle="Create your first post above." />
      ) : (
        <div className="space-y-2">
          {items.map(p => (
            <div key={p.id} className="bg-[#111118] border border-white/8 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-white/16 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white truncate">{p.title}</p>
                  {p.isPublished ? <Badge color="green">Published</Badge> : <Badge color="gray">Draft</Badge>}
                  {p.isFeatured && <Badge color="violet">Featured</Badge>}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5">{p.slug} · {p.category}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap flex-shrink-0">
                <ActionButton variant="default" onClick={() => { setEditing(p); setForm(p); setShowForm(true); }}>Edit</ActionButton>
                {p.isPublished
                  ? <ActionButton variant="warning" onClick={() => pub(p, false)}>Unpublish</ActionButton>
                  : <ActionButton variant="success" onClick={() => pub(p, true)}>Publish</ActionButton>}
                <ActionButton variant="brand" onClick={() => feature(p)}>
                  {p.isFeatured ? 'Unfeature' : 'Feature'}
                </ActionButton>
                <ActionButton variant="danger" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
