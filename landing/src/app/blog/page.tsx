import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogList from '@/components/BlogList';

export const metadata: Metadata = {
  title: "Blog — Velxo",
  description: "Tips for buyers, guides for sellers, platform updates, and gaming news to help you trade smarter on Africa's No.1 gaming marketplace.",
  alternates: { canonical: "https://velxo.shop/blog" },
  openGraph: {
    title: "Blog — Velxo",
    description: "Insights, guides & gaming news for African gamers and traders.",
    url: "https://velxo.shop/blog",
    siteName: "Velxo",
    type: "website",
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
