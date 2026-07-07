import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velxo — Africa's No.1 Gaming Marketplace",
  description: "Buy and sell game accounts, top-ups, gift cards and boosting services with full escrow protection. Built for Africa's gaming community.",
  keywords: "gaming marketplace, free fire accounts, pubg mobile, cod mobile, escrow gaming, buy game accounts africa, velxo",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Velxo — Africa's No.1 Gaming Marketplace",
    description: "Trade gaming assets safely with Velxo Escrow. No more scams. Africa's most trusted gaming marketplace.",
    url: "https://velxo.shop",
    siteName: "Velxo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velxo — Africa's No.1 Gaming Marketplace",
    description: "Trade gaming assets safely with Velxo Escrow. No more scams.",
  },
  alternates: {
    canonical: "https://velxo.shop",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Velxo",
    "url": "https://velxo.shop",
    "logo": "https://velxo.shop/logo.png",
    "description": "Africa's No.1 escrow-backed gaming marketplace.",
    "sameAs": [
      "https://twitter.com/velxoshop",
      "https://instagram.com/velxoshop",
      "https://youtube.com/@velxo",
      "https://discord.gg/velxo",
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
