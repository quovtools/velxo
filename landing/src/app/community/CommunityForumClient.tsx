'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Plus, Search, ArrowLeft, Lock, Pin,
  Eye, Clock, ChevronRight, User, Home
} from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  authorId: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  _count: { posts: number };
}

interface Post {
  id: string;
  content: string;
  isHidden: boolean;
  authorId: string;
  threadId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.velxo.shop/api/v1';

export default function CommunityForumClient() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'thread'>('list');
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('General');
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('velxo_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    loadThreads();
    loadCategories();
  }, [category, search]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const res = await fetch(`${API}/forum/threads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.data.threads || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API}/forum/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadThread = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/forum/threads/${id}`);
      if (res.ok) {
        const data = await res.json();
        const thread = data.data;
        setActiveThread(thread);
        setPosts(thread.posts || []);
        setView('thread');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/forum/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          title: newThreadTitle,
          content: newThreadContent,
          category: newThreadCategory,
          tags: [],
        }),
      });
      if (res.ok) {
        setShowNewThread(false);
        setNewThreadTitle('');
        setNewThreadContent('');
        loadThreads();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeThread) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/forum/threads/${activeThread.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ content: newPostContent }),
      });
      if (res.ok) {
        setNewPostContent('');
        loadThread(activeThread.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAuthorName = (author: Thread['author'] | Post['author']) => {
    return `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Anonymous';
  };

  return (
    <main className="min-h-screen bg-background pt-24">
      <div className="container-x py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="flex items-center gap-1 transition hover:text-white">
            <Home className="h-4 w-4" /> Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Community Forum</span>
        </nav>

        {view === 'list' ? (
          <>
            {/* Header */}
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="eyebrow">Community</span>
                <h1 className="heading-xl mt-2">Gaming Forum</h1>
                <p className="text-gray-400 mt-2">Ask questions, share tips, and connect with African gamers.</p>
              </div>
              {user && (
                <button
                  onClick={() => setShowNewThread(!showNewThread)}
                  className="btn-primary justify-center sm:justify-start"
                >
                  <Plus className="h-4 w-4" />
                  New Thread
                </button>
              )}
            </div>

            {/* New Thread Form */}
            {showNewThread && (
              <form onSubmit={handleCreateThread} className="card-surface mb-8 space-y-5 p-8">
                <h3 className="text-lg font-bold text-white">Start a new thread</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Title</label>
                    <input
                      type="text"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      required
                      placeholder="What's on your mind?"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
                    <select
                      value={newThreadCategory}
                      onChange={(e) => setNewThreadCategory(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
                    >
                      <option value="General">General</option>
                      <option value="Trading Tips">Trading Tips</option>
                      <option value="Account Valuation">Account Valuation</option>
                      <option value="Scam Reports">Scam Reports</option>
                      <option value="Game Guides">Game Guides</option>
                      <option value="Marketplace">Marketplace</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Content</label>
                    <textarea
                      value={newThreadContent}
                      onChange={(e) => setNewThreadContent(e.target.value)}
                      required
                      rows={4}
                      placeholder="Share your thoughts, questions, or tips..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Posting...' : 'Post Thread'}
                  </button>
                  <button type="button" onClick={() => setShowNewThread(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white outline-none transition focus:border-brand"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-brand"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Threads List */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-20 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-600" />
                <p className="mt-4 text-lg font-semibold text-gray-400">No threads found</p>
                <p className="mt-2 text-sm text-gray-500">Be the first to start a discussion!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => loadThread(thread.id)}
                    className="card-surface cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 border border-brand/20">
                        <MessageSquare className="h-5 w-5 text-brand-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {thread.isPinned && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                              <Pin className="h-3 w-3" /> Pinned
                            </span>
                          )}
                          {thread.isLocked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          )}
                          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-light">
                            {thread.category}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold text-white transition-colors group-hover:text-brand-light">
                          {thread.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                          {thread.content}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {getAuthorName(thread.author)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(thread.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {thread._count.posts} replies
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {thread.viewCount} views
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-gray-600 transition group-hover:text-brand-light" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Thread Detail */
          activeThread && (
            <div>
              <button
                onClick={() => { setView('list'); setActiveThread(null); }}
                className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back to threads
              </button>

              <div className="card-surface mb-6 p-8">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {activeThread.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                  {activeThread.isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-light">
                    {activeThread.category}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white sm:text-3xl">{activeThread.title}</h1>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {getAuthorName(activeThread.author)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(activeThread.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {activeThread.viewCount} views
                  </span>
                </div>
                <div className="mt-6 border-t border-white/10 pt-6">
                  <p className="whitespace-pre-wrap text-gray-300">{activeThread.content}</p>
                </div>
              </div>

              {/* Posts */}
              <div className="space-y-4 mb-8">
                {posts.map((post) => (
                  <div key={post.id} className="card-surface p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 border border-brand/20 text-xs font-bold text-brand-light">
                        {post.author.firstName?.[0]}{post.author.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{getAuthorName(post.author)}</p>
                        <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-300">{post.content}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {user && !activeThread.isLocked && (
                <form onSubmit={handleCreatePost} className="card-surface p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Reply to thread</h3>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    required
                    rows={3}
                    placeholder="Write your reply..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand mb-4"
                  />
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </form>
              )}
              {!user && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                  <p className="text-gray-400">
                    <Link href="/auth/login" className="text-brand-light hover:text-white">Log in</Link> to reply to this thread.
                  </p>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </main>
  );
}
