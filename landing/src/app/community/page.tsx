import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CommunityForumClient from "./CommunityForumClient";

export const metadata: Metadata = {
  title: "Community Forum",
  description: "Join the Velxo community forum. Ask questions, share trading tips, connect with African gamers, and stay updated.",
  keywords: ["gaming forum", "velxo community", "african gamers", "trading tips", "game accounts forum"],
  alternates: { canonical: "https://velxo.shop/community" },
  openGraph: {
    title: "Community Forum — Velxo",
    description: "Join the conversation with thousands of African gamers and traders.",
    url: "https://velxo.shop/community",
    siteName: "Velxo",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Velxo Community Forum" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Forum — Velxo",
    description: "Join the conversation with thousands of African gamers and traders.",
    images: ["/og.png"],
  },
};

export default function CommunityPage() {
  return (
    <>
      <Navbar />
      <CommunityForumClient />
      <Footer />
    </>
  );
}
