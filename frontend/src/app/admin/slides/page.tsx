'use client';

import React, { useEffect, useState } from 'react';
import { Image, Plus, Trash2, RefreshCw, GripVertical } from 'lucide-react';
import { api } from '@/lib/api';
import { fileToDataUrl } from '@/lib/file';

interface Slide {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkHref: string;
  badge: string;
  isActive: boolean;
  sortOrder: number;
}

const emptySlide: Omit<Slide, 'id'> = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkHref: '',
  badge: '',
  isActive: true,
  sortOrder: 0,
};

export default function SlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Slide, 'id'>>(emptySlide);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Slide[] }>('/slides/all');
      setSlides((res as any).data || []);
    } catch {
      // fallback to public endpoint
      try {
        const res = await api.get<{ data: Slide[] }>('/slides');
        setSlides((res as any).data || []);
      } catch {
        setSlides([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.imageUrl) return;
    setSaving(true);
    setSaveError('');
    try {
      await api.post('/slides', form);
      setShowForm(false);
      setForm(emptySlide);
      fetchSlides();
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    try {
      await api.delete(`/slides/${id}`);
      setSlides(s => s.filter(x => x.id !== id));
    } catch (e: any) {
      setSaveError(e.message || 'Failed to delete');
    }
  };

  const handleToggle = async (slide: Slide) => {
    try {
      await api.patch(`/slides/${slide.id}`, { isActive: !slide.isActive });
      setSlides(s => s.map(x => x.id === slide.id ? { ...x, isActive: !x.isActive } : x));
    } catch (e: any) {
      setSaveError(e.message || 'Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Image className="w-5 h-5 text-brand" /> Homepage Slides
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage the hero banner slideshow.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSlides} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowForm(true); setSaveError(''); }}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Add Slide
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-cardBg border border-brand/30 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white">New Slide</h2>
          {saveError && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl">{saveError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'title', label: 'Title *', placeholder: 'e.g. Free Fire Season 8' },
              { key: 'subtitle', label: 'Subtitle', placeholder: 'Short description' },
              { key: 'linkHref', label: 'Link URL', placeholder: '/games/free-fire' },
              { key: 'badge', label: 'Badge', placeholder: 'e.g. NEW' },
              { key: 'sortOrder', label: 'Sort Order', placeholder: '0' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
                <input
                  type={key === 'sortOrder' ? 'number' : 'text'}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: key === 'sortOrder' ? Number(e.target.value) : e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Image *</label>
              <label className="flex items-center gap-2 cursor-pointer bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-gray-400 focus-within:border-brand transition overflow-hidden">
                {form.imageUrl ? <span className="truncate text-white">Image selected</span> : <span>Choose image…</span>}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setForm(f => ({ ...f, imageUrl: await fileToDataUrl(file) }));
                  }}
                />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-brand"
              />
              <span className="text-sm text-gray-300">Active</span>
            </label>
          </div>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="preview" className="w-full h-40 object-cover rounded-xl border border-borderBg" onError={e => (e.currentTarget.style.display = 'none')} />
          )}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.title || !form.imageUrl} className="bg-brand hover:bg-brand-dark text-white text-sm font-bold px-5 py-2 rounded-xl transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Slide'}
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

      {/* Slides list */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading slides...</div>
      ) : slides.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No slides yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map(slide => (
            <div key={slide.id} className="bg-cardBg border border-borderBg rounded-2xl p-4 flex items-center gap-4">
              <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
              {slide.imageUrl && (
                <img src={slide.imageUrl} alt={slide.title} className="w-20 h-12 object-cover rounded-lg flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{slide.title}</p>
                <p className="text-xs text-gray-500 truncate">{slide.subtitle}</p>
                {slide.badge && <span className="mt-1 inline-block bg-brand/20 text-brand text-xs px-2 py-0.5 rounded-full">{slide.badge}</span>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleToggle(slide)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${slide.isActive ? 'bg-green-500/20 text-green-300 hover:bg-red-500/20 hover:text-red-300' : 'bg-gray-700 text-gray-400 hover:bg-green-500/20 hover:text-green-300'}`}
                >
                  {slide.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handleDelete(slide.id!)} className="text-red-400 hover:text-red-300 transition">
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
