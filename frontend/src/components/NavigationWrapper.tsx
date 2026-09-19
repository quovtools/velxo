'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { useState } from 'react';
import {
  MessageSquare, Wallet, User, PlusCircle, LayoutDashboard,
  ShieldCheck, LogOut, Menu, X, Search, Home, Compass,
  Bell, Sun, Moon, Gamepad2, Zap, Gift, ChevronDown, Settings,
} from 'lucide-react';
import Marquee from '@/components/Marquee';
import SectionNav from '@/components/SectionNav';
import NotificationBell from '@/components/NotificationBell';
import { useNotifications } from '@/components/NotificationProvider';
import CurrencySelector from '@/components/CurrencySelector';

export default function NavigationWrapper() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const role = (user as any)?.role;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unread: unreadNotifications } = useNotifications();

  const sellHref = role === 'SELLER' ? '/seller/dashboard' : '/sell';
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const navLinks = [
    { label: 'Marketplace', href: '/listings' },
    { label: 'Games', href: '/games' },
    { label: 'Boosting', href: '/boosting' },
    { label: 'Top-Ups', href: '/topups' },
  ];

  return (
    <>
      {/* ── Desktop Nav ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-bg)] bg-black/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group" onClick={() => setMobileMenuOpen(false)}>
            <img src="/logo-new.png" alt="Piyrox" className="w-7 h-7 md:w-8 md:h-8 rounded-xl object-contain" />
            <span className="text-lg md:text-xl font-black tracking-widest text-white group-hover:text-brand transition">PIYROX</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'text-brand bg-brand/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={sellHref}
              className="ml-1 flex items-center gap-1.5 text-black bg-brand hover:bg-brand-light px-3.5 py-2 rounded-lg font-semibold transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Sell
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 md:gap-2">
            <CurrencySelector />

            {/* Search */}
            <Link href="/search"
              className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition"
              title="Search">
              <Search className="w-4.5 h-4.5" />
            </Link>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
              {theme === 'light' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {user ? (
              <>
                <NotificationBell />
                <Link href="/messages" className="hidden sm:flex p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition" title="Messages">
                  <MessageSquare className="w-4.5 h-4.5" />
                </Link>
                <Link href="/wallet" className="hidden sm:flex p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition" title="Wallet">
                  <Wallet className="w-4.5 h-4.5" />
                </Link>

                {/* Profile dropdown */}
                <div className="relative group hidden md:block">
                  <button className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/5 transition">
                    <div className="w-7 h-7 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-black border border-[var(--border-bg)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-1 z-50">
                    <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-brand hover:bg-brand/5 transition">
                      <User className="w-3.5 h-3.5" /> Profile
                    </Link>
                    {(role === 'SELLER' || role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                      <Link href="/seller/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-brand hover:bg-brand/5 transition">
                        <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                      </Link>
                    )}
                    <Link href="/orders" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-brand hover:bg-brand/5 transition">
                      <ShieldCheck className="w-3.5 h-3.5" /> My Orders
                    </Link>
                    {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-brand hover:bg-brand/5 transition">
                        <Settings className="w-3.5 h-3.5" /> Admin
                      </Link>
                    )}
                    <div className="border-t border-[var(--border-bg)] my-1" />
                    <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/5 transition">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/5">
                  Sign In
                </Link>
                <Link href="/auth/register"
                  className="text-sm font-semibold text-black bg-brand hover:bg-brand-light px-4 py-2 rounded-lg transition">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Section nav (game filters, etc.) */}
        <SectionNav />
      </header>

      {/* Marquee ticker */}
      <Marquee />

      {/* ── Mobile Menu Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-black border-l border-[var(--border-bg)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-bg)]">
              <span className="text-sm font-bold text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-1">
              {/* Main links */}
              {[
                { label: 'Home', href: '/', icon: Home },
                { label: 'Marketplace', href: '/listings', icon: Compass },
                { label: 'Games', href: '/games', icon: Gamepad2 },
                { label: 'Boosting', href: '/boosting', icon: Zap },
                { label: 'Top-Ups', href: '/topups', icon: Gift },
                { label: 'Sell', href: sellHref, icon: PlusCircle },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isActive(href) ? 'bg-brand/10 text-brand' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}

              {user && (
                <>
                  <div className="border-t border-[var(--border-bg)] my-2" />
                  {[
                    { label: 'Messages', href: '/messages', icon: MessageSquare },
                    { label: 'Wallet', href: '/wallet', icon: Wallet },
                    { label: 'Orders', href: '/orders', icon: ShieldCheck },
                    { label: 'Profile', href: '/profile', icon: User },
                    ...(role === 'SELLER' ? [{ label: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard }] : []),
                    ...(role === 'ADMIN' || role === 'SUPER_ADMIN' ? [{ label: 'Admin', href: '/admin', icon: Settings }] : []),
                  ].map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition">
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-[var(--border-bg)] my-2" />
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/5 transition">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              )}

              {!user && (
                <>
                  <div className="border-t border-[var(--border-bg)] my-2" />
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium text-gray-300 border border-[var(--border-bg)] hover:border-brand/30 hover:text-brand transition">
                    Sign In
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center mt-2 px-4 py-3 rounded-xl text-sm font-bold text-black bg-brand hover:bg-brand-light transition">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-black/95 backdrop-blur-md border-t border-[var(--border-bg)] safe-area-pb">
        <div className="flex items-center justify-around h-14 px-2">
          {[
            { label: 'Home', href: '/', icon: Home },
            { label: 'Explore', href: '/listings', icon: Compass },
            { label: 'Sell', href: sellHref, icon: PlusCircle, gold: true },
            { label: 'Messages', href: '/messages', icon: MessageSquare },
            { label: 'Profile', href: user ? '/profile' : '/auth/login', icon: User },
          ].map(({ label, href, icon: Icon, gold }) => {
            const active = isActive(href);
            return (
              <Link key={label} href={href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 rounded-xl transition ${
                  gold
                    ? 'text-black bg-brand px-3 py-1.5 rounded-full -mt-4 shadow-lg shadow-brand/30'
                    : active
                    ? 'text-brand'
                    : 'text-gray-500 hover:text-gray-300'
                }`}>
                <Icon className={gold ? 'w-5 h-5' : 'w-5 h-5'} />
                <span className={`text-[9px] font-semibold ${gold ? 'text-black' : ''}`}>{label}</span>
                {!gold && active && <span className="w-1 h-1 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
