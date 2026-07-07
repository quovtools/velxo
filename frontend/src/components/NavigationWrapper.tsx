'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useState } from 'react';
import {
  Search, ShoppingBag, MessageSquare, Wallet, User,
  PlusCircle, LayoutDashboard, ShieldCheck, LogOut,
  Menu, X, Bell, ChevronDown,
} from 'lucide-react';

export default function NavigationWrapper() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const role = (user as any)?.role;

  return (
    <>
      {/* Top Nav */}
      <header className="border-b border-borderBg bg-cardBg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMobileOpen(false)}>
            <img src="/logo.png" alt="Velxo" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-lg font-black tracking-wider text-white">VELXO</span>
          </Link>

          {/* Category nav — desktop */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {[
              { label: 'Accounts', href: '/?category=accounts' },
              { label: 'Top-Ups', href: '/?category=topups' },
              { label: 'Gift Cards', href: '/?category=giftcards' },
              { label: 'Boosting', href: '/?category=boosting' },
              { label: 'How it Works', href: '/escrow' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-hoverBg transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search — desktop */}
          <div className="hidden md:flex flex-1 max-w-sm mx-auto">
            <Link href="/?focus=search" className="w-full flex items-center gap-2 bg-surface border border-borderBg rounded-xl px-3 py-2 text-sm text-gray-500 hover:border-brand/40 transition">
              <Search className="w-4 h-4 flex-shrink-0" />
              <span>Search listings...</span>
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Sell button */}
            <Link
              href="/sell"
              className="hidden sm:flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <PlusCircle className="w-4 h-4" />
              Sell
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-hoverBg transition text-gray-300 text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-brand-light" />
                  </div>
                  <span className="hidden sm:block font-medium">
                    {(user as any).firstName || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-52 bg-cardBg border border-borderBg rounded-2xl shadow-xl py-1.5 z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-borderBg">
                      <p className="text-sm font-semibold text-white">{(user as any).firstName} {(user as any).lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{(user as any).email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                      <ShoppingBag className="w-4 h-4" /> My Orders
                    </Link>
                    <Link href="/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                      <Wallet className="w-4 h-4" /> Wallet
                    </Link>
                    <Link href="/messages" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                      <MessageSquare className="w-4 h-4" /> Messages
                    </Link>
                    {role === 'SELLER' && (
                      <Link href="/seller/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                        <LayoutDashboard className="w-4 h-4" /> Seller Dashboard
                      </Link>
                    )}
                    {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-hoverBg transition">
                        <ShieldCheck className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-borderBg mt-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-hoverBg transition"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-white px-3 py-2 transition">
                  Sign In
                </Link>
                <Link href="/auth/register" className="bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-2 text-gray-400 hover:text-white transition"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-borderBg bg-cardBg px-4 py-3 space-y-0.5">
            <div className="flex items-center gap-2 bg-surface border border-borderBg rounded-xl px-3 py-2.5 mb-3">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Search listings...</span>
            </div>
            {[
              { href: '/', label: 'Browse', icon: <ShoppingBag className="w-4 h-4" /> },
              { href: '/sell', label: 'Sell', icon: <PlusCircle className="w-4 h-4" /> },
              { href: '/escrow', label: 'How it Works', icon: <ShieldCheck className="w-4 h-4" /> },
              { href: '/pricing', label: 'Pricing', icon: <Wallet className="w-4 h-4" /> },
            ].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                {item.icon} {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="border-t border-borderBg my-2" />
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <Link href="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                  <ShoppingBag className="w-4 h-4" /> Orders
                </Link>
                <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-hoverBg transition">
                  <MessageSquare className="w-4 h-4" /> Messages
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-hoverBg transition">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-borderBg my-2 pt-2 space-y-2">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl border border-borderBg text-sm font-semibold text-gray-300 hover:border-brand/40 transition">
                    Sign In
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-bold transition">
                    Create Account
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-cardBg border-t border-borderBg flex items-center justify-around px-1 py-2 safe-area-pb">
        <Link href="/" className="flex flex-col items-center gap-0.5 p-2 text-gray-500 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Shop</span>
        </Link>
        <Link href="/notifications" className="flex flex-col items-center gap-0.5 p-2 text-gray-500 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <Bell className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Alerts</span>
        </Link>
        <Link href="/sell" className="flex flex-col items-center gap-0.5 p-2 -mt-5" onClick={() => setMobileOpen(false)}>
          <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/40 border-4 border-background">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-[9px] font-semibold text-brand">Sell</span>
        </Link>
        <Link href="/messages" className="flex flex-col items-center gap-0.5 p-2 text-gray-500 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Messages</span>
        </Link>
        <Link href={user ? '/profile' : '/auth/login'} className="flex flex-col items-center gap-0.5 p-2 text-gray-500 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <User className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Account</span>
        </Link>
      </nav>
    </>
  );
}
