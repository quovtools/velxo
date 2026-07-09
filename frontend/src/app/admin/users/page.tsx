'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, Ban, CheckCircle, Shield, Mail, RefreshCw, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton, Modal, formatDate } from '@/components/admin/ui';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  emailVerified: boolean;
  createdAt: string;
  sellers?: { id: string; storeName: string; isVerified: boolean }[];
}

const ROLES = ['BUYER', 'SELLER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

export default function AdminUsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/admin/users', {
        params: { search, status, role, page, limit: 25 },
      });
      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, role, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    setError('');
    try {
      await fn();
      await fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" /> User Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Ban, suspend, verify or change roles for any user.</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search email or name..."
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="bg-cardBg border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand">
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading users...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Users} title="No users found" subtitle="Try adjusting your filters." />
      ) : (
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs uppercase bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => (
                  <tr key={u.id} className="border-t border-borderBg hover:bg-white/5">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(u)} className="text-left">
                        <p className="font-semibold text-white">{u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.email}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3"><Badge color="brand">{u.role}</Badge></td>
                    <td className="px-4 py-3">
                      {u.isBanned ? <Badge color="red">Banned</Badge> : !u.isActive ? <Badge color="yellow">Inactive</Badge> : <Badge color="green">Active</Badge>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {u.isBanned ? (
                          <ActionButton variant="success" loading={busy === u.id} onClick={() => act(u.id, () => api.patch(`/admin/users/${u.id}/unban`))}>Unban</ActionButton>
                        ) : (
                          <ActionButton variant="danger" loading={busy === u.id} onClick={() => act(u.id, () => api.patch(`/admin/users/${u.id}/ban`, { reason: 'Violation of terms' }))}>Ban</ActionButton>
                        )}
                        <ActionButton variant="warning" loading={busy === `act-${u.id}`} onClick={() => act(`act-${u.id}`, () => api.patch(`/admin/users/${u.id}/active`, { active: !u.isActive }))}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </ActionButton>
                        {!u.emailVerified && (
                          <ActionButton variant="default" loading={busy === `ver-${u.id}`} onClick={() => act(`ver-${u.id}`, () => api.patch(`/admin/users/${u.id}/verify-email`))}>
                            <Mail className="w-3.5 h-3.5" /> Verify
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

      <Modal open={!!detail} onClose={() => setDetail(null)} title="User details">
        {detail && (
          <div className="space-y-4 text-sm">
            <Row label="ID" value={detail.id} />
            <Row label="Name" value={`${detail.firstName || ''} ${detail.lastName || ''}`.trim() || '—'} />
            <Row label="Email" value={detail.email} />
            <Row label="Role" value={detail.role} />
            <Row label="Active" value={detail.isActive ? 'Yes' : 'No'} />
            <Row label="Banned" value={detail.isBanned ? `Yes${detail.banReason ? ` — ${detail.banReason}` : ''}` : 'No'} />
            <Row label="Email verified" value={detail.emailVerified ? 'Yes' : 'No'} />
            <Row label="Joined" value={formatDate(detail.createdAt)} />
            {detail.sellers?.length ? (
              <div>
                <p className="text-gray-400 mb-1">Seller accounts</p>
                {detail.sellers.map(s => (
                  <p key={s.id} className="text-white">{s.storeName} {s.isVerified && <Badge color="green">verified</Badge>}</p>
                ))}
              </div>
            ) : null}
            <div className="pt-2 border-t border-borderBg">
              <label className="block text-gray-400 mb-2">Change role</label>
              <div className="flex gap-2 items-center">
                <select
                  defaultValue={detail.role}
                  onChange={async (e) => {
                    setBusy(`role-${detail.id}`);
                    try { await api.patch(`/admin/users/${detail.id}/role`, { role: e.target.value }); await fetchUsers(); setDetail({ ...detail, role: e.target.value }); }
                    catch (err: any) { setError(err.message); }
                    finally { setBusy(null); }
                  }}
                  disabled={busy === `role-${detail.id}`}
                  className="flex-1 bg-background border border-borderBg rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {busy === `role-${detail.id}` && <span className="text-xs text-gray-400">Saving...</span>}
              </div>
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
