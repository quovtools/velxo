'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useState } from 'react';
import {
  Gamepad2,
  MessageSquare,
  Wallet,
  User,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Search,
  Home,
} from 'lucide-react';

export default function NavigationWrapper() {
  const { user, role, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop / Top Nav ── */}
      <header className="border-b border-borderBg bg-cardBg sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <Gamepad2 className="w-7 h-7 text-brand" />
              <span className="text-xl md:text-2xl font-black tracking-wider text-gradient">VELXO</span>
            </Link>
            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
              <Link href="/search" className="hover:text-brand transition">Browse</Link>
              <Link href="/sell" className="hover:text-brand transition flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" />
                Sell
              </Link>
              <Link href="/escrow" className="hover:text-brand transition">How it Works</Link>
              <Link href="/pricing" className="hover:text-brand transition">Pricing</Link>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              <>
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
              className="sm:hidden p-2 text-gray-300 hover:text-white transition"
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
            <Link href="/sell" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Sell a Product
            </Link>
            <Link href="/escrow" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
              <ShieldCheck className="w-4 h-4" /> How Escrow Works
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-background hover:text-white transition text-sm font-medium">
              <Wallet className="w-4 h-4" /> Pricing & Fees
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

      {/* ── Mobile Bottom Tab Bar ── */}
      {user && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-cardBg border-t border-borderBg flex items-center justify-around px-2 py-2 safe-area-pb">
          <Link href="/" className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition" onClick={() => setMobileOpen(false)}>
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Home</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition">
            <Search className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Browse</span>
          </Link>
          <Link href="/sell" className="flex flex-col items-center gap-0.5 p-2">
            <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/30 -mt-5 border-2 border-background">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-[9px] font-semibold text-brand">Sell</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition">
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Messages</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-white transition">
            <User className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Profile</span>
          </Link>
        </nav>
      )}
    </>
  );
}
