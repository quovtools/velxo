'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useState } from 'react';
import {
  MessageSquare, Wallet, User, PlusCircle, LayoutDashboard,
  ShieldCheck, LogOut, Menu, X, Search, Home, Users,
  ShoppingBag, Bell, Award, Sun, Moon, Check, Gamepad2,
  Zap,
} from 'lucide-react';
import Marquee from '@/components/Marquee';
import SectionNav from '@/components/SectionNav';
import NotificationBell from '@/components/NotificationBell';
import { useNotifications } from '@/components/NotificationProvider';

export default function NavigationWrapper() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const role = (user as any)?.role;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unread: unreadNotifications } = useNotifications();

  // Sellers get the seller dashboard (orders, store, payouts, create listing)
  // from the Sell entry point; everyone else is taken to create a listing.
  const sellHref = role === 'SELLER' ? '/seller/dashboard' : '/sell';

  return (
    <>
      {/* ── Desktop / Top Nav ── */}
      <header className="border-b border-borderBg bg-cardBg sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <img src="/logo.png" alt="Velxo" className="w-7 h-7 rounded-lg object-cover" />
              <span className="text-xl md:text-2xl font-black tracking-wider">VELXO</span>
            </Link>
            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
              <Link href="/" className="hover:text-brand transition">Browse</Link>
              <Link href="/sell" className="hover:text-brand transition flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" />
                Sell
              </Link>
              <Link href="/escrow" className="hover:text-brand transition">How it Works</Link>
              <Link href="/topups" className="hover:text-brand transition flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Top-Ups
              </Link>
              <Link href="/boosting" className="hover:text-brand transition flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4" />
                Boosting
              </Link>
              <Link href="/pricing" className="hover:text-brand transition">Pricing</Link>
              <Link href="/affiliate" className="hover:text-brand transition flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Refer
              </Link>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme toggle - always visible on the nav bar */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-brand transition rounded-lg hover:bg-brand/10"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <NotificationBell />
                <Link href="/messages" className="hidden sm:flex text-gray-300 hover:text-brand p-2 transition" title="Messages">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <Link href="/wallet" className="hidden sm:flex text-gray-300 hover:text-brand p-2 transition" title="Wallet">
                  <Wallet className="w-5 h-5" />
                </Link>
                {role === 'SELLER' && (
                  <Link href="/seller/dashboard" className="hidden sm:flex text-gray-300 hover:text-brand p-2 transition" title="Seller Dashboard">
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                  <Link href="/admin" className="hidden sm:flex text-red-400 hover:text-red-300 p-2 transition" title="Admin">
                    <ShieldCheck className="w-5 h-5" />
                  </Link>
                )}
                <Link href="/profile" className="hidden sm:flex text-gray-300 hover:text-brand p-2 transition" title="Profile">
                  <User className="w-5 h-5" />
                </Link>
                <button onClick={logout} className="hidden sm:flex text-gray-400 hover:text-red-400 p-2 transition" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-gray-300 hover:text-brand transition px-3 py-2">
                  Sign In
                </Link>
                <Link href="/auth/register" className="bg-brand hover:bg-brand-dark px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-brand/20 text-white">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-2 text-gray-500 hover:text-white transition"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-borderBg bg-cardBg px-4 py-4 space-y-1">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link href="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
              <Search className="w-4 h-4" /> Browse Marketplace
            </Link>
            <Link href={sellHref} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> {role === 'SELLER' ? 'Seller Dashboard' : 'Sell a Product'}
            </Link>
             <Link href="/escrow" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
               <ShieldCheck className="w-4 h-4" /> How Escrow Works
             </Link>
             <Link href="/pricing" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
               <Wallet className="w-4 h-4" /> Pricing & Fees
             </Link>
              <Link href="/affiliate" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
                <Users className="w-4 h-4" /> Refer & Earn
              </Link>

              {user ? (
              <>
                <div className="border-t border-borderBg my-2" />
                <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
                  <MessageSquare className="w-4 h-4" /> Messages
                </Link>
                <Link href="/wallet" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
                  <Wallet className="w-4 h-4" /> Wallet
                </Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
                  <User className="w-4 h-4" /> Profile
                </Link>
                {role === 'SELLER' && (
                  <Link href="/seller/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
                    <LayoutDashboard className="w-4 h-4" /> Seller Dashboard
                  </Link>
                )}
                {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-background transition text-sm font-medium">
                    <ShieldCheck className="w-4 h-4" /> Admin Panel
                  </Link>
                )}
                <div className="border-t border-borderBg my-2" />
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-background transition text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-borderBg my-2" />
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-borderBg text-gray-300 hover:border-brand/40 transition text-sm font-semibold">
                  Sign In
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white transition text-sm font-semibold shadow-lg shadow-brand/20">
                  Create Account
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── News Marquee (admin-controlled) ── */}
      <Marquee />

      {/* ── Section Navigation (slideable) ── */}
      <SectionNav />

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-cardBg border-t border-borderBg flex items-center justify-around px-1 py-2 safe-area-pb">
        <Link href="/" className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Shop</span>
        </Link>
        <Link href="/notifications" className="relative flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
          <span className="text-[9px] font-semibold">Alerts</span>
        </Link>
        <Link href="/messages" className="flex flex-col items-center gap-0.5 p-2 -mt-5" onClick={() => setMobileOpen(false)}>
          <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/40 border-4 border-background">
            <MessageSquare className="w-5 h-5 text-background" />
          </div>
          <span className="text-[9px] font-semibold text-brand">Messages</span>
        </Link>
        <Link href="/affiliate" className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <Award className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Affiliate</span>
        </Link>
        <Link href={sellHref} className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <PlusCircle className="w-5 h-5" />
          <span className="text-[9px] font-semibold">{role === 'SELLER' ? 'Sell' : 'Sell'}</span>
        </Link>
        <Link href={user ? "/profile" : "/auth/login"} className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <User className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Profile</span>
        </Link>
      </nav>
    </>
  );
}
