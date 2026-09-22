'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Eye, Scale, BarChart3, Users, ShoppingBag, DollarSign,
  AlertTriangle, TrendingUp, Clock, Store, CreditCard, LifeBuoy,
  FolderTree, FileText, History, Crown, MessageSquareMore, ScrollText,
  ImageIcon, Megaphone, Gamepad2, Package, Upload, UserCheck,
  ArrowRight, Sparkles, Flame,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/admin/ui';

interface Stats {
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

const QUICK: {
  href: string; icon: any; label: string; desc: string;
  color: string; bg: string; priority?: boolean;
}[] = [
  { href: '/admin/moderation',    icon: Eye,               label: 'Moderation',    desc: 'Approve listings',      color: 'text-violet-300', bg: 'bg-violet-500/10', priority: true },
  { href: '/admin/live-chat',     icon: MessageSquareMore, label: 'Live Chat',     desc: 'Reply to visitors',     color: 'text-emerald-300', bg: 'bg-emerald-500/10', priority: true },
  { href: '/admin/disputes',      icon: Scale,             label: 'Disputes',      desc: 'Arbitrate cases',       color: 'text-orange-300',  bg: 'bg-orange-500/10', priority: true },
  { href: '/admin/withdrawals',   icon: DollarSign,        label: 'Payouts',       desc: 'Approve withdrawals',   color: 'text-green-300',   bg: 'bg-green-500/10', priority: true },
  { href: '/admin/kyc',           icon: UserCheck,         label: 'KYC Review',    desc: 'Verify identities',     color: 'text-yellow-300',  bg: 'bg-yellow-500/10' },
  { href: '/admin/ai',            icon: Sparkles,          label: 'AI Copilot',    desc: 'Ask anything',          color: 'text-violet-300',  bg: 'bg-violet-500/10' },
  { href: '/admin/users',         icon: Users,             label: 'Users',         desc: 'Manage accounts',       color: 'text-cyan-300',    bg: 'bg-cyan-500/10' },
  { href: '/admin/sellers',       icon: Store,             label: 'Sellers',       desc: 'Verify stores',         color: 'text-purple-300',  bg: 'bg-purple-500/10' },
  { href: '/admin/orders',        icon: CreditCard,        label: 'Orders',        desc: 'Track transactions',    color: 'text-blue-300',    bg: 'bg-blue-500/10' },
  { href: '/admin/analytics',     icon: BarChart3,         label: 'Analytics',     desc: 'Revenue & growth',      color: 'text-brand',       bg: 'bg-brand/8' },
  { href: '/admin/featured-listings', icon: Flame,         label: 'Featured',      desc: 'Homepage carousel',     color: 'text-rose-300',    bg: 'bg-rose-500/10' },
  { href: '/admin/game-banners',  icon: ImageIcon,         label: 'Banners',       desc: 'Upload game art',       color: 'text-indigo-300',  bg: 'bg-indigo-500/10' },
  { href: '/admin/blog',          icon: FileText,          label: 'Blog',          desc: 'Publish news',          color: 'text-teal-300',    bg: 'bg-teal-500/10' },
  { href: '/admin/legal',         icon: ScrollText,        label: 'Legal',         desc: 'ToS & Privacy',         color: 'text-slate-300',   bg: 'bg-white/5' },
  { href: '/admin/categories',    icon: FolderTree,        label: 'Categories',    desc: 'Catalog structure',     color: 'text-lime-300',    bg: 'bg-lime-500/10' },
  { href: '/admin/audit-logs',    icon: History,           label: 'Audit Logs',    desc: 'Admin trail',           color: 'text-gray-400',    bg: 'bg-white/4' },
];

export default function AdminDashboardPage() {
  const [stats, setStats]     = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get<any>('/admin/dashboard').then(r => setStats((r as any).data || {})).catch(() => {}),
      api.get<any>('/live-chat/admin/unread').then((r: any) => setChatUnread(r?.data?.count ?? 0)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const fmt = (n?: number) => loading ? '—' : (n ?? 0).toLocaleString();
  const fmtMoney = (n?: number) =>
    loading ? '—' : `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center ring-1 ring-violet-500/40 shadow-sm shadow-violet-500/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm pl-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {chatUnread > 0 && (
          <Link href="/admin/live-chat"
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl hover:bg-red-500/15 transition animate-pulse touch-manipulation">
            <MessageSquareMore className="w-4 h-4 flex-shrink-0" />
            <span>{chatUnread} unread chat{chatUnread > 1 ? 's' : ''}</span>
          </Link>
        )}
      </div>

      {/* ── Priority actions (mobile-prominent) ── */}
      <div className="grid grid-cols-2 sm:hidden gap-2">
        {QUICK.filter(q => q.priority).map(({ href, icon: Icon, label, desc, color, bg }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 bg-[#111118] border border-white/8 rounded-2xl p-3.5 hover:border-white/16 hover:bg-[#15151f] transition-all active:scale-95 touch-manipulation">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{label}</p>
              <p className="text-[10px] text-gray-500 truncate">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Stats grid ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-3">Platform overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
          <StatCard icon={Users}             label="Users"         value={fmt(stats.totalUsers)}      color="text-violet-400" />
          <StatCard icon={Store}             label="Sellers"       value={fmt(stats.totalSellers)}    color="text-purple-400" />
          <StatCard icon={ShoppingBag}       label="Listings"      value={fmt(stats.totalListings)}   color="text-indigo-400" />
          <StatCard icon={Clock}             label="Pending"       value={fmt(stats.pendingListings)} sub="awaiting review"  color="text-amber-400" />
          <StatCard icon={CreditCard}        label="Orders"        value={fmt(stats.totalOrders)}     color="text-cyan-400" />
          <StatCard icon={TrendingUp}        label="Active"        value={fmt(stats.activeListings)}  color="text-emerald-400" />
          <StatCard icon={DollarSign}        label="Revenue"       value={fmtMoney(stats.totalRevenue)} color="text-green-400" />
          <StatCard icon={Scale}             label="Disputes"      value={fmt(stats.openDisputes)}    color="text-orange-400" />
          <StatCard icon={AlertTriangle}     label="Flagged"       value={fmt(stats.flaggedUsers)}    color="text-red-400" />
          <StatCard icon={MessageSquareMore} label="Chat Unread"   value={loading ? '—' : chatUnread} color="text-pink-400" />
        </div>
      </div>

      {/* ── Quick access ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-3">Quick access</p>

        {/* Desktop grid (hidden on mobile — mobile uses the priority grid above + full grid below) */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {QUICK.map(({ href, icon: Icon, label, desc, color, bg }) => (
            <Link key={href} href={href}
              className="group flex items-center gap-3 bg-[#111118] border border-white/8 rounded-xl p-3.5 hover:border-white/15 hover:bg-[#15151f] transition-all">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">{label}</p>
                <p className="text-[11px] text-gray-600 truncate">{desc}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition flex-shrink-0 opacity-0 group-hover:opacity-100" />
            </Link>
          ))}
        </div>

        {/* Mobile: full list (compact rows) */}
        <div className="sm:hidden space-y-1.5">
          {QUICK.filter(q => !q.priority).map(({ href, icon: Icon, label, desc, color, bg }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 bg-[#111118] border border-white/8 rounded-xl px-4 py-3 hover:border-white/16 transition-all active:scale-[0.98] touch-manipulation">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white">{label}</p>
                <p className="text-[11px] text-gray-600">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-700 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Needed for ChevronRight on mobile list
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
