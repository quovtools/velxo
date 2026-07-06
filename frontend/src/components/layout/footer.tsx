import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">V</span>
              </div>
              <span className="font-bold text-lg">Velxo</span>
            </Link>
            <p className="text-zinc-400 text-sm mb-6">
              The safest gaming marketplace with escrow protection and verified sellers.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@velxo.com" className="hover:text-white">
                  support@velxo.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-bold mb-6">Marketplace</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/search" className="text-zinc-400 hover:text-white text-sm transition">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/search?sortBy=newest" className="text-zinc-400 hover:text-white text-sm transition">
                  Latest Products
                </Link>
              </li>
              <li>
                <Link href="/search?sortBy=popular" className="text-zinc-400 hover:text-white text-sm transition">
                  Popular Listings
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-zinc-400 hover:text-white text-sm transition">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-zinc-400 hover:text-white text-sm transition">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="font-bold mb-6">For Sellers</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/seller/dashboard" className="text-zinc-400 hover:text-white text-sm transition">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link href="/listings/new" className="text-zinc-400 hover:text-white text-sm transition">
                  Create Listing
                </Link>
              </li>
              <li>
                <Link href="/help/seller-guide" className="text-zinc-400 hover:text-white text-sm transition">
                  Seller Guide
                </Link>
              </li>
              <li>
                <Link href="/help/fees" className="text-zinc-400 hover:text-white text-sm transition">
                  Fees & Pricing
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-zinc-400 hover:text-white text-sm transition">
                  Support Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-zinc-400 hover:text-white text-sm transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-zinc-400 hover:text-white text-sm transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-zinc-400 hover:text-white text-sm transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-zinc-400 hover:text-white text-sm transition">
                  Press Kit
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-400 hover:text-white text-sm transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-6">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-zinc-400 hover:text-white text-sm transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-zinc-400 hover:text-white text-sm transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-zinc-400 hover:text-white text-sm transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/dispute-resolution" className="text-zinc-400 hover:text-white text-sm transition">
                  Dispute Resolution
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-zinc-400 hover:text-white text-sm transition">
                  Safety Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-12">
          {/* Social Links */}
          <div className="flex items-center justify-between mb-12">
            <p className="text-zinc-400">Follow us on social media</p>
            <div className="flex gap-4">
              {[
                { icon: Twitter, label: 'Twitter', href: 'https://twitter.com/velxo' },
                { icon: Facebook, label: 'Facebook', href: 'https://facebook.com/velxo' },
                { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/velxo' },
                { icon: Youtube, label: 'YouTube', href: 'https://youtube.com/@velxo' },
              ].map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-zinc-900 hover:bg-blue-600 transition flex items-center justify-center text-zinc-400 hover:text-white"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <p className="text-sm text-zinc-400 mb-4">Payment Methods</p>
            <div className="flex gap-4 flex-wrap">
              {['💳 Credit Card', '🏦 Bank Transfer', '📱 PayPal', '🪙 Crypto'].map((method) => (
                <div key={method} className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded">
                  {method}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-zinc-500">
            <p>&copy; 2024 Velxo. All rights reserved.</p>
            <p>Made with 💙 for gamers by gamers</p>
          </div>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="bg-zinc-900/50 border-t border-zinc-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="text-zinc-400">Escrow Protected</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">✅</span>
              <span className="text-zinc-400">Verified Sellers</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="text-zinc-400">Instant Delivery</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🔒</span>
              <span className="text-zinc-400">Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
