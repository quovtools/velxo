'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, XCircle, RefreshCw, CheckCircle, ClipboardCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton, Modal, formatDate, formatMoney } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
  buyer?: { email: string; firstName?: string; lastName?: string };
  seller?: { storeName: string };
  orderItems?: { listing?: { title: string } }[];
  payments?: { id: string; provider: string; status: string; paidAt?: string }[];
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
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = async (o: Order) => {
    setDetail(o);
    setDetailLoading(true);
    try {
      const res: any = await api.get(`/admin/orders/${o.id}`);
      setDetail(res.data || o);
    } catch { /* keep basic data */ }
    finally { setDetailLoading(false); }
  };

  // Manual payment confirmation state
  const [markPaidOrder, setMarkPaidOrder] = useState<Order | null>(null);
  const [markPaidNote, setMarkPaidNote] = useState('');
  const [markPaidBusy, setMarkPaidBusy] = useState(false);

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

  const confirmMarkPaid = async () => {
    if (!markPaidOrder) return;
    setMarkPaidBusy(true);
    setError('');
    try {
      await api.patch(`/admin/orders/${markPaidOrder.id}/mark-paid`, { note: markPaidNote });
      setMarkPaidOrder(null);
      setMarkPaidNote('');
      await fetchOrders();
    } catch (e: any) {
      setError(e.message || 'Failed to mark order as paid');
    } finally {
      setMarkPaidBusy(false);
    }
  };

  const pendingCount = items.filter(o => o.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand" /> Order Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Cancel, refund, or manually confirm payments.
            {pendingCount > 0 && <span className="text-yellow-400 font-semibold ml-1">{pendingCount} pending payment{pendingCount > 1 ? 's' : ''}</span>}
          </p>
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
        <LoadingArea label="Loading orders..." />
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
                      <button onClick={() => openDetail(o)} className="text-left">
                        <p className="font-semibold text-white font-mono text-xs">{o.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{o.buyer?.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{o.seller?.storeName || '—'}</td>
                    <td className="px-4 py-3 text-white">{formatMoney(o.totalAmount, o.currency)}</td>
                    <td className="px-4 py-3"><Badge color={statusColor(o.status)}>{o.status.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {/* Manual payment checkmark — only for PENDING orders */}
                        {o.status === 'PENDING' && (
                          <ActionButton
                            variant="success"
                            loading={busy === `mp-${o.id}`}
                            onClick={() => { setMarkPaidOrder(o); setMarkPaidNote(''); }}
                            title="Manually confirm buyer has paid"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                          </ActionButton>
                        )}
                        {!['CANCELLED', 'REFUNDED', 'COMPLETED'].includes(o.status) && (
                          <ActionButton variant="warning" loading={busy === `c-${o.id}`} onClick={() => { if (window.confirm(`Cancel order ${o.orderNumber}?`)) act(`c-${o.id}`, () => api.patch(`/admin/orders/${o.id}/cancel`, { reason: 'Admin action' })); }}>
                            Cancel
                          </ActionButton>
                        )}
                        {!['REFUNDED', 'CANCELLED', 'PENDING'].includes(o.status) && (
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

      {/* Order detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Order details" size="lg">
        {detail && (
          <div className="space-y-3 text-sm">
            {detailLoading && (
              <div className="text-center py-2 text-gray-400 text-xs">Loading full details…</div>
            )}
            <Row label="Order #" value={detail.orderNumber} />
            <Row label="Status" value={detail.status.replace(/_/g, ' ')} />
            <Row label="Total" value={formatMoney(detail.totalAmount, detail.currency)} />
            <Row label="Buyer" value={detail.buyer ? `${[detail.buyer.firstName, detail.buyer.lastName].filter(Boolean).join(' ') || detail.buyer.email}` : '—'} />
            <Row label="Buyer email" value={detail.buyer?.email || '—'} />
            <Row label="Seller" value={detail.seller?.storeName || '—'} />
            <Row label="Created" value={formatDate(detail.createdAt)} />
            {detail.paidAt && <Row label="Paid at" value={formatDate(detail.paidAt)} />}
            <div>
              <p className="text-gray-400 mb-1">Items</p>
              {detail.orderItems?.map((it, i) => (
                <p key={i} className="text-white">{it.listing?.title || 'Item'}</p>
              )) || <p className="text-gray-500">No items</p>}
            </div>
            {detail.payments && detail.payments.length > 0 && (
              <div>
                <p className="text-gray-400 mb-2">Payment records</p>
                <div className="space-y-1">
                  {detail.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-300 text-xs font-mono">{p.provider}</span>
                      <Badge color={p.status === 'COMPLETED' ? 'green' : p.status === 'PENDING' ? 'yellow' : 'red'}>{p.status}</Badge>
                      {p.paidAt && <span className="text-gray-500 text-xs">{formatDate(p.paidAt)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail.status === 'PENDING' && (
              <div className="pt-3 border-t border-borderBg">
                <ActionButton
                  variant="success"
                  onClick={() => { setDetail(null); setMarkPaidOrder(detail); setMarkPaidNote(''); }}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Manually Mark as Paid
                </ActionButton>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Mark Paid confirmation modal */}
      <Modal
        open={!!markPaidOrder}
        onClose={() => { setMarkPaidOrder(null); setMarkPaidNote(''); }}
        title={
          <span className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-green-400" />
            Confirm Manual Payment
          </span>
        }
        footer={
          <>
            <button
              onClick={() => { setMarkPaidOrder(null); setMarkPaidNote(''); }}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <ActionButton variant="success" loading={markPaidBusy} onClick={confirmMarkPaid}>
              <CheckCircle className="w-3.5 h-3.5" /> Confirm Payment
            </ActionButton>
          </>
        }
      >
        {markPaidOrder && (
          <div className="space-y-4 text-sm">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-300 text-xs">
              ⚠ This will mark order <span className="font-mono font-bold">{markPaidOrder.orderNumber}</span> as PAID and notify both buyer and seller. Only use this if you have confirmed the buyer has paid outside the platform (e.g. bank transfer, cash).
            </div>
            <Row label="Order" value={markPaidOrder.orderNumber} />
            <Row label="Amount" value={formatMoney(markPaidOrder.totalAmount, markPaidOrder.currency)} />
            <Row label="Buyer" value={markPaidOrder.buyer?.email || '—'} />
            <div>
              <label className="block text-gray-400 mb-2">Admin note (optional)</label>
              <textarea
                value={markPaidNote}
                onChange={e => setMarkPaidNote(e.target.value)}
                placeholder="e.g. Buyer paid via bank transfer ref #123456"
                rows={3}
                className="w-full bg-background border border-borderBg rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand resize-none"
              />
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
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-white text-right break-all">{value}</span>
    </div>
  );
}
