'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, LayoutDashboard, Eye, Scale,
  BarChart3, Image, LogOut, Lock, Menu, X, Megaphone, UserCheck,
  Users, Store, ShoppingBag, CreditCard, LifeBuoy, FolderTree, Gamepad2, FileText, History,
  Package, Upload
} from 'lucide-react';

const ADMIN_PASSWORD = 'Fadekemi123@';
const SESSION_KEY = 'velxo_admin_auth';
const PASSWORD_KEY = 'velxo_admin_password';

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(PASSWORD_KEY, password);
        onUnlock();
      } else {
        setError('Incorrect password. Access denied.');
        setPassword('');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-cardBg border border-borderBg rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Access</h1>
          <p className="text-gray-400 text-sm mt-2">Enter your admin password to continue</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••••••"
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/moderation', label: 'Moderation', icon: Eye },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/sellers', label: 'Sellers', icon: Store },
  { href: '/admin/listings', label: 'Listings', icon: ShoppingBag },
  { href: '/admin/listings-manager', label: 'Bulk Manager', icon: Package, badge: 'NEW' },
  { href: '/admin/bulk-image-manager', label: 'Bulk Images', icon: Upload, badge: 'NEW' },
  { href: '/admin/orders', label: 'Orders', icon: CreditCard },
  { href: '/admin/withdrawals', label: 'Payouts', icon: LifeBuoy },
  { href: '/admin/disputes', label: 'Disputes', icon: Scale },
  { href: '/admin/tickets', label: 'Support', icon: LifeBuoy },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/topup', label: 'Topups', icon: Gamepad2 },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/slides', label: 'Slides', icon: Image },
  { href: '/admin/marquee', label: 'News Marquee', icon: Megaphone },
  { href: '/admin/kyc', label: 'KYC Review', icon: UserCheck },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem(SESSION_KEY);
    if (auth === 'true') setUnlocked(true);
    setChecked(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PASSWORD_KEY);
    setUnlocked(false);
    router.push('/');
  };

  if (!checked) return null;
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-cardBg border-r border-borderBg flex flex-col transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="p-6 border-b border-borderBg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand" />
            <span className="font-extrabold text-white text-lg">Velxo Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition
                  ${active ? 'bg-brand text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-borderBg space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition">
            <LayoutDashboard className="w-4 h-4" />
            Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Lock Admin
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-cardBg/80 backdrop-blur border-b border-borderBg px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400 font-mono">
            {navItems.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href))?.label || 'Admin'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
