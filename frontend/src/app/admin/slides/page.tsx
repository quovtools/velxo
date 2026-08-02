'use client';

import React, { useEffect, useState } from 'react';
import { ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadListingImage } from '@/lib/upload';
import { EmptyState, ErrorBanner, PageHeader, RefreshButton, AdminInput, Card } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Slide {
  id?: string; title: string; subtitle: string; imageUrl: string;
  linkHref: string; badge: string; isActive: boolean; sortOrder: number;
}

const empty: Omit<Slide,'id'> = { title:'', subtitle:'', imageUrl:'', linkHref:'', badge:'', isActive:true, sortOrder:0 };

export default function SlidesPage() {
  const [slides, setSlides]     = useState<Slide[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/slides/all');
      setSlides(res.data || []);
    } catch { try { const r = await api.get<any>('/slides'); setSlides(r.data || []); } catch { setSlides([]); } }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSlides(); }, []);

  const F = (k: keyof Slide) => (v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.imageUrl) return;
    setSaving(true); setError('');
    try { await api.post('/slides', form); setShowForm(false); setForm(empty); fetchSlides(); }
    catch (e: any) { setError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    try { await api.delete(`/slides/${id}`); setSlides(s => s.filter(x => x.id !== id)); }
    catch (e: any) { setError(e.message || 'Failed to delete'); }
  };

  const handleToggle = async (slide: Slide) => {
    try { await api.patch(`/slides/${slide.id}`, { isActive: !slide.isActive }); setSlides(s => s.map(x => x.id === slide.id ? { ...x, isActive: !x.isActive } : x)); }
    catch (e: any) { setError(e.message || 'Failed to update'); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={ImageIcon} title="Hero Slides" subtitle="Manage the homepage hero banner slideshow."
        action={
          <div className="flex gap-2">
            <RefreshButton onClick={fetchSlides} loading={loading} />
            <button onClick={() => { setShowForm(true); setError(''); }}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm shadow-violet-500/20">
              <Plus className="w-3.5 h-3.5" />Add Slide
            </button>
          </div>
        } />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {showForm && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">New Slide</h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminInput label="Title *" value={form.title} onChange={e => F('title')(e.target.value)} placeholder="e.g. Free Fire Season 8" />
            <AdminInput label="Subtitle" value={form.subtitle} onChange={e => F('subtitle')(e.target.value)} placeholder="Short description" />
            <AdminInput label="Link URL" value={form.linkHref} onChange={e => F('linkHref')(e.target.value)} placeholder="/games/free-fire" />
            <AdminInput label="Badge" value={form.badge} onChange={e => F('badge')(e.target.value)} placeholder="e.g. NEW" />
            <AdminInput label="Sort order" type="number" value={form.sortOrder} onChange={e => F('sortOrder')(Number(e.target.value))} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Image *</p>
            <label className="flex items-center gap-2 cursor-pointer bg-[#0a0a0f] border border-white/10 hover:border-violet-500/40 rounded-xl px-4 py-3 text-xs text-gray-500 transition">
              <ImageIcon className="w-4 h-4 flex-shrink-0" />
              {form.imageUrl ? <span className="text-white truncate">Image selected ✓</span> : <span>Click to upload image…</span>}
              <input type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]; if (!file) return;
                  try { const url = await uploadListingImage(file); F('imageUrl')(url); }
                  catch (err: any) { setError(err.message || 'Upload failed'); }
                }} />
            </label>
          </div>
          {form.imageUrl && <img src={form.imageUrl} alt="preview" className="w-full h-36 object-cover rounded-xl border border-white/8" onError={e => (e.currentTarget.style.display='none')} />}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
            <input type="checkbox" checked={form.isActive} onChange={e => F('isActive')(e.target.checked)} className="w-4 h-4 accent-violet-500" />Active
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.title || !form.imageUrl}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition disabled:opacity-40">
              {saving ? 'Saving…' : 'Save Slide'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-xl transition">Cancel</button>
          </div>
        </Card>
      )}

      {loading ? <LoadingArea label="Loading slides…" /> : slides.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No slides yet" subtitle="Add your first homepage banner above." />
      ) : (
        <div className="space-y-2">
          {slides.map(slide => (
            <div key={slide.id} className="bg-[#111118] border border-white/8 rounded-2xl p-4 flex items-center gap-4 hover:border-white/16 transition-colors">
              {slide.imageUrl && (
                <img src={slide.imageUrl} alt={slide.title}
                  className="w-20 h-12 object-cover rounded-xl flex-shrink-0 border border-white/8"
                  onError={e => (e.currentTarget.style.display='none')} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{slide.title}</p>
                <p className="text-[11px] text-gray-600 truncate">{slide.subtitle}</p>
                {slide.badge && <span className="text-[10px] bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full mt-1 inline-block">{slide.badge}</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggle(slide)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition ${
                    slide.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'
                  }`}>
                  {slide.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handleDelete(slide.id!)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition">
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
