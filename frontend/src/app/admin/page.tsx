'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Eye, Scale, BarChart3, Users, ShoppingBag, DollarSign,
  AlertTriangle, TrendingUp, Clock, Store, CreditCard, LifeBuoy, FolderTree,
  FileText, History, Crown, MessageSquareMore, ScrollText, ImageIcon,
  Megaphone, Gamepad2, Package, Upload, UserCheck, ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  totalUsers?: number;
  totalSellers?: number;
  totalListings?: number;
  activeListings?: number;
  pendingListings?: number;
  totalOrders?: number;
  totalRevenue?: number;
  openDisputes?: number;
  flaggedUsers?: number;
}

const QUICK_LINKS = [
  { href: '/admin/moderation',        icon: Eye,              label: 'Moderation',      desc: 'Approve or reject listings',      color: 'from-violet-600/30 to-violet-600/5',  ring: 'ring-violet-500/30',  text: 'text-violet-400' },
  { href: '/admin/live-chat',         icon: MessageSquareMore,label: 'Live Chat',       desc: 'Reply to visitor messages',       color: 'from-emerald-600/30 to-emerald-600/5', ring: 'ring-emerald-500/30', text: 'text-emerald-400' },
  { href: '/admin/users',             icon: Users,            label: 'Users',           desc: 'Manage user accounts',            color: 'from-cyan-600/30 to-cyan-600/5',      ring: 'ring-cyan-500/30',    text: 'text-cyan-400' },
  { href: '/admin/disputes',          icon: Scale,            label: 'Disputes',        desc: 'Arbitrate buyer/seller disputes', color: 'from-orange-600/30 to-orange-600/5',  ring: 'ring-orange-500/30',  text: 'text-orange-400' },
  { href: '/admin/withdrawals',       icon: DollarSign,       label: 'Payouts',         desc: 'Approve withdrawal requests',     color: 'from-green-600/30 to-green-600/5',    ring: 'ring-green-500/30',   text: 'text-green-400' },
  { href: '/admin/kyc',               icon: UserCheck,        label: 'KYC Review',      desc: 'Verify seller identity docs',     color: 'from-yellow-600/30 to-yellow-600/5',  ring: 'ring-yellow-500/30',  text: 'text-yellow-400' },
  { href: '/admin/sellers',           icon: Store,            label: 'Sellers',         desc: 'Verify and manage sellers',       color: 'from-purple-600/30 to-purple-600/5',  ring: 'ring-purple-500/30',  text: 'text-purple-400' },
  { href: '/admin/tickets',           icon: LifeBuoy,         label: 'Support',         desc: 'Manage customer tickets',         color: 'from-pink-600/30 to-pink-600/5',      ring: 'ring-pink-500/30',    text: 'text-pink-400' },
  { href: '/admin/analytics',         icon: BarChart3,        label: 'Analytics',       desc: 'Revenue & platform stats',        color: 'from-brand/30 to-brand/5',            ring: 'ring-brand/30',       text: 'text-brand' },
  { href: '/admin/game-banners',      icon: ImageIcon,        label: 'Game Banners',    desc: 'Upload per-game banners',         color: 'from-indigo-600/30 to-indigo-600/5',  ring: 'ring-indigo-500/30',  text: 'text-indigo-400' },
  { href: '/admin/legal',             icon: ScrollText,       label: 'Legal Pages',     desc: 'Edit ToS & Privacy Policy',       color: 'from-slate-600/30 to-slate-600/5',    ring: 'ring-slate-500/30',   text: 'text-slate-400' },
  { href: '/admin/slides',            icon: ImageIcon,        label: 'Hero Slides',     desc: 'Manage homepage banners',         color: 'from-rose-600/30 to-rose-600/5',      ring: 'ring-rose-500/30',    text: 'text-rose-400' },
  { href: '/admin/blog',              icon: FileText,         label: 'Blog',            desc: 'Publish platform news',           color: 'from-teal-600/30 to-teal-600/5',      ring: 'ring-teal-500/30',    text: 'text-teal-400' },
  { href: '/admin/creators',          icon: Crown,            label: 'Creators',        desc: 'Review creator applications',     color: 'from-amber-600/30 to-amber-600/5',    ring: 'ring-amber-500/30',   text: 'text-amber-400' },
  { href: '/admin/categories',        icon: FolderTree,       label: 'Categories',      desc: 'Manage catalog structure',        color: 'from-lime-600/30 to-lime-600/5',      ring: 'ring-lime-500/30',    text: 'text-lime-400' },
  { href: '/admin/audit-logs',        icon: History,          label: 'Audit Logs',      desc: 'Track all admin actions',         color: 'from-gray-600/30 to-gray-600/5',      ring: 'ring-gray-500/30',    text: 'text-gray-400' },
];

