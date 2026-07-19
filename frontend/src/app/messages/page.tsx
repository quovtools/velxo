'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  Send, User, MessageSquare, Search, Loader2, ArrowLeft,
  Circle, Package, CheckCheck, Check, Clock, Paperclip, X,
} from 'lucide-react';
import LoadingLogo from '@/components/LoadingLogo';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  conversationId?: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  orderId?: string | null;
  lastMessageAt: string;
  unreadCount?: number;
  buyer?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  sellerStoreName?: string | null;
  lastMessage?: { id: string; content: string; senderId: string; createdAt: string } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const QUICK_REPLIES = [
  'Hi! Is this item still available?',
  'Can you provide more details about the account?',
  'What is the delivery time after payment?',
  'I have received the item, confirming now.',
  'Thank you for the quick delivery!',
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

function fmtTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(date: string) {
  const d = new Date(date);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function otherName(c: Conversation, userId?: string): string {
  return c.buyerId === userId ? (c.sellerStoreName || 'Seller') : [c.buyer?.firstName, c.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer';
}

function groupByDay(messages: Message[]): Array<{ day: string; msgs: Message[] }> {
  const groups: Record<string, Message[]> = {};
  messages.forEach(m => {
    const key = fmtDate(m.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups).map(([day, msgs]) => ({ day, msgs }));
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyerIdParam = searchParams.get('buyerId');
  const sellerIdParam = searchParams.get('sellerId');
  const targetUserId = searchParams.get('userId');
  const conversationIdParam = searchParams.get('conversationId');
  const { user, loading: authLoading } = useAuth();

  const [convos, setConvos] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConvos = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Conversation[] }>('/messages');
      if (res.success) { const list = res.data || []; setConvos(list); return list; }
    } catch { /* silent */ }
    return [];
  };

  const fetchMessages = async (convoId: string, markRead = false) => {
    try {
      const res = await api.get<{ success: boolean; data: Message[] }>(`/messages/conversation/${convoId}`);
      if (res.success) setMessages(res.data || []);
      if (markRead) api.patch(`/messages/conversation/${convoId}/mark-read`).catch(() => {});
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    (async () => {
      const list = await fetchConvos() as Conversation[];
      let target: Conversation | undefined;
      if (conversationIdParam) {
        target = list.find(c => c.id === conversationIdParam);
      } else if (buyerIdParam && sellerIdParam) {
        target = list.find(c => c.buyerId === buyerIdParam && c.sellerId === sellerIdParam);
        if (!target) {
          try {
            const created = await api.post<{ success: boolean; data: Conversation }>('/messages/conversation', { buyerId: buyerIdParam, sellerId: sellerIdParam });
            if (created.success) { target = created.data; setConvos(p => [created.data, ...p]); }
          } catch { /* no thread */ }
        }
      } else if (targetUserId) {
        target = list.find(c => c.buyerId === targetUserId || c.sellerId === targetUserId);
        if (!target) {
          try {
            const created = await api.post<{ success: boolean; data: Conversation }>('/messages/conversation', { recipientId: targetUserId });
            if (created.success) { target = created.data; setConvos(p => [created.data, ...p]); }
          } catch { /* no thread */ }
        }
      } else if (list.length > 0) {
        target = list[0];
      }
      if (target) { setActive(target); setShowSidebar(false); fetchMessages(target.id, true); }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, targetUserId, buyerIdParam, sellerIdParam, conversationIdParam, router]);

  useEffect(() => {
    if (!user) return;
    const listTimer = setInterval(fetchConvos, 10000);
    try {
      const socketUrl = API_BASE.replace(/\/api\/v1$/, '');
      const socket = io(`${socketUrl}/messages`, { transports: ['websocket', 'polling'], reconnection: true });
      socketRef.current = socket;
      socket.on('newMessage', (msg: Message) => {
        if (activeIdRef.current && msg?.conversationId === activeIdRef.current) {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
        fetchConvos();
      });
    } catch { /* socket unavailable */ }
    return () => { clearInterval(listTimer); socketRef.current?.disconnect(); socketRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!active) return;
    activeIdRef.current = active.id;
    fetchMessages(active.id, true);
    try { socketRef.current?.emit('join', active.id); } catch { /* no-op */ }
    const msgTimer = setInterval(() => fetchMessages(active.id), 4000);
    return () => { clearInterval(msgTimer); activeIdRef.current = null; };
  }, [active]);

  const send = async (e: React.FormEvent, override?: string) => {
    e.preventDefault();
    const content = override ?? text;
    if (!content.trim() || !active || sending) return;
    setSending(true);
    const optimistic: Message = { id: `temp-${Date.now()}`, conversationId: active.id, content, senderId: user!.id, createdAt: new Date().toISOString(), isRead: false };
    setMessages(p => [...p, optimistic]);
    const draft = content;
    setText('');
    setShowQuickReplies(false);
    try {
      const res = await api.post<{ success: boolean; data: Message }>(`/messages/conversation/${active.id}/send`, { content: draft });
      if (res.success) setMessages(p => p.map(m => m.id === optimistic.id ? res.data : m));
    } catch {
      setMessages(p => p.filter(m => m.id !== optimistic.id));
      if (!override) setText(draft);
    }
    setSending(false);
  };

  const filtered = convos.filter(c => !search || otherName(c, user?.id).toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="h-[600px] bg-cardBg border border-borderBg rounded-3xl flex items-center justify-center">
      <LoadingLogo label="Loading messages..." />
    </div>
  );

  const grouped = groupByDay(messages);

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[520px] bg-cardBg border border-borderBg rounded-3xl overflow-hidden fade-in shadow-xl">
      {/* ── Sidebar ── */}
      <div className={`${active && !showSidebar ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 flex-shrink-0 border-r border-borderBg flex-col`}>
        <div className="px-4 py-4 border-b border-borderBg space-y-3">
          <h2 className="font-black text-base text-white">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
              className="w-full bg-background border border-borderBg rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-brand transition" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <MessageSquare className="w-10 h-10 text-gray-700 mx-auto" />
              <p className="text-sm font-semibold text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-600">Message a seller from any listing page</p>
            </div>
          ) : filtered.map(c => {
            const isActive = active?.id === c.id;
            const name = otherName(c, user?.id);
            const preview = c.lastMessage?.content || 'No messages yet';
            const unread = c.unreadCount || 0;
            return (
              <button key={c.id} onClick={() => { setActive(c); setShowSidebar(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition border-b border-borderBg/40 ${isActive ? 'bg-brand/10 border-l-2 border-l-brand' : 'hover:bg-hoverBg/30'}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/30 to-purple-600/30 border border-brand/20 flex items-center justify-center">
                    <span className="text-sm font-black text-brand-light">{name[0]?.toUpperCase() || '?'}</span>
                  </div>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-bold truncate ${unread > 0 ? 'text-white' : 'text-gray-300'}`}>{name}</p>
                    <span className="text-[10px] text-gray-600 ml-1 flex-shrink-0">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-gray-300' : 'text-gray-500'}`}>{preview}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className={`${showSidebar && !active ? 'hidden sm:flex' : 'flex'} flex-1 flex-col min-w-0`}>
        {active ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-borderBg bg-cardBg/80 backdrop-blur-sm">
              <button onClick={() => setShowSidebar(true)} className="sm:hidden p-1.5 text-gray-400 hover:text-white rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand/30 to-purple-600/30 border border-brand/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-brand-light">{otherName(active, user?.id)[0]?.toUpperCase() || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white">{otherName(active, user?.id)}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-emerald-400" /> Online
                </p>
              </div>
              {active.orderId && (
                <Link href={`/orders/${active.orderId}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-light transition bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-lg">
                  <Package className="w-3.5 h-3.5" /> View Order
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {grouped.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No messages yet — say hello! 👋</div>
              )}
              {grouped.map(({ day, msgs }) => (
                <div key={day}>
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-borderBg/60" />
                    <span className="text-[10px] text-gray-600 font-semibold px-2">{day}</span>
                    <div className="flex-1 h-px bg-borderBg/60" />
                  </div>
                  <div className="space-y-2">
                    {msgs.map(m => {
                      const mine = m.senderId === user?.id;
                      const isPending = m.id.startsWith('temp-');
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                          {!mine && (
                            <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 mb-1">
                              <User className="w-3.5 h-3.5 text-brand-light" />
                            </div>
                          )}
                          <div className={`max-w-[72%] md:max-w-sm group`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${mine ? 'bg-brand text-white rounded-br-sm' : 'bg-hoverBg border border-borderBg/60 rounded-bl-sm'}`}>
                              <p className="leading-relaxed break-words">{m.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 ${mine ? 'justify-end' : ''}`}>
                              <span className="text-[9px] text-gray-600">{fmtTime(m.createdAt)}</span>
                              {mine && (
                                isPending
                                  ? <Clock className="w-2.5 h-2.5 text-gray-600" />
                                  : m.isRead
                                    ? <CheckCheck className="w-2.5 h-2.5 text-brand-light" />
                                    : <Check className="w-2.5 h-2.5 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {showQuickReplies && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {QUICK_REPLIES.map(qr => (
                  <button key={qr} onClick={e => { setText(qr); setShowQuickReplies(false); inputRef.current?.focus(); }}
                    className="text-xs bg-background border border-borderBg hover:border-brand/40 text-gray-300 hover:text-white px-3 py-1.5 rounded-full transition">
                    {qr.length > 40 ? qr.slice(0, 38) + '…' : qr}
                  </button>
                ))}
                <button onClick={() => setShowQuickReplies(false)} className="text-xs text-gray-500 hover:text-white p-1"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Input bar */}
            <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-borderBg bg-cardBg/80 backdrop-blur-sm">
              <button type="button" onClick={() => setShowQuickReplies(v => !v)}
                title="Quick replies" className="p-2 text-gray-500 hover:text-brand transition rounded-lg hover:bg-brand/10 flex-shrink-0">
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..."
                className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition" />
              <button type="submit" disabled={!text.trim() || sending}
                className="w-10 h-10 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center transition disabled:opacity-40 flex-shrink-0 shadow-lg shadow-brand/20">
                {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-brand/40" />
            </div>
            <p className="font-bold text-white">Select a conversation</p>
            <p className="text-xs text-gray-500">Or start a chat from a listing page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-[600px] bg-cardBg border border-borderBg rounded-3xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
