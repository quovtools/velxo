import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://velxo.shop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Velxo — Africa's No.1 Gaming Marketplace",
    template: "%s | Velxo",
  },
  description:
    "Buy and sell game accounts, top-ups, gift cards and boosting services with full escrow protection. Built for Africa's gaming community.",
  applicationName: "Velxo",
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
    "velxo",
  ],
  authors: [{ name: "Velxo", url: SITE_URL }],
  creator: "Velxo",
  publisher: "Velxo",
  category: "Gaming",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Velxo",
    title: "Velxo — Africa's No.1 Gaming Marketplace",
    description:
      "Trade gaming assets safely with Velxo Escrow. No more scams. Africa's most trusted gaming marketplace.",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Velxo — Africa's No.1 Gaming Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@velxoshop",
    creator: "@velxoshop",
    title: "Velxo — Africa's No.1 Gaming Marketplace",
    description: "Trade gaming assets safely with Velxo Escrow. No more scams.",
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
    { media: "(prefers-color-scheme: light)", color: "#0b0f19" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Velxo",
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
      "https://twitter.com/velxoshop",
      "https://instagram.com/velxoshop",
      "https://youtube.com/@velxo",
      "https://discord.gg/velxo",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Velxo",
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
    name: "Velxo",
    operatingSystem: "Web, Android, iOS",
    applicationCategory: "BusinessApplication",
    url: SITE_URL,
    sameAs: ["https://twitter.com/velxoshop", "https://discord.gg/velxo"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "10284",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
