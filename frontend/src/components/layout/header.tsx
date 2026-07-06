'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { ShoppingBag, Plus, LayoutDashboard, Shield, Menu, X, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'

export function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Velxo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/search" className="text-sm text-zinc-400 hover:text-white transition">
              Browse
            </Link>
            {isAuthenticated && user?.role === 'seller' && (
              <Link href="/seller/dashboard" className="text-sm text-zinc-400 hover:text-white transition">
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin" className="text-sm text-zinc-400 hover:text-white transition">
                Admin
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/orders">
                  <Button variant="ghost" size="sm">
                    <ShoppingBag className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Sell
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-zinc-800 py-4 space-y-3">
            <Link href="/search" className="block text-sm text-zinc-400 hover:text-white transition p-2">
              Browse
            </Link>
            {isAuthenticated && user?.role === 'seller' && (
              <Link href="/seller/dashboard" className="block text-sm text-zinc-400 hover:text-white transition p-2">
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin" className="block text-sm text-zinc-400 hover:text-white transition p-2">
                Admin
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link href="/orders" className="block text-sm text-zinc-400 hover:text-white transition p-2">
                  Orders
                </Link>
                <Link href="/sell" className="block text-sm text-zinc-400 hover:text-white transition p-2">
                  Sell Item
                </Link>
                <Link href="/profile" className="block text-sm text-zinc-400 hover:text-white transition p-2">
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="block text-sm text-zinc-400 hover:text-white transition p-2 w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block text-sm text-zinc-400 hover:text-white transition p-2">
                  Sign In
                </Link>
                <Link href="/auth/register" className="block text-sm text-zinc-400 hover:text-white transition p-2">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
