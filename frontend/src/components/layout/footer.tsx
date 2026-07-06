'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold text-white mb-4 block">
              VELXO
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              The fastest and most secure gaming marketplace. Trade with confidence.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Browse */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm lg:text-base">Browse</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-slate-400 hover:text-white transition">
                  All Listings
                </Link>
              </li>
              <li>
                <Link href="/search?sortBy=popular" className="text-slate-400 hover:text-white transition">
                  Popular
                </Link>
              </li>
              <li>
                <Link href="/search?sortBy=newest" className="text-slate-400 hover:text-white transition">
                  Newest
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-slate-400 hover:text-white transition">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm lg:text-base">Sell</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/register" className="text-slate-400 hover:text-white transition">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/seller/dashboard" className="text-slate-400 hover:text-white transition">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-400 hover:text-white transition">
                  Seller Guide
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-400 hover:text-white transition">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm lg:text-base">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-slate-400 hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400 text-center sm:text-left">
            © {currentYear} Velxo Gaming Marketplace. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="text-slate-400 hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition">
              Terms
            </Link>
            <a href="mailto:support@velxo.com" className="text-slate-400 hover:text-white transition flex items-center gap-1">
              <Mail className="w-4 h-4" /> support@velxo.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
