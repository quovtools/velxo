'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, LayoutDashboard, Eye, Scale, BarChart3, Image as ImageIcon,
  LogOut, Lock, Menu, X, Megaphone, UserCheck, Users, Store, ShoppingBag,
  CreditCard, LifeBuoy, FolderTree, Gamepad2, FileText, History, Package,
  Upload, Crown, MessageSquareMore, ScrollText, ChevronDown, ChevronRight,
  Bell, Slash, TrendingUp, Globe,
} from 'lucide-react';
import { api } from '@/lib/api';

/* ─── Auth ──────────────────────────────────────────────────────────────── */
const ADMIN_PASSWORD = 'Fadekemi123@';
const SESSION_KEY    = 'piyrox_admin_auth';
const PASSWORD_KEY   = 'piyrox_admin_password';

/* ─── Nav structure ──────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin',           label: 'Dashboard',      icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics', label: 'Analytics',      icon: BarChart3 },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { href: '/admin/moderation',       label: 'Moderation',    icon: Eye },
      { href: '/admin/listings',         label: 'Listings',       icon: ShoppingBag },
      { href: '/admin/listings-manager', label: 'Bulk Manager',   icon: Package },
      { href: '/admin/bulk-image-manager', label: 'Bulk Images',  icon: Upload },
      { href: '/admin/orders',           label: 'Orders',         icon: CreditCard },
      { href: '/admin/disputes',         label: 'Disputes',       icon: Scale },
      { href: '/admin/categories',       label: 'Categories',     icon: FolderTree },
    ],
  },
  {
    label: 'Users & Sellers',
    items: [
      { href: '/admin/users',    label: 'Users',    icon: Users },
      { href: '/admin/sellers',  label: 'Sellers',  icon: Store },
      { href: '/admin/kyc',      label: 'KYC Review', icon: UserCheck },
      { href: '/admin/creators', label: 'Creators', icon: Crown },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/withdrawals', label: 'Payouts',  icon: LifeBuoy },
      { href: '/admin/topup',       label: 'Top-Ups',  icon: Gamepad2 },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/slides',       label: 'Hero Slides',   icon: ImageIcon },
      { href: '/admin/game-banners', label: 'Game Banners',  icon: ImageIcon },
      { href: '/admin/marquee',      label: 'News Marquee',  icon: Megaphone },
      { href: '/admin/blog',         label: 'Blog',          icon: FileText },
      { href: '/admin/legal',        label: 'Legal Pages',   icon: ScrollText },
    ],
  },
  {
    label: 'Support',
    items: [
      { href: '/admin/tickets',    label: 'Tickets',   icon: LifeBuoy },
      { href: '/admin/live-chat',  label: 'Live Chat', icon: MessageSquareMore, badge: 'chat' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: History },
    ],
  },
];

/* ─── Password Gate ─────────────────────────────────────────────────────── */
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY,   'true');
        sessionStorage.setItem(PASSWORD_KEY,  password);
        onUnlock();
      } else {
        setError('Incorrect password. Access denied.');
        setPassword('');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#111118] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/60">
        <div className="text-center mb-8">
          {/* logo mark */}
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">piyrox admin</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your admin password to continue</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
            <Slash className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••••••"
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-brand hover:from-violet-700 hover:to-brand-dark py-3.5 rounded-xl font-bold text-white transition disabled:opacity-50 shadow-lg shadow-violet-500/20"
          >
            {loading ? 'Verifying…' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Nav Item ──────────────────────────────────────────────────────────── */
function NavItem({
  href, label, icon: Icon, exact, badge, chatUnread, pathname, onClick,
}: {
  href: string; label: string; icon: any; exact?: boolean;
  badge?: string; chatUnread?: number; pathname: string; onClick?: () => void;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  const unread = badge === 'chat' && chatUnread && chatUnread > 0;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
        ${active
          ? 'bg-gradient-to-r from-violet-600/30 to-brand/20 text-white border border-violet-500/30 shadow-sm'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
      <span className="truncate flex-1">{label}</span>
      {unread && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {chatUnread! > 99 ? '99+' : chatUnread}
        </span>
      )}
      {badge && badge !== 'chat' && (
        <span className="ml-auto bg-violet-500/20 text-violet-300 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Nav Group ─────────────────────────────────────────────────────────── */
function NavGroup({
  label, items, pathname, chatUnread, onItemClick, defaultOpen = true,
}: {
  label: string; items: any[]; pathname: string;
  chatUnread: number; onItemClick: () => void; defaultOpen?: boolean;
}) {
  const hasActive = items.some(i => i.exact ? pathname === i.href : pathname.startsWith(i.href));
  const [open, setOpen] = useState(defaultOpen || hasActive);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-gray-400 transition"
      >
        {label}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5">
          {items.map(item => (
            <NavItem key={item.href} {...item} pathname={pathname} chatUnread={chatUnread} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Layout ───────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [unlocked,     setUnlocked]     = useState(false);
  const [checked,      setChecked]      = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [chatUnread,   setChatUnread]   = useState(0);
  const pathname = usePathname();
  const router   = useRouter();

  /* Check session */
  useEffect(() => {
    const auth = sessionStorage.getItem(SESSION_KEY);
    if (auth === 'true') setUnlocked(true);
    setChecked(true);
  }, []);

  /* Poll live-chat unread count every 20 s */
  const fetchUnread = useCallback(async () => {
    try {
      const res: any = await api.get('/live-chat/admin/unread');
      setChatUnread(res?.data?.count ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    fetchUnread();
    const id = setInterval(fetchUnread, 20_000);
    return () => clearInterval(id);
  }, [unlocked, fetchUnread]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PASSWORD_KEY);
    setUnlocked(false);
    router.push('/');
  };

  const currentLabel =
    NAV_GROUPS.flatMap(g => g.items)
      .find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href))?.label ?? 'Admin';

  if (!checked)   return null;
  if (!unlocked)  return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const Sidebar = (
    <aside className="w-64 bg-[#0e0e16] border-r border-white/8 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-brand rounded-lg flex items-center justify-center shadow-md shadow-violet-500/30">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm leading-none">Piyrox</p>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">Admin Console</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {NAV_GROUPS.map((group, gi) => (
          <NavGroup
            key={group.label}
            label={group.label}
            items={group.items}
            pathname={pathname}
            chatUnread={chatUnread}
            onItemClick={() => setSidebarOpen(false)}
            defaultOpen={gi <= 2}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/8 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition"
        >
          <Globe className="w-4 h-4" /> View Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          <LogOut className="w-4 h-4" /> Lock Admin
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex text-white">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 flex flex-col fixed inset-y-0 left-0 z-30">{Sidebar}</div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden">{Sidebar}</div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/8 px-5 py-3.5 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white transition p-1"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
            <span className="font-semibold text-white">{currentLabel}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Live chat unread pill */}
            {chatUnread > 0 && (
              <Link
                href="/admin/live-chat"
                className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-500/20 transition"
              >
                <MessageSquareMore className="w-3.5 h-3.5" />
                {chatUnread} unread
              </Link>
            )}

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>

            {/* Notifications placeholder */}
            <button className="relative text-gray-400 hover:text-white transition p-1">
              <Bell className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
