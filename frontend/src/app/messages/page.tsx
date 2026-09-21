'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  Send, User, MessageSquare, Search, Loader2, ArrowLeft,
  Check, CheckCheck, Paperclip, X, Package, Plus,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message { id: string; content: string; senderId: string; createdAt: string; isRead: boolean; }
interface Conversation {
  id: string; buyerId: string; sellerId: string; orderId?: string | null;
  lastMessageAt: string; unreadCount?: number;
  buyer?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  sellerStoreName?: string | null;
  lastMessage?: { id: string; content: string; senderId: string; createdAt: string } | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return 'now'; if (m < 60) return `${m}m`; if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`; return new Date(date).toLocaleDateString();
}

const QUICK_REPLIES = [
  'Hi! Is this still available?',
  'Can you provide more details?',
  'What is the delivery time after payment?',
  'I have received the item, confirming now.',
  'Thank you for the quick delivery!',
];

function MessagesContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(sp.get('conversationId') || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    api.get<{ success: boolean; data: Conversation[] }>('/messages/conversations')
      .then(res => { if (res.success) setConvos(Array.isArray(res.data) ? res.data : []); })
      .catch(console.error).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!activeId) return;
    setMsgLoading(true);
    api.get<{ success: boolean; data: Message[] }>(`/messages/conversations/${activeId}/messages`)
      .then(res => { if (res.success) setMessages(Array.isArray(res.data) ? res.data : []); })
      .catch(console.error).finally(() => setMsgLoading(false));
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('piyrox_token') : null;
    if (!token) return;
    const SOCKET_URL = API.replace('/api/v1', '');
    socketRef.current = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current.emit('joinConversation', activeId);
    socketRef.current.on('newMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => { socketRef.current?.disconnect(); };
  }, [activeId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async (text = content) => {
    const trimmed = text.trim();
    if (!trimmed || !activeId || sending) return;
    setSending(true);
    try {
      const res = await api.post<{ success: boolean; data: Message }>(`/messages/conversations/${activeId}/messages`, { content: trimmed });
      if (res.success) { setMessages(prev => [...prev, res.data]); setContent(''); }
    } catch {} finally { setSending(false); }
  };

  const activeConvo = conversations.find(c => c.id === activeId);
  const filtered = conversations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const other = c.buyer?.firstName?.toLowerCase() || c.sellerStoreName?.toLowerCase() || '';
    return other.includes(q) || c.lastMessage?.content.toLowerCase().includes(q);
  });

  const getOtherName = (c: Conversation) => {
    if (!user) return 'Unknown';
    return (user as any).id === c.buyerId
      ? (c.sellerStoreName || 'Seller')
      : `${c.buyer?.firstName || ''} ${c.buyer?.lastName || ''}`.trim() || 'Buyer';
  };

  return (
    <div className="flex h-[calc(100vh-130px)] md:h-[calc(100vh-80px)] border border-[var(--border-bg)] rounded-2xl overflow-hidden bg-[var(--card-bg)] fade-in">

      {/* ── Sidebar ── */}
      <div className={`flex flex-col border-r border-[var(--border-bg)] ${activeId ? 'hidden md:flex w-72 xl:w-80' : 'flex flex-1 md:flex-none md:w-72 xl:w-80'}`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--border-bg)]">
          <h2 className="font-black text-white mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[var(--surface)] border border-[var(--border-bg)] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand transition" />
          </div>
        </div>

        {/* Convo list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-brand" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500 mb-1">No conversations yet</p>
              <p className="text-xs text-gray-600">Conversations start when you place or receive an order.</p>
            </div>
          ) : (
            filtered.map(c => {
              const name = getOtherName(c);
              const isActive = c.id === activeId;
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition border-b border-[var(--border-bg)]/50 last:border-0 ${
                    isActive ? 'bg-brand/8 border-l-2 border-l-brand' : 'hover:bg-[var(--hover-bg)]'
                  }`}>
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-brand/20 text-brand' : 'bg-[var(--surface)] text-gray-400'
                  }`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-semibold truncate ${isActive ? 'text-brand' : 'text-white'}`}>{name}</span>
                      <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{c.lastMessage?.content || 'No messages yet'}</p>
                  </div>
                  {(c.unreadCount || 0) > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand text-black text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className={`flex-1 flex flex-col ${!activeId ? 'hidden md:flex' : 'flex'}`}>
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-brand/50" />
            </div>
            <h3 className="font-black text-white mb-1">Select a conversation</h3>
            <p className="text-sm text-gray-500">Choose a conversation from the list to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-bg)]">
              <button onClick={() => setActiveId(null)} className="md:hidden btn-ghost p-2 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-full bg-brand/15 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                {getOtherName(activeConvo!).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{activeConvo ? getOtherName(activeConvo) : ''}</p>
                {activeConvo?.orderId && (
                  <Link href={`/orders/${activeConvo.orderId}`}
                    className="flex items-center gap-1 text-xs text-brand hover:text-brand-light transition">
                    <Package className="w-3 h-3" /> View order
                  </Link>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">No messages yet. Say hello!</div>
              ) : (
                messages.map(m => {
                  const mine = m.senderId === (user as any)?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        mine ? 'bg-brand text-black rounded-br-sm' : 'bg-[var(--surface)] text-white border border-[var(--border-bg)] rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{m.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${mine ? 'text-black/60' : 'text-gray-500'}`}>
                          <span className="text-[10px]">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {mine && (m.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
              {QUICK_REPLIES.map(r => (
                <button key={r} onClick={() => sendMsg(r)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-bg)] text-gray-400 hover:border-brand/40 hover:text-brand transition whitespace-nowrap">
                  {r}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
              <form onSubmit={e => { e.preventDefault(); sendMsg(); }}
                className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border-bg)] rounded-2xl px-3 py-2 focus-within:border-brand/50 transition">
                <input value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none py-1.5" />
                <button type="submit" disabled={!content.trim() || sending}
                  className="w-9 h-9 rounded-xl bg-brand hover:bg-brand-light text-black flex items-center justify-center transition flex-shrink-0 disabled:opacity-40">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
