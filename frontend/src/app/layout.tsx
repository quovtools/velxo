import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import NavigationWrapper from "@/components/NavigationWrapper";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Velxo Market | Buy & Sell Game Accounts, Coins & More",
  description: "Browse thousands of verified gaming listings — accounts, top-ups, gift cards and boosting services. All trades protected by Velxo Escrow.",
  keywords: "gaming marketplace, buy game accounts, sell game accounts, escrow gaming, velxo, africa gaming marketplace, free fire, pubg mobile",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Velxo Market | Buy & Sell Game Accounts, Coins & More",
    description: "Browse thousands of verified gaming listings — accounts, top-ups, gift cards and boosting services. All trades protected by Velxo Escrow.",
    url: "https://market.velxo.shop",
    siteName: "Velxo Market",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velxo Market | Buy & Sell Game Accounts, Coins & More",
    description: "Browse thousands of verified gaming listings with escrow protection.",
  },
  alternates: {
    canonical: "https://market.velxo.shop",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Velxo Market",
    "url": "https://market.velxo.shop",
    "logo": "https://market.velxo.shop/favicon.png",
    "description": "Africa's trusted escrow-backed gaming marketplace. Buy and sell game accounts, coins, gift cards safely.",
    "sameAs": [
      "https://twitter.com/velxoshop",
      "https://instagram.com/velxoshop",
      "https://youtube.com/@velxo",
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <Providers>
          <NavigationWrapper />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
