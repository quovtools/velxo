import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import NavigationWrapper from "@/components/NavigationWrapper";
import Footer from "@/components/Footer";

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
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
