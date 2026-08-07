'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Package, Search, Check, X, AlertCircle, Trash2, Star, RefreshCw, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, ErrorBanner, PageHeader, AdminInput, AdminSelect } from '@/components/admin/ui';

interface Listing {
  id: string; title: string; price: number; status: string;
  isFeatured: boolean; isSponsored: boolean; gameName?: string;
  images?: string[]; seller?: { user?: { name: string } }; createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING_APPROVAL: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DRAFT:            'bg-white/5 text-gray-400 border-white/10',
  REJECTED:         'bg-red-500/10 text-red-400 border-red-500/20',
  SUSPENDED:        'bg-orange-500/10 text-orange-400 border-orange-500/20',
  SOLD:             'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const BULK_ACTIONS = [
  { key: 'approve',   label: 'Approve',   color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' },
  { key: 'reject',    label: 'Reject',    color: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20', needsReason: true },
  { key: 'suspend',   label: 'Suspend',   color: 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20', needsReason: true },
  { key: 'unsuspend', label: 'Unsuspend', color: 'bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/20' },
  { key: 'feature',   label: 'Feature',   color: 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20' },
  { key: 'unfeature', label: 'Unfeature', color: 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' },
  { key: 'delete',    label: 'Delete',    color: 'bg-red-900/20 border-red-900/40 text-red-500 hover:bg-red-900/30' },
];

export default function ListingsManagerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]     = useState('');
  const [gameFilter, setGameFilter]   = useState('');
  const [reason, setReason]     = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (gameFilter)   params.append('game', gameFilter);
      if (search)       params.append('search', search);
      const res = await api.get<any>(`/admin/listings?${params}`);
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) { setError(e.message || 'Failed to load listings'); }
    finally { setLoading(false); }
  }, [statusFilter, gameFilter, search]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const toggle   = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === listings.length ? new Set() : new Set(listings.map(l => l.id)));

  const execute = async (action: string) => {
    if (selected.size === 0) { setError('Select at least one listing.'); return; }
    const meta = BULK_ACTIONS.find(a => a.key === action);
    if (meta?.needsReason && !reason.trim()) { setPendingAction(action); return; }
    if (action === 'delete' && !window.confirm(`Delete ${selected.size} listings permanently?`)) return;

    setBusy(true); setError('');
    try {
      const ids = Array.from(selected);
      switch (action) {
        case 'approve':   await api.post('/admin/bulk/listings/approve', { listingIds: ids }); break;
        case 'reject':    await api.post('/admin/bulk/listings/reject',  { listingIds: ids, reason }); break;
        case 'suspend':   await api.patch('/admin/bulk/listings/suspend', { listingIds: ids, reason }); break;
        case 'unsuspend': await api.patch('/admin/bulk/listings/unsuspend', { listingIds: ids }); break;
        case 'feature':   await api.patch('/admin/bulk/listings/feature', { listingIds: ids, isFeatured: true }); break;
        case 'unfeature': await api.patch('/admin/bulk/listings/feature', { listingIds: ids, isFeatured: false }); break;
        case 'delete':    await api.delete('/admin/bulk/listings/delete', { data: { listingIds: ids } } as any); break;
      }
      setSelected(new Set()); setReason(''); setPendingAction(null);
      await loadListings();
    } catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(false); }
  };

  const cancelReason = () => { setPendingAction(null); setReason(''); };

  return (
    <div className="space-y-5">
      <PageHeader icon={Package} title="Bulk Manager" subtitle="Select multiple listings and apply actions in one click."
        action={
          <button onClick={loadListings} disabled={loading}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        } />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <AdminInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8" />
        </div>
        <AdminSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {['PENDING_APPROVAL','ACTIVE','SUSPENDED','REJECTED','DRAFT','SOLD'].map(s =>
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </AdminSelect>
        <AdminInput value={gameFilter} onChange={e => setGameFilter(e.target.value)} placeholder="Game…" className="w-32" />
      </div>

      {/* Selection toolbar */}
      {selected.size > 0 && (
        <div className="bg-violet-600/8 border border-violet-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{selected.size} listing{selected.size !== 1 ? 's' : ''} selected</p>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-white transition">Clear</button>
          </div>

          {pendingAction && (
            <div className="space-y-2">
              <AdminInput value={reason} onChange={e => setReason(e.target.value)}
                placeholder={`Reason for ${pendingAction}…`} />
              <div className="flex gap-2">
                <button onClick={() => execute(pendingAction)} disabled={!reason.trim() || busy}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-40">
                  {busy ? 'Processing…' : 'Submit'}
                </button>
                <button onClick={cancelReason} className="px-3 py-1.5 text-xs text-gray-500 hover:text-white transition">Cancel</button>
              </div>
            </div>
          )}

          {!pendingAction && (
            <div className="flex flex-wrap gap-1.5">
              {BULK_ACTIONS.map(a => (
                <button key={a.key} onClick={() => execute(a.key)} disabled={busy}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition disabled:opacity-40 ${a.color}`}>
                  {a.key === 'approve'   && <Check className="w-3 h-3" />}
                  {a.key === 'reject'    && <X className="w-3 h-3" />}
                  {a.key === 'suspend'   && <AlertCircle className="w-3 h-3" />}
                  {a.key === 'feature'   && <Star className="w-3 h-3" />}
                  {a.key === 'delete'    && <Trash2 className="w-3 h-3" />}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-600 text-sm">Loading listings…</div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center text-gray-600 text-sm">No listings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.size===listings.length && listings.length>0}
                      onChange={toggleAll} className="rounded cursor-pointer accent-violet-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-10">Img</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Game</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Badges</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {listings.map(l => (
                  <tr key={l.id} className={`transition-colors hover:bg-white/3 ${selected.has(l.id) ? 'bg-violet-600/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)}
                        className="rounded cursor-pointer accent-violet-500" />
                    </td>
                    <td className="px-4 py-3">
                      {l.images?.[0]
                        ? <img src={l.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/8" />
                        : <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center"><Eye className="w-3.5 h-3.5 text-gray-600" /></div>}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-white text-sm font-medium truncate">{l.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{l.gameName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-white">${l.price}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${STATUS_COLOR[l.status]||'bg-white/5 text-gray-400 border-white/8'}`}>
                        {l.status.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {l.isFeatured  && <Badge color="violet">Featured</Badge>}
                        {l.isSponsored && <Badge color="purple">Sponsored</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-600">{new Date(l.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-600">{listings.length} listing{listings.length !== 1 ? 's' : ''} loaded</p>
    </div>
  );
}
