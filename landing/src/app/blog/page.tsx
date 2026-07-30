import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogList from '@/components/BlogList';

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips for buyers, guides for sellers, platform updates, and gaming news to help you trade smarter on Africa's No.1 gaming marketplace.",
  keywords: ["gaming blog", "esports africa", "sell game accounts guide", "piyrox blog", "trading tips"],
  alternates: { canonical: "https://piyrox.shop/blog" },
  openGraph: {
    title: "Blog — Piyrox",
    description: "Insights, guides & gaming news for African gamers and traders.",
    url: "https://piyrox.shop/blog",
    siteName: "Piyrox",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Piyrox Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Piyrox",
    description: "Insights, guides & gaming news for African gamers and traders.",
    images: ["/og.png"],
  },
};

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <BlogList />
      <Footer />
    </>
  );
}
