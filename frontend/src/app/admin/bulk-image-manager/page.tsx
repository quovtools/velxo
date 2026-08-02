'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Check, X, Search, RefreshCw, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, AdminInput, AdminSelect, ErrorBanner } from '@/components/admin/ui';

interface ImageFile { file: File; preview: string; uploaded: boolean; url?: string; error?: string; }
interface Listing {
  id: string; title: string; price: number; gameName?: string;
  images?: string[]; seller?: { storeName?: string };
}

export default function BulkImageManagerPage() {
  const [images, setImages]   = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [listings, setListings]   = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [strategy, setStrategy] = useState<'rotate'|'all'|'first'|'random'>('rotate');
  const [assigning, setAssigning] = useState(false);
  const [result, setResult]   = useState<{ updated: number; failed: number } | null>(null);
  const [error, setError]     = useState('');

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const params = new URLSearchParams({ status: 'ACTIVE', limit: '200' });
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get<any>(`/admin/listings?${params}`);
      setListings(res.data || []);
    } catch (e: any) { setError(e.message || 'Failed to load listings'); }
    finally { setLoadingListings(false); }
  }, [search]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handleFiles = (files: File[]) => {
    setImages(p => [...p, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), uploaded: false }))]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  };

  const removeImage = (i: number) => setImages(p => { const n = [...p]; URL.revokeObjectURL(n[i].preview); n.splice(i,1); return n; });

  const uploadImages = async () => {
    setUploading(true);
    for (let i = 0; i < images.length; i++) {
      if (images[i].uploaded) continue;
      setImages(p => { const n=[...p]; n[i]={...n[i]}; return n; });
      try {
        const base64 = await new Promise<string>((res, rej) => {
          const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(images[i].file);
        });
        setImages(p => { const n=[...p]; n[i]={...n[i], uploaded:true, url:base64}; return n; });
      } catch {
        setImages(p => { const n=[...p]; n[i]={...n[i], error:'Failed'}; return n; });
      }
    }
    setUploading(false);
  };

  const toggleListing = (id: string) => setSelected(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size===listings.length ? new Set() : new Set(listings.map(l=>l.id)));

  const assignImages = async () => {
    const urls = images.filter(i => i.uploaded && i.url).map(i => i.url!);
    if (!urls.length) { setError('Upload images first.'); return; }
    if (!selected.size) { setError('Select at least one listing.'); return; }
    setAssigning(true); setError(''); setResult(null);
    try {
      const res = await api.post<any>('/admin/bulk/images/update-listings', { imageUrls: urls, listingIds: Array.from(selected), strategy });
      setResult(res.data);
      setSelected(new Set());
    } catch (e: any) { setError(e.message || 'Assignment failed'); }
    finally { setAssigning(false); }
  };

  const uploadedCount = images.filter(i => i.uploaded).length;

  return (
    <div className="space-y-5">
      <PageHeader icon={Upload} title="Bulk Image Manager" subtitle="Upload images, select listings, then assign in one click." />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Step 1 */}
      <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
          <h2 className="text-sm font-semibold text-white">Upload Images</h2>
        </div>

        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-white/8 hover:border-violet-500/30 rounded-xl p-8 text-center transition cursor-pointer group">
          <input type="file" multiple accept="image/*" className="hidden" id="imgUpload"
            onChange={e => handleFiles(Array.from(e.target.files||[]))} />
          <label htmlFor="imgUpload" className="cursor-pointer block">
            <Upload className="w-8 h-8 text-gray-600 group-hover:text-violet-400 mx-auto mb-2 transition" />
            <p className="text-sm text-white">Drop images or click to browse</p>
            <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP, GIF</p>
          </label>
        </div>

        {images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">{images.length} image{images.length!==1?'s':''} · {uploadedCount} uploaded</span>
              <button onClick={uploadImages} disabled={uploading || uploadedCount===images.length}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition disabled:opacity-40">
                {uploading ? 'Uploading…' : 'Upload All'}
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-white/8">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    {img.uploaded && <Check className="w-5 h-5 text-emerald-400" />}
                    {img.error && <X className="w-5 h-5 text-red-400" />}
                  </div>
                  <button onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
            <h2 className="text-sm font-semibold text-white">
              Select Listings
              {selected.size > 0 && <span className="ml-2 text-xs text-violet-400 font-normal">({selected.size} selected)</span>}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <AdminInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8 w-44" />
            </div>
            <button onClick={loadListings} disabled={loadingListings}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingListings?'animate-spin':''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-2 border-b border-white/6">
          <input type="checkbox" id="selAll" checked={listings.length>0 && selected.size===listings.length}
            onChange={toggleAll} className="w-4 h-4 rounded cursor-pointer accent-violet-500" />
          <label htmlFor="selAll" className="text-xs text-gray-400 cursor-pointer select-none">
            {selected.size===listings.length && listings.length>0 ? 'Deselect all' : `Select all ${listings.length}`}
          </label>
          {selected.size>0 && selected.size<listings.length && (
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-600 hover:text-white ml-auto transition">Clear</button>
          )}
        </div>

        {loadingListings ? (
          <p className="text-center text-gray-600 text-xs py-6">Loading…</p>
        ) : listings.length === 0 ? (
          <p className="text-center text-gray-600 text-xs py-6">No active listings found</p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-0.5 pr-1">
            {listings.map(l => (
              <label key={l.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${
                  selected.has(l.id) ? 'bg-violet-600/8 border border-violet-500/20' : 'hover:bg-white/4 border border-transparent'}`}>
                <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleListing(l.id)}
                  className="w-4 h-4 rounded accent-violet-500 flex-shrink-0" />
                {l.images?.[0]
                  ? <img src={l.images[0]} alt="" className="w-8 h-8 object-cover rounded-lg flex-shrink-0 border border-white/8" />
                  : <div className="w-8 h-8 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center"><Eye className="w-3 h-3 text-gray-600" /></div>}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate">{l.title}</p>
                  <p className="text-[11px] text-gray-600 truncate">{l.gameName && `${l.gameName} · `}${l.seller?.storeName || ''}</p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">${l.price}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Step 3 */}
      <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
          <h2 className="text-sm font-semibold text-white">Strategy & Assign</h2>
        </div>

        <AdminSelect label="Assignment strategy" value={strategy} onChange={e => setStrategy(e.target.value as any)} className="max-w-sm">
          <option value="rotate">Rotate — cycle images across listings</option>
          <option value="all">All — assign every image to each listing</option>
          <option value="first">First — assign only the first image</option>
          <option value="random">Random — pick a random image per listing</option>
        </AdminSelect>

        <button onClick={assignImages} disabled={assigning || !images.some(i=>i.uploaded) || selected.size===0}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40 shadow-sm shadow-emerald-500/20">
          {assigning ? 'Assigning…' : `Assign to ${selected.size||'—'} listing${selected.size!==1?'s':''}`}
        </button>

        {result && (
          <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-300">Assignment complete</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">{result.updated} updated{result.failed>0 ? ` · ${result.failed} failed` : ''}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
