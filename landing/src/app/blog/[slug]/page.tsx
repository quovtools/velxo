import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogPost from '@/components/BlogPost';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.piyrox.shop/api/v1';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `https://piyrox.shop/blog/${slug}`;
  try {
    const res = await fetch(`${API}/blog/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const post = data.data;
      if (post) {
        return {
          title: post.title,
          description: post.excerpt,
          keywords: [post.category, 'Piyrox', 'gaming marketplace', post.title],
          alternates: { canonical },
          openGraph: {
            title: post.title,
            description: post.excerpt,
            url: canonical,
            siteName: 'Piyrox',
            type: 'article',
            images: [{ url: post.coverImage || '/og.png', width: 1200, height: 630, alt: post.title }],
          },
          twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [post.coverImage || '/og.png'],
          },
        };
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return {
    title: 'Blog Post',
    description: 'Read the latest from the Piyrox blog.',
    keywords: ['Piyrox', 'gaming marketplace', 'blog'],
    alternates: { canonical },
    openGraph: {
      title: 'Blog Post — Piyrox',
      description: 'Read the latest from the Piyrox blog.',
      url: canonical,
      siteName: 'Piyrox',
      type: 'article',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Piyrox' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Blog Post — Piyrox',
      description: 'Read the latest from the Piyrox blog.',
      images: ['/og.png'],
    },
  };
}

export default function BlogPostPage() {
  return (
    <>
      <Navbar />
      <BlogPost />
      <Footer />
    </>
  );
}
