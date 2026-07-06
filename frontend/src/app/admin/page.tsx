'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Eye, Scale, BarChart3, Image, Users, ShoppingBag, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  totalUsers?: number;
  totalListings?: number;
  pendingListings?: number;
  totalOrders?: number;
  totalRevenue?: number;
  openDisputes?: number;
  flaggedUsers?: number;
}

function StatCard({ icon: Icon, label, value, color = 'text-brand', sub }: {
  icon: any; label: string; value: string | number; color?: string; sub?: string;
}) {
  return (
    <div className="bg-cardBg border border-borderBg rounded-2xl p-6 flex items-start gap-4">
      <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-extrabold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const quickLinks = [
  { href: '/admin/moderation', icon: Eye, label: 'Listings Moderation', desc: 'Approve or reject pending listings', color: 'text-blue-400' },
  { href: '/admin/disputes', icon: Scale, label: 'Dispute Court', desc: 'Arbitrate buyer/seller disputes', color: 'text-yellow-400' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', desc: 'Revenue and platform stats', color: 'text-green-400' },
  { href: '/admin/slides', icon: Image, label: 'Homepage Slides', desc: 'Manage hero banner slides', color: 'text-purple-400' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: DashboardStats }>('/admin/dashboard')
      .then(res => setStats((res as any).data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-brand" />
          Admin Dashboard
        </h1>
        <p className="text-gray-400 text-sm mt-1">Overview of platform activity and operations.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={loading ? '—' : (stats.totalUsers ?? 0)} color="text-blue-400" />
        <StatCard icon={ShoppingBag} label="Total Listings" value={loading ? '—' : (stats.totalListings ?? 0)} color="text-purple-400" />
        <StatCard icon={Clock} label="Pending Review" value={loading ? '—' : (stats.pendingListings ?? 0)} color="text-yellow-400" sub="listings awaiting approval" />
        <StatCard icon={TrendingUp} label="Total Orders" value={loading ? '—' : (stats.totalOrders ?? 0)} color="text-green-400" />
        <StatCard icon={DollarSign} label="Total Revenue" value={loading ? '—' : `$${(stats.totalRevenue ?? 0).toLocaleString()}`} color="text-emerald-400" />
        <StatCard icon={Scale} label="Open Disputes" value={loading ? '—' : (stats.openDisputes ?? 0)} color="text-orange-400" />
        <StatCard icon={AlertTriangle} label="Flagged Users" value={loading ? '—' : (stats.flaggedUsers ?? 0)} color="text-red-400" />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(({ href, icon: Icon, label, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl p-6 flex flex-col gap-3 transition group"
            >
              <Icon className={`w-8 h-8 ${color}`} />
              <div>
                <h3 className="font-bold text-white group-hover:text-brand transition text-sm">{label}</h3>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
              <span className="text-brand text-xs font-mono mt-auto">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
