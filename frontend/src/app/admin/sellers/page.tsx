'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Store, Search, CheckCircle, XCircle, Star, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Pagination, EmptyState, ErrorBanner, ActionButton, Modal, formatDate, formatMoney } from '@/components/admin/ui';

interface Seller {
  id: string;
  storeName: string;
  isVerified: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  accountType: string;
  reputationScore: number;
  totalSales: number;
  averageRating: number;
  createdAt: string;
  user?: { email: string; firstName?: string; lastName?: string };
}

export default function AdminSellersPage() {
  const [items, setItems] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<Seller | null>(null);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/sellers', { params: { search, status, page, limit: 25 } });
      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load sellers');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    setError('');
    try { await fn(); await fetchSellers(); } catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-brand" /> Seller Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Verify, suspend or feature seller stores.</p>
        </div>
        <button onClick={fetchSellers} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search store or email..."
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All sellers</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading sellers...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Store} title="No sellers found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(s => (
            <div key={s.id} className="bg-cardBg border border-borderBg rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => setDetail(s)} className="text-left">
                  <h3 className="font-bold text-white">{s.storeName}</h3>
                  <p className="text-xs text-gray-500">{s.user?.email || '—'}</p>
                </button>
                <div className="flex flex-col items-end gap-1">
                  {s.isVerified ? <Badge color="green">Verified</Badge> : <Badge color="gray">Unverified</Badge>}
                  {s.isSuspended && <Badge color="red">Suspended</Badge>}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>★ {s.averageRating?.toFixed(1) || '0.0'}</span>
                <span>{s.totalSales} sales</span>
                <span>{s.accountType}</span>
              </div>
              <div className="flex gap-2 flex-wrap mt-auto pt-2">
                <ActionButton variant="success" loading={busy === s.id} onClick={() => act(s.id, () => api.patch(`/admin/sellers/${s.id}/verify`, { verified: !s.isVerified }))}>
                  {s.isVerified ? 'Unverify' : 'Verify'}
                </ActionButton>
                <ActionButton variant="warning" loading={busy === `sus-${s.id}`} onClick={() => act(`sus-${s.id}`, () => api.patch(`/admin/sellers/${s.id}/suspend`, { suspended: !s.isSuspended, reason: s.isSuspended ? '' : 'Policy violation' }))}>
                  {s.isSuspended ? 'Reinstate' : 'Suspend'}
                </ActionButton>
                <ActionButton variant="brand" loading={busy === `feat-${s.id}`} onClick={() => act(`feat-${s.id}`, () => api.patch(`/admin/sellers/${s.id}/feature`, { featured: true }))}>
                  <Star className="w-3.5 h-3.5" /> Feature
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Seller details">
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label="Store" value={detail.storeName} />
            <Row label="Owner" value={detail.user?.email || '—'} />
            <Row label="Verified" value={detail.isVerified ? 'Yes' : 'No'} />
            <Row label="Suspended" value={detail.isSuspended ? `Yes${detail.suspensionReason ? ` — ${detail.suspensionReason}` : ''}` : 'No'} />
            <Row label="Reputation" value={String(detail.reputationScore)} />
            <Row label="Avg rating" value={String(detail.averageRating)} />
            <Row label="Total sales" value={String(detail.totalSales)} />
            <Row label="Joined" value={formatDate(detail.createdAt)} />
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
