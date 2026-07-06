'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, ShoppingCart, Bell, Menu, X, User, LogOut, Store } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Velxo
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 mx-8">
            <div className="w-full max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search games, accounts..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    router.push(`/search?q=${(e.target as HTMLInputElement).value}`)
                  }
                }}
              />
            </div>
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-zinc-400 hover:text-white transition">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Seller Dashboard */}
                {user.role === 'seller' && (
                  <Link href="/seller/dashboard">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Store className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                )}

                {/* Cart */}
                <button className="relative p-2 text-zinc-400 hover:text-white transition">
                  <ShoppingCart className="w-5 h-5" />
                </button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 text-zinc-400 hover:text-white transition">
                      <User className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-semibold">
                      {user.firstName || user.email}
                    </DropdownMenuLabel>
                    <p className="text-xs text-zinc-500 px-2 -mt-1">{user.email}</p>
                    <DropdownMenuSeparator />

                    <Link href="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/orders">
                      <DropdownMenuItem>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Orders</span>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/wallet">
                      <DropdownMenuItem>
                        <span className="mr-2 h-4 w-4">💰</span>
                        <span>Wallet</span>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/messages">
                      <DropdownMenuItem>
                        <span className="mr-2 h-4 w-4">💬</span>
                        <span>Messages</span>
                      </DropdownMenuItem>
                    </Link>

                    {user.role === 'seller' && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/listings/new">
                          <DropdownMenuItem>
                            <span className="mr-2 h-4 w-4">➕</span>
                            <span>Create Listing</span>
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}

                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/admin">
                          <DropdownMenuItem>
                            <span className="mr-2 h-4 w-4">⚙️</span>
                            <span>Admin Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-400 focus:text-red-400 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-zinc-800">
            {isAuthenticated && user ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    Profile
                  </Button>
                </Link>
                <Link href="/orders">
                  <Button variant="ghost" className="w-full justify-start">
                    Orders
                  </Button>
                </Link>
                <Link href="/wallet">
                  <Button variant="ghost" className="w-full justify-start">
                    Wallet
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" className="w-full justify-start">
                    Messages
                  </Button>
                </Link>
                {user.role === 'seller' && (
                  <Link href="/listings/new">
                    <Button variant="ghost" className="w-full justify-start">
                      Create Listing
                    </Button>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full text-left text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
