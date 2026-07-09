'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, Search, Star, Ban, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton, Modal, formatDate, formatMoney } from '@/components/admin/ui';

interface Listing {
  id: string;
  title: string;
  gameName: string;
  price: number;
  currency: string;
  status: string;
  isFeatured: boolean;
  images?: string[];
  createdAt: string;
  seller?: { storeName: string; user?: { email: string } };
  category?: { name: string };
}

export default function AdminListingsPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [game, setGame] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<Listing | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/listings', { params: { search, status, game, page, limit: 25 } });
      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load listings');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, game, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    setError('');
    try { await fn(); await fetchListings(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Permanently delete this listing? This cannot be undone.')) return;
    await act(id, () => api.delete(`/admin/listings/${id}`));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand" /> Listing Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Feature, suspend, approve or remove any listing.</p>
        </div>
        <button onClick={fetchListings} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search title or game..."
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="SOLD">Sold</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <input value={game} onChange={e => { setGame(e.target.value); setPage(1); }} placeholder="Game filter..."
          className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand w-40" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading listings...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No listings found" />
      ) : (
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs uppercase bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">Listing</th>
                  <th className="text-left px-4 py-3">Game</th>
                  <th className="text-left px-4 py-3">Price</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Seller</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(l => (
                  <tr key={l.id} className="border-t border-borderBg hover:bg-white/5">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(l)} className="flex items-center gap-3 text-left">
                        {l.images?.[0] ? (
                          <img src={l.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5" />
                        )}
                        <span className="font-semibold text-white max-w-[220px] truncate">{l.title}</span>
                        {l.isFeatured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{l.gameName}</td>
                    <td className="px-4 py-3 text-white">{formatMoney(l.price, l.currency)}</td>
                    <td className="px-4 py-3"><Badge color={statusColor(l.status)}>{l.status.replace('_', ' ')}</Badge></td>
                    <td className="px-4 py-3 text-gray-400">{l.seller?.storeName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <ActionButton variant="brand" loading={busy === `f-${l.id}`} onClick={() => act(`f-${l.id}`, () => api.patch(`/admin/listings/${l.id}/feature`, { featured: !l.isFeatured }))}>
                          <Star className="w-3.5 h-3.5" /> {l.isFeatured ? 'Unfeature' : 'Feature'}
                        </ActionButton>
                        {l.status !== 'SUSPENDED' && (
                          <ActionButton variant="warning" loading={busy === `s-${l.id}`} onClick={() => act(`s-${l.id}`, () => api.patch(`/admin/listings/${l.id}/suspend`, { reason: 'Policy violation' }))}>
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </ActionButton>
                        )}
                        {l.status !== 'ACTIVE' && (
                          <ActionButton variant="success" loading={busy === `a-${l.id}`} onClick={() => act(`a-${l.id}`, () => api.patch(`/admin/listings/${l.id}/approve`))}>
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </ActionButton>
                        )}
                        <ActionButton variant="danger" loading={busy === `d-${l.id}`} onClick={() => remove(l.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Listing details" size="lg">
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label="Title" value={detail.title} />
            <Row label="Game" value={detail.gameName} />
            <Row label="Category" value={detail.category?.name || '—'} />
            <Row label="Price" value={formatMoney(detail.price, detail.currency)} />
            <Row label="Status" value={detail.status} />
            <Row label="Featured" value={detail.isFeatured ? 'Yes' : 'No'} />
            <Row label="Seller" value={detail.seller?.storeName || '—'} />
            <Row label="Created" value={formatDate(detail.createdAt)} />
            {detail.images?.length ? (
              <div className="flex gap-2 flex-wrap pt-2">
                {detail.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover border border-borderBg" />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-white text-right break-all">{value}</span>
    </div>
  );
}
