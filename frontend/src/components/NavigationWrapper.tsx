'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { useState, useEffect } from 'react';
import {
  Home, Compass, ShoppingBag, MessageSquare, Wallet, User,
  PlusCircle, LayoutDashboard, ShieldCheck, LogOut, Search,
  Bell, Settings, Gamepad2, Zap, Gift, ChevronDown, Menu, X,
  Star, TrendingUp, BookOpen, Users,
} from 'lucide-react';
import Marquee from '@/components/Marquee';
import NotificationBell from '@/components/NotificationBell';
import { useNotifications } from '@/components/NotificationProvider';
import CurrencySelector from '@/components/CurrencySelector';

/* ── Nav structure per architecture diagram ── */
const PUBLIC_NAV = [
  { label: 'Marketplace', href: '/listings', icon: Compass },
  { label: 'Games', href: '/games', icon: Gamepad2 },
  { label: 'Boosting', href: '/boosting', icon: Zap },
  { label: 'Top-Ups', href: '/topups', icon: Gift },
];

const AUTH_NAV = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Marketplace', href: '/listings', icon: Compass },
  { label: 'Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Affiliate', href: '/affiliate', icon: Users },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function NavigationWrapper() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const role = (user as any)?.role;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { unread } = useNotifications();

  const isSeller = role === 'SELLER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const sellHref = isSeller ? '/seller/dashboard' : '/sell';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navItems = user ? AUTH_NAV : PUBLIC_NAV;

  return (
    <>
      {/* ════════════════════════════════════
          DESKTOP HEADER (top bar)
          ════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-50 hidden md:block transition-all duration-300 ${
          scrolled
            ? 'border-b border-[var(--border-bg)] bg-[var(--nav-bg)] backdrop-blur-xl shadow-lg shadow-black/20'
            : 'border-b border-[var(--border-bg)] bg-[var(--nav-bg)] backdrop-blur-xl'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group mr-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden">
              <img src="/logo-new.png" alt="Piyrox" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-xl font-black tracking-[0.15em] text-white group-hover:text-brand transition-colors">
              PIYROX
            </span>
          </Link>

          {/* Main nav links */}
          <nav className="flex items-center gap-0.5 flex-1">
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-brand/10 text-brand border border-brand/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {label === 'Messages' && unread > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                  )}
                </Link>
              );
            })}

            {!user && (
              <Link href={sellHref}
                className="ml-1 flex items-center gap-1.5 bg-brand hover:bg-brand-light text-black font-bold px-4 py-2 rounded-xl text-sm transition-all duration-150 shadow-md shadow-brand/20">
                <PlusCircle className="w-3.5 h-3.5" />
                Sell
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <CurrencySelector />

            <Link href="/search"
              className="p-2 text-gray-400 hover:text-brand hover:bg-brand/8 rounded-xl transition-all"
              title="Search">
              <Search className="w-4.5 h-4.5" />
            </Link>

            {user ? (
              <>
                <NotificationBell />

                {/* Sell button */}
                <Link href={sellHref}
                  className="flex items-center gap-1.5 bg-brand hover:bg-brand-light text-black font-bold px-3.5 py-2 rounded-xl text-sm transition-all shadow-md shadow-brand/20">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Sell
                </Link>

                {/* Profile dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-[var(--border-bg)]">
                    <div className="w-7 h-7 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--surface)] border border-[var(--border-bg)] rounded-2xl shadow-2xl shadow-black/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-1.5 z-50">
                    {/* User info */}
                    <div className="px-3.5 py-2.5 border-b border-[var(--border-bg)] mb-1">
                      <p className="text-xs font-bold text-white truncate">{(user as any)?.firstName || 'Gamer'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{(user as any)?.email}</p>
                    </div>

                    {[
                      { label: 'Profile', href: '/profile', icon: User },
                      { label: 'Orders', href: '/orders', icon: ShoppingBag },
                      { label: 'Wallet', href: '/wallet', icon: Wallet },
                      ...(isSeller ? [{ label: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard }] : []),
                      ...(isAdmin ? [{ label: 'Admin Panel', href: '/admin', icon: Settings }] : []),
                    ].map(({ label, href, icon: Icon }) => (
                      <Link key={href} href={href}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-300 hover:text-brand hover:bg-brand/5 transition-all mx-1 rounded-xl">
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </Link>
                    ))}

                    <div className="border-t border-[var(--border-bg)] mt-1 pt-1 mx-1">
                      <button onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/5 rounded-xl transition-all">
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="text-sm font-medium text-gray-400 hover:text-white transition px-3 py-2 rounded-xl hover:bg-white/5">
                  Sign In
                </Link>
                <Link href="/auth/register"
                  className="text-sm font-bold text-black bg-brand hover:bg-brand-light px-4 py-2 rounded-xl transition shadow-md shadow-brand/20">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Marquee ticker */}
        <Marquee />
      </header>

      {/* ════════════════════════════════════
          MOBILE HEADER
          ════════════════════════════════════ */}
      <header className="sticky top-0 z-50 md:hidden border-b border-[var(--border-bg)] bg-[var(--nav-bg)] backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden">
              <img src="/logo-new.png" alt="Piyrox" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-base font-black tracking-widest text-white">PIYROX</span>
          </Link>

          <div className="flex items-center gap-1">
            {user && <NotificationBell />}
            <Link href="/search" className="p-2 text-gray-400 hover:text-brand rounded-xl transition">
              <Search className="w-4.5 h-4.5" />
            </Link>
            <button onClick={() => setMobileOpen(v => !v)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <Marquee />
      </header>

      {/* ════════════════════════════════════
          MOBILE DRAWER
          ════════════════════════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[280px] bg-[var(--surface)] border-l border-[var(--border-bg)] flex flex-col overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-bg)]">
              {user ? (
                <div>
                  <p className="text-sm font-bold text-white">{(user as any)?.firstName || 'Gamer'}</p>
                  <p className="text-xs text-gray-500">{(user as any)?.email}</p>
                </div>
              ) : (
                <span className="text-sm font-bold text-white">Menu</span>
              )}
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-0.5">
              {/* Always visible links */}
              {[
                { label: 'Home', href: '/', icon: Home },
                { label: 'Marketplace', href: '/listings', icon: Compass },
                { label: 'Games', href: '/games', icon: Gamepad2 },
                { label: 'Boosting', href: '/boosting', icon: Zap },
                { label: 'Top-Ups', href: '/topups', icon: Gift },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isActive(href) ? 'bg-brand/10 text-brand border border-brand/15' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}

              {user ? (
                <>
                  <div className="border-t border-[var(--border-bg)] my-2" />
                  {[
                    { label: 'Orders', href: '/orders', icon: ShoppingBag },
                    { label: 'Messages', href: '/messages', icon: MessageSquare, badge: unread },
                    { label: 'Wallet', href: '/wallet', icon: Wallet },
                    { label: 'Affiliate', href: '/affiliate', icon: Users },
                    { label: 'Profile', href: '/profile', icon: User },
                    ...(isSeller ? [{ label: 'Seller Dashboard', href: '/seller/dashboard', icon: LayoutDashboard, badge: 0 }] : []),
                    ...(isAdmin ? [{ label: 'Admin Panel', href: '/admin', icon: Settings, badge: 0 }] : []),
                  ].map(({ label, href, icon: Icon, badge }) => (
                    <Link key={href} href={href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                        isActive(href) ? 'bg-brand/10 text-brand border border-brand/15' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}>
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{label}</span>
                      {badge && badge > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-brand text-black text-[10px] font-bold flex items-center justify-center">
                          {badge > 9 ? '9+' : badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}

                  {/* Sell CTA */}
                  <div className="pt-2">
                    <Link href={sellHref}
                      className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-black font-bold py-3 rounded-xl text-sm transition shadow-md shadow-brand/20">
                      <PlusCircle className="w-4 h-4" /> Sell on Piyrox
                    </Link>
                  </div>

                  <div className="border-t border-[var(--border-bg)] mt-2 pt-2">
                    <button onClick={() => { logout(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/5 transition">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-[var(--border-bg)] my-2" />
                  <Link href="/auth/login"
                    className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium border border-[var(--border-bg)] text-gray-300 hover:border-brand/30 hover:text-brand transition">
                    Sign In
                  </Link>
                  <Link href="/auth/register"
                    className="w-full flex items-center justify-center mt-2 px-4 py-3 rounded-xl text-sm font-bold text-black bg-brand hover:bg-brand-light transition shadow-md shadow-brand/20">
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          MOBILE BOTTOM TAB BAR
          Per architecture: Home │ Explore │ Sell │ Messages │ Profile
          ════════════════════════════════════ */}
      <nav className="mobile-nav safe-area-pb md:hidden" aria-label="Mobile navigation">
        <div className="flex items-center justify-around h-[58px] px-2">
          {[
            { label: 'Home', href: '/', icon: Home },
            { label: 'Explore', href: '/listings', icon: Compass },
            { label: 'Sell', href: sellHref, icon: PlusCircle, gold: true },
            { label: 'Messages', href: '/messages', icon: MessageSquare, badge: unread },
            { label: 'Profile', href: user ? '/profile' : '/auth/login', icon: User },
          ].map(({ label, href, icon: Icon, gold, badge }) => {
            const active = isActive(href);
            return (
              <Link key={label} href={href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1 rounded-xl transition-all ${
                  gold
                    ? 'text-black bg-brand px-3.5 py-2 rounded-2xl -mt-5 shadow-xl shadow-brand/30'
                    : active
                    ? 'text-brand'
                    : 'text-gray-500 hover:text-gray-300'
                }`}>
                <div className="relative">
                  <Icon className={gold ? 'w-5 h-5' : 'w-5 h-5'} />
                  {badge && badge > 0 && !gold ? (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[9px] font-bold ${gold ? 'text-black' : ''}`}>{label}</span>
                {!gold && active && <span className="w-1 h-1 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
