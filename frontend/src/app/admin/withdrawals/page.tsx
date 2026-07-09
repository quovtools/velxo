'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LifeBuoy, Search, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton, Modal, formatDate, formatMoney } from '@/components/admin/ui';

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  fee: number;
  netAmount: number;
  notes?: string;
  destination?: any;
  createdAt: string;
  completedAt?: string;
  seller?: { storeName: string; user?: { email: string } };
}

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/withdrawals', { params: { status, page, limit: 25 } });
      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load withdrawals');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    setError('');
    try { await fn(); await fetchItems(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const pending = items.filter(w => w.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-brand" /> Payout / Withdrawal Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Approve or reject seller payout requests. {pending > 0 && <span className="text-yellow-400 font-semibold">{pending} pending</span>}</p>
        </div>
        <button onClick={fetchItems} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
        <option value="">All payouts</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="PROCESSING">Processing</option>
        <option value="COMPLETED">Completed</option>
        <option value="REJECTED">Rejected</option>
        <option value="FAILED">Failed</option>
      </select>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading payouts...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No payouts found" />
      ) : (
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs uppercase bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">Seller</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Requested</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(w => (
                  <tr key={w.id} className="border-t border-borderBg hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{w.seller?.storeName || '—'}</p>
                      <p className="text-xs text-gray-500">{w.seller?.user?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold">{formatMoney(w.amount, w.currency)}</p>
                      <p className="text-xs text-gray-500">net {formatMoney(w.netAmount, w.currency)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{w.method}</td>
                    <td className="px-4 py-3"><Badge color={statusColor(w.status)}>{w.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(w.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {w.status === 'PENDING' && (
                          <>
                            <ActionButton variant="success" loading={busy === `a-${w.id}`} onClick={() => act(`a-${w.id}`, () => api.patch(`/admin/withdrawals/${w.id}/approve`))}>
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </ActionButton>
                            <ActionButton variant="danger" loading={busy === `r-${w.id}`} onClick={() => { if (window.confirm('Reject this payout?')) act(`r-${w.id}`, () => api.patch(`/admin/withdrawals/${w.id}/reject`, { reason: 'Failed verification' })); }}>
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </ActionButton>
                          </>
                        )}
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
    </div>
  );
}
