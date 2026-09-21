'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon, ChevronDown, Gamepad2, Zap, Gift, ShieldCheck } from 'lucide-react';

const NAV_LINKS = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Games', href: '/#games' },
  { label: 'Boosting', href: 'https://app.piyrox.shop/boosting' },
  { label: 'Top-Ups', href: 'https://app.piyrox.shop/topups' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(t);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.classList.toggle('light', next === 'light');
    try { localStorage.setItem('piyrox_theme', next); } catch {}
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? 'border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl shadow-lg shadow-black/20'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container-x flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Piyrox home">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-brand/10 border border-brand/20">
              <img src="/logo.png" alt="Piyrox" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-xl font-black tracking-[0.15em] text-white group-hover:text-brand transition-colors">
              PIYROX
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) =>
              link.href.startsWith('http') ? (
                <a key={link.label} href={link.href}
                  className="rounded-xl px-3.5 py-2 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white">
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href}
                  className="rounded-xl px-3.5 py-2 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white">
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right actions */}
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={toggleTheme} aria-label="Toggle theme"
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:border-brand/30 hover:text-brand">
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <a href="https://app.piyrox.shop/auth/login"
              className="btn-ghost text-gray-300 hover:text-white">
              Sign In
            </a>
            <a href="https://app.piyrox.shop/auth/register" className="btn-primary">
              Get Started Free
            </a>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button type="button" onClick={toggleTheme}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:border-brand/30">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-[var(--border)] bg-[var(--nav-bg)] px-4 py-4 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) =>
                link.href.startsWith('http') ? (
                  <a key={link.label} href={link.href} onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white">
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} href={link.href} onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white">
                    {link.label}
                  </Link>
                )
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href="https://app.piyrox.shop/auth/login"
                className="rounded-xl border border-[var(--border)] px-4 py-3 text-center text-sm font-semibold text-gray-300 transition hover:border-brand/30 hover:text-brand">
                Sign In
              </a>
              <a href="https://app.piyrox.shop/auth/register" className="btn-primary w-full justify-center">
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
