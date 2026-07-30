import type { Metadata, Viewport } from "next";
import "./globals.css";
import LiveChatWidget from '@/components/LiveChatWidget';

const SITE_URL = "https://piyrox.shop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Piyrox — Africa's No.1 Gaming Marketplace",
    template: "%s | Piyrox",
  },
  description:
    "Buy and sell game accounts, top-ups, gift cards and boosting services with full escrow protection. Built for Africa's gaming community.",
  applicationName: "Piyrox",
  keywords: [
    "gaming marketplace",
    "free fire accounts",
    "pubg mobile",
    "cod mobile",
    "escrow gaming",
    "buy game accounts africa",
    "sell game accounts",
    "game top ups",
    "gift cards africa",
    "boosting services",
    "piyrox",
  ],
  authors: [{ name: "Piyrox", url: SITE_URL }],
  creator: "Piyrox",
  publisher: "Piyrox",
  category: "Gaming",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Piyrox",
    title: "Piyrox — Africa's No.1 Gaming Marketplace",
    description:
      "Trade gaming assets safely with piyrox escrow. No more scams. Africa's most trusted gaming marketplace.",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Piyrox — Africa's No.1 Gaming Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@piyroxshop",
    creator: "@piyroxshop",
    title: "Piyrox — Africa's No.1 Gaming Marketplace",
    description: "Trade gaming assets safely with piyrox escrow. No more scams.",
    images: ["/og.png"],
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
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Piyrox",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og.png`,
    description: "Africa's No.1 escrow-backed gaming marketplace.",
    foundingDate: "2025",
    founder: {
      "@type": "Person",
      name: "Badeji Precious",
    },
    slogan: "Trade games. Zero risk.",
    address: {
      "@type": "PostalAddress",
      addressRegion: "Lagos",
      addressCountry: "NG",
    },
    areaServed: ["NG", "GH", "KE", "UG", "ZA"],
    sameAs: [
      "https://twitter.com/piyroxshop",
      "https://instagram.com/piyroxshop",
      "https://youtube.com/@piyrox",
      "https://discord.gg/piyrox",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Piyrox",
    url: SITE_URL,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Piyrox",
    operatingSystem: "Web, Android, iOS",
    applicationCategory: "BusinessApplication",
    url: SITE_URL,
    sameAs: ["https://twitter.com/piyroxshop", "https://discord.gg/piyrox"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('piyrox_theme')||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var r=document.documentElement;r.classList.add(t);r.classList.remove(t==='dark'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      </head>
      <body className="antialiased">
        {children}
        <LiveChatWidget showAlways />
      </body>
    </html>
  );
}
