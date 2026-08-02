'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, XCircle, CheckCircle, ClipboardCheck } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton,
  Modal, formatDate, formatMoney, DetailRow, FilterRow, Table, Tr, Td,
  PageHeader, RefreshButton, AdminSelect, AdminTextarea,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Order {
  id: string; orderNumber: string; status: string; totalAmount: number; currency: string;
  createdAt: string; paidAt?: string;
  buyer?: { email: string; firstName?: string; lastName?: string };
  seller?: { storeName: string };
  orderItems?: { listing?: { title: string } }[];
  payments?: { id: string; provider: string; status: string; paidAt?: string }[];
}

export default function AdminOrdersPage() {
  const [items, setItems]           = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy]             = useState<string | null>(null);
  const [detail, setDetail]         = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [markPaid, setMarkPaid]     = useState<Order | null>(null);
  const [markNote, setMarkNote]     = useState('');
  const [markBusy, setMarkBusy]     = useState(false);

  const openDetail = async (o: Order) => {
    setDetail(o); setDetailLoading(true);
    try { const res: any = await api.get(`/admin/orders/${o.id}`); setDetail(res.data || o); }
    catch { /* keep basic */ } finally { setDetailLoading(false); }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res: any = await api.get('/admin/orders', { params: { status, page, limit: 25 } });
      setItems(res.data || []); setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) { setError(e.message || 'Failed to load orders'); setItems([]); }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id); setError('');
    try { await fn(); await fetchOrders(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const confirmMarkPaid = async () => {
    if (!markPaid) return;
    setMarkBusy(true);
    try {
      await api.patch(`/admin/orders/${markPaid.id}/mark-paid`, { note: markNote });
      setMarkPaid(null); setMarkNote(''); await fetchOrders();
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setMarkBusy(false); }
  };

  const pendingCount = items.filter(o => o.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      <PageHeader icon={CreditCard} title="Orders"
        subtitle={pendingCount > 0 ? `${pendingCount} pending payment${pendingCount > 1 ? 's' : ''}` : 'Manage all platform orders.'}
        action={<RefreshButton onClick={fetchOrders} loading={loading} />} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      <FilterRow>
        <AdminSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-44">
          <option value="">All orders</option>
          {['PENDING','PAID','IN_PROGRESS','DELIVERED','COMPLETED','CANCELLED','REFUNDED','DISPUTED'].map(s =>
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </AdminSelect>
      </FilterRow>

      {loading ? <LoadingArea label="Loading orders…" /> : items.length === 0 ? (
        <EmptyState icon={CreditCard} title="No orders found" />
      ) : (
        <Table headers={['Order #','Buyer','Seller','Total','Status','Actions']}>
          {items.map(o => (
            <Tr key={o.id}>
              <Td>
                <button onClick={() => openDetail(o)} className="text-left group">
                  <p className="font-mono text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition">{o.orderNumber}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{formatDate(o.createdAt)}</p>
                </button>
              </Td>
              <Td><span className="text-xs">{o.buyer?.email || '—'}</span></Td>
              <Td><span className="text-xs">{o.seller?.storeName || '—'}</span></Td>
              <Td><span className="font-medium text-white text-sm">{formatMoney(o.totalAmount, o.currency)}</span></Td>
              <Td><Badge color={statusColor(o.status)}>{o.status.replace(/_/g,' ')}</Badge></Td>
              <Td right>
                <div className="flex justify-end gap-1.5 flex-wrap">
                  {o.status === 'PENDING' && (
                    <ActionButton variant="success" loading={busy===`mp-${o.id}`}
                      onClick={() => { setMarkPaid(o); setMarkNote(''); }}>
                      <CheckCircle className="w-3 h-3" /> Mark Paid
                    </ActionButton>
                  )}
                  {!['CANCELLED','REFUNDED','COMPLETED'].includes(o.status) && (
                    <ActionButton variant="warning" loading={busy===`c-${o.id}`}
                      onClick={() => { if (window.confirm(`Cancel order ${o.orderNumber}?`)) act(`c-${o.id}`, () => api.patch(`/admin/orders/${o.id}/cancel`, { reason: 'Admin action' })); }}>
                      Cancel
                    </ActionButton>
                  )}
                  {!['REFUNDED','CANCELLED','PENDING'].includes(o.status) && (
                    <ActionButton variant="danger" loading={busy===`r-${o.id}`}
                      onClick={() => { if (window.confirm(`Refund order ${o.orderNumber}?`)) act(`r-${o.id}`, () => api.patch(`/admin/orders/${o.id}/refund`, { amount: Number(o.totalAmount), reason: 'Admin refund' })); }}>
                      <XCircle className="w-3 h-3" /> Refund
                    </ActionButton>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Order details" size="lg">
        {detail && (
          <div className="space-y-1">
            {detailLoading && <p className="text-xs text-gray-500 text-center py-1">Loading full details…</p>}
            <DetailRow label="Order #" value={detail.orderNumber} mono />
            <DetailRow label="Status"  value={<Badge color={statusColor(detail.status)}>{detail.status}</Badge>} />
            <DetailRow label="Total"   value={formatMoney(detail.totalAmount, detail.currency)} />
            <DetailRow label="Buyer"   value={detail.buyer?.email} />
            <DetailRow label="Seller"  value={detail.seller?.storeName} />
            <DetailRow label="Created" value={formatDate(detail.createdAt)} />
            {detail.paidAt && <DetailRow label="Paid" value={formatDate(detail.paidAt)} />}
            {detail.orderItems?.length ? (
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-1">Items</p>
                {detail.orderItems.map((it, i) => <p key={i} className="text-xs text-white">{it.listing?.title || 'Item'}</p>)}
              </div>
            ) : null}
            {detail.payments?.length ? (
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">Payments</p>
                {detail.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 mb-1">
                    <span className="font-mono text-xs text-gray-300">{p.provider}</span>
                    <Badge color={p.status==='COMPLETED'?'green':p.status==='PENDING'?'yellow':'red'}>{p.status}</Badge>
                    {p.paidAt && <span className="text-[11px] text-gray-500">{formatDate(p.paidAt)}</span>}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <Modal open={!!markPaid} onClose={() => { setMarkPaid(null); setMarkNote(''); }}
        title={<span className="flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-emerald-400" />Confirm Manual Payment</span>}
        footer={
          <>
            <button onClick={() => { setMarkPaid(null); setMarkNote(''); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-white transition">Cancel</button>
            <ActionButton variant="success" loading={markBusy} onClick={confirmMarkPaid}>
              <CheckCircle className="w-3.5 h-3.5" /> Confirm Payment
            </ActionButton>
          </>
        }>
        {markPaid && (
          <div className="space-y-3 text-sm">
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-xs">
              ⚠ This will mark order <span className="font-mono font-bold">{markPaid.orderNumber}</span> as PAID. Only use if the buyer paid outside the platform.
            </div>
            <DetailRow label="Order"  value={markPaid.orderNumber} mono />
            <DetailRow label="Amount" value={formatMoney(markPaid.totalAmount, markPaid.currency)} />
            <DetailRow label="Buyer"  value={markPaid.buyer?.email} />
            <AdminTextarea label="Admin note (optional)" value={markNote} rows={2}
              onChange={e => setMarkNote(e.target.value)} placeholder="e.g. Paid via bank transfer ref #123" />
          </div>
        )}
      </Modal>
    </div>
  );
}
