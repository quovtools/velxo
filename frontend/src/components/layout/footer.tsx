import Link from 'next/link'
import { Github, Twitter, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-semibold text-white mb-4">About Velxo</h3>
            <p className="text-sm text-zinc-400">
              The safest marketplace for digital gaming products with escrow protection and verified sellers.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3 className="font-semibold text-white mb-4">Browse</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search?type=account" className="text-zinc-400 hover:text-white transition">
                  Gaming Accounts
                </Link>
              </li>
              <li>
                <Link href="/search?type=coins" className="text-zinc-400 hover:text-white transition">
                  In-Game Currency
                </Link>
              </li>
              <li>
                <Link href="/search?type=topup" className="text-zinc-400 hover:text-white transition">
                  Game Top-Ups
                </Link>
              </li>
              <li>
                <Link href="/search?type=boost" className="text-zinc-400 hover:text-white transition">
                  Ranking Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition">
                  Report Issue
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition">
                  Safety Tips
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition">
                  Dispute Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-zinc-500">
            © 2024 Velxo. All rights reserved. Trading gaming products safely and securely.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-zinc-400 hover:text-white transition">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-zinc-400 hover:text-white transition">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-zinc-400 hover:text-white transition">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
