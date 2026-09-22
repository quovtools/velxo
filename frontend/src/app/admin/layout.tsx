'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, LayoutDashboard, Eye, Scale, BarChart3, Image as ImageIcon,
  LogOut, Menu, X, Megaphone, UserCheck, Users, Store, ShoppingBag,
  CreditCard, LifeBuoy, FolderTree, Gamepad2, FileText, History, Package,
  Upload, Crown, MessageSquareMore, ScrollText, ChevronRight, ChevronDown,
  Globe, Slash, Flame, Sparkles, DollarSign,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/admin/ui';

const SESSION_KEY  = 'piyrox_admin_auth';
const PASSWORD_KEY = 'piyrox_admin_password';

// ── Bottom-nav shortcuts (mobile) ─────────────────────────────────────────────
const BOTTOM_NAV = [
  { href: '/admin',           label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/moderation',label: 'Queue',     icon: Eye },
  { href: '/admin/orders',    label: 'Orders',    icon: CreditCard },
  { href: '/admin/disputes',  label: 'Disputes',  icon: Scale },
  { href: '/admin/ai',        label: 'Copilot',   icon: Sparkles },
];

const NAV = [
  {
    label: 'Overview',
    items: [
      { href: '/admin',           label: 'Dashboard',    icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics', label: 'Analytics',    icon: BarChart3 },
      { href: '/admin/ai',        label: 'AI Copilot',   icon: Sparkles },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { href: '/admin/moderation',         label: 'Moderation',       icon: Eye },
      { href: '/admin/listings',           label: 'Listings',         icon: ShoppingBag },
      { href: '/admin/featured-listings',  label: 'Featured',         icon: Flame },
      { href: '/admin/buyer-requests',     label: 'Buyer Requests',   icon: MessageSquareMore },
      { href: '/admin/listings-manager',   label: 'Bulk Manager',     icon: Package },
      { href: '/admin/bulk-image-manager', label: 'Bulk Images',      icon: Upload },
      { href: '/admin/orders',             label: 'Orders',           icon: CreditCard },
      { href: '/admin/disputes',           label: 'Disputes',         icon: Scale },
      { href: '/admin/categories',         label: 'Categories',       icon: FolderTree },
    ],
  },
  {
    label: 'Users & Sellers',
    items: [
      { href: '/admin/users',    label: 'Users',      icon: Users },
      { href: '/admin/sellers',  label: 'Sellers',    icon: Store },
      { href: '/admin/kyc',      label: 'KYC Review', icon: UserCheck },
      { href: '/admin/creators', label: 'Creators',   icon: Crown },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/withdrawals', label: 'Payouts',  icon: DollarSign },
      { href: '/admin/topup',       label: 'Top-Ups',  icon: Gamepad2 },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/slides',       label: 'Hero Slides',  icon: ImageIcon },
      { href: '/admin/game-banners', label: 'Game Banners', icon: ImageIcon },
      { href: '/admin/marquee',      label: 'Marquee',      icon: Megaphone },
      { href: '/admin/blog',         label: 'Blog',         icon: FileText },
      { href: '/admin/legal',        label: 'Legal Pages',  icon: ScrollText },
    ],
  },
  {
    label: 'Support',
    items: [
      { href: '/admin/tickets',   label: 'Tickets',   icon: LifeBuoy },
      { href: '/admin/live-chat', label: 'Live Chat', icon: MessageSquareMore, badge: 'chat' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: History },
    ],
  },
];

// ─── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/dashboard`,
        { headers: { 'x-admin-password': password } },
      );
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY,  'true');
        sessionStorage.setItem(PASSWORD_KEY, password);
        onUnlock();
      } else {
        setError('Incorrect password. Access denied.');
        setPassword('');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 safe-area-pt safe-area-pb">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25 ring-1 ring-violet-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Piyrox Admin</h1>
          <p className="text-gray-600 text-sm mt-1">Restricted area — authorised users only</p>
        </div>

        <div className="bg-[#111118] border border-white/8 rounded-2xl p-6 shadow-2xl shadow-black/40">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 text-red-400 text-xs px-3 py-3 rounded-xl mb-4">
              <Slash className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Admin Password</label>
              <input
                type="password" required autoFocus value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••••••"
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 py-3.5 rounded-xl font-bold text-white text-sm transition disabled:opacity-50 shadow-lg shadow-violet-500/20 touch-manipulation">
              {loading ? <><Spinner className="w-4 h-4" /> Verifying…</> : 'Enter Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Nav Item ──────────────────────────────────────────────────────────────────
function NavItem({ href, label, icon: Icon, exact, badge, chatUnread, pathname, onClick }: {
  href: string; label: string; icon: any; exact?: boolean;
  badge?: string; chatUnread?: number; pathname: string; onClick?: () => void;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  const hasUnread = badge === 'chat' && (chatUnread ?? 0) > 0;
  return (
    <Link href={href} onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all relative touch-manipulation
        ${active
          ? 'bg-violet-600/15 text-white border border-violet-500/25'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
        }`}>
      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-violet-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
      <span className="truncate flex-1 leading-none">{label}</span>
      {hasUnread && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {(chatUnread ?? 0) > 99 ? '99+' : chatUnread}
        </span>
      )}
    </Link>
  );
}

// ─── Nav Group ─────────────────────────────────────────────────────────────────
function NavGroup({ label, items, pathname, chatUnread, onItemClick, defaultOpen = true }: {
  label: string; items: any[]; pathname: string;
  chatUnread: number; onItemClick: () => void; defaultOpen?: boolean;
}) {
  const hasActive = items.some(i => i.exact ? pathname === i.href : pathname.startsWith(i.href));
  const [open, setOpen] = useState(defaultOpen || hasActive);
  return (
    <div className="space-y-0.5">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-gray-700 uppercase tracking-[0.1em] hover:text-gray-500 transition touch-manipulation">
        {label}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <div className="space-y-0.5">
          {items.map(item => (
            <NavItem key={item.href} {...item} pathname={pathname} chatUnread={chatUnread} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Content ───────────────────────────────────────────────────────────
function SidebarContent({
  pathname, chatUnread, onItemClick, onClose, onLogout,
}: {
  pathname: string; chatUnread: number; onItemClick: () => void; onClose: () => void; onLogout: () => void;
}) {
  return (
    <aside className="w-64 bg-[#0d0d14] border-r border-white/6 flex flex-col h-full">
      {/* Branding */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/6 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center ring-1 ring-violet-500/40 shadow-sm shadow-violet-500/30">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <p className="text-[13px] font-black text-white tracking-tight">Piyrox</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Admin Console</p>
          </div>
        </div>
        <button onClick={onClose}
          className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 rounded-lg transition touch-manipulation"
          aria-label="Close sidebar">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav scroll area */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/6 overscroll-contain">
        {NAV.map((group, gi) => (
          <NavGroup key={group.label} label={group.label} items={group.items}
            pathname={pathname} chatUnread={chatUnread}
            onItemClick={onItemClick} defaultOpen={gi <= 2} />
        ))}
        {/* Bottom padding so last item isn't hidden by safe area */}
        <div className="h-4" />
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/6 space-y-0.5 flex-shrink-0">
        <Link href="/" onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] transition touch-manipulation">
          <Globe className="w-4 h-4" /> View Site
        </Link>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500/70 hover:text-red-400 hover:bg-red-500/6 transition touch-manipulation">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Main Layout ───────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [unlocked,    setUnlocked]    = useState(false);
  const [checked,     setChecked]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatUnread,  setChatUnread]  = useState(0);
  const pathname = usePathname();
  const router   = useRouter();

  // Swipe-to-dismiss sidebar ───────────────────────────────────────────────────
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') setUnlocked(true);
    setChecked(true);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

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

  // Swipe handlers for mobile sidebar
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    // Swipe left ≥ 60px and mostly horizontal → close
    if (dx < -60 && dy < 80) setSidebarOpen(false);
  };

  const currentLabel = NAV.flatMap(g => g.items)
    .find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href))?.label ?? 'Admin';

  if (!checked)  return null;
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex text-white antialiased">
      {/* ── Desktop sidebar (fixed) ───────────────────────────── */}
      <div className="hidden lg:block flex-shrink-0">
        <div className="w-64 flex flex-col fixed inset-y-0 left-0 z-30">
          <SidebarContent
            pathname={pathname} chatUnread={chatUnread}
            onItemClick={() => {}} onClose={() => {}} onLogout={handleLogout}
          />
        </div>
      </div>

      {/* ── Mobile sidebar overlay ────────────────────────────── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer — swipe-dismiss attached here */}
          <div
            className="fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden animate-[slideInLeft_0.22s_ease-out]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <SidebarContent
              pathname={pathname} chatUnread={chatUnread}
              onItemClick={() => setSidebarOpen(false)}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </>
      )}

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/6 flex items-center px-3 sm:px-4 gap-2 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 rounded-xl transition touch-manipulation flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0">
            <span className="hidden sm:inline">Admin</span>
            <ChevronRight className="w-3 h-3 hidden sm:inline flex-shrink-0" />
            <span className="text-gray-200 font-semibold truncate">{currentLabel}</span>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {chatUnread > 0 && (
              <Link href="/admin/live-chat"
                className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold px-2.5 py-1.5 rounded-full hover:bg-red-500/15 transition animate-pulse touch-manipulation">
                <MessageSquareMore className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{chatUnread} unread</span>
                <span className="sm:hidden">{chatUnread}</span>
              </Link>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 pr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </div>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for the bottom nav bar */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav bar ─────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0d0d14]/98 backdrop-blur-xl border-t border-white/8 safe-area-pb"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}>
        <div className="flex items-stretch h-14">
          {BOTTOM_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            const isCopilot = href === '/admin/ai';
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition touch-manipulation
                  ${isCopilot
                    ? active
                      ? 'text-violet-300'
                      : 'text-gray-600 hover:text-violet-400'
                    : active
                      ? 'text-violet-400'
                      : 'text-gray-600 hover:text-gray-300'
                  }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition
                  ${isCopilot && !active ? 'bg-violet-600/10' : ''}
                  ${active ? 'bg-violet-600/20' : ''}`}>
                  <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
          {/* "More" button opens sidebar on mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-gray-600 hover:text-gray-300 transition touch-manipulation">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center">
              <Menu className="w-[18px] h-[18px]" />
            </div>
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
