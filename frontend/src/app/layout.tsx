import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import NavigationWrapper from "@/components/NavigationWrapper";
import AppLoader from "@/components/AppLoader";
import InstallPrompt from "@/components/InstallPrompt";
import ActiveOrderBanner from "@/components/ActiveOrderBanner";

const SITE_URL = "https://market.piyrox.shop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "piyrox market | Buy & Sell Game Accounts, Coins & More",
    template: "%s | piyrox market",
  },
  description: "Browse thousands of verified gaming listings — accounts and boosting services. All trades protected by piyrox escrow, Africa's trusted gaming marketplace.", 
  applicationName: "piyrox market",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Piyrox",
  },
  formatDetection: { telephone: false },
  keywords: [
    "gaming marketplace",
    "buy game accounts",
    "sell game accounts",
    "escrow gaming",
    "piyrox",
    "africa gaming marketplace",
    "free fire accounts",
    "pubg mobile uc",
    "rank boosting",
  ],
  authors: [{ name: "Piyrox" }],
  creator: "Piyrox",
  category: "marketplace",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "piyrox market",
    title: "piyrox market | Buy & Sell Game Accounts, Coins & More",
    description: "Browse thousands of verified gaming listings — accounts, top-ups, gift cards and boosting services. All trades protected by piyrox escrow.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@piyroxshop",
    creator: "@piyroxshop",
    title: "piyrox market | Buy & Sell Game Accounts, Coins & More",
    description: "Browse thousands of verified gaming listings with escrow protection.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "piyrox market",
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo-new.png`,
      "description": "Africa's trusted escrow-backed gaming marketplace. Buy and sell game accounts, coins, gift cards safely.",
      "sameAs": [
        "https://twitter.com/piyroxshop",
        "https://instagram.com/piyroxshop",
        "https://youtube.com/@piyrox",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "piyrox market",
      "url": SITE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/search?query={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('piyrox_theme')||'dark';var r=document.documentElement;r.classList.add(t);r.classList.remove(t==='dark'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/logo-new.png" />
        <link rel="apple-touch-icon" href="/logo-new.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <Providers>
            <AppLoader />
            <NavigationWrapper />
            <ActiveOrderBanner />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
              {children}
            </main>
            <InstallPrompt />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
