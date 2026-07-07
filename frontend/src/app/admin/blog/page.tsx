'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { PlusCircle, Pencil, Trash2, Eye, EyeOff, Star, StarOff, ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string; title: string; slug: string; excerpt: string; content: string;
  category: string; author: string; coverImage?: string; isPublished: boolean;
  isFeatured: boolean; readTime?: string; publishedAt?: string; createdAt: string;
}

const EMPTY: Partial<Post> = {
  title: '', slug: '', excerpt: '', content: '', category: 'Platform',
  author: 'Velxo Team', coverImage: '', isPublished: false, isFeatured: false, readTime: '5 min read',
};

export default function AdminBlogPage() {
  const { user } = useAuth();
  const role = (user as any)?.role;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Post>>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return <div className="text-center py-20 text-red-400 font-bold">Access Denied</div>;
  }

  async function load() {
    try {
      const res = await api.get<{ data: Post[] }>('/blog/all');
      setPosts(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function notify(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  }

  function openEdit(p: Post) {
    setForm({ ...p });
    setEditId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openNew() {
    setForm({ ...EMPTY });
    setEditId(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.slug || !form.content) return notify('Title, slug and content are required.', false);
    setSaving(true);
    try {
      if (editId) { await api.patch(`/blog/${editId}`, form); notify('Post updated.'); }
      else { await api.post('/blog', form); notify('Post created.'); }
      setShowForm(false);
      await load();
    } catch (err: any) { notify(err.message || 'Failed.', false); }
    finally { setSaving(false); }
  }

  async function toggle(p: Post, field: 'isPublished' | 'isFeatured') {
    try {
      await api.patch(`/blog/${p.id}`, { [field]: !p[field] });
      await load();
    } catch (err: any) { notify(err.message || 'Failed', false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    try { await api.delete(`/blog/${id}`); notify('Deleted.'); await load(); }
    catch (err: any) { notify(err.message || 'Failed', false); }
  }

  function slugify(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  return (
    <div className="space-y-6 my-6">
      <div className="flex items-center justify-between border-b border-borderBg pb-5">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-extrabold text-white">Blog Posts</h1>
          <span className="text-xs bg-brand/10 text-brand-light border border-brand/20 px-2 py-0.5 rounded-full">{posts.length} posts</span>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-xl text-sm font-bold text-white transition">
          <PlusCircle className="w-4 h-4" /> New Post
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-300' : 'bg-red-950/30 border border-red-500/30 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{editId ? 'Edit Post' : 'New Post'}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title *</label>
                <input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  placeholder="Post title" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slug *</label>
                <input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand font-mono"
                  placeholder="post-slug" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Excerpt *</label>
              <textarea value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand h-20 resize-none"
                placeholder="Short summary shown in listing" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content (Markdown/HTML) *</label>
              <textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand h-48 resize-none font-mono"
                placeholder="Full post content..." required />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                <select value={form.category || 'Platform'} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand">
                  {['Platform', 'Sellers', 'Safety', 'Guides', 'News'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Author</label>
                <input value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Read Time</label>
                <input value={form.readTime || ''} onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                  placeholder="5 min read"
                  className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cover Image URL</label>
                <input value={form.coverImage || ''} onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-brand w-4 h-4" />
                <span className="text-sm text-gray-300">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-brand w-4 h-4" />
                <span className="text-sm text-gray-300">Featured</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : editId ? 'Update Post' : 'Publish Post'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-borderBg text-gray-400 hover:text-white rounded-xl text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-cardBg border border-borderBg rounded-2xl h-20 animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-cardBg border border-borderBg rounded-2xl text-gray-400 text-sm">No posts yet. Click &quot;New Post&quot; to create your first article.</div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="bg-cardBg border border-borderBg rounded-2xl px-5 py-4 flex items-center gap-4">
              {p.coverImage && <img src={p.coverImage} alt="" className="w-16 h-10 rounded-lg object-cover flex-shrink-0 border border-borderBg" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-white text-sm truncate">{p.title}</p>
                  {p.isFeatured && <span className="text-[10px] bg-brand/10 text-brand-light border border-brand/20 px-2 py-0.5 rounded-full flex-shrink-0">Featured</span>}
                  {!p.isPublished && <span className="text-[10px] bg-gray-700 text-gray-400 border border-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">Draft</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{p.excerpt}</p>
                <p className="text-[10px] text-gray-700 mt-0.5">{p.category} · {p.readTime} · {p.author}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggle(p, 'isPublished')} title={p.isPublished ? 'Unpublish' : 'Publish'}
                  className={`p-1.5 rounded-lg transition ${p.isPublished ? 'text-emerald-400 hover:bg-emerald-950/30' : 'text-gray-600 hover:bg-background'}`}>
                  {p.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => toggle(p, 'isFeatured')} title={p.isFeatured ? 'Unfeature' : 'Feature'}
                  className={`p-1.5 rounded-lg transition ${p.isFeatured ? 'text-yellow-400 hover:bg-yellow-950/30' : 'text-gray-600 hover:bg-background'}`}>
                  {p.isFeatured ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-white hover:bg-background rounded-lg transition">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:bg-red-950/30 rounded-lg transition">
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
