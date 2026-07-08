'use client';
import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, User, Loader2 } from 'lucide-react';

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
  Sellers: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
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
    async function loadPosts() {
      setLoading(true);
      try {
        const url = category ? `${API}/blog?category=${encodeURIComponent(category)}` : `${API}/blog`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, [category]);

  const featured = posts.filter((p) => p.isFeatured);
  const rest = posts.filter((p) => !p.isFeatured);
  const categories = ['', 'Platform', 'Sellers', 'Safety', 'Guides'];

  return (
    <main className="min-h-screen bg-[#0b0f19] pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

        <div className="text-center space-y-4">
          <span className="inline-block text-xs font-bold text-brand-light uppercase tracking-widest bg-brand/10 px-4 py-2 rounded-full border border-brand/20">
            Velxo Blog
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white">
            Insights, guides &amp;{' '}
            <span>gaming news</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Tips for buyers, guides for sellers, platform updates, and everything to trade smarter.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
                category === cat
                  ? 'bg-brand border-brand text-white'
                  : 'bg-card border-border text-gray-400 hover:text-white hover:border-brand/40'
              }`}>
              {cat || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-[#111827] border border-[#1F2937] rounded-2xl">
            <p className="text-gray-400">No posts published yet. Check back soon.</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((post) => (
                     <article key={post.slug} className="bg-card border border-border hover:border-brand/30 rounded-3xl overflow-hidden transition-all duration-300 card-glow group">
                      {post.coverImage && (
                        <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" className="w-full h-48 object-cover" />
                      )}
                      <div className="p-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${CATEGORY_COLORS[post.category] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                            {post.category}
                          </span>
                          {post.readTime && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Clock className="w-3 h-3" /> {post.readTime}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-white group-hover:text-[#A78BFA] transition-colors leading-snug">
                          {post.title}
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">{post.excerpt}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-[#1F2937]">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <User className="w-3 h-3" /> {post.author}
                            {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                          </div>
                          <a href={`/blog/${post.slug}`} className="flex items-center gap-1 text-xs font-bold text-brand-light group-hover:gap-2 transition-all">
                             Read more <ArrowRight className="w-3 h-3" />
                           </a>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white">All Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {rest.map((post) => (
                    <article key={post.slug} className="bg-card border border-border hover:border-brand/30 rounded-2xl overflow-hidden transition-all duration-300 card-glow group">
                      {post.coverImage && (
                        <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" className="w-full h-32 object-cover" />
                      )}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[post.category] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                            {post.category}
                          </span>
                          {post.readTime && <span className="text-xs text-gray-600">{post.readTime}</span>}
                        </div>
                        <h3 className="font-bold text-white text-sm group-hover:text-[#A78BFA] transition-colors leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
                         <a href={`/blog/${post.slug}`} className="text-xs font-bold text-brand-light hover:text-white transition flex items-center gap-1">
                           Read more <ArrowRight className="w-3 h-3" />
                         </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Newsletter */}
        <div className="bg-card border border-brand/20 rounded-3xl p-10 text-center space-y-5">
          <h3 className="text-2xl font-black text-white">Stay in the loop</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">Get new posts, platform updates, and seller tips. No spam.</p>
          {subscribed ? (
            <p className="text-brand-accent font-semibold">You&apos;re subscribed!</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-background border border-border focus:border-brand rounded-xl px-4 py-3 text-white text-sm outline-none transition" />
              <button onClick={() => email && setSubscribed(true)}
                className="bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl text-sm transition">
                Subscribe
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
