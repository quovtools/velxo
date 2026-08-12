import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, Tag } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = 'https://app.piyrox.shop';

export const revalidate = 3600; // revalidate every hour

export const metadata: Metadata = {
  title: 'Blog & Guides | Gaming Marketplace Tips | Piyrox',
  description:
    'Guides, tips and news for mobile gamers — how to buy and sell game accounts safely, rank-up guides for Free Fire, PUBG Mobile, COD Mobile and more. Published by the Piyrox team.',
  keywords: [
    'game account buying guide',
    'how to sell game account safely',
    'free fire rank guide',
    'pubg mobile conqueror guide',
    'cod mobile legendary guide',
    'mobile gaming tips',
    'gaming marketplace guide',
    'piyrox blog',
    'escrow gaming explained',
    'how to avoid game account scams',
  ],
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Blog & Guides | Piyrox Market',
    description:
      'Guides, rank tips and marketplace news from the Piyrox team — helping you buy, sell and trade game accounts safely.',
    url: `${SITE_URL}/blog`,
    siteName: 'Piyrox Market',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Piyrox Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@piyroxshop',
    title: 'Blog & Guides | Piyrox Market',
    description: 'Guides, rank tips and marketplace news from Piyrox.',
    images: ['/opengraph-image'],
  },
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  author?: string | null;
  coverImage?: string | null;
  isFeatured: boolean;
  readTime?: number | null;
  publishedAt?: string | null;
};

async function fetchPosts(category?: string): Promise<BlogPost[]> {
  try {
    const url = category
      ? `${API_BASE}/blog?category=${encodeURIComponent(category)}`
      : `${API_BASE}/blog`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

const blogListJsonLd = (posts: BlogPost[]) => ({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Piyrox Blog',
  url: `${SITE_URL}/blog`,
  description: 'Guides, tips and news for mobile gamers from the Piyrox marketplace team.',
  inLanguage: 'en',
  blogPost: posts.slice(0, 10).map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: `${SITE_URL}/blog/${p.slug}`,
    ...(p.excerpt ? { description: p.excerpt } : {}),
    ...(p.coverImage ? { image: p.coverImage } : {}),
    ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
    author: { '@type': 'Organization', name: p.author ?? 'Piyrox' },
  })),
});

const CATEGORIES = ['All', 'Guides', 'News', 'Tips', 'Rankings'];

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = category && category !== 'All' ? category : undefined;
  const posts = await fetchPosts(activeCategory);

  const featured = posts.find((p) => p.isFeatured) ?? posts[0] ?? null;
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListJsonLd(posts)) }}
      />

      <div className="space-y-10">
        {/* ── Header ── */}
        <div className="space-y-2">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <span className="text-gray-300">Blog</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-brand" /> Blog &amp; Guides
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Rank-up guides, marketplace tips and gaming news from the Piyrox team.
          </p>
        </div>

        {/* ── Category filter ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const active = cat === 'All' ? !activeCategory : activeCategory === cat;
            const href = cat === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
                className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition ${
                  active
                    ? 'bg-brand border-brand text-white'
                    : 'bg-cardBg border-borderBg text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-24 bg-cardBg border border-borderBg rounded-2xl">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">No posts published yet.</p>
            <p className="text-gray-500 text-sm mt-1">Check back soon — guides are on the way.</p>
          </div>
        ) : (
          <>
            {/* ── Featured post ── */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group block bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-brand/10"
              >
                {featured.coverImage && (
                  <div className="relative h-56 sm:h-72 w-full overflow-hidden">
                    <Image
                      src={featured.coverImage}
                      alt={featured.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute top-4 left-4 text-xs font-bold bg-brand text-white px-3 py-1 rounded-full">
                      Featured
                    </span>
                  </div>
                )}
                <div className="p-6 space-y-2">
                  {featured.category && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                      <Tag className="w-3 h-3" /> {featured.category}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-brand transition">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                    {featured.author && <span>{featured.author}</span>}
                    {featured.readTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {featured.readTime} min read
                      </span>
                    )}
                    {featured.publishedAt && (
                      <span>
                        {new Date(featured.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* ── Post grid ── */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg hover:shadow-brand/5"
                  >
                    {post.coverImage ? (
                      <div className="relative h-40 overflow-hidden">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-brand/20 to-background flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-brand/40" />
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      {post.category && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                          <Tag className="w-3 h-3" /> {post.category}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-white group-hover:text-brand transition line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-auto pt-2 border-t border-borderBg">
                        {post.readTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.readTime} min
                          </span>
                        )}
                        {post.publishedAt && (
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
