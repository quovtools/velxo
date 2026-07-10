'use client';
import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, User, Loader2, Mail } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  coverImage?: string;
  isFeatured: boolean;
  readTime?: string;
  publishedAt?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Platform: 'bg-brand/10 text-brand-light border-brand/20',
  Sellers: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
  Safety: 'bg-red-500/10 text-red-400 border-red-500/20',
  Guides: 'bg-brand-light/10 text-brand-light border-brand-light/20',
};

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.velxo.shop/api/v1';

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadPosts() {
      setLoading(true);
      try {
        const url = category ? `${API}/blog?category=${encodeURIComponent(category)}` : `${API}/blog`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (active) setPosts(data.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPosts();
    return () => { active = false; };
  }, [category]);

  const featured = posts.filter((p) => p.isFeatured);
  const rest = posts.filter((p) => !p.isFeatured);
  const categories = ['', 'Platform', 'Sellers', 'Safety', 'Guides'];

  return (
    <main className="min-h-screen bg-background pt-24">
      <div className="container-x space-y-12 py-16">

        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <span className="eyebrow">Velxo Blog</span>
          <h1 className="heading-xl">
            Insights, guides &amp;{' '}
            <span className="text-gradient">gaming news</span>
          </h1>
          <p className="text-lg text-gray-400">
            Tips for buyers, guides for sellers, platform updates, and everything to trade smarter.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                category === cat
                  ? 'border-brand bg-brand text-white'
                  : 'border-white/10 bg-white/[0.04] text-gray-400 hover:border-brand/40 hover:text-white'
              }`}>
              {cat || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-20 text-center">
            <p className="text-gray-400">No posts published yet. Check back soon.</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <section aria-label="Featured articles">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {featured.map((post) => (
                    <article key={post.slug} className="card-surface group flex flex-col">
                      {post.coverImage && (
                        <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" className="h-48 w-full rounded-2xl border border-white/10 object-cover" />
                      )}
                      <div className="flex flex-1 flex-col space-y-4 p-2 pt-6">
                        <div className="flex items-center justify-between">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${CATEGORY_COLORS[post.category] || 'border-white/10 bg-white/5 text-gray-300'}`}>
                            {post.category}
                          </span>
                          {post.readTime && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="h-3 w-3" /> {post.readTime}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold leading-snug text-white transition-colors group-hover:text-brand-light">
                          {post.title}
                        </h2>
                        <p className="text-sm leading-relaxed text-gray-400">{post.excerpt}</p>
                        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="h-3 w-3" /> {post.author}
                            {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                          </div>
                          <a href={`/blog/${post.slug}`} className="flex items-center gap-1 text-xs font-bold text-brand-light transition-all group-hover:gap-2">
                            Read more <ArrowRight className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section aria-label="All articles" className="space-y-5">
                <h2 className="text-xl font-bold text-white">All Articles</h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {rest.map((post) => (
                    <article key={post.slug} className="card-surface group flex flex-col">
                      {post.coverImage && (
                        <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" className="h-32 w-full rounded-xl border border-white/10 object-cover" />
                      )}
                      <div className="flex flex-1 flex-col space-y-3 p-2 pt-5">
                        <div className="flex items-center justify-between">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${CATEGORY_COLORS[post.category] || 'border-white/10 bg-white/5 text-gray-300'}`}>
                            {post.category}
                          </span>
                          {post.readTime && <span className="text-xs text-gray-500">{post.readTime}</span>}
                        </div>
                        <h3 className="text-sm font-bold leading-snug text-white transition-colors group-hover:text-brand-light">
                          {post.title}
                        </h3>
                        <p className="line-clamp-3 text-xs leading-relaxed text-gray-500">{post.excerpt}</p>
                        <a href={`/blog/${post.slug}`} className="mt-auto flex items-center gap-1 text-xs font-bold text-brand-light transition hover:text-white">
                          Read more <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section aria-label="Newsletter" className="rounded-3xl border border-brand/20 bg-white/[0.03] p-10 text-center">
          <h3 className="text-2xl font-black text-white">Stay in the loop</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">Get new posts, platform updates, and seller tips. No spam.</p>
          {subscribed ? (
            <p className="mt-5 font-semibold text-accent-emerald">You&apos;re subscribed!</p>
          ) : (
            <form
              className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}
            >
              <label htmlFor="blog-email" className="sr-only">Email address</label>
              <input
                id="blog-email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
              />
              <button type="submit" className="btn-primary">
                Subscribe
              </button>
            </form>
          )}
          <a href="mailto:hello@velxo.shop" className="mt-5 inline-flex items-center gap-1.5 text-xs text-gray-500 transition hover:text-brand-light">
            <Mail className="h-3.5 w-3.5" /> hello@velxo.shop
          </a>
        </section>
      </div>
    </main>
  );
}
