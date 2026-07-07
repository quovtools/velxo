'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.velxo.shop/api/v1';

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`${API}/blog/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          const postData = data.data;
          if (postData) {
            setPost(postData);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug, API]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0b0f19] pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 text-[#8B5CF6] animate-spin" />
            </div>
          ) : notFound || !post ? (
            <div className="text-center py-24 space-y-6">
              <p className="text-gray-400 text-lg font-semibold">Post not found.</p>
              <Link href="/blog" className="inline-flex items-center gap-2 text-[#A78BFA] hover:text-white transition">
                <ArrowLeft className="w-4 h-4" /> Back to Blog
              </Link>
            </div>
          ) : (
            <article className="space-y-8">
              <div className="flex items-center justify-between">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition">
                  <ArrowLeft className="w-4 h-4" /> Back to Blog
                </Link>
                <button onClick={() => navigator.share?.({ title: post.title, url: window.location.href })} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>

              {post.coverImage && (
                <img src={post.coverImage} alt={post.title} className="w-full h-64 sm:h-80 object-cover rounded-3xl border border-[#1F2937]" />
              )}

              <div className="space-y-4">
                <span className="inline-block text-xs font-bold text-[#A78BFA] uppercase tracking-widest bg-[#8B5CF6]/10 px-4 py-2 rounded-full border border-[#8B5CF6]/20">
                  {post.category}
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">{post.title}</h1>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author || 'Velxo Team'}</span>
                  {post.publishedAt && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                  {post.readTime && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>}
                </div>
              </div>

              <div className="border-t border-b border-[#1F2937] py-8">
                <p className="text-lg text-gray-300 leading-relaxed font-medium">{post.excerpt}</p>
              </div>

              <div className="prose prose-invert max-w-none">
                {post.content.split('\n').map((paragraph, i) => (
                  <p key={i} className="text-gray-400 leading-relaxed py-2">{paragraph}</p>
                ))}
              </div>

              <div className="border-t border-[#1F2937] pt-8">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#A78BFA] hover:text-white transition">
                  <ArrowLeft className="w-4 h-4" /> Back to all posts
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
