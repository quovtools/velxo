'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LifeBuoy, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton, Modal, formatDate } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  closedAt?: string;
  user?: { email: string; firstName?: string; lastName?: string };
}

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function AdminTicketsPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<Ticket | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/tickets', { params: { status, priority, page, limit: 25 } });
      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load tickets');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, priority, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    setError('');
    try { await fn(); await fetchItems(); }
    catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-brand" /> Support Tickets
          </h1>
          <p className="text-gray-400 text-sm mt-1">Triage, prioritise and close customer tickets.</p>
        </div>
        <button onClick={fetchItems} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingArea label="Loading tickets..." />
      ) : items.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets found" />
      ) : (
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs uppercase bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.id} className="border-t border-borderBg hover:bg-white/5">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(t)} className="text-left">
                        <p className="font-semibold text-white max-w-[260px] truncate">{t.subject}</p>
                        <p className="text-xs text-gray-500">{formatDate(t.createdAt)}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{t.user?.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{t.category}</td>
                    <td className="px-4 py-3">
                      <Badge color={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'red' : t.priority === 'MEDIUM' ? 'yellow' : 'gray'}>{t.priority}</Badge>
                    </td>
                    <td className="px-4 py-3"><Badge color={statusColor(t.status)}>{t.status.replace('_', ' ')}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <select
                          defaultValue={t.status}
                          onChange={e => act(`st-${t.id}`, () => api.patch(`/admin/tickets/${t.id}/status`, { status: e.target.value }))}
                          disabled={busy === `st-${t.id}`}
                          className="bg-background border border-borderBg rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        <select
                          defaultValue={t.priority}
                          onChange={e => act(`pr-${t.id}`, () => api.patch(`/admin/tickets/${t.id}/priority`, { priority: e.target.value }))}
                          disabled={busy === `pr-${t.id}`}
                          className="bg-background border border-borderBg rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand"
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
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

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Ticket details">
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label="Subject" value={detail.subject} />
            <Row label="User" value={detail.user?.email || '—'} />
            <Row label="Category" value={detail.category} />
            <Row label="Priority" value={detail.priority} />
            <Row label="Status" value={detail.status} />
            <Row label="Created" value={formatDate(detail.createdAt)} />
            <Row label="Closed" value={detail.closedAt ? formatDate(detail.closedAt) : '—'} />
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
