'use client';

import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, RefreshCw, Pencil, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadFileWithKey } from '@/lib/upload';
import { LoadingArea } from '@/components/LoadingLogo';
import { GAME_LIST } from '@/lib/games';

interface GameBanner {
  id: string;
  gameName: string;
  gameSlug: string;
  bannerUrl: string;
  bannerKey?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = {
  gameName: GAME_LIST[0]?.name ?? '',
  gameSlug: GAME_LIST[0]?.slug ?? '',
  bannerUrl: '',
  bannerKey: '',
  color: '',
  isActive: true,
  sortOrder: 0,
};

export default function GameBannersAdminPage() {
  const [banners, setBanners] = useState<GameBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: GameBanner[] }>('/game-banners/all');
      setBanners((res as any).data ?? []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setPreviewUrl('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (b: GameBanner) => {
    setEditId(b.id);
    setForm({
      gameName: b.gameName,
      gameSlug: b.gameSlug,
      bannerUrl: b.bannerUrl,
      bannerKey: b.bannerKey ?? '',
      color: b.color ?? '',
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    });
    setPreviewUrl(b.bannerUrl);
    setError('');
    setShowForm(true);
  };

  const handleGameChange = (gameName: string) => {
    const g = GAME_LIST.find(gl => gl.name === gameName);
    setForm(f => ({
      ...f,
      gameName,
      gameSlug: g?.slug ?? gameName.toLowerCase().replace(/\s+/g, '-'),
      color: g?.color ?? f.color,
    }));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const { key, url } = await uploadFileWithKey(file, 'banners');
      setForm(f => ({ ...f, bannerUrl: url, bannerKey: key }));
      setPreviewUrl(url);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.gameName || !form.bannerUrl) {
      setError('Game and banner image are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await api.patch(`/game-banners/${editId}`, {
          bannerUrl: form.bannerUrl,
          bannerKey: form.bannerKey || undefined,
          color: form.color || undefined,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
        });
      } else {
        await api.post('/game-banners', form);
      }
      setShowForm(false);
      setEditId(null);
      fetchBanners();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (b: GameBanner) => {
    try {
      await api.patch(`/game-banners/${b.id}`, { isActive: !b.isActive });
      setBanners(prev => prev.map(x => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
    } catch (e: any) {
      setError(e.message ?? 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner? Listings showing this game will fall back to the default gradient.')) return;
    try {
      await api.delete(`/game-banners/${id}`);
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (e: any) {
      setError(e.message ?? 'Delete failed');
    }
  };

  // Map which games already have a banner
  const coveredGames = new Set(banners.map(b => b.gameName));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand" /> Game Banners
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Per-game banner images shown on all listings for that game. Replaces manual image uploads by sellers.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBanners} className="text-gray-400 hover:text-white transition p-2" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>
      </div>

      {/* Global error */}
      {error && !showForm && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl flex justify-between items-center">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-cardBg border border-brand/30 rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-white">{editId ? 'Edit Banner' : 'New Game Banner'}</h2>
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Game picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Game *</label>
              <select
                value={form.gameName}
                disabled={!!editId}
                onChange={e => handleGameChange(e.target.value)}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition disabled:opacity-60"
              >
                {GAME_LIST.map(g => (
                  <option key={g.slug} value={g.name} disabled={!editId && coveredGames.has(g.name)}>
                    {g.name}{!editId && coveredGames.has(g.name) ? ' (already set)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Color override */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Brand Color (hex, optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color || '#6366f1'}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-borderBg bg-background cursor-pointer"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="#6366f1"
                  className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition"
                />
              </div>
            </div>

            {/* Sort order */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm text-gray-300">Active (shown on listings)</span>
              </label>
            </div>
          </div>

          {/* Banner image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Banner Image *</label>
            <label className="flex items-center gap-3 cursor-pointer bg-background border border-dashed border-borderBg hover:border-brand/60 rounded-xl px-4 py-4 text-sm text-gray-400 transition group">
              <ImageIcon className="w-5 h-5 text-gray-500 group-hover:text-brand transition flex-shrink-0" />
              {uploading
                ? <span className="text-brand animate-pulse">Uploading…</span>
                : form.bannerUrl
                  ? <span className="text-white truncate">Banner uploaded ✓</span>
                  : <span>Click to upload banner image (PNG / JPG / WebP, 1920×480 recommended)</span>
              }
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
              />
            </label>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden border border-borderBg" style={{ background: form.color ? `${form.color}22` : undefined }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Banner preview"
                className="w-full h-44 object-cover"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                {form.gameName}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || uploading || !form.bannerUrl}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving…' : editId ? 'Update Banner' : 'Save Banner'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); setError(''); }}
              className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Banners list */}
      {loading ? (
        <LoadingArea label="Loading game banners…" />
      ) : banners.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No game banners yet.</p>
          <p className="text-gray-500 text-xs mt-1">Listings will show a game-colored gradient until you add banners here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div
              key={b.id}
              className="bg-cardBg border border-borderBg rounded-2xl p-4 flex items-center gap-4 group"
            >
              {/* Banner thumbnail */}
              <div
                className="w-28 h-16 rounded-xl overflow-hidden flex-shrink-0 relative"
                style={{ background: b.color ? `${b.color}33` : 'var(--color-card)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.bannerUrl}
                  alt={b.gameName}
                  className="w-full h-full object-cover"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
                {b.color && (
                  <span
                    className="absolute top-1 left-1 w-3 h-3 rounded-full border-2 border-white/30"
                    style={{ background: b.color }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{b.gameName}</p>
                <p className="text-xs text-gray-500">/{b.gameSlug} · order: {b.sortOrder}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(b)}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition ${
                    b.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-red-500/20 hover:text-red-300'
                      : 'bg-gray-700 text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                  }`}
                  title={b.isActive ? 'Click to deactivate' : 'Click to activate'}
                >
                  {b.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {b.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="p-1.5 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-1.5 text-red-400 hover:text-red-300 transition rounded-lg hover:bg-red-500/10"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coverage summary */}
      {!loading && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 mb-3">Coverage ({coveredGames.size}/{GAME_LIST.length} games)</p>
          <div className="flex flex-wrap gap-2">
            {GAME_LIST.map(g => (
              <span
                key={g.slug}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                  coveredGames.has(g.name)
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-gray-700/40 text-gray-500 border-borderBg'
                }`}
              >
                {g.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
