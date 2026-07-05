"use client"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/" className="text-2xl font-bold tracking-tight">Velxo</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/search" className="text-zinc-400 hover:text-white">Browse</Link>
          <Link href="/sell" className="text-zinc-400 hover:text-white">Sell</Link>
          <Link href="/seller/dashboard" className="text-zinc-400 hover:text-white">Dashboard</Link>
          <Link href="/admin"><Button size="sm" variant="outline">Admin</Button></Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/login"><Button size="sm" className="bg-white text-black hover:bg-zinc-200">Sign In</Button></Link>
        </div>
      </div>
    </header>
  )
}
