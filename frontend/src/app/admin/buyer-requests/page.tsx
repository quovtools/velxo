'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquarePlus, Search, CheckCircle, XCircle, Trash2,
  AlertTriangle, ShieldBan, ShieldCheck, RefreshCw, Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, statusColor, Pagination, EmptyState, ErrorBanner,
  ActionButton, Modal, formatDate, DetailRow, FilterRow,
  Table, Tr, Td, PageHeader, RefreshButton, AdminInput,
  AdminSelect, Card,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface BuyerRequest {
  id: string;
  gameName: string;
  title: string;
  description: string;
  itemType: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  status: string;
  isFlagged: boolean;
  flagCount: number;
  flagReason?: string;
  flaggedAt?: string;
  reviewedByAdminAt?: string;
  externalContactAttempts: number;
  createdAt: string;
  buyer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isBanned: boolean;
    externalContactStrikes: number;
  };
}

const STATUS_OPTS = [
  { value: '',                label: 'All statuses' },
  { value: 'FLAGGED',         label: 'Flagged' },
  { value: 'AUTO_SUSPENDED',  label: 'Auto-suspended' },
  { value: 'OPEN',            label: 'Open' },
  { value: 'CLOSED',          label: 'Closed' },
];

const strikesColor = (n: number) =>
  n >= 3 ? 'text-red-400' : n === 2 ? 'text-amber-400' : 'text-gray-400';

