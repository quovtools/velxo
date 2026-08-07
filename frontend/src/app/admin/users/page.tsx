'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, ShieldBan, ShieldCheck, UserX, UserCheck, Mail, Copy, ShoppingCart, MessageSquare, TicketIcon } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, Pagination, EmptyState, ErrorBanner, ActionButton, Modal,
  formatDate, formatMoney, DetailRow, FilterRow, Table, Tr, Td,
  PageHeader, RefreshButton, AdminInput, AdminSelect, AdminTextarea, Card,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface SellerAccount { id: string; storeName: string; isVerified: boolean; isSuspended?: boolean; averageRating?: number; }
interface UserDetail {
  id: string; email: string; firstName?: string; lastName?: string; phone?: string;
  role: string; isActive: boolean; isBanned: boolean; banReason?: string; emailVerified: boolean; createdAt: string;
  sellers?: SellerAccount[];
  wallet?: { balance: number; totalEarnings: number; totalWithdrawn: number; currency?: string };
  piyroxCoins?: { balance: number; totalEarned: number };
  stats?: { orders: number; disputes: number; tickets: number };
}
interface User { id: string; email: string; firstName?: string; lastName?: string; role: string; isActive: boolean; isBanned: boolean; emailVerified: boolean; createdAt: string; sellers?: SellerAccount[]; }

const ROLES = ['BUYER','SELLER','MODERATOR','ADMIN','SUPER_ADMIN'];
const roleColor = (r: string) => r === 'ADMIN' || r === 'SUPER_ADMIN' ? 'red' : r === 'SELLER' ? 'purple' : r === 'MODERATOR' ? 'violet' : 'gray';
const displayName = (u: { firstName?: string; lastName?: string; email: string }) =>
  u.firstName || u.lastName ? `${u.firstName||''} ${u.lastName||''}`.trim() : u.email;

