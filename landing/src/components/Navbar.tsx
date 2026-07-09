'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ShieldCheck } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Games', href: '#games' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: '/community' },
];

const isHash = (href: string) => href.startsWith('#');

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass = scrolled
    ? 'text-gray-300 hover:text-brand-light'
    : 'text-gray-200 hover:text-white';

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Primary"
        className={`transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2" aria-label="Velxo home">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent shadow-glow">
              <ShieldCheck className="h-5 w-5 text-white" />
            </span>
            <span className={`text-xl font-black tracking-wider ${scrolled ? 'text-white' : 'text-white'}`}>
              VELXO
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) =>
              isHash(link.href) ? (
                <a key={link.label} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium ${linkClass} transition-colors duration-200`}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium ${linkClass} transition-colors duration-200`}>
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a href="https://market.velxo.shop/auth/login" className="btn-ghost">
              Sign In
            </a>
            <a href="https://market.velxo.shop/auth/register" className="btn-primary">
              Get Started Free
            </a>
          </div>

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

        {open && (
          <div id="mobile-menu" className="border-t border-white/10 bg-[#0b0f19]/95 px-4 py-4 backdrop-blur-xl md:hidden">
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
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href="https://market.velxo.shop/auth/login"
                className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-gray-200 transition hover:border-brand/40">
                Sign In
              </a>
              <a href="https://market.velxo.shop/auth/register"
                className="btn-primary w-full">
                Get Started Free
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
