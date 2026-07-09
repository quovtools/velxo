'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, XCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton, Modal, formatDate, formatMoney } from '@/components/admin/ui';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  buyer?: { email: string; firstName?: string; lastName?: string };
  seller?: { storeName: string };
  orderItems?: { listing?: { title: string } }[];
}

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [refundAmt, setRefundAmt] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/orders', { params: { status, page, limit: 25 } });
      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    setError('');
    try { await fn(); await fetchOrders(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand" /> Order Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Cancel or refund orders when needed.</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
        <option value="">All orders</option>
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DELIVERED">Delivered</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="REFUNDED">Refunded</option>
        <option value="DISPUTED">Disputed</option>
      </select>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading orders...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={CreditCard} title="No orders found" />
      ) : (
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs uppercase bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">Order #</th>
                  <th className="text-left px-4 py-3">Buyer</th>
                  <th className="text-left px-4 py-3">Seller</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(o => (
                  <tr key={o.id} className="border-t border-borderBg hover:bg-white/5">
                    <td className="px-4 py-3">
                      <button onClick={() => { setDetail(o); setRefundAmt(String(o.totalAmount)); }} className="text-left">
                        <p className="font-semibold text-white font-mono text-xs">{o.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{o.buyer?.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{o.seller?.storeName || '—'}</td>
                    <td className="px-4 py-3 text-white">{formatMoney(o.totalAmount, o.currency)}</td>
                    <td className="px-4 py-3"><Badge color={statusColor(o.status)}>{o.status.replace('_', ' ')}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {!['CANCELLED', 'REFUNDED', 'COMPLETED'].includes(o.status) && (
                          <ActionButton variant="warning" loading={busy === `c-${o.id}`} onClick={() => { if (window.confirm(`Cancel order ${o.orderNumber}?`)) act(`c-${o.id}`, () => api.patch(`/admin/orders/${o.id}/cancel`, { reason: 'Admin action' })); }}>
                            Cancel
                          </ActionButton>
                        )}
                        {!['REFUNDED', 'CANCELLED'].includes(o.status) && (
                          <ActionButton variant="danger" loading={busy === `r-${o.id}`} onClick={() => { if (window.confirm(`Refund order ${o.orderNumber}?`)) act(`r-${o.id}`, () => api.patch(`/admin/orders/${o.id}/refund`, { amount: Number(o.totalAmount), reason: 'Admin refund' })); }}>
                            <XCircle className="w-3.5 h-3.5" /> Refund
                          </ActionButton>
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

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Order details" size="lg">
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label="Order #" value={detail.orderNumber} />
            <Row label="Status" value={detail.status} />
            <Row label="Total" value={formatMoney(detail.totalAmount, detail.currency)} />
            <Row label="Buyer" value={detail.buyer?.email || '—'} />
            <Row label="Seller" value={detail.seller?.storeName || '—'} />
            <Row label="Created" value={formatDate(detail.createdAt)} />
            <div>
              <p className="text-gray-400 mb-1">Items</p>
              {detail.orderItems?.map((it, i) => (
                <p key={i} className="text-white">{it.listing?.title || 'Item'}</p>
              )) || <p className="text-gray-500">No items</p>}
            </div>
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
