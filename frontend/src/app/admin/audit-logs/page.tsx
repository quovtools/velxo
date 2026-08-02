'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { History, Search } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, Pagination, EmptyState, ErrorBanner, FilterRow,
  Table, Tr, Td, PageHeader, RefreshButton, AdminInput, AdminSelect, formatDate,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Log {
  id: string; actorId: string; action: string; entityType: string;
  entityId: string; createdAt: string;
}

const ACTIONS = ['CREATE','UPDATE','DELETE','STATUS_CHANGE','ROLE_CHANGE','VERIFICATION_CHANGE','REFUND','WITHDRAWAL','ESCROW_RELEASE','PAYMENT'];
const ENTITIES = ['user','seller','listing','order','withdrawal','ticket','category','subcategory','topup','blog'];

const ACTION_COLOR: Record<string, 'green'|'red'|'yellow'|'violet'|'gray'> = {
  CREATE: 'green', DELETE: 'red', REFUND: 'red', WITHDRAWAL: 'yellow',
  STATUS_CHANGE: 'violet', ROLE_CHANGE: 'violet', VERIFICATION_CHANGE: 'violet',
};

export default function AdminAuditLogsPage() {
  const [items, setItems]           = useState<Log[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [action, setAction]         = useState('');
  const [entityType, setEntityType] = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res: any = await api.get('/admin/audit-logs', {
        params: { action, entityType, ...(search ? { actorId: search } : {}), page, limit: 50 },
      });
      setItems(res.data || []); setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) { setError(e.message || 'Failed to load logs'); setItems([]); }
    finally { setLoading(false); }
  }, [action, entityType, search, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  return (
    <div className="space-y-5">
      <PageHeader icon={History} title="Audit Logs" subtitle="Full trail of every administrative action on the platform."
        action={<RefreshButton onClick={fetchItems} loading={loading} />} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      <FilterRow>
        <AdminSelect value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="w-44">
          <option value="">All actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
        </AdminSelect>
        <AdminSelect value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }} className="w-36">
          <option value="">All entities</option>
          {ENTITIES.map(t => <option key={t} value={t}>{t}</option>)}
        </AdminSelect>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <AdminInput value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Actor ID…" className="pl-8" />
        </div>
      </FilterRow>

      {loading ? <LoadingArea label="Loading logs…" /> : items.length === 0 ? (
        <EmptyState icon={History} title="No audit logs found" subtitle="Try adjusting your filters." />
      ) : (
        <Table headers={['Action', 'Entity', 'Entity ID', 'Actor', 'When']}>
          {items.map(l => (
            <Tr key={l.id}>
              <Td>
                <Badge color={ACTION_COLOR[l.action] || 'gray'}>
                  {l.action.replace(/_/g,' ')}
                </Badge>
              </Td>
              <Td><span className="text-xs capitalize font-medium text-white">{l.entityType}</span></Td>
              <Td><span className="font-mono text-[11px] text-gray-500 truncate block max-w-[160px]">{l.entityId}</span></Td>
              <Td><span className="font-mono text-[11px] text-gray-500 truncate block max-w-[160px]">{l.actorId}</span></Td>
              <Td><span className="text-[11px] text-gray-600">{formatDate(l.createdAt)}</span></Td>
            </Tr>
          ))}
        </Table>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
