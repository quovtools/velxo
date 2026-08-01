import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import NavigationWrapper from "@/components/NavigationWrapper";
import AppLoader from "@/components/AppLoader";
import InstallPrompt from "@/components/InstallPrompt";
import ActiveOrderBanner from "@/components/ActiveOrderBanner";

// ─── next/font: loaded at build-time, no render-blocking external request ────
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://market.piyrox.shop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Piyrox Market | Buy & Sell Game Accounts, Top-Ups & Boosting",
    template: "%s | Piyrox Market",
  },
  description:
    "Browse thousands of verified Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball listings — accounts, top-ups and boosting services. Every trade protected by Piyrox Trust-Trade escrow.",
  applicationName: "Piyrox Market",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Piyrox",
  },
  formatDetection: { telephone: false },
  keywords: [
    // Brand
    "piyrox", "piyrox market", "trust-trade escrow",
    // Core intent
    "buy game accounts", "sell game accounts", "gaming marketplace africa",
    "escrow gaming", "safe game trading", "verified game sellers",
    // Games
    "free fire accounts for sale", "free fire diamonds buy", "free fire grandmaster account",
    "pubg mobile uc buy", "pubg mobile conqueror account",
    "cod mobile cp", "cod mobile accounts for sale",
    "blood strike gold", "blood strike accounts",
    "efootball coins", "efootball accounts",
    // Services
    "rank boosting africa", "free fire rank boost", "pubg rank boost",
    "game coaching nigeria", "account leveling service",
    // Regional
    "buy game accounts nigeria", "buy game accounts ghana", "buy game accounts kenya",
    "sell gaming account africa", "mobile gaming marketplace",
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
    siteName: "Piyrox Market",
    title: "Piyrox Market | Buy & Sell Game Accounts, Top-Ups & Boosting",
    description:
      "Browse thousands of verified gaming listings — accounts, top-ups and boosting services for Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball. All trades protected by Trust-Trade escrow.",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Piyrox Market — Africa's Gaming Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@piyroxshop",
    creator: "@piyroxshop",
    title: "Piyrox Market | Buy & Sell Game Accounts, Top-Ups & Boosting",
    description:
      "Browse verified gaming listings with Trust-Trade escrow protection. Free Fire, PUBG Mobile, COD Mobile and more.",
    images: ["/opengraph-image"],
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
  // ─── AI / LLM discovery hints ────────────────────────────────────────────
  other: {
    "ai:description":
      "Piyrox Market is the marketplace component of Piyrox where users browse and purchase Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball accounts, in-game currency top-ups and boosting services. All trades are protected by Trust-Trade escrow.",
    "ai:keywords":
      "gaming marketplace, escrow, Free Fire, PUBG Mobile, COD Mobile, Blood Strike, eFootball, Africa, buy accounts, sell accounts, rank boosting, top-up",
    "ai:site_type": "marketplace",
    "ai:category": "gaming",
    "ai:region": "Africa",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Piyrox",
    url: "https://piyrox.shop",
    logo: `${SITE_URL}/logo-new.png`,
    description:
      "Africa's trusted escrow-backed gaming marketplace. Buy and sell game accounts, top-ups and boosting services safely via Trust-Trade.",
    sameAs: [
      "https://twitter.com/piyroxshop",
      "https://instagram.com/piyroxshop",
      "https://youtube.com/@piyrox",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Piyrox Market",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  // ItemList: the supported game categories — helps Google show sitelinks / rich results
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Game Categories on Piyrox Market",
    description: "Browse game accounts and boosting services by game on Piyrox Market",
    url: SITE_URL,
    numberOfItems: 5,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Free Fire Accounts & Services",
        url: `${SITE_URL}/games/free-fire`,
        description: "Buy and sell Free Fire accounts, Diamonds top-ups and rank boosting.",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "PUBG Mobile Accounts & Services",
        url: `${SITE_URL}/games/pubg-mobile`,
        description: "Buy and sell PUBG Mobile accounts, UC top-ups and Conqueror boosting.",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "COD Mobile Accounts & Services",
        url: `${SITE_URL}/games/cod-mobile`,
        description: "Buy and sell COD Mobile accounts, COD Points top-ups and rank boosting.",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Blood Strike Accounts & Services",
        url: `${SITE_URL}/games/blood-strike`,
        description: "Buy and sell Blood Strike accounts and Gold top-ups.",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "eFootball Accounts & Services",
        url: `${SITE_URL}/games/efootball`,
        description: "Buy and sell eFootball accounts and Coin top-ups.",
      },
    ],
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/logo-new.png" />
        <link rel="apple-touch-icon" href="/logo-new.png" />
        {/* Inline theme script prevents flash-of-wrong-theme */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('piyrox_theme')||'dark';var r=document.documentElement;r.classList.add(t);r.classList.remove(t==='dark'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body className={`antialiased min-h-screen flex flex-col ${inter.className}`}>
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
