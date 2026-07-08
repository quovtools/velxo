'use client';
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Games', href: '#games' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: '/community' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-xl object-cover" />
          <span className="text-xl font-black tracking-wider text-gray-900">VELXO</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-brand transition-colors duration-200">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="https://market.velxo.shop/auth/login"
            className="text-sm font-semibold text-gray-700 hover:text-brand transition px-4 py-2">
            Sign In
          </a>
          <a href="https://market.velxo.shop/auth/register"
            className="bg-brand hover:bg-purple-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-brand/25">
            Get Started Free
          </a>
        </div>

        <button className="md:hidden p-2 text-gray-700" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-5 space-y-2">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-brand hover:bg-gray-50 rounded-xl transition">
              {link.label}
            </a>
          ))}
          <div className="pt-3 space-y-2">
            <a href="https://market.velxo.shop/auth/login"
              className="block text-center px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-brand/40 transition">
              Sign In
            </a>
            <a href="https://market.velxo.shop/auth/register"
              className="block text-center px-4 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition">
              Get Started Free
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
