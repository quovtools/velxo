'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, Search, Star, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton,
  Modal, formatDate, formatMoney, DetailRow, FilterRow, Table, Tr, Td,
  PageHeader, RefreshButton, AdminInput, AdminSelect,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Listing {
  id: string; title: string; gameName: string; price: number; currency: string;
  status: string; isFeatured: boolean; images?: string[]; createdAt: string;
  seller?: { storeName: string; user?: { email: string } };
  category?: { name: string };
}

export default function AdminListingsPage() {
  const [items, setItems]           = useState<Listing[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [game, setGame]             = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy]             = useState<string | null>(null);
  const [detail, setDetail]         = useState<Listing | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res: any = await api.get('/admin/listings', { params: { search, status, game, page, limit: 25 } });
      setItems(Array.isArray(res.data) ? res.data : []); setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) { setError(e.message || 'Failed to load listings'); setItems([]); }
    finally { setLoading(false); }
  }, [search, status, game, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id); setError('');
    try { await fn(); await fetch(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Permanently delete this listing?')) return;
    await act(id, () => api.delete(`/admin/listings/${id}`));
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={ShoppingBag} title="Listings" subtitle="Feature, suspend, approve or remove any listing."
        action={<RefreshButton onClick={fetch} loading={loading} />} />

      <ErrorBanner message={error} onClose={() => setError('')} />

      <FilterRow>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <AdminInput value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search title or game…" className="pl-8" />
        </div>
        <AdminSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">All statuses</option>
          {['DRAFT','PENDING_APPROVAL','ACTIVE','REJECTED','SUSPENDED','SOLD','EXPIRED'].map(s =>
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </AdminSelect>
        <AdminInput value={game} onChange={e => { setGame(e.target.value); setPage(1); }}
          placeholder="Game filter…" className="w-36" />
      </FilterRow>

      {loading ? <LoadingArea label="Loading listings…" /> : items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No listings found" />
      ) : (
        <Table headers={['Listing','Game','Price','Status','Seller','Actions']}>
          {items.map(l => (
            <Tr key={l.id}>
              <Td>
                <button onClick={() => setDetail(l)} className="flex items-center gap-2.5 text-left group">
                  {l.images?.[0]
                    ? <img src={l.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-lg bg-white/5 flex-shrink-0" />}
                  <span className="font-medium text-white text-sm max-w-[200px] truncate group-hover:text-violet-300 transition">{l.title}</span>
                  {l.isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                </button>
              </Td>
              <Td><span className="text-xs">{l.gameName}</span></Td>
              <Td><span className="text-white text-sm font-medium">{formatMoney(l.price, l.currency)}</span></Td>
              <Td><Badge color={statusColor(l.status)}>{l.status.replace(/_/g,' ')}</Badge></Td>
              <Td><span className="text-xs">{l.seller?.storeName || '—'}</span></Td>
              <Td right>
                <div className="flex justify-end gap-1.5 flex-wrap">
                  <ActionButton variant="default" loading={busy===`f-${l.id}`}
                    onClick={() => act(`f-${l.id}`, () => api.patch(`/admin/listings/${l.id}/feature`, { featured: !l.isFeatured }))}>
                    <Star className="w-3 h-3" />{l.isFeatured ? 'Unfeature' : 'Feature'}
                  </ActionButton>
                  {l.status !== 'SUSPENDED' && (
                    <ActionButton variant="warning" loading={busy===`s-${l.id}`}
                      onClick={() => act(`s-${l.id}`, () => api.patch(`/admin/listings/${l.id}/suspend`, { reason: 'Policy violation' }))}>
                      <Ban className="w-3 h-3" />Suspend
                    </ActionButton>
                  )}
                  {l.status !== 'ACTIVE' && (
                    <ActionButton variant="success" loading={busy===`a-${l.id}`}
                      onClick={() => act(`a-${l.id}`, () => api.patch(`/admin/listings/${l.id}/approve`))}>
                      <CheckCircle className="w-3 h-3" />Approve
                    </ActionButton>
                  )}
                  <ActionButton variant="danger" loading={busy===`d-${l.id}`} onClick={() => remove(l.id)}>
                    <Trash2 className="w-3 h-3" />
                  </ActionButton>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Listing details" size="lg">
        {detail && (
          <div className="space-y-1">
            <DetailRow label="Title"    value={detail.title} />
            <DetailRow label="Game"     value={detail.gameName} />
            <DetailRow label="Category" value={detail.category?.name} />
            <DetailRow label="Price"    value={formatMoney(detail.price, detail.currency)} />
            <DetailRow label="Status"   value={<Badge color={statusColor(detail.status)}>{detail.status}</Badge>} />
            <DetailRow label="Featured" value={detail.isFeatured ? 'Yes' : 'No'} />
            <DetailRow label="Seller"   value={detail.seller?.storeName} />
            <DetailRow label="Email"    value={detail.seller?.user?.email} />
            <DetailRow label="Created"  value={formatDate(detail.createdAt)} />
            {detail.images?.length ? (
              <div className="flex gap-2 flex-wrap pt-3">
                {detail.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-20 h-20 rounded-xl object-cover border border-white/8" />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
