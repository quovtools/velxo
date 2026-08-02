'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Eye, Scale, BarChart3, Users, ShoppingBag, DollarSign,
  AlertTriangle, TrendingUp, Clock, Store, CreditCard, LifeBuoy, FolderTree,
  FileText, History, Crown, MessageSquareMore, ScrollText, ImageIcon,
  Megaphone, Gamepad2, Package, Upload, UserCheck, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/admin/ui';

interface Stats {
  totalUsers?: number; totalSellers?: number; totalListings?: number;
  activeListings?: number; pendingListings?: number; totalOrders?: number;
  totalRevenue?: number; openDisputes?: number; flaggedUsers?: number;
}

const QUICK: { href: string; icon: any; label: string; desc: string; color: string }[] = [
  { href: '/admin/moderation',    icon: Eye,              label: 'Moderation',    desc: 'Approve listings',        color: 'text-violet-400' },
  { href: '/admin/live-chat',     icon: MessageSquareMore,label: 'Live Chat',     desc: 'Reply to visitors',       color: 'text-emerald-400' },
  { href: '/admin/disputes',      icon: Scale,            label: 'Disputes',      desc: 'Arbitrate cases',         color: 'text-orange-400' },
  { href: '/admin/withdrawals',   icon: DollarSign,       label: 'Payouts',       desc: 'Approve withdrawals',     color: 'text-green-400' },
  { href: '/admin/kyc',           icon: UserCheck,        label: 'KYC Review',    desc: 'Verify identities',       color: 'text-yellow-400' },
  { href: '/admin/users',         icon: Users,            label: 'Users',         desc: 'Manage accounts',         color: 'text-cyan-400' },
  { href: '/admin/sellers',       icon: Store,            label: 'Sellers',       desc: 'Verify stores',           color: 'text-purple-400' },
  { href: '/admin/orders',        icon: CreditCard,       label: 'Orders',        desc: 'Track transactions',      color: 'text-blue-400' },
  { href: '/admin/analytics',     icon: BarChart3,        label: 'Analytics',     desc: 'Revenue stats',           color: 'text-brand' },
  { href: '/admin/game-banners',  icon: ImageIcon,        label: 'Game Banners',  desc: 'Upload banners',          color: 'text-indigo-400' },
  { href: '/admin/legal',         icon: ScrollText,       label: 'Legal',         desc: 'ToS & Privacy',           color: 'text-slate-400' },
  { href: '/admin/blog',          icon: FileText,         label: 'Blog',          desc: 'Publish news',            color: 'text-teal-400' },
  { href: '/admin/creators',      icon: Crown,            label: 'Creators',      desc: 'Review applications',     color: 'text-amber-400' },
  { href: '/admin/categories',    icon: FolderTree,       label: 'Categories',    desc: 'Catalog structure',       color: 'text-lime-400' },
  { href: '/admin/slides',        icon: ImageIcon,        label: 'Hero Slides',   desc: 'Homepage banners',        color: 'text-rose-400' },
  { href: '/admin/audit-logs',    icon: History,          label: 'Audit Logs',    desc: 'Admin trail',             color: 'text-gray-400' },
];

export default function AdminDashboardPage() {
  const [stats, setStats]     = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get<any>('/admin/dashboard').then(r => setStats(r.data || {})).catch(() => {}),
      api.get<any>('/live-chat/admin/unread').then((r: any) => setChatUnread(r?.data?.count ?? 0)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const fmt = (n?: number) => loading ? '—' : (n ?? 0).toLocaleString();

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center ring-1 ring-violet-500/40">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {chatUnread > 0 && (
          <Link href="/admin/live-chat"
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-500/15 transition animate-pulse">
            <MessageSquareMore className="w-4 h-4" />
            {chatUnread} unread chat{chatUnread > 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard icon={Users}              label="Users"          value={fmt(stats.totalUsers)}     color="text-violet-400" />
        <StatCard icon={Store}              label="Sellers"        value={fmt(stats.totalSellers)}   color="text-purple-400" />
        <StatCard icon={ShoppingBag}        label="Listings"       value={fmt(stats.totalListings)}  color="text-indigo-400" />
        <StatCard icon={Clock}              label="Pending"        value={fmt(stats.pendingListings)} sub="awaiting review" color="text-amber-400" />
        <StatCard icon={CreditCard}         label="Orders"         value={fmt(stats.totalOrders)}    color="text-cyan-400" />
        <StatCard icon={TrendingUp}         label="Active"         value={fmt(stats.activeListings)} color="text-emerald-400" />
        <StatCard icon={DollarSign}         label="Revenue"        value={loading ? '—' : `$${(stats.totalRevenue ?? 0).toLocaleString()}`} color="text-green-400" />
        <StatCard icon={Scale}              label="Disputes"       value={fmt(stats.openDisputes)}   color="text-orange-400" />
        <StatCard icon={AlertTriangle}      label="Flagged"        value={fmt(stats.flaggedUsers)}   color="text-red-400" />
        <StatCard icon={MessageSquareMore}  label="Chat Unread"    value={loading ? '—' : chatUnread} color="text-pink-400" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {QUICK.map(({ href, icon: Icon, label, desc, color }) => (
            <Link key={href} href={href}
              className="group flex items-center gap-3 bg-[#111118] border border-white/8 rounded-xl p-3.5 hover:border-white/16 hover:bg-[#15151f] transition-all">
              <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">{label}</p>
                <p className="text-[11px] text-gray-600 truncate">{desc}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