export default function AdminBuyerRequestsPage() {
  const [items, setItems]           = useState<BuyerRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [status, setStatus]         = useState('FLAGGED');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [busy, setBusy]             = useState<string | null>(null);
  const [detail, setDetail]         = useState<BuyerRequest | null>(null);
  const [resetTarget, setResetTarget] = useState<BuyerRequest | null>(null);
  const [resetBusy, setResetBusy]   = useState(false);
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: any = { limit: LIMIT, offset: (page - 1) * LIMIT };
      if (status) params.status = status;
      const res: any = await api.get('/admin/buyer-requests/flagged', { params });
      const data = res.data ?? res;
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / LIMIT));
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'CLEAR' | 'CONFIRM_VIOLATION' | 'DELETE') => {
    setBusy(`${action}-${id}`); setError('');
    try {
      await api.patch(`/admin/buyer-requests/${id}/review`, { action });
      await load();
      if (detail?.id === id) setDetail(null);
    } catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const resetStrikes = async (userId: string) => {
    setResetBusy(true); setError('');
    try {
      await api.patch(`/admin/users/${userId}/reset-strikes`, {});
      await load();
      setResetTarget(null);
    } catch (e: any) { setError(e.message || 'Failed to reset strikes'); }
    finally { setResetBusy(false); }
  };

  const filtered = search
    ? items.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.gameName.toLowerCase().includes(search.toLowerCase()) ||
        r.buyer?.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={MessageSquarePlus}
        title="Buyer Requests"
        subtitle="Review flagged requests and manage external-contact violations."
        action={<RefreshButton onClick={load} loading={loading} />}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total shown', value: total, color: 'text-white' },
          { label: 'Flagged',     value: items.filter(r => r.status === 'FLAGGED').length,        color: 'text-amber-400' },
          { label: 'Auto-sus.',   value: items.filter(r => r.status === 'AUTO_SUSPENDED').length,  color: 'text-red-400' },
          { label: 'Reviewed',    value: items.filter(r => r.reviewedByAdminAt).length,            color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-black mt-0.5 ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <FilterRow>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <AdminInput value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title, game, email…" className="pl-8" />
        </div>
        <AdminSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-44">
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </AdminSelect>
      </FilterRow>

      {loading ? <LoadingArea label="Loading requests…" /> : filtered.length === 0 ? (
        <EmptyState icon={MessageSquarePlus} title="No flagged requests found" />
      ) : (
        <Table headers={['Request', 'Game / Type', 'Buyer', 'Violations', 'Status', 'Actions']}>
          {filtered.map(req => (
            <Tr key={req.id}>
              <Td>
                <button onClick={() => setDetail(req)} className="text-left group max-w-[220px]">
                  <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition truncate">{req.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(req.createdAt)}</p>
                </button>
              </Td>
              <Td>
                <p className="text-xs text-white">{req.gameName}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{req.itemType}</p>
              </Td>
              <Td>
                <p className="text-xs text-white truncate max-w-[140px]">{req.buyer?.email}</p>
                <p className={`text-[10px] mt-0.5 font-semibold ${strikesColor(req.buyer?.externalContactStrikes ?? 0)}`}>
                  {req.buyer?.externalContactStrikes ?? 0} strikes
                  {req.buyer?.isBanned && <span className="ml-1 text-red-400">· Banned</span>}
                </p>
              </Td>
              <Td>
                {req.flagReason ? (
                  <p className="text-[11px] text-amber-300 max-w-[160px] truncate" title={req.flagReason}>
                    {req.flagReason}
                  </p>
                ) : (
                  <span className="text-gray-600 text-xs">—</span>
                )}
              </Td>
              <Td>
                <Badge color={
                  req.status === 'FLAGGED' ? 'yellow' :
                  req.status === 'AUTO_SUSPENDED' ? 'red' :
                  req.status === 'OPEN' ? 'green' : 'gray'
                }>
                  {req.status.replace('_', ' ')}
                </Badge>
              </Td>
              <Td right>
                <div className="flex justify-end gap-1.5 flex-wrap">
                  <ActionButton variant="default" onClick={() => setDetail(req)}>
                    <Eye className="w-3 h-3" /> View
                  </ActionButton>
                  <ActionButton variant="success" loading={busy === `CLEAR-${req.id}`}
                    onClick={() => act(req.id, 'CLEAR')} title="Clear flag — false positive">
                    <CheckCircle className="w-3 h-3" /> Clear
                  </ActionButton>
                  <ActionButton variant="warning" loading={busy === `CONFIRM_VIOLATION-${req.id}`}
                    onClick={() => act(req.id, 'CONFIRM_VIOLATION')} title="Confirm violation — add strike to buyer">
                    <AlertTriangle className="w-3 h-3" /> Confirm
                  </ActionButton>
                  <ActionButton variant="danger" loading={busy === `DELETE-${req.id}`}
                    onClick={() => act(req.id, 'DELETE')}>
                    <Trash2 className="w-3 h-3" />
                  </ActionButton>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Buyer Request Detail" size="lg">
        {detail && (
          <div className="space-y-4">
            {/* Platform warning */}
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">All transactions must be completed through PIYROX. External deals are not protected.</p>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <DetailRow label="Title"      value={detail.title} />
              <DetailRow label="Game"       value={detail.gameName} />
              <DetailRow label="Item Type"  value={detail.itemType} />
              <DetailRow label="Status"     value={<Badge color={statusColor(detail.status)}>{detail.status.replace('_',' ')}</Badge>} />
              <DetailRow label="Budget"     value={detail.budgetMin || detail.budgetMax ? `${detail.budgetMin ?? 0} – ${detail.budgetMax ?? '∞'} ${detail.currency}` : 'Not set'} />
              <DetailRow label="Flag count" value={String(detail.flagCount)} />
              <DetailRow label="Flagged at" value={detail.flaggedAt ? formatDate(detail.flaggedAt) : '—'} />
              <DetailRow label="Reviewed"   value={detail.reviewedByAdminAt ? formatDate(detail.reviewedByAdminAt) : 'Not yet'} />
            </div>

            <div className="bg-white/4 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Description</p>
              <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">{detail.description}</p>
            </div>

            {detail.flagReason && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-[10px] text-amber-500 font-semibold uppercase mb-1">Flag Reason</p>
                <p className="text-xs text-amber-300">{detail.flagReason}</p>
              </div>
            )}

            <div className="border-t border-white/8 pt-3">
              <p className="text-xs font-semibold text-white mb-2">Buyer</p>
              <div className="grid grid-cols-2 gap-1">
                <DetailRow label="Email"   value={detail.buyer?.email} />
                <DetailRow label="Strikes" value={
                  <span className={strikesColor(detail.buyer?.externalContactStrikes ?? 0)}>
                    {detail.buyer?.externalContactStrikes ?? 0} / 3
                  </span>
                } />
                <DetailRow label="Banned"  value={detail.buyer?.isBanned ? <Badge color="red">Yes</Badge> : <Badge color="green">No</Badge>} />
              </div>
              {(detail.buyer?.externalContactStrikes > 0 || detail.buyer?.isBanned) && (
                <button
                  onClick={() => setResetTarget(detail)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Reset strikes & reinstate account
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <ActionButton variant="success" loading={busy === `CLEAR-${detail.id}`}
                onClick={() => act(detail.id, 'CLEAR')}>
                <CheckCircle className="w-3.5 h-3.5" /> Clear Flag (False Positive)
              </ActionButton>
              <ActionButton variant="warning" loading={busy === `CONFIRM_VIOLATION-${detail.id}`}
                onClick={() => act(detail.id, 'CONFIRM_VIOLATION')}>
                <AlertTriangle className="w-3.5 h-3.5" /> Confirm Violation (+1 Strike)
              </ActionButton>
              <ActionButton variant="danger" loading={busy === `DELETE-${detail.id}`}
                onClick={() => act(detail.id, 'DELETE')}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset strikes confirm modal */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset User Strikes">
        {resetTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Reset all external-contact strikes for <span className="text-white font-semibold">{resetTarget.buyer?.email}</span> and unban their account if banned?
            </p>
            <p className="text-xs text-gray-500">This action is logged in audit trails.</p>
            <div className="flex gap-3">
              <ActionButton variant="success" loading={resetBusy}
                onClick={() => resetStrikes(resetTarget.buyer.id)}>
                <ShieldCheck className="w-3.5 h-3.5" /> Yes, Reset & Reinstate
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setResetTarget(null)}>
                Cancel
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
