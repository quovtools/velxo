'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Store, Search, Star } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, Pagination, EmptyState, ErrorBanner, ActionButton, Modal,
  formatDate, DetailRow, FilterRow, PageHeader, RefreshButton,
  AdminInput, AdminSelect,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Seller {
  id: string; storeName: string; isVerified: boolean; isSuspended: boolean;
  suspensionReason?: string; accountType: string; reputationScore: number;
  totalSales: number; averageRating: number; createdAt: string;
  user?: { email: string; firstName?: string; lastName?: string };
}

export default function AdminSellersPage() {
  const [items, setItems]           = useState<Seller[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy]             = useState<string | null>(null);
  const [detail, setDetail]         = useState<Seller | null>(null);

  const fetchSellers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res: any = await api.get('/admin/sellers', { params: { search, status, page, limit: 25 } });
      setItems(Array.isArray(res.data) ? res.data : []); setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) { setError(e.message || 'Failed'); setItems([]); }
    finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id); setError('');
    try { await fn(); await fetchSellers(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={Store} title="Sellers" subtitle="Verify, suspend or feature seller stores."
        action={<RefreshButton onClick={fetchSellers} loading={loading} />} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      <FilterRow>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <AdminInput value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Store name or email…" className="pl-8" />
        </div>
        <AdminSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">All sellers</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="suspended">Suspended</option>
        </AdminSelect>
      </FilterRow>

      {loading ? <LoadingArea label="Loading sellers…" /> : items.length === 0 ? (
        <EmptyState icon={Store} title="No sellers found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map(s => (
            <div key={s.id} className="bg-[#111118] border border-white/8 rounded-2xl p-4 flex flex-col gap-3 hover:border-white/16 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => setDetail(s)} className="text-left group">
                  <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition">{s.storeName}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{s.user?.email}</p>
                </button>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {s.isVerified ? <Badge color="green">Verified</Badge> : <Badge color="gray">Unverified</Badge>}
                  {s.isSuspended && <Badge color="red">Suspended</Badge>}
                </div>
              </div>
              <div className="flex gap-3 text-[11px] text-gray-600">
                <span>★ {s.averageRating?.toFixed(1) || '0.0'}</span>
                <span>{s.totalSales} sales</span>
                <span className="uppercase">{s.accountType}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap pt-1 border-t border-white/6">
                <ActionButton variant="success" loading={busy===s.id}
                  onClick={() => act(s.id, () => api.patch(`/admin/sellers/${s.id}/verify`, { verified: !s.isVerified }))}>
                  {s.isVerified ? 'Unverify' : 'Verify'}
                </ActionButton>
                <ActionButton variant="warning" loading={busy===`sus-${s.id}`}
                  onClick={() => act(`sus-${s.id}`, () => api.patch(`/admin/sellers/${s.id}/suspend`, { suspended: !s.isSuspended, reason: s.isSuspended ? '' : 'Policy violation' }))}>
                  {s.isSuspended ? 'Reinstate' : 'Suspend'}
                </ActionButton>
                <ActionButton variant="brand" loading={busy===`feat-${s.id}`}
                  onClick={() => act(`feat-${s.id}`, () => api.patch(`/admin/sellers/${s.id}/feature`, { featured: true }))}>
                  <Star className="w-3 h-3" />Feature
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Seller details">
        {detail && (
          <div className="space-y-1">
            <DetailRow label="Store"       value={detail.storeName} />
            <DetailRow label="Owner email" value={detail.user?.email} />
            <DetailRow label="Verified"    value={detail.isVerified ? <Badge color="green">Yes</Badge> : <Badge color="gray">No</Badge>} />
            <DetailRow label="Suspended"   value={detail.isSuspended ? <Badge color="red">{detail.suspensionReason || 'Yes'}</Badge> : 'No'} />
            <DetailRow label="Reputation"  value={String(detail.reputationScore)} />
            <DetailRow label="Rating"      value={`★ ${detail.averageRating?.toFixed(1) || '—'}`} />
            <DetailRow label="Total sales" value={String(detail.totalSales)} />
            <DetailRow label="Account"     value={detail.accountType} />
            <DetailRow label="Joined"      value={formatDate(detail.createdAt)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
