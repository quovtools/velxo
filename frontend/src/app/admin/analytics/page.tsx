'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, DollarSign, TrendingUp, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { LoadingArea } from '@/components/LoadingLogo';

interface RevenueData {
  totalRevenue?: number;
  totalCommissions?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  period?: { start: string; end: string };
}

interface FlaggedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fraudFlags?: any[];
}

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);
  const [revenue, setRevenue] = useState<RevenueData>({});
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);
    try {
      const [revRes, flagRes] = await Promise.allSettled([
        api.get<{ data: RevenueData }>(`/admin/analytics/revenue?startDate=${startDate}&endDate=${endDate}`),
        api.get<{ data: FlaggedUser[] }>('/admin/fraud/suspicious-users'),
      ]);

      if (revRes.status === 'fulfilled') setRevenue((revRes.value as any).data || {});
      if (flagRes.status === 'fulfilled') setFlaggedUsers((flagRes.value as any).data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand" /> Platform Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1">Revenue and fraud overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={e => setRange(Number(e.target.value))}
            className="bg-cardBg border border-borderBg text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-brand"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button onClick={fetchData} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingArea label="Loading analytics..." />
      ) : (
        <>
          {/* Revenue cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: 'Total Revenue', value: `$${(revenue.totalRevenue ?? 0).toLocaleString()}`, color: 'text-green-400' },
              { icon: TrendingUp, label: 'Commissions Earned', value: `$${(revenue.totalCommissions ?? 0).toLocaleString()}`, color: 'text-brand' },
              { icon: BarChart3, label: 'Total Orders', value: revenue.totalOrders ?? 0, color: 'text-blue-400' },
              { icon: Users, label: 'Avg Order Value', value: `$${(revenue.averageOrderValue ?? 0).toFixed(2)}`, color: 'text-purple-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-cardBg border border-borderBg rounded-2xl p-6 flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="text-xl font-extrabold text-white mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Suspicious users */}
          <div>
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Suspicious Users ({flaggedUsers.length})
            </h2>
            {flaggedUsers.length === 0 ? (
              <div className="text-center py-12 bg-cardBg border border-borderBg rounded-2xl text-gray-500 text-sm">
                No suspicious users flagged.
              </div>
            ) : (
              <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-borderBg">
                      <th className="text-left px-5 py-3 text-gray-400 font-semibold">User</th>
                      <th className="text-left px-5 py-3 text-gray-400 font-semibold">Email</th>
                      <th className="text-left px-5 py-3 text-gray-400 font-semibold">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedUsers.map(u => (
                      <tr key={u.id} className="border-b border-borderBg/50 hover:bg-white/5 transition">
                        <td className="px-5 py-3 text-white font-medium">{u.firstName} {u.lastName}</td>
                        <td className="px-5 py-3 text-gray-400">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className="bg-red-500/20 text-red-300 text-xs font-bold px-2.5 py-1 rounded-full">
                            {u.fraudFlags?.length ?? 0} flag{(u.fraudFlags?.length ?? 0) !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
