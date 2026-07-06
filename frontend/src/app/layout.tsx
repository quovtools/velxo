import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";
import NavigationWrapper from "@/components/NavigationWrapper";

export const metadata: Metadata = {
  title: "Velxo | No.1 Gaming Marketplace in Africa",
  description: "Buy and sell digital gaming accounts, top-ups, coins, gift cards, and boosting services with escrow protection.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <Providers>
          <NavigationWrapper />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-borderBg bg-cardBg py-8 text-center text-gray-500 text-sm mt-12">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-white font-bold text-lg">Velxo</span>
                <p className="mt-1 text-xs">Escrow-backed gaming marketplace</p>
              </div>
              <div className="flex gap-6">
                <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                <Link href="/support" className="hover:text-white transition">Support Center</Link>
              </div>
              <p className="text-xs">&copy; {new Date().getFullYear()} Velxo.shop. All rights reserved.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
