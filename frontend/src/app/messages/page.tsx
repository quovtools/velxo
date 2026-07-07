'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Send, User, MessageSquare, Search, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  messages?: Message[];
}

function timeAgo(date: string) {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)   return 'now';
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return new Date(date).toLocaleDateString();
}

function ChatContent() {
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const targetUserId    = searchParams.get('userId');
  const { user }        = useAuth();

  const [convos, setConvos]         = useState<Conversation[]>([]);
  const [active, setActive]         = useState<Conversation | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [text, setText]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [search, setSearch]         = useState('');
  const bottomRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }

    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: Conversation[] }>('/messages/conversations');
        const list = res.success ? (res.data || []) : [];
        setConvos(list);

        if (targetUserId) {
          const match = list.find(c => c.buyerId === targetUserId || c.sellerId === targetUserId);
          if (match) {
            setActive(match);
          } else {
            const created = await api.post<{ success: boolean; data: Conversation }>(
              '/messages/conversations', { recipientId: targetUserId }
            );
            if (created.success) {
              setConvos(prev => [created.data, ...prev]);
              setActive(created.data);
            }
          }
        } else if (list.length > 0) {
          setActive(list[0]);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, targetUserId, router]);

  useEffect(() => {
    if (!active) return;
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: Message[] }>(
          `/messages/conversations/${active.id}/messages`
        );
        if (res.success) setMessages(res.data || []);
      } catch { /* silent */ }
    })();
  }, [active]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active || sending) return;
    setSending(true);
    try {
      const res = await api.post<{ success: boolean; data: Message }>(
        `/messages/conversations/${active.id}/messages`, { content: text }
      );
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        setText('');
      }
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const filtered = convos.filter(c =>
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-[600px] bg-cardBg border border-borderBg rounded-2xl flex items-center justify-center fade-in">
      <Loader2 className="w-8 h-8 text-brand animate-spin" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] bg-cardBg border border-borderBg rounded-2xl overflow-hidden fade-in">

      {/* ── Sidebar ── */}
      <div className="w-72 flex-shrink-0 border-r border-borderBg flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-borderBg">
          <h2 className="font-bold text-sm mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-background border border-borderBg rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-brand transition" />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <MessageSquare className="w-8 h-8 text-gray-700 mx-auto" />
              <p className="text-xs text-gray-500">No conversations yet</p>
            </div>
          ) : filtered.map(c => {
            const isActive = active?.id === c.id;
            const otherRole = c.buyerId === (user as any)?.id ? 'Seller' : 'Buyer';
            return (
              <button key={c.id} onClick={() => setActive(c)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition border-b border-borderBg/50 ${
                  isActive ? 'bg-brand/10 border-l-2 border-l-brand' : 'hover:bg-hoverBg/40'
                }`}>
                <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-brand-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {otherRole} #{c.id.slice(-4).toUpperCase()}
                    </p>
                    <span className="text-[9px] text-gray-600 flex-shrink-0 ml-1">
                      {timeAgo(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">Room #{c.id.slice(-6).toUpperCase()}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {active ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-borderBg bg-cardBg">
              <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                <User className="w-4 h-4 text-brand-light" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {active.buyerId === (user as any)?.id ? 'Seller' : 'Buyer'} #{active.id.slice(-4).toUpperCase()}
                </p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Encrypted line
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages.map(m => {
                const isMine = m.senderId === (user as any)?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMine
                        ? 'bg-brand text-white rounded-tr-none'
                        : 'bg-hoverBg border border-borderBg text-gray-200 rounded-tl-none'
                    }`}>
                      <p className="leading-relaxed">{m.content}</p>
                      <p className={`text-[9px] mt-1 ${isMine ? 'text-blue-200 text-right' : 'text-gray-500'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="flex items-center gap-3 px-5 py-4 border-t border-borderBg">
              <input value={text} onChange={e => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition" />
              <button type="submit" disabled={!text.trim() || sending}
                className="w-10 h-10 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center transition disabled:opacity-40 flex-shrink-0 shadow-lg shadow-brand/20">
                {sending
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-brand/40" />
            </div>
            <p className="font-semibold text-gray-300">Select a conversation</p>
            <p className="text-xs text-gray-500">Choose from the list or start a chat from a listing page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-[600px] bg-cardBg border border-borderBg rounded-2xl flex items-center justify-center fade-in">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
