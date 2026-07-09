'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { History, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, EmptyState, ErrorBanner, Pagination, formatDate } from '@/components/admin/ui';

interface Log {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
}

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ROLE_CHANGE', 'VERIFICATION_CHANGE', 'REFUND', 'WITHDRAWAL', 'ESCROW_RELEASE', 'PAYMENT'];

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/audit-logs', { params: { action, entityType, ...(search ? { actorId: search } : {}), page, limit: 50 } });
      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load audit logs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [action, entityType, search, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand" /> Audit Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">Full trail of administrative actions across the platform.</p>
        </div>
        <button onClick={fetchItems} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="flex flex-wrap gap-3">
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
        </select>
        <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All entities</option>
          {['user', 'seller', 'listing', 'order', 'withdrawal', 'ticket', 'category', 'subcategory', 'topup', 'blog'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Actor ID..."
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading logs...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={History} title="No audit logs found" />
      ) : (
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs uppercase bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Entity</th>
                  <th className="text-left px-4 py-3">Actor</th>
                  <th className="text-left px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {items.map(l => (
                  <tr key={l.id} className="border-t border-borderBg hover:bg-white/5">
                    <td className="px-4 py-3"><Badge color="brand">{l.action.replace('_', ' ')}</Badge></td>
                    <td className="px-4 py-3">
                      <p className="text-white capitalize">{l.entityType}</p>
                      <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]">{l.entityId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{l.actorId}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(l.createdAt)}</td>
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