function StatCard({ icon: Icon, label, value, sub, color = 'text-brand', trend }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; trend?: number;
}) {
  return (
    <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 flex items-start gap-4 hover:border-white/15 transition-all group">
      <div className={`p-2.5 rounded-xl bg-white/5 ${color} flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get<{ data: DashboardStats }>('/admin/dashboard')
        .then(res => setStats((res as any).data || {}))
        .catch(() => {}),
      api.get('/live-chat/admin/unread')
        .then((res: any) => setChatUnread(res?.data?.count ?? 0))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const fmt = (n?: number) => loading ? '—' : (n ?? 0).toLocaleString();

  return (
    <div className="space-y-8 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-violet-400" /> Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Platform overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        {chatUnread > 0 && (
          <Link href="/admin/live-chat"
            className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-red-500/20 transition animate-pulse">
            <MessageSquareMore className="w-4 h-4" />
            {chatUnread} unread chat{chatUnread > 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard icon={Users}       label="Total Users"     value={fmt(stats.totalUsers)}    color="text-violet-400" />
        <StatCard icon={Store}       label="Sellers"         value={fmt(stats.totalSellers)}  color="text-purple-400" />
        <StatCard icon={ShoppingBag} label="Listings"        value={fmt(stats.totalListings)} color="text-indigo-400" />
        <StatCard icon={Clock}       label="Pending Review"  value={fmt(stats.pendingListings)} sub="awaiting approval" color="text-yellow-400" />
        <StatCard icon={CreditCard}  label="Orders"          value={fmt(stats.totalOrders)}   color="text-cyan-400" />
        <StatCard icon={TrendingUp}  label="Active Listings" value={fmt(stats.activeListings)} color="text-emerald-400" />
        <StatCard icon={DollarSign}  label="Revenue"         value={loading ? '—' : `$${(stats.totalRevenue ?? 0).toLocaleString()}`} color="text-green-400" />
        <StatCard icon={Scale}       label="Open Disputes"   value={fmt(stats.openDisputes)}  color="text-orange-400" />
        <StatCard icon={AlertTriangle} label="Flagged Users" value={fmt(stats.flaggedUsers)}  color="text-red-400" />
        <StatCard icon={MessageSquareMore} label="Live Chat Unread" value={loading ? '—' : chatUnread} color="text-pink-400" />
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {QUICK_LINKS.map(({ href, icon: Icon, label, desc, color, ring, text }) => (
            <Link
              key={href}
              href={href}
              className={`relative bg-gradient-to-br ${color} border border-white/8 ring-1 ${ring} rounded-2xl p-4 flex flex-col gap-3 hover:border-white/20 hover:scale-[1.02] transition-all duration-200 group`}
            >
              <Icon className={`w-6 h-6 ${text}`} />
              <div className="min-w-0">
                <p className="font-bold text-white text-sm leading-tight">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
              </div>
              <ArrowUpRight className={`w-3.5 h-3.5 ${text} opacity-0 group-hover:opacity-100 absolute top-3.5 right-3.5 transition`} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
