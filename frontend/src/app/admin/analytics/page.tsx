'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, DollarSign, TrendingUp, Users, AlertTriangle, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, RefreshButton, StatCard, AdminSelect, Table, Tr, Td, Badge } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface RevenueData {
  totalRevenue?: number; totalCommissions?: number;
  totalOrders?: number; averageOrderValue?: number;
}
interface FlaggedUser {
  id: string; email: string; firstName: string; lastName: string; fraudFlags?: any[];
}

function getDateRange(days: number) {
  const end = new Date(); const start = new Date();
  start.setDate(start.getDate() - days);
  return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
}

export default function AnalyticsPage() {
  const [range, setRange]               = useState(30);
  const [revenue, setRevenue]           = useState<RevenueData>({});
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [loading, setLoading]           = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);
    try {
      const [revRes, flagRes] = await Promise.allSettled([
        api.get<any>(`/admin/analytics/revenue?startDate=${startDate}&endDate=${endDate}`),
        api.get<any>('/admin/fraud/suspicious-users'),
      ]);
      if (revRes.status === 'fulfilled') setRevenue((revRes.value as any).data || {});
      if (flagRes.status === 'fulfilled') setFlaggedUsers((flagRes.value as any).data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [range]);

  const fmt = (n?: number) => loading ? '—' : (n ?? 0).toLocaleString();
  const fmtMoney = (n?: number) => loading ? '—' : `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Analytics" subtitle="Revenue overview and fraud signals."
        action={
          <div className="flex items-center gap-2">
            <AdminSelect value={range} onChange={e => setRange(Number(e.target.value))} className="w-36">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </AdminSelect>
            <RefreshButton onClick={fetchData} loading={loading} />
          </div>
        } />

      {loading ? <LoadingArea label="Loading analytics…" /> : (
        <>
          {/* Revenue stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={DollarSign}   label="Total Revenue"     value={fmtMoney(revenue.totalRevenue)}      color="text-emerald-400" />
            <StatCard icon={TrendingUp}   label="Commissions"       value={fmtMoney(revenue.totalCommissions)}  color="text-violet-400" />
            <StatCard icon={ShoppingCart} label="Orders"            value={fmt(revenue.totalOrders)}            color="text-cyan-400" />
            <StatCard icon={Users}        label="Avg Order Value"   value={fmtMoney(revenue.averageOrderValue)} color="text-purple-400" />
          </div>

          {/* Suspicious users */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Suspicious Users ({flaggedUsers.length})</h2>
            </div>
            {flaggedUsers.length === 0 ? (
              <div className="bg-[#111118] border border-white/8 rounded-2xl flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-white">No suspicious users</p>
                <p className="text-xs text-gray-600 mt-1">No fraud flags detected.</p>
              </div>
            ) : (
              <Table headers={['User', 'Email', 'Flags']}>
                {flaggedUsers.map(u => (
                  <Tr key={u.id}>
                    <Td><span className="text-sm font-medium text-white">{u.firstName} {u.lastName}</span></Td>
                    <Td><span className="text-xs">{u.email}</span></Td>
                    <Td right>
                      <Badge color="red">{u.fraudFlags?.length ?? 0} flag{(u.fraudFlags?.length ?? 0) !== 1 ? 's' : ''}</Badge>
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
