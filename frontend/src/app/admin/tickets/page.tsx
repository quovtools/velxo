'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LifeBuoy } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, statusColor, Pagination, EmptyState, ErrorBanner, Modal,
  FilterRow, Table, Tr, Td, PageHeader, RefreshButton, AdminSelect,
  formatDate, DetailRow,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Ticket {
  id: string; subject: string; category: string; priority: string;
  status: string; createdAt: string; closedAt?: string;
  user?: { email: string; firstName?: string; lastName?: string };
}

const STATUSES   = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];

const priorityColor = (p: string) =>
  p === 'URGENT' || p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'yellow' : 'gray';

export default function AdminTicketsPage() {
  const [items, setItems]           = useState<Ticket[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [status, setStatus]         = useState('');
  const [priority, setPriority]     = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy]             = useState<string | null>(null);
  const [detail, setDetail]         = useState<Ticket | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res: any = await api.get('/admin/tickets', { params: { status, priority, page, limit: 25 } });
      setItems(res.data || []); setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) { setError(e.message || 'Failed'); setItems([]); }
    finally { setLoading(false); }
  }, [status, priority, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id); setError('');
    try { await fn(); await fetchItems(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const openCount = items.filter(t => t.status === 'OPEN').length;

  return (
    <div className="space-y-5">
      <PageHeader icon={LifeBuoy} title="Support Tickets"
        subtitle={openCount > 0 ? `${openCount} open ticket${openCount > 1 ? 's' : ''}` : 'Triage and close customer support tickets.'}
        action={<RefreshButton onClick={fetchItems} loading={loading} />} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      <FilterRow>
        <AdminSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </AdminSelect>
        <AdminSelect value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }} className="w-36">
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </AdminSelect>
      </FilterRow>

      {loading ? <LoadingArea label="Loading tickets…" /> : items.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets found" subtitle="Try adjusting your filters." />
      ) : (
        <Table headers={['Subject','User','Category','Priority','Status','Actions']}>
          {items.map(t => (
            <Tr key={t.id}>
              <Td>
                <button onClick={() => setDetail(t)} className="text-left group">
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition max-w-[240px] truncate">{t.subject}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{formatDate(t.createdAt)}</p>
                </button>
              </Td>
              <Td><span className="text-xs">{t.user?.email || '—'}</span></Td>
              <Td><span className="text-xs text-gray-500">{t.category}</span></Td>
              <Td><Badge color={priorityColor(t.priority) as any}>{t.priority}</Badge></Td>
              <Td><Badge color={statusColor(t.status)}>{t.status.replace(/_/g,' ')}</Badge></Td>
              <Td right>
                <div className="flex justify-end gap-1.5">
                  <AdminSelect
                    defaultValue={t.status}
                    onChange={e => act(`st-${t.id}`, () => api.patch(`/admin/tickets/${t.id}/status`, { status: e.target.value }))}
                    disabled={busy === `st-${t.id}`}
                    className="w-28 text-xs py-1.5">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </AdminSelect>
                  <AdminSelect
                    defaultValue={t.priority}
                    onChange={e => act(`pr-${t.id}`, () => api.patch(`/admin/tickets/${t.id}/priority`, { priority: e.target.value }))}
                    disabled={busy === `pr-${t.id}`}
                    className="w-24 text-xs py-1.5">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </AdminSelect>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Ticket Details">
        {detail && (
          <div className="space-y-1">
            <DetailRow label="Subject"  value={detail.subject} />
            <DetailRow label="User"     value={detail.user?.email} />
            <DetailRow label="Category" value={detail.category} />
            <DetailRow label="Priority" value={<Badge color={priorityColor(detail.priority) as any}>{detail.priority}</Badge>} />
            <DetailRow label="Status"   value={<Badge color={statusColor(detail.status)}>{detail.status}</Badge>} />
            <DetailRow label="Created"  value={formatDate(detail.createdAt)} />
            <DetailRow label="Closed"   value={detail.closedAt ? formatDate(detail.closedAt) : '—'} />
          </div>
        )}
      </Modal>
    </div>
  );
}
