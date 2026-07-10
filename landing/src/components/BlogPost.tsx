'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, User, Calendar, Loader2, Share2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  coverImage?: string;
  isFeatured: boolean;
  readTime?: string;
  publishedAt?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.velxo.shop/api/v1';

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadPost() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`${API}/blog/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          const postData = data.data;
          if (active) {
            if (postData) setPost(postData);
            else setNotFound(true);
          }
        } else if (active) {
          setNotFound(true);
        }
      } catch (e) {
        console.error(e);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPost();
    return () => { active = false; };
  }, [slug]);

  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && post) {
      try { await navigator.share({ title: post.title, url: window.location.href }); } catch { /* ignore */ }
    }
  };

  return (
    <main className="min-h-screen bg-background pt-24">
      <article className="container-x max-w-4xl space-y-8 py-12">
        <div className="flex items-center justify-between">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <button onClick={share} className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-white">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          </div>
        ) : notFound || !post ? (
          <div className="space-y-6 py-24 text-center">
            <p className="text-lg font-semibold text-gray-400">Post not found.</p>
            <Link href="/blog" className="inline-flex items-center gap-2 text-brand-light transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
          </div>
        ) : (
          <>
            {post.coverImage && (
              <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" className="h-64 w-full rounded-3xl border border-white/10 object-cover sm:h-80" />
            )}

            <header className="space-y-4">
              <span className="inline-block rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-light">
                {post.category}
              </span>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {post.author || 'Velxo Team'}</span>
                {post.publishedAt && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                {post.readTime && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {post.readTime}</span>}
              </div>
            </header>

            <div className="border-y border-white/10 py-8">
              <p className="text-lg font-medium leading-relaxed text-gray-300">{post.excerpt}</p>
            </div>

            <div className="prose prose-invert max-w-none">
              {post.content.split('\n').map((paragraph, i) => (
                <p key={i} className="py-2 leading-relaxed text-gray-400">{paragraph}</p>
              ))}
            </div>

            <div className="border-t border-white/10 pt-8">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-brand-light transition hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to all posts
              </Link>
            </div>
          </>
        )}
      </article>
    </main>
  );
}
