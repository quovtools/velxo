'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Games', href: '/#games' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: '/community' },
];

const isHash = (href: string) => href.startsWith('#');

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
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    const root = document.documentElement;
    root.classList.add(next);
    root.classList.remove(next === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem('piyrox_theme', next); } catch (e) {}
  };

  const linkClass = scrolled
    ? 'text-gray-300 hover:text-white'
    : 'text-gray-200 hover:text-white';

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Primary"
        className={`transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/8 bg-[var(--nav-bg)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container-x flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Piyrox home">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <img src="/logo.png" alt="Piyrox" className="h-7 w-7 object-contain" />
            </span>
            <span className="text-xl font-black tracking-widest text-white">PIYROX</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) =>
              isHash(link.href) ? (
                <a key={link.label} href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${linkClass} transition-colors duration-200`}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${linkClass} transition-colors duration-200`}>
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right actions */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:border-brand/40 hover:text-white"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <a href="https://app.piyrox.shop/auth/login" className="btn-ghost">
              Sign In
            </a>
            {/* Gold primary CTA */}
            <a href="https://app.piyrox.shop/auth/register" className="btn-primary">
              Get Started Free
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:border-brand/40 md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div id="mobile-menu" className={`border-t border-white/8 bg-[var(--nav-bg)] px-4 py-4 backdrop-blur-xl md:hidden ${open ? '' : 'hidden'}`}>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) =>
              isHash(link.href) ? (
                <a key={link.label} href={link.href} onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white">
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white">
                  {link.label}
                </Link>
              )
            )}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-brand/30"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href="https://app.piyrox.shop/auth/login"
              className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-gray-200 transition hover:border-brand/30 hover:text-white">
              Sign In
            </a>
            {/* Gold CTA */}
            <a href="https://app.piyrox.shop/auth/register" className="btn-primary w-full">
              Get Started Free
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
