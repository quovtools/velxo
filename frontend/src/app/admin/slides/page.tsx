'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { Image, Plus, Trash2, Eye, EyeOff, GripVertical, Save, AlertOctagon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkHref?: string;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkHref: '',
  badge: '',
  isActive: true,
  sortOrder: 0,
};

export default function AdminSlidesPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return (
      <div className="text-center py-20">
        <AlertOctagon className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-white font-bold">Access Denied</p>
      </div>
    );
  }

  async function loadSlides() {
    try {
      const res = await api.get<{ success: boolean; data: Slide[] }>('/slides/all');
      if (res.success) setSlides(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSlides(); }, []);

  function notify(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM, sortOrder: slides.length });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(slide: Slide) {
    setForm({
      title: slide.title,
      subtitle: slide.subtitle || '',
      imageUrl: slide.imageUrl,
      linkHref: slide.linkHref || '',
      badge: slide.badge || '',
      isActive: slide.isActive,
      sortOrder: slide.sortOrder,
    });
    setEditId(slide.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.imageUrl) {
      notify('Title and Image URL are required.', true);
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/slides/${editId}`, form);
        notify('Slide updated successfully.');
      } else {
        await api.post('/slides', form);
        notify('Slide created successfully.');
      }
      setShowForm(false);
      setEditId(null);
      await loadSlides();
    } catch (err: any) {
      notify(err.message || 'Failed to save slide.', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this slide?')) return;
    try {
      await api.delete(`/slides/${id}`);
      notify('Slide deleted.');
      await loadSlides();
    } catch (err: any) {
      notify(err.message || 'Failed to delete slide.', true);
    }
  }

  async function toggleActive(slide: Slide) {
    try {
      await api.patch(`/slides/${slide.id}`, { isActive: !slide.isActive });
      notify(`Slide ${slide.isActive ? 'hidden' : 'shown'}.`);
      await loadSlides();
    } catch (err: any) {
      notify(err.message || 'Failed to update slide.', true);
    }
  }

  return (
    <div className="space-y-6 my-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderBg pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Image className="w-6 h-6 text-brand" />
              Homepage Slideshow
            </h1>
          </div>
          <p className="text-gray-400 text-sm">Manage the banner slides displayed on the homepage. Paste an image URL from any host.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl font-bold transition text-white text-sm"
        >
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-950/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm">{success}</div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-white">{editId ? 'Edit Slide' : 'New Slide'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Free Fire Diamond Sale"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtitle</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Buy diamonds with escrow protection"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Image URL *</label>
              <input
                type="url"
                required
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
              />
              {form.imageUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-borderBg h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Link URL</label>
                <input
                  type="text"
                  value={form.linkHref}
                  onChange={(e) => setForm({ ...form, linkHref: e.target.value })}
                  placeholder="/games/free-fire"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Badge Text</label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="🔥 Hot Deal"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-brand"
              />
              <label htmlFor="isActive" className="text-sm text-gray-300">Active (visible on homepage)</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-2.5 rounded-xl font-bold transition text-white text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editId ? 'Update Slide' : 'Create Slide'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-5 py-2.5 rounded-xl border border-borderBg text-gray-400 hover:text-white text-sm transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slides List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-cardBg border border-borderBg rounded-2xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-16 bg-cardBg border border-borderBg rounded-2xl">
          <Image className="w-12 h-12 text-brand/20 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No slides yet. Click &quot;Add Slide&quot; to create your first banner.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`bg-cardBg border rounded-2xl p-4 flex items-center gap-4 transition ${
                slide.isActive ? 'border-borderBg' : 'border-borderBg opacity-50'
              }`}
            >
              <GripVertical className="w-5 h-5 text-gray-600 flex-shrink-0 cursor-grab" />

              {/* Preview thumbnail */}
              <div className="w-20 h-12 rounded-lg overflow-hidden bg-background border border-borderBg flex-shrink-0">
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm truncate">{slide.title}</p>
                  {slide.badge && (
                    <span className="text-xs bg-brand/10 text-brand-light border border-brand/20 px-2 py-0.5 rounded-full flex-shrink-0">
                      {slide.badge}
                    </span>
                  )}
                </div>
                {slide.subtitle && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{slide.subtitle}</p>
                )}
                {slide.linkHref && (
                  <p className="text-xs text-brand-light truncate mt-0.5">→ {slide.linkHref}</p>
                )}
              </div>

              {/* Order badge */}
              <span className="text-xs text-gray-500 font-bold w-6 text-center flex-shrink-0">#{i + 1}</span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(slide)}
                  className={`p-2 rounded-lg transition ${
                    slide.isActive
                      ? 'text-emerald-400 hover:bg-emerald-950/30'
                      : 'text-gray-600 hover:bg-background'
                  }`}
                  title={slide.isActive ? 'Hide slide' : 'Show slide'}
                >
                  {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(slide)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-background transition text-xs font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-950/30 transition"
                  title="Delete slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div className="bg-background border border-borderBg rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="font-bold text-gray-400">💡 Tips</p>
        <p>• Recommended image size: <strong className="text-gray-300">1200 × 480px</strong> (landscape). JPG or WebP for best quality.</p>
        <p>• Use Supabase Storage, Cloudinary, Imgur, or any public image host and paste the direct image URL.</p>
        <p>• Slides auto-advance every 5 seconds on the homepage. Lower sort order = appears first.</p>
        <p>• Toggle the eye icon to show/hide a slide without deleting it.</p>
      </div>
    </div>
  );
}
