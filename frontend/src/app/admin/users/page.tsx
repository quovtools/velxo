'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, Mail, RefreshCw, ShieldBan, ShieldCheck, UserX, UserCheck,
  Wallet, ShoppingCart, MessageSquare, TicketIcon, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, statusColor, Pagination, EmptyState, ErrorBanner, ActionButton, Modal, formatDate, formatMoney } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface SellerAccount {
  id: string;
  storeName: string;
  isVerified: boolean;
  isSuspended?: boolean;
  totalSales?: number;
  averageRating?: number;
}

interface UserDetail {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  emailVerified: boolean;
  createdAt: string;
  sellers?: SellerAccount[];
  wallet?: { balance: number; totalEarnings: number; totalWithdrawn: number; currency?: string };
  velxoCoins?: { balance: number; totalEarned: number };
  stats?: { orders: number; disputes: number; tickets: number };
}

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
  sellers?: SellerAccount[];
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

  // Detail modal
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Ban modal
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banBusy, setBanBusy] = useState(false);

  // Role change confirm
  const [roleTarget, setRoleTarget] = useState<{ id: string; newRole: string; currentRole: string } | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);

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

  const openDetail = async (u: User) => {
    setDetailLoading(true);
    setDetail(u as UserDetail);
    try {
      const res: any = await api.get(`/admin/users/${u.id}`);
      setDetail(res.data || u as UserDetail);
    } catch {
      // fallback to basic user data already set
    } finally {
      setDetailLoading(false);
    }
  };

  const act = async (id: string, fn: () => Promise<any>, refreshDetail?: string) => {
    setBusy(id);
    setError('');
    try {
      await fn();
      await fetchUsers();
      if (refreshDetail) {
        const res: any = await api.get(`/admin/users/${refreshDetail}`);
        setDetail(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const confirmBan = async () => {
    if (!banTarget) return;
    setBanBusy(true);
    setError('');
    try {
      await api.patch(`/admin/users/${banTarget.id}/ban`, { reason: banReason });
      setBanTarget(null);
      setBanReason('');
      await fetchUsers();
      if (detail?.id === banTarget.id) {
        const res: any = await api.get(`/admin/users/${banTarget.id}`);
        setDetail(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Ban failed');
    } finally {
      setBanBusy(false);
    }
  };

  const confirmRoleChange = async () => {
    if (!roleTarget) return;
    setRoleBusy(true);
    setError('');
    try {
      await api.patch(`/admin/users/${roleTarget.id}/role`, { role: roleTarget.newRole });
      setRoleTarget(null);
      await fetchUsers();
      if (detail?.id === roleTarget.id) {
        const res: any = await api.get(`/admin/users/${roleTarget.id}`);
        setDetail(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Role change failed');
    } finally {
      setRoleBusy(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const displayName = (u: User | UserDetail) =>
    u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.email;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" /> User Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Ban, suspend, verify, change roles, and inspect any user account.
          </p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email, name, or phone..."
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

      {/* Table */}
      {loading ? (
        <LoadingArea label="Loading users..." />
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
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => (
                  <tr key={u.id} className="border-t border-borderBg hover:bg-white/5">
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(u)} className="text-left group">
                        <p className="font-semibold text-white group-hover:text-brand transition">{displayName(u)}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        {u.sellers?.length ? (
                          <p className="text-xs text-purple-400 mt-0.5">🏪 {u.sellers[0].storeName}</p>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'red' : u.role === 'SELLER' ? 'purple' : u.role === 'MODERATOR' ? 'blue' : 'brand'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.isBanned
                        ? <Badge color="red">Banned</Badge>
                        : !u.isActive
                          ? <Badge color="yellow">Inactive</Badge>
                          : <Badge color="green">Active</Badge>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {u.emailVerified
                        ? <Badge color="green">Verified</Badge>
                        : <Badge color="yellow">Unverified</Badge>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        <ActionButton variant="default" onClick={() => openDetail(u)}>
                          View
                        </ActionButton>
                        {u.isBanned ? (
                          <ActionButton
                            variant="success"
                            loading={busy === `unban-${u.id}`}
                            onClick={() => act(`unban-${u.id}`, () => api.patch(`/admin/users/${u.id}/unban`), u.id)}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Unban
                          </ActionButton>
                        ) : (
                          <ActionButton
                            variant="danger"
                            onClick={() => { setBanTarget(u); setBanReason(''); }}
                          >
                            <ShieldBan className="w-3.5 h-3.5" /> Ban
                          </ActionButton>
                        )}
                        <ActionButton
                          variant="warning"
                          loading={busy === `act-${u.id}`}
                          onClick={() => act(`act-${u.id}`, () => api.patch(`/admin/users/${u.id}/active`, { active: !u.isActive }), u.id)}
                        >
                          {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </ActionButton>
                        {!u.emailVerified && (
                          <ActionButton
                            variant="default"
                            loading={busy === `ver-${u.id}`}
                            onClick={() => act(`ver-${u.id}`, () => api.patch(`/admin/users/${u.id}/verify-email`), u.id)}
                          >
                            <Mail className="w-3.5 h-3.5" /> Verify Email
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

      {/* ─── User Detail Modal ─── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="User Profile" size="xl">
        {detail && (
          <div className="space-y-6 text-sm">
            {detailLoading && (
              <div className="text-center py-4 text-gray-400 text-xs">Loading full profile…</div>
            )}

            {/* Identity */}
            <Section title="Identity">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Name" value={displayName(detail)} />
                <InfoRow
                  label="User ID"
                  value={detail.id}
                  action={
                    <button onClick={() => copyToClipboard(detail.id)} title="Copy ID" className="text-gray-500 hover:text-brand transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  }
                />
                <InfoRow label="Email" value={detail.email} />
                <InfoRow label="Phone" value={detail.phone || '—'} />
                <InfoRow label="Role" value={detail.role} />
                <InfoRow label="Joined" value={formatDate(detail.createdAt)} />
              </div>
            </Section>

            {/* Account Status */}
            <Section title="Account Status">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow
                  label="Active"
                  value={detail.isActive ? 'Yes' : 'No'}
                  valueNode={detail.isActive ? <Badge color="green">Active</Badge> : <Badge color="yellow">Inactive</Badge>}
                />
                <InfoRow
                  label="Banned"
                  value={detail.isBanned ? 'Yes' : 'No'}
                  valueNode={detail.isBanned ? <Badge color="red">Banned</Badge> : <Badge color="green">No</Badge>}
                />
                <InfoRow
                  label="Email verified"
                  value={detail.emailVerified ? 'Yes' : 'No'}
                  valueNode={detail.emailVerified ? <Badge color="green">Verified</Badge> : <Badge color="yellow">Unverified</Badge>}
                />
                {detail.banReason && (
                  <div className="col-span-2 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs">
                    Ban reason: {detail.banReason}
                  </div>
                )}
              </div>
            </Section>

            {/* Financials */}
            {(detail.wallet || detail.velxoCoins) && (
              <Section title="Wallet & Coins">
                <div className="grid grid-cols-2 gap-3">
                  {detail.wallet && (
                    <>
                      <InfoRow label="Balance" value={formatMoney(detail.wallet.balance, detail.wallet.currency || 'USD')} />
                      <InfoRow label="Total earned" value={formatMoney(detail.wallet.totalEarnings, detail.wallet.currency || 'USD')} />
                      <InfoRow label="Total withdrawn" value={formatMoney(detail.wallet.totalWithdrawn, detail.wallet.currency || 'USD')} />
                    </>
                  )}
                  {detail.velxoCoins && (
                    <>
                      <InfoRow label="Velxo Coins" value={`${Number(detail.velxoCoins.balance).toLocaleString()} VC`} />
                      <InfoRow label="Total coins earned" value={`${Number(detail.velxoCoins.totalEarned).toLocaleString()} VC`} />
                    </>
                  )}
                </div>
              </Section>
            )}

            {/* Activity stats */}
            {detail.stats && (
              <Section title="Activity">
                <div className="grid grid-cols-3 gap-3">
                  <StatBadge icon={ShoppingCart} label="Orders" value={detail.stats.orders} />
                  <StatBadge icon={MessageSquare} label="Disputes" value={detail.stats.disputes} color="text-orange-400" />
                  <StatBadge icon={TicketIcon} label="Tickets" value={detail.stats.tickets} color="text-blue-400" />
                </div>
              </Section>
            )}

            {/* Seller accounts */}
            {detail.sellers && detail.sellers.length > 0 && (
              <Section title="Seller Accounts">
                <div className="space-y-2">
                  {detail.sellers.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-white font-semibold">{s.storeName}</p>
                        <p className="text-gray-500 text-xs font-mono">{s.id}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        {s.isVerified ? <Badge color="green">Verified</Badge> : <Badge color="yellow">Unverified</Badge>}
                        {s.isSuspended && <Badge color="red">Suspended</Badge>}
                        {s.averageRating != null && (
                          <span className="text-yellow-400 text-xs">★ {Number(s.averageRating).toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Admin Actions */}
            <Section title="Admin Actions">
              <div className="flex flex-wrap gap-2">
                {detail.isBanned ? (
                  <ActionButton
                    variant="success"
                    loading={busy === `modal-unban-${detail.id}`}
                    onClick={() => act(`modal-unban-${detail.id}`, () => api.patch(`/admin/users/${detail.id}/unban`), detail.id)}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Unban User
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="danger"
                    onClick={() => { setBanTarget(detail as unknown as User); setBanReason(''); }}
                  >
                    <ShieldBan className="w-3.5 h-3.5" /> Ban User
                  </ActionButton>
                )}

                <ActionButton
                  variant="warning"
                  loading={busy === `modal-act-${detail.id}`}
                  onClick={() => act(`modal-act-${detail.id}`, () => api.patch(`/admin/users/${detail.id}/active`, { active: !detail.isActive }), detail.id)}
                >
                  {detail.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  {detail.isActive ? 'Deactivate Account' : 'Activate Account'}
                </ActionButton>

                {!detail.emailVerified && (
                  <ActionButton
                    variant="default"
                    loading={busy === `modal-ver-${detail.id}`}
                    onClick={() => act(`modal-ver-${detail.id}`, () => api.patch(`/admin/users/${detail.id}/verify-email`), detail.id)}
                  >
                    <Mail className="w-3.5 h-3.5" /> Verify Email
                  </ActionButton>
                )}
              </div>

              {/* Role change */}
              <div className="mt-4">
                <label className="block text-gray-400 mb-2 text-xs font-semibold uppercase tracking-wide">Change Role</label>
                <div className="flex gap-2 items-center">
                  <select
                    defaultValue={detail.role}
                    onChange={e => setRoleTarget({ id: detail.id, newRole: e.target.value, currentRole: detail.role })}
                    className="flex-1 bg-background border border-borderBg rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <span className="text-xs text-gray-500">Select a new role to be prompted to confirm</span>
                </div>
              </div>
            </Section>
          </div>
        )}
      </Modal>

      {/* ─── Ban Confirmation Modal ─── */}
      <Modal
        open={!!banTarget}
        onClose={() => { setBanTarget(null); setBanReason(''); }}
        title={
          <span className="flex items-center gap-2 text-red-400">
            <ShieldBan className="w-4 h-4" /> Ban User
          </span>
        }
        footer={
          <>
            <button
              onClick={() => { setBanTarget(null); setBanReason(''); }}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <ActionButton variant="danger" loading={banBusy} onClick={confirmBan}>
              <ShieldBan className="w-3.5 h-3.5" /> Confirm Ban
            </ActionButton>
          </>
        }
      >
        {banTarget && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-300">
              Banning <span className="text-white font-semibold">{displayName(banTarget)}</span> will block their account immediately.
            </p>
            <div>
              <label className="block text-gray-400 mb-2">Ban reason <span className="text-gray-600">(optional)</span></label>
              <textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="e.g. Fraudulent activity, repeated policy violations..."
                rows={3}
                className="w-full bg-background border border-borderBg rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand resize-none"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Role Change Confirmation Modal ─── */}
      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title="Confirm Role Change"
        footer={
          <>
            <button onClick={() => setRoleTarget(null)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition">
              Cancel
            </button>
            <ActionButton variant="brand" loading={roleBusy} onClick={confirmRoleChange}>
              Confirm Change
            </ActionButton>
          </>
        }
      >
        {roleTarget && (
          <div className="space-y-3 text-sm">
            <p className="text-gray-300">
              Change role from{' '}
              <Badge color="brand">{roleTarget.currentRole}</Badge>
              {' '}to{' '}
              <Badge color={roleTarget.newRole === 'ADMIN' || roleTarget.newRole === 'SUPER_ADMIN' ? 'red' : 'purple'}>
                {roleTarget.newRole}
              </Badge>
              ?
            </p>
            {(roleTarget.newRole === 'ADMIN' || roleTarget.newRole === 'SUPER_ADMIN') && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-xs">
                ⚠ Granting admin/super-admin access gives full platform control. Only do this for trusted team members.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueNode,
  action,
}: {
  label: string;
  value: string;
  valueNode?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
      <span className="text-gray-400 shrink-0 text-xs">{label}</span>
      <span className="flex items-center gap-1.5 text-white text-right text-xs break-all">
        {valueNode || value}
        {action}
      </span>
    </div>
  );
}

function StatBadge({
  icon: Icon,
  label,
  value,
  color = 'text-brand',
}: {
  icon: any;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center gap-1">
      <Icon className={`w-5 h-5 ${color}`} />
      <p className="text-white font-bold text-lg">{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  );
}
