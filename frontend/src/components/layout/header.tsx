'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Menu, X, Search, ShoppingBag, User, LogOut } from 'lucide-react'
import Image from 'next/image'

export function Header() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-lg sm:text-xl text-blue-600 hover:text-blue-700 transition">
            VELXO
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-slate-700 hover:text-blue-600 transition font-medium text-sm lg:text-base">
              Browse
            </Link>
            <Link href="/help" className="text-slate-700 hover:text-blue-600 transition font-medium text-sm lg:text-base">
              Help
            </Link>
            {isAuthenticated && user?.role === 'seller' && (
              <Link href="/seller/dashboard" className="text-slate-700 hover:text-blue-600 transition font-medium text-sm lg:text-base">
                Sell
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin/enhanced" className="text-slate-700 hover:text-blue-600 transition font-medium text-sm lg:text-base">
                Admin
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="text-slate-700">
                    <ShoppingBag className="w-5 h-5" />
                  </Button>
                </Link>
                <div className="relative group">
                  <Button variant="ghost" size="sm" className="text-slate-700 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span className="text-sm">{user?.email?.split('@')[0]}</span>
                  </Button>
                  <div className="absolute right-0 top-full hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg py-2 min-w-48">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      Profile
                    </Link>
                    <Link href="/wallet" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      Wallet
                    </Link>
                    {user?.role === 'seller' && (
                      <Link href="/seller/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
          >
            {menuOpen ? (
              <X className="w-6 h-6 text-slate-900" />
            ) : (
              <Menu className="w-6 h-6 text-slate-900" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden pb-4 space-y-2 border-t border-slate-200">
            <Link href="/search" className="block px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
              Browse
            </Link>
            <Link href="/help" className="block px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
              Help
            </Link>
            {isAuthenticated && user?.role === 'seller' && (
              <Link href="/seller/dashboard" className="block px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
                Seller Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin/enhanced" className="block px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
                Admin Panel
              </Link>
            )}
            {isAuthenticated ? (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <Link href="/orders" className="block px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
                  Orders
                </Link>
                <Link href="/wallet" className="block px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
                  Wallet
                </Link>
                <Link href="/profile" className="block px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 text-red-600 font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
