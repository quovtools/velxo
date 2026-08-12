import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookOpen, Clock, Tag, ArrowLeft, Calendar } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = 'https://app.piyrox.shop';

export const dynamic = 'force-dynamic';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
  author?: string | null;
  coverImage?: string | null;
  isFeatured: boolean;
  readTime?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  tags?: string[] | null;
};

async function fetchPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_BASE}/blog/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'This blog post is no longer available.',
      robots: { index: false, follow: true },
    };
  }

  const title = `${post.title} | Piyrox Blog`;
  const description = post.excerpt?.slice(0, 160) ?? `Read "${post.title}" on the Piyrox blog — guides and tips for mobile game account trading.`;

  return {
    title,
    description,
    keywords: [
      ...(post.tags ?? []),
      post.category ?? 'gaming guide',
      'piyrox blog',
      'game account guide',
    ],
    authors: [{ name: post.author ?? 'Piyrox' }],
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: 'Piyrox Market',
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      authors: [post.author ?? 'Piyrox'],
      section: post.category ?? 'Gaming',
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : [{ url: '/opengraph-image', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@piyroxshop',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : ['/opengraph-image'],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) notFound();

  // Article JSON-LD
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ? [post.coverImage] : undefined,
    author: {
      '@type': 'Organization',
      name: post.author ?? 'Piyrox',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Piyrox',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-new.png` },
    },
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
    inLanguage: 'en',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
    ...(post.keywords ?? post.tags ? { keywords: (post.tags ?? []).join(', ') } : {}),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-3xl mx-auto space-y-8">
        {/* ── Breadcrumb + back ── */}
        <div className="flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition">Blog</Link>
            <span>/</span>
            <span className="text-gray-300 truncate max-w-[160px]">{post.title}</span>
          </nav>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All posts
          </Link>
        </div>

        {/* ── Cover image ── */}
        {post.coverImage && (
          <div className="relative h-56 sm:h-80 w-full rounded-2xl overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        {/* ── Meta ── */}
        <header className="space-y-3">
          {post.category && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wide text-brand">{post.category}</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="text-gray-400 text-base leading-relaxed">{post.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1 border-t border-borderBg">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-brand" />
                </div>
                {post.author}
              </span>
            )}
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            {post.readTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {post.readTime} min read
              </span>
            )}
          </div>
        </header>

        {/* ── Content ── */}
        {post.content ? (
          <div
            className="prose prose-invert prose-sm sm:prose-base max-w-none
              prose-headings:font-black prose-headings:text-white
              prose-p:text-gray-400 prose-p:leading-relaxed
              prose-a:text-brand prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-bold
              prose-ul:text-gray-400 prose-ol:text-gray-400
              prose-li:marker:text-brand
              prose-blockquote:border-brand prose-blockquote:text-gray-400
              prose-code:bg-background prose-code:text-brand prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-background prose-pre:border prose-pre:border-borderBg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <div className="text-center py-16 bg-cardBg border border-borderBg rounded-2xl">
            <p className="text-gray-400">Content coming soon.</p>
          </div>
        )}

        {/* ── Tags ── */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-borderBg">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold bg-background border border-borderBg text-gray-400 px-2.5 py-1 rounded-lg"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── CTA ── */}
        <div className="bg-brand/5 border border-brand/20 rounded-2xl p-6 space-y-3">
          <p className="text-white font-bold">Ready to buy or sell?</p>
          <p className="text-sm text-gray-400">
            Browse verified game accounts on Piyrox Market — every trade protected by Trust-Trade escrow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-block bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition"
            >
              Browse marketplace
            </Link>
            <Link
              href="/sell"
              className="inline-block bg-cardBg border border-borderBg hover:border-brand/50 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
            >
              Sell your account
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
