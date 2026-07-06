'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { 
  Gamepad2, 
  MessageSquare, 
  Wallet, 
  User, 
  PlusCircle, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';

export default function NavigationWrapper() {
  const { user, role, logout } = useAuth();

  return (
    <header className="border-b border-borderBg bg-cardBg sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-brand" />
            <span className="text-2xl font-black tracking-wider text-gradient">VELXO</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/search" className="hover:text-brand transition">Browse</Link>
            <Link href="/sell" className="hover:text-brand transition flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" />
              Sell Product
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/messages" className="text-gray-300 hover:text-brand p-2 transition relative" title="Messages">
                <MessageSquare className="w-5 h-5" />
              </Link>
              <Link href="/wallet" className="text-gray-300 hover:text-brand p-2 transition flex items-center gap-1.5" title="Wallet">
                <Wallet className="w-5 h-5" />
              </Link>
              
              {role === 'SELLER' && (
                <Link href="/seller/dashboard" className="text-gray-300 hover:text-brand p-2 transition" title="Seller Dashboard">
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
              )}

              {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                <Link href="/admin" className="text-red-400 hover:text-red-300 p-2 transition" title="Admin panel">
                  <ShieldCheck className="w-5 h-5" />
                </Link>
              )}

              <Link href="/profile" className="text-gray-300 hover:text-brand p-2 transition flex items-center gap-1" title="Profile">
                <User className="w-5 h-5" />
              </Link>

              <button 
                onClick={logout} 
                className="text-gray-400 hover:text-red-400 p-2 transition" 
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium hover:text-brand transition">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-brand hover:bg-brand-dark px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-brand/20">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
