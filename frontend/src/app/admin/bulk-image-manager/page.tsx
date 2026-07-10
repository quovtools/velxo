'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Check, X, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';

interface ImageFile {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  gameName?: string;
  platform?: string;
  images?: string[];
  seller?: { storeName?: string; user?: { email?: string } };
}

export default function BulkImageManagerPage() {
  // ── Step 1: images ──────────────────────────────────────────────
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // ── Step 2: listing selection ───────────────────────────────────
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Step 3: assign ──────────────────────────────────────────────
  const [strategy, setStrategy] = useState<'rotate' | 'all' | 'first' | 'random'>('rotate');
  const [assigning, setAssigning] = useState(false);
  const [result, setResult] = useState<any>(null);

  // ── Load active listings ────────────────────────────────────────
  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const params = new URLSearchParams({ status: 'ACTIVE', limit: '200' });
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get<{ data: Listing[]; success: boolean }>(`/admin/listings?${params}`);
      setListings((res as any).data || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoadingListings(false);
    }
  }, [search]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // ── File handling ───────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [
      ...prev,
      ...files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
      })),
    ]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setImages(prev => [
      ...prev,
      ...files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
      })),
    ]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  // ── Upload images (base64 for now) ──────────────────────────────
  const uploadImages = async () => {
    setUploading(true);
    for (let i = 0; i < images.length; i++) {
      if (images[i].uploaded) continue;
      setImages(prev => { const n = [...prev]; n[i] = { ...n[i], uploading: true }; return n; });
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(images[i].file);
        });
        setImages(prev => { const n = [...prev]; n[i] = { ...n[i], uploading: false, uploaded: true, url: base64 }; return n; });
      } catch {
        setImages(prev => { const n = [...prev]; n[i] = { ...n[i], uploading: false, error: 'Upload failed' }; return n; });
      }
    }
    setUploading(false);
  };

  // ── Listing selection ───────────────────────────────────────────
  const toggleListing = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === listings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(listings.map(l => l.id)));
    }
  };

  // ── Assign images to selected listings ─────────────────────────
  const assignImages = async () => {
    const uploadedUrls = images.filter(img => img.uploaded && img.url).map(img => img.url!);
    if (uploadedUrls.length === 0) { alert('Please upload images first'); return; }
    if (selected.size === 0) { alert('Please select at least one listing'); return; }

    setAssigning(true);
    try {
      const res = await api.post<{ data: any; message?: string }>('/admin/bulk/images/update-listings', {
        imageUrls: uploadedUrls,
        listingIds: Array.from(selected),
        strategy,
      });
      setResult(res.data);
      alert(res.message || 'Images assigned successfully!');
      setSelected(new Set());
    } catch (err: any) {
      alert(err?.message || 'Error assigning images');
    } finally {
      setAssigning(false);
    }
  };

  const allSelected = listings.length > 0 && selected.size === listings.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Bulk Image Manager</h1>
        <p className="text-gray-400">Upload images, pick listings, then assign in one click</p>
      </div>

      {/* ── Step 1: Upload ── */}
      <div className="bg-cardBg border border-borderBg rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Step 1 — Upload Images</h2>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-borderBg rounded-lg p-10 text-center hover:border-brand transition cursor-pointer"
        >
          <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" id="imgUpload" />
          <label htmlFor="imgUpload" className="cursor-pointer block">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Drop images here or click to browse</p>
            <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP, GIF</p>
          </label>
        </div>

        {images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold">{images.length} image{images.length !== 1 ? 's' : ''}</span>
              <button
                onClick={uploadImages}
                disabled={uploading || images.every(i => i.uploaded)}
                className="px-4 py-2 bg-brand hover:bg-brand-dark rounded-lg text-white text-sm font-semibold disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img src={img.preview} alt="" className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    {img.uploading && <div className="text-white text-xs">...</div>}
                    {img.uploaded && <Check className="w-6 h-6 text-green-400" />}
                    {img.error && <X className="w-6 h-6 text-red-400" />}
                  </div>
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-0.5 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Step 2: Select Listings ── */}
      <div className="bg-cardBg border border-borderBg rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white">
            Step 2 — Select Listings
            {selected.size > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-brand/20 text-brand rounded-full text-sm font-normal">
                {selected.size} selected
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search listings..."
                className="pl-9 pr-3 py-2 bg-background border border-borderBg rounded-lg text-white text-sm placeholder-gray-500 w-52"
              />
            </div>
            <button
              onClick={loadListings}
              disabled={loadingListings}
              className="p-2 bg-background border border-borderBg rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={16} className={loadingListings ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Select all row */}
        <div className="flex items-center gap-3 pb-2 border-b border-borderBg">
          <input
            type="checkbox"
            id="selectAll"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 rounded cursor-pointer accent-brand"
          />
          <label htmlFor="selectAll" className="text-sm text-gray-300 cursor-pointer select-none">
            {allSelected ? 'Deselect all' : `Select all ${listings.length} listings`}
          </label>
          {selected.size > 0 && !allSelected && (
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-white ml-auto">
              Clear selection
            </button>
          )}
        </div>

        {/* Listings table */}
        {loadingListings ? (
          <div className="text-center text-gray-400 py-8">Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No active listings found</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
            {listings.map(listing => (
              <label
                key={listing.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                  selected.has(listing.id) ? 'bg-brand/10 border border-brand/30' : 'hover:bg-background border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(listing.id)}
                  onChange={() => toggleListing(listing.id)}
                  className="w-4 h-4 rounded accent-brand flex-shrink-0"
                />
                {/* Thumbnail */}
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-gray-700 rounded flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{listing.title}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {listing.gameName && <span>{listing.gameName} · </span>}
                    ${listing.price}
                    {listing.seller?.storeName && <span> · {listing.seller.storeName}</span>}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ── Step 3: Strategy + Assign ── */}
      <div className="bg-cardBg border border-borderBg rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Step 3 — Choose Strategy &amp; Assign</h2>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Assignment Strategy</label>
          <select
            value={strategy}
            onChange={e => setStrategy(e.target.value as any)}
            className="w-full bg-background border border-borderBg rounded-lg px-3 py-2 text-white"
          >
            <option value="rotate">Rotate — cycle through images across listings</option>
            <option value="all">All — assign every image to each listing</option>
            <option value="first">First — assign only the first image</option>
            <option value="random">Random — random image per listing</option>
          </select>
        </div>

        <button
          onClick={assignImages}
          disabled={assigning || !images.some(i => i.uploaded) || selected.size === 0}
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {assigning
            ? 'Assigning...'
            : `Assign Images to ${selected.size > 0 ? selected.size : '—'} Listing${selected.size !== 1 ? 's' : ''}`}
        </button>

        {result && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
            <p className="text-green-300 font-semibold mb-1">✓ Assignment Complete</p>
            <p className="text-sm text-green-200">Updated: {result.updated} listings{result.failed > 0 && ` · Failed: ${result.failed}`}</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-5">
        <h3 className="text-white font-bold mb-2 flex items-center gap-2"><AlertCircle size={18} /> How It Works</h3>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Upload images using drag &amp; drop or the file browser, then click Upload All</li>
          <li>Search and select the listings you want to update — use Select All for everything</li>
          <li>Pick an assignment strategy, then click Assign</li>
        </ol>
      </div>
    </div>
  );
}
