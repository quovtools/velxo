import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LiveChatWidget from "@/components/LiveChatWidget";

// ─── next/font: loaded at build-time, no render-blocking external request ────
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://piyrox.shop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Piyrox — Africa's No.1 Gaming Marketplace",
    template: "%s | Piyrox",
  },
  description:
    "Buy and sell Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball accounts, top-ups and boosting services with full escrow protection. Africa's most trusted gaming marketplace.",
  applicationName: "Piyrox",
  keywords: [
    // Brand
    "piyrox", "piyrox market", "piyrox shop",
    // Core intent
    "gaming marketplace africa", "buy game accounts", "sell game accounts",
    "escrow gaming", "safe game trading", "trust-trade escrow",
    // Games
    "free fire accounts for sale", "free fire diamonds", "free fire elite pass",
    "pubg mobile uc", "pubg mobile accounts", "cod mobile cp", "cod mobile accounts",
    "blood strike gold", "blood strike accounts", "efootball coins",
    // Services
    "rank boosting africa", "game account boosting", "game coaching",
    "account leveling", "game top up nigeria", "game top up ghana",
    // Regional
    "buy game accounts nigeria", "buy game accounts ghana", "buy game accounts kenya",
    "mobile gaming marketplace africa",
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
      "Trade gaming assets safely with Piyrox escrow (Trust-Trade). No more scams — Africa's most trusted marketplace for Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball.",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
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
    description:
      "Trade gaming assets safely with Piyrox escrow. No more scams — Free Fire, PUBG Mobile, COD Mobile and more.",
    images: ["/opengraph-image"],
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
  // ─── AI / LLM discovery hints ──────────────────────────────────────────────
  other: {
    "ai:description":
      "Piyrox is Africa's leading escrow-backed gaming marketplace where players buy and sell Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball accounts, top-ups and boosting services safely via the Trust-Trade escrow system.",
    "ai:keywords":
      "gaming marketplace, escrow, Free Fire, PUBG Mobile, COD Mobile, Blood Strike, eFootball, Africa, buy accounts, sell accounts, rank boosting",
    "ai:site_type": "marketplace",
    "ai:category": "gaming",
    "ai:region": "Africa",
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
    image: `${SITE_URL}/opengraph-image`,
    description:
      "Africa's No.1 escrow-backed gaming marketplace for buying and selling game accounts, top-ups and boosting services safely.",
    foundingDate: "2025",
    founder: { "@type": "Person", name: "Badeji Precious" },
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
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  // FAQ structured data — improves rich snippets in Google Search
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is Piyrox safe to buy game accounts?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every transaction on Piyrox is protected by Trust-Trade, our built-in escrow system. Funds are held securely until both buyer and seller confirm the trade is complete — eliminating scams.",
        },
      },
      {
        "@type": "Question",
        name: "Which games does Piyrox support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Piyrox supports Free Fire, PUBG Mobile, COD Mobile, Blood Strike and eFootball. You can buy and sell accounts, purchase in-game currency top-ups, or order rank boosting and coaching services for all supported titles.",
        },
      },
      {
        "@type": "Question",
        name: "How does the Trust-Trade escrow work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "When you place an order, your payment is held in the Piyrox Trust-Trade escrow. The seller then delivers the account or service. Once you confirm receipt and satisfaction, the funds are released to the seller. If there is a dispute, our AI-powered dispute resolution team steps in.",
        },
      },
      {
        "@type": "Question",
        name: "Can I sell my game account on Piyrox?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Sellers can create a free listing for any supported game, set their price, and get paid safely via the escrow system. Simply complete KYC verification and start selling.",
        },
      },
      {
        "@type": "Question",
        name: "Does Piyrox operate in Nigeria and Ghana?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Piyrox is built for Africa's gaming community and currently serves Nigeria, Ghana, Kenya, Uganda and South Africa, with more countries coming soon.",
        },
      },
    ],
  };

  // HowTo structured data — can appear as rich results for 'how to sell game account'
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Sell a Game Account on Piyrox",
    description:
      "A step-by-step guide to listing and selling your gaming account safely on Piyrox using the Trust-Trade escrow system.",
    step: [
      {
        "@type": "HowToStep",
        name: "Create a free account",
        text: "Sign up on Piyrox.shop, verify your email and complete a quick KYC check to become a verified seller.",
      },
      {
        "@type": "HowToStep",
        name: "Create your listing",
        text: "Choose your game (Free Fire, PUBG Mobile, COD Mobile, Blood Strike or eFootball), fill in the account details and set your asking price.",
      },
      {
        "@type": "HowToStep",
        name: "Buyer places an order",
        text: "Interested buyers pay into Trust-Trade escrow. Funds are held securely until the trade is confirmed.",
      },
      {
        "@type": "HowToStep",
        name: "Deliver account credentials",
        text: "Share account credentials securely via Piyrox's private messaging system.",
      },
      {
        "@type": "HowToStep",
        name: "Get paid",
        text: "Once the buyer confirms receipt, the escrow releases your payment directly to your Piyrox wallet.",
      },
    ],
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* ── Google Analytics ── */}
        {/* FIX S6: GA ID read from env var — never hardcoded in source. */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`,
              }}
            />
          </>
        )}
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        {/* Inline theme script prevents flash-of-wrong-theme */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('piyrox_theme')||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var r=document.documentElement;r.classList.add(t);r.classList.remove(t==='dark'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      </head>
      <body className={`antialiased ${inter.className}`}>
        {children}
        <LiveChatWidget showAlways />
      </body>
    </html>
  );
}
