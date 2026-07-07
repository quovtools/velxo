import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velxo — Africa's No.1 Gaming Marketplace",
  description: "Buy and sell game accounts, top-ups, gift cards and boosting services with full escrow protection. Built for Africa's gaming community.",
  keywords: "gaming marketplace, free fire accounts, pubg mobile, cod mobile, escrow gaming, buy game accounts africa",
  openGraph: {
    title: "Velxo — Africa's No.1 Gaming Marketplace",
    description: "Trade gaming assets safely with Velxo Escrow. No more scams.",
    url: "https://velxo.shop",
    siteName: "Velxo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velxo — Africa's No.1 Gaming Marketplace",
    description: "Trade gaming assets safely with Velxo Escrow.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
