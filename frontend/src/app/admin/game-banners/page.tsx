'use client';

import React, { useEffect, useState } from 'react';
import { ImageIcon, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadFileWithKey } from '@/lib/upload';
import { EmptyState, ErrorBanner, PageHeader, RefreshButton, AdminInput, Card } from '@/components/admin/ui';
import { GAME_LIST } from '@/lib/games';
import { LoadingArea } from '@/components/LoadingLogo';

interface GameBanner {
  id: string; gameName: string; gameSlug: string; bannerUrl: string;
  bannerKey?: string; color?: string; isActive: boolean; sortOrder: number;
}

const emptyForm = {
  gameName: GAME_LIST[0]?.name ?? '', gameSlug: GAME_LIST[0]?.slug ?? '',
  bannerUrl: '', bannerKey: '', color: '', isActive: true, sortOrder: 0,
};

export default function GameBannersAdminPage() {
  const [banners, setBanners]   = useState<GameBanner[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchBanners = async () => {
    setLoading(true);
    try { const res = await api.get<any>('/game-banners/all'); setBanners(res.data ?? []); }
    catch { setBanners([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchBanners(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setPreviewUrl(''); setError(''); setShowForm(true); };
  const openEdit   = (b: GameBanner) => {
    setEditId(b.id);
    setForm({ gameName: b.gameName, gameSlug: b.gameSlug, bannerUrl: b.bannerUrl, bannerKey: b.bannerKey ?? '', color: b.color ?? '', isActive: b.isActive, sortOrder: b.sortOrder });
    setPreviewUrl(b.bannerUrl); setError(''); setShowForm(true);
  };

  const handleGameChange = (gameName: string) => {
    const g = GAME_LIST.find(gl => gl.name === gameName);
    setForm(f => ({ ...f, gameName, gameSlug: g?.slug ?? gameName.toLowerCase().replace(/\s+/g,'-'), color: g?.color ?? f.color }));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true); setError('');
    try { const { key, url } = await uploadFileWithKey(file, 'banners'); setForm(f => ({ ...f, bannerUrl: url, bannerKey: key })); setPreviewUrl(url); }
    catch (e: any) { setError(e.message ?? 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.gameName || !form.bannerUrl) { setError('Game and banner image are required.'); return; }
    setSaving(true); setError('');
    try {
      if (editId) { await api.patch(`/game-banners/${editId}`, { bannerUrl: form.bannerUrl, bannerKey: form.bannerKey||undefined, color: form.color||undefined, isActive: form.isActive, sortOrder: form.sortOrder }); }
      else { await api.post('/game-banners', form); }
      setShowForm(false); setEditId(null); fetchBanners();
    } catch (e: any) { setError(e.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (b: GameBanner) => {
    try { await api.patch(`/game-banners/${b.id}`, { isActive: !b.isActive }); setBanners(p => p.map(x => x.id===b.id ? {...x, isActive: !x.isActive} : x)); }
    catch (e: any) { setError(e.message ?? 'Update failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try { await api.delete(`/game-banners/${id}`); setBanners(p => p.filter(b => b.id !== id)); }
    catch (e: any) { setError(e.message ?? 'Delete failed'); }
  };

  const coveredGames = new Set(banners.map(b => b.gameName));

  return (
    <div className="space-y-5">
      <PageHeader icon={ImageIcon} title="Game Banners" subtitle="Per-game banner images shown on all listings for that game."
        action={
          <div className="flex gap-2">
            <RefreshButton onClick={fetchBanners} loading={loading} />
            <button onClick={openCreate}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm shadow-violet-500/20">
              <Plus className="w-3.5 h-3.5" />Add Banner
            </button>
          </div>
        } />

      {error && !showForm && <ErrorBanner message={error} onClose={() => setError('')} />}

      {showForm && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{editId ? 'Edit Banner' : 'New Game Banner'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setError(''); }} className="p-1 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
          </div>
          {error && <ErrorBanner message={error} onClose={() => setError('')} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Game *</p>
              <select value={form.gameName} disabled={!!editId} onChange={e => handleGameChange(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60 transition disabled:opacity-50">
                {GAME_LIST.map(g => (
                  <option key={g.slug} value={g.name} disabled={!editId && coveredGames.has(g.name)}>
                    {g.name}{!editId && coveredGames.has(g.name) ? ' (set)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Brand color (hex, optional)</p>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color||'#6366f1'} onChange={e => setForm(f => ({...f, color: e.target.value}))}
                  className="w-9 h-9 rounded-lg border border-white/10 bg-[#0a0a0f] cursor-pointer" />
                <AdminInput value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} placeholder="#6366f1" />
              </div>
            </div>
            <AdminInput label="Sort order" type="number" value={form.sortOrder} onChange={e => setForm(f => ({...f, sortOrder: Number(e.target.value)}))} />
            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="w-4 h-4 accent-violet-500" />
                Active (shown on listings)
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Banner image * (1920×480 recommended)</p>
            <label className="flex items-center gap-3 cursor-pointer bg-[#0a0a0f] border border-dashed border-white/10 hover:border-violet-500/40 rounded-xl px-4 py-4 text-xs text-gray-500 transition group">
              <ImageIcon className="w-4 h-4 group-hover:text-violet-400 transition flex-shrink-0" />
              {uploading ? <span className="text-violet-400 animate-pulse">Uploading…</span>
                : form.bannerUrl ? <span className="text-white">Banner uploaded ✓</span>
                : <span>Click to upload banner (PNG / JPG / WebP)</span>}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            </label>
          </div>

          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden border border-white/8" style={{ background: form.color ? `${form.color}22` : undefined }}>
              <img src={previewUrl} alt="preview" className="w-full h-40 object-cover" onError={e => (e.currentTarget.style.display='none')} />
              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">{form.gameName}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || uploading || !form.bannerUrl}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition disabled:opacity-40">
              <Check className="w-3.5 h-3.5" />{saving ? 'Saving…' : editId ? 'Update' : 'Save Banner'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setError(''); }} className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-xl transition">Cancel</button>
          </div>
        </Card>
      )}

      {loading ? <LoadingArea label="Loading banners…" /> : banners.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No game banners yet" subtitle="Listings will show colored gradients until banners are added." />
      ) : (
        <div className="space-y-2">
          {banners.map(b => (
            <div key={b.id} className="bg-[#111118] border border-white/8 rounded-2xl p-4 flex items-center gap-4 hover:border-white/16 transition-colors">
              <div className="w-24 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/8" style={{ background: b.color ? `${b.color}22` : undefined }}>
                <img src={b.bannerUrl} alt={b.gameName} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{b.gameName}</p>
                <p className="text-[11px] text-gray-600">/{b.gameSlug} · order: {b.sortOrder}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggle(b)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition ${
                    b.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'
                  }`}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => openEdit(b)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-gray-600 mb-3">Coverage ({coveredGames.size}/{GAME_LIST.length} games)</p>
          <div className="flex flex-wrap gap-1.5">
            {GAME_LIST.map(g => (
              <span key={g.slug} className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${
                coveredGames.has(g.name) ? 'bg-emerald-500/8 text-emerald-400 border-emerald-500/20' : 'bg-white/4 text-gray-600 border-white/8'
              }`}>{g.name}</span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