export default function AdminUsersPage() {
  const [items, setItems]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [role, setRole]             = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy]             = useState<string | null>(null);
  const [detail, setDetail]         = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [banTarget, setBanTarget]   = useState<User | null>(null);
  const [banReason, setBanReason]   = useState('');
  const [banBusy, setBanBusy]       = useState(false);
  const [roleTarget, setRoleTarget] = useState<{ id: string; newRole: string; currentRole: string } | null>(null);
  const [roleBusy, setRoleBusy]     = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res: any = await api.get('/admin/users', { params: { search, status, role, page, limit: 25 } });
      setItems(Array.isArray(res.data) ? res.data : []); setTotalPages(res.meta?.totalPages || 1);
    } catch (e: any) { setError(e.message || 'Failed'); setItems([]); }
    finally { setLoading(false); }
  }, [search, status, role, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openDetail = async (u: User) => {
    setDetailLoading(true); setDetail(u as UserDetail);
    try { const res: any = await api.get(`/admin/users/${u.id}`); setDetail(res.data || u as UserDetail); }
    catch { } finally { setDetailLoading(false); }
  };

  const act = async (id: string, fn: () => Promise<any>, refreshId?: string) => {
    setBusy(id); setError('');
    try {
      await fn(); await fetchUsers();
      if (refreshId) { const res: any = await api.get(`/admin/users/${refreshId}`); setDetail(res.data); }
    } catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const confirmBan = async () => {
    if (!banTarget) return;
    setBanBusy(true); setError('');
    try {
      await api.patch(`/admin/users/${banTarget.id}/ban`, { reason: banReason });
      setBanTarget(null); setBanReason(''); await fetchUsers();
      if (detail?.id === banTarget.id) { const r: any = await api.get(`/admin/users/${banTarget.id}`); setDetail(r.data); }
    } catch (e: any) { setError(e.message || 'Ban failed'); }
    finally { setBanBusy(false); }
  };

  const confirmRole = async () => {
    if (!roleTarget) return;
    setRoleBusy(true); setError('');
    try {
      await api.patch(`/admin/users/${roleTarget.id}/role`, { role: roleTarget.newRole });
      setRoleTarget(null); await fetchUsers();
      if (detail?.id === roleTarget.id) { const r: any = await api.get(`/admin/users/${roleTarget.id}`); setDetail(r.data); }
    } catch (e: any) { setError(e.message || 'Role change failed'); }
    finally { setRoleBusy(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={Users} title="Users" subtitle="Ban, verify, change roles and inspect any user account."
        action={<RefreshButton onClick={fetchUsers} loading={loading} />} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      <FilterRow>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <AdminInput value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Email, name or phone…" className="pl-8" />
        </div>
        <AdminSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-36">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </AdminSelect>
        <AdminSelect value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="w-36">
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </AdminSelect>
      </FilterRow>

      {loading ? <LoadingArea label="Loading users…" /> : items.length === 0 ? (
        <EmptyState icon={Users} title="No users found" subtitle="Try adjusting your filters." />
      ) : (
        <Table headers={['User','Role','Status','Email','Joined','Actions']}>
          {items.map(u => (
            <Tr key={u.id}>
              <Td>
                <button onClick={() => openDetail(u)} className="text-left group">
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition">{displayName(u)}</p>
                  <p className="text-[11px] text-gray-600">{u.email}</p>
                  {u.sellers?.length ? <p className="text-[11px] text-purple-400 mt-0.5">🏪 {u.sellers[0].storeName}</p> : null}
                </button>
              </Td>
              <Td><Badge color={roleColor(u.role) as any}>{u.role}</Badge></Td>
              <Td>
                {u.isBanned ? <Badge color="red">Banned</Badge>
                  : !u.isActive ? <Badge color="yellow">Inactive</Badge>
                  : <Badge color="green">Active</Badge>}
              </Td>
              <Td>{u.emailVerified ? <Badge color="green">Verified</Badge> : <Badge color="yellow">Unverified</Badge>}</Td>
              <Td><span className="text-[11px] text-gray-600">{formatDate(u.createdAt)}</span></Td>
              <Td right>
                <div className="flex justify-end gap-1.5 flex-wrap">
                  <ActionButton variant="default" onClick={() => openDetail(u)}>View</ActionButton>
                  {u.isBanned
                    ? <ActionButton variant="success" loading={busy===`unban-${u.id}`} onClick={() => act(`unban-${u.id}`, () => api.patch(`/admin/users/${u.id}/unban`), u.id)}>
                        <ShieldCheck className="w-3 h-3" />Unban
                      </ActionButton>
                    : <ActionButton variant="danger" onClick={() => { setBanTarget(u); setBanReason(''); }}>
                        <ShieldBan className="w-3 h-3" />Ban
                      </ActionButton>
                  }
                  <ActionButton variant="warning" loading={busy===`act-${u.id}`}
                    onClick={() => act(`act-${u.id}`, () => api.patch(`/admin/users/${u.id}/active`, { active: !u.isActive }), u.id)}>
                    {u.isActive ? <><UserX className="w-3 h-3" />Deactivate</> : <><UserCheck className="w-3 h-3" />Activate</>}
                  </ActionButton>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="User Profile" size="xl">
        {detail && (
          <div className="space-y-5 text-sm">
            {detailLoading && <p className="text-xs text-gray-500 text-center">Loading full profile…</p>}
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Identity</p>
              <div className="grid grid-cols-2 gap-1">
                <DetailRow label="Name"   value={displayName(detail)} />
                <DetailRow label="ID"     value={<span className="flex items-center gap-1">{detail.id.slice(0,16)}… <button onClick={() => navigator.clipboard.writeText(detail.id)}><Copy className="w-3 h-3 text-gray-600 hover:text-white" /></button></span>} />
                <DetailRow label="Email"  value={detail.email} />
                <DetailRow label="Phone"  value={detail.phone} />
                <DetailRow label="Role"   value={<Badge color={roleColor(detail.role) as any}>{detail.role}</Badge>} />
                <DetailRow label="Joined" value={formatDate(detail.createdAt)} />
              </div>
            </section>

            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Status</p>
              <div className="grid grid-cols-2 gap-1">
                <DetailRow label="Active"   value={detail.isActive ? <Badge color="green">Active</Badge> : <Badge color="yellow">Inactive</Badge>} />
                <DetailRow label="Banned"   value={detail.isBanned ? <Badge color="red">Banned</Badge> : <Badge color="green">No</Badge>} />
                <DetailRow label="Email"    value={detail.emailVerified ? <Badge color="green">Verified</Badge> : <Badge color="yellow">Unverified</Badge>} />
              </div>
              {detail.banReason && <div className="mt-2 bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2 text-red-300 text-xs">Ban reason: {detail.banReason}</div>}
            </section>

            {(detail.wallet || detail.piyroxCoins) && (
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Wallet</p>
                <div className="grid grid-cols-2 gap-1">
                  {detail.wallet && <>
                    <DetailRow label="Balance"    value={formatMoney(detail.wallet.balance, detail.wallet.currency)} />
                    <DetailRow label="Earned"     value={formatMoney(detail.wallet.totalEarnings, detail.wallet.currency)} />
                    <DetailRow label="Withdrawn"  value={formatMoney(detail.wallet.totalWithdrawn, detail.wallet.currency)} />
                  </>}
                  {detail.piyroxCoins && <>
                    <DetailRow label="Coins"       value={`${Number(detail.piyroxCoins.balance).toLocaleString()} VC`} />
                    <DetailRow label="Total Earned" value={`${Number(detail.piyroxCoins.totalEarned).toLocaleString()} VC`} />
                  </>}
                </div>
              </section>
            )}

            {detail.stats && (
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Activity</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{icon: ShoppingCart, label:'Orders', v: detail.stats.orders, c:'text-cyan-400'},
                    {icon: MessageSquare, label:'Disputes', v: detail.stats.disputes, c:'text-orange-400'},
                    {icon: TicketIcon, label:'Tickets', v: detail.stats.tickets, c:'text-violet-400'}].map(({icon:I,label,v,c}) => (
                    <div key={label} className="bg-white/4 rounded-xl p-3 flex flex-col items-center gap-1">
                      <I className={`w-4 h-4 ${c}`} />
                      <p className="text-white font-bold text-lg leading-none">{v}</p>
                      <p className="text-gray-600 text-[11px]">{label}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {detail.sellers?.length ? (
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Seller Accounts</p>
                {detail.sellers.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white/4 rounded-xl px-3 py-2 mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-white">{s.storeName}</p>
                      <p className="text-[11px] font-mono text-gray-600">{s.id.slice(0,16)}…</p>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      {s.isVerified ? <Badge color="green">Verified</Badge> : <Badge color="yellow">Unverified</Badge>}
                      {s.isSuspended && <Badge color="red">Suspended</Badge>}
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Admin Actions</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {detail.isBanned
                  ? <ActionButton variant="success" loading={busy===`m-unban-${detail.id}`} onClick={() => act(`m-unban-${detail.id}`, () => api.patch(`/admin/users/${detail.id}/unban`), detail.id)}>
                      <ShieldCheck className="w-3.5 h-3.5" />Unban User
                    </ActionButton>
                  : <ActionButton variant="danger" onClick={() => { setBanTarget(detail as unknown as User); setBanReason(''); }}>
                      <ShieldBan className="w-3.5 h-3.5" />Ban User
                    </ActionButton>
                }
                <ActionButton variant="warning" loading={busy===`m-act-${detail.id}`}
                  onClick={() => act(`m-act-${detail.id}`, () => api.patch(`/admin/users/${detail.id}/active`, { active: !detail.isActive }), detail.id)}>
                  {detail.isActive ? <><UserX className="w-3.5 h-3.5" />Deactivate</> : <><UserCheck className="w-3.5 h-3.5" />Activate</>}
                </ActionButton>
                {!detail.emailVerified && (
                  <ActionButton variant="default" loading={busy===`m-ver-${detail.id}`}
                    onClick={() => act(`m-ver-${detail.id}`, () => api.patch(`/admin/users/${detail.id}/verify-email`), detail.id)}>
                    <Mail className="w-3.5 h-3.5" />Verify Email
                  </ActionButton>
                )}
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-600 mb-1.5">Change Role</p>
                <AdminSelect defaultValue={detail.role}
                  onChange={e => e.target.value !== detail.role && setRoleTarget({ id: detail.id, newRole: e.target.value, currentRole: detail.role })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </AdminSelect>
              </div>
            </section>
          </div>
        )}
      </Modal>

      <Modal open={!!banTarget} onClose={() => { setBanTarget(null); setBanReason(''); }}
        title={<span className="flex items-center gap-2 text-red-400"><ShieldBan className="w-4 h-4" />Ban User</span>}
        footer={<>
          <button onClick={() => { setBanTarget(null); setBanReason(''); }} className="px-3 py-2 text-sm text-gray-500 hover:text-white transition">Cancel</button>
          <ActionButton variant="danger" loading={banBusy} onClick={confirmBan}><ShieldBan className="w-3.5 h-3.5" />Confirm Ban</ActionButton>
        </>}>
        {banTarget && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Banning <span className="text-white font-semibold">{displayName(banTarget)}</span> blocks their account immediately.</p>
            <AdminTextarea label="Reason (optional)" value={banReason} onChange={e => setBanReason(e.target.value)} rows={2} placeholder="e.g. Fraudulent activity…" />
          </div>
        )}
      </Modal>

      <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title="Confirm Role Change"
        footer={<>
          <button onClick={() => setRoleTarget(null)} className="px-3 py-2 text-sm text-gray-500 hover:text-white transition">Cancel</button>
          <ActionButton variant="brand" loading={roleBusy} onClick={confirmRole}>Confirm</ActionButton>
        </>}>
        {roleTarget && (
          <div className="space-y-3">
            <p className="text-sm text-gray-300">Change role from <Badge color={roleColor(roleTarget.currentRole) as any}>{roleTarget.currentRole}</Badge> to <Badge color={roleColor(roleTarget.newRole) as any}>{roleTarget.newRole}</Badge>?</p>
            {['ADMIN','SUPER_ADMIN'].includes(roleTarget.newRole) && (
              <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5 text-red-300 text-xs">⚠ Granting admin access gives full platform control. Only do this for trusted team members.</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
