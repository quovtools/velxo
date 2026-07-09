'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Send, User, MessageSquare, Search, Loader2, ArrowLeft, Circle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  unreadCount?: number;
  buyer?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  sellerStoreName?: string | null;
  lastMessage?: { id: string; content: string; senderId: string; createdAt: string } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

function otherPartyName(c: Conversation, userId?: string): string {
  const isMeBuyer = c.buyerId === userId;
  if (isMeBuyer) return c.sellerStoreName || 'Seller';
  return [c.buyer?.firstName, c.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer';
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyerIdParam = searchParams.get('buyerId');
  const sellerIdParam = searchParams.get('sellerId');
  const targetUserId = searchParams.get('userId');
  const { user, loading: authLoading } = useAuth();

  const [convos, setConvos] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConvos = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Conversation[] }>('/messages');
      if (res.success) {
        const list = res.data || [];
        setConvos(list);
        return list as Conversation[];
      }
    } catch {
      /* silent */
    }
    return [];
  };

  const fetchMessages = async (conversationId: string, markRead = false) => {
    try {
      const res = await api.get<{ success: boolean; data: Message[] }>(`/messages/conversation/${conversationId}`);
      if (res.success) setMessages(res.data || []);
      if (markRead) {
        api.patch(`/messages/conversation/${conversationId}/mark-read`).catch(() => {});
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }

    (async () => {
      const list = await fetchConvos();
      let target: Conversation | undefined;
      if (buyerIdParam && sellerIdParam) {
        target = list.find((c) => c.buyerId === buyerIdParam && c.sellerId === sellerIdParam);
        if (!target) {
          try {
            const created = await api.post<{ success: boolean; data: Conversation }>('/messages/conversation', {
              buyerId: buyerIdParam,
              sellerId: sellerIdParam,
            });
            if (created.success) {
              target = created.data;
              setConvos((p) => [created.data, ...p]);
            }
          } catch { /* no thread */ }
        }
      } else if (targetUserId) {
        target = list.find((c) => c.buyerId === targetUserId || c.sellerId === targetUserId);
        if (!target) {
          try {
            const created = await api.post<{ success: boolean; data: Conversation }>('/messages/conversation', {
              recipientId: targetUserId,
            });
            if (created.success) {
              target = created.data;
              setConvos((p) => [created.data, ...p]);
            }
          } catch { /* no thread */ }
        }
      } else if (list.length > 0) {
        target = list[0];
      }

      if (target) {
        setActive(target);
        setShowSidebar(false);
        fetchMessages(target.id, true);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, targetUserId, buyerIdParam, sellerIdParam, router]);

  // Real-time: poll the conversation list + active thread, and (best effort)
  // subscribe to the WebSocket gateway for instant delivery.
  useEffect(() => {
    if (!user) return;
    const listTimer = setInterval(fetchConvos, 12000);
    let msgTimer: ReturnType<typeof setInterval> | null = null;

    try {
      const socketUrl = API_BASE.replace(/\/api\/v1$/, '');
      const socket = io(`${socketUrl}/messages`, { transports: ['websocket', 'polling'], reconnection: true });
      socketRef.current = socket;
      socket.on('newMessage', (msg: Message) => {
        if (active && msg && (msg as any).conversationId === active.id) {
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
        fetchConvos();
      });
    } catch {
      /* socket unavailable — polling covers delivery */
    }

    return () => {
      clearInterval(listTimer);
      if (msgTimer) clearInterval(msgTimer);
      socketRef.current?.disconnect();
    };
  }, [user, active]);

  useEffect(() => {
    if (!active) return;
    fetchMessages(active.id, true);
    const msgTimer = setInterval(() => fetchMessages(active.id), 4000);
    try {
      socketRef.current?.emit('join', active.id);
    } catch { /* no-op */ }
    return () => clearInterval(msgTimer);
  }, [active]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active || sending) return;
    setSending(true);
    const optimistic: Message = { id: Date.now().toString(), content: text, senderId: user!.id, createdAt: new Date().toISOString(), isRead: false };
    setMessages((p) => [...p, optimistic]);
    const draft = text;
    setText('');
    try {
      const res = await api.post<{ success: boolean; data: Message }>(
        `/messages/conversation/${active.id}/send`, { content: draft },
      );
      if (res.success) {
        setMessages((p) => p.map((m) => (m.id === optimistic.id ? res.data : m)));
      }
    } catch {
      setMessages((p) => p.filter((m) => m.id !== optimistic.id));
      setText(draft);
    }
    setSending(false);
  };

  const filtered = convos.filter((c) => {
    if (!search) return true;
    return otherPartyName(c, user?.id).toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div className="h-[600px] bg-cardBg border border-borderBg rounded-2xl flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand animate-spin" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] bg-cardBg border border-borderBg rounded-2xl overflow-hidden fade-in">

      {/* Sidebar */}
      <div className={`${active && !showSidebar ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 flex-shrink-0 border-r border-borderBg flex-col`}>
        <div className="px-4 py-4 border-b border-borderBg">
          <h2 className="font-bold text-base mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..."
              className="w-full bg-background border border-borderBg rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-brand transition" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <MessageSquare className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-600">Message a seller from any listing page</p>
            </div>
          ) : filtered.map((c) => {
            const isActive = active?.id === c.id;
            const name = otherPartyName(c, user?.id);
            const initial = name[0]?.toUpperCase() || '?';
            const preview = c.lastMessage?.content || 'No messages yet';
            return (
              <button key={c.id} onClick={() => { setActive(c); setShowSidebar(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-b border-borderBg/50 ${
                  isActive ? 'bg-brand/10 border-l-2 border-l-brand' : 'hover:bg-hoverBg/40'
                }`}>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-light">{initial}</span>
                  </div>
                  {c.unreadCount ? (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {c.unreadCount > 9 ? '9+' : c.unreadCount}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold truncate">{name}</p>
                    <span className="text-[10px] text-gray-500 ml-1 flex-shrink-0">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{preview}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`${showSidebar && !active ? 'hidden sm:flex' : 'flex'} flex-1 flex-col min-w-0`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-borderBg">
              <button onClick={() => setShowSidebar(true)} className="sm:hidden p-1.5 text-gray-400 hover:text-white rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                <span className="text-sm font-bold text-brand-light">{otherPartyName(active, user?.id)[0]?.toUpperCase() || '?'}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{otherPartyName(active, user?.id)}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-emerald-400" /> Active
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No messages yet — say hi!</div>
              )}
              {messages.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && (
                      <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-brand-light" />
                      </div>
                    )}
                    <div className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      mine ? 'bg-brand text-white rounded-tr-sm' : 'bg-hoverBg border border-borderBg rounded-tl-sm'
                    }`}>
                      <p className="leading-relaxed break-words">{m.content}</p>
                      <p className={`text-[9px] mt-1 ${mine ? 'text-blue-200 text-right' : 'text-gray-500'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="flex items-center gap-2 px-4 py-3.5 border-t border-borderBg">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..."
                className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition" />
              <button type="submit" disabled={!text.trim() || sending}
                className="w-10 h-10 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center transition disabled:opacity-40 flex-shrink-0">
                {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-brand/40" />
            </div>
            <p className="font-semibold">Select a conversation</p>
            <p className="text-xs text-gray-500">Or start a chat from a listing page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-[600px] bg-cardBg border border-borderBg rounded-2xl flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
