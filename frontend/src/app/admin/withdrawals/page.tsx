'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Wallet, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton,
  FilterRow, Table, Tr, Td, PageHeader, RefreshButton, AdminSelect,
  formatDate, formatMoney,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Withdrawal {
  id: string; amount: number; currency: string; status: string; method: string;
  fee: number; netAmount: number; notes?: string; createdAt: string; completedAt?: string;
  seller?: { storeName: string; user?: { email: string } };
}

export default function AdminWithdrawalsPage() {
  const [items, setItems]           = useState<Withdrawal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy]             = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res: any = await api.get('/admin/withdrawals', { params: { status, page, limit: 25 } });
      setItems(res.data || []); setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) { setError(e.message || 'Failed'); setItems([]); }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id); setError('');
    try { await fn(); await fetchItems(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const pending = items.filter(w => w.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      <PageHeader icon={Wallet} title="Payouts"
        subtitle={pending > 0 ? `${pending} pending approval` : 'Approve or reject seller payout requests.'}
        action={<RefreshButton onClick={fetchItems} loading={loading} />} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      <FilterRow>
        <AdminSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-44">
          <option value="">All payouts</option>
          {['PENDING','APPROVED','PROCESSING','COMPLETED','REJECTED','FAILED'].map(s =>
            <option key={s} value={s}>{s}</option>)}
        </AdminSelect>
      </FilterRow>

      {loading ? <LoadingArea label="Loading payouts…" /> : items.length === 0 ? (
        <EmptyState icon={Wallet} title="No payouts found" />
      ) : (
        <Table headers={['Seller','Amount','Net','Method','Status','Date','Actions']}>
          {items.map(w => (
            <Tr key={w.id}>
              <Td>
                <p className="text-sm font-medium text-white">{w.seller?.storeName || '—'}</p>
                <p className="text-[11px] text-gray-600">{w.seller?.user?.email}</p>
              </Td>
              <Td><span className="font-medium text-white">{formatMoney(w.amount, w.currency)}</span></Td>
              <Td><span className="text-xs text-gray-500">{formatMoney(w.netAmount, w.currency)}</span></Td>
              <Td><span className="text-xs">{w.method}</span></Td>
              <Td><Badge color={statusColor(w.status)}>{w.status}</Badge></Td>
              <Td><span className="text-xs text-gray-600">{formatDate(w.createdAt)}</span></Td>
              <Td right>
                {w.status === 'PENDING' && (
                  <div className="flex justify-end gap-1.5">
                    <ActionButton variant="success" loading={busy===`a-${w.id}`}
                      onClick={() => act(`a-${w.id}`, () => api.patch(`/admin/withdrawals/${w.id}/approve`))}>
                      <CheckCircle className="w-3 h-3" />Approve
                    </ActionButton>
                    <ActionButton variant="danger" loading={busy===`r-${w.id}`}
                      onClick={() => { if (window.confirm('Reject this payout?')) act(`r-${w.id}`, () => api.patch(`/admin/withdrawals/${w.id}/reject`, { reason: 'Failed verification' })); }}>
                      <XCircle className="w-3 h-3" />Reject
                    </ActionButton>
                  </div>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
