'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquareMore, RefreshCw, Send, CheckCheck, Circle, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, ErrorBanner, formatDate } from '@/components/admin/ui';

type ChatStatus = 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';

interface ChatMessage { id: string; senderType: string; content: string; isRead: boolean; createdAt: string; }
interface LiveChat {
  id: string; visitorId: string; visitorName?: string; visitorEmail?: string;
  subject?: string; status: ChatStatus; createdAt: string; updatedAt: string;
  messages?: ChatMessage[]; _count?: { messages: number };
}

const STATUS_COLORS: Record<ChatStatus, string> = {
  OPEN:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  ASSIGNED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  RESOLVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CLOSED:   'bg-gray-500/15 text-gray-400 border-gray-500/30',
};
const STATUSES: ChatStatus[] = ['OPEN', 'ASSIGNED', 'RESOLVED', 'CLOSED'];

export default function AdminLiveChatPage() {
  const [chats,     setChats]     = useState<LiveChat[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState('');
  const [selected,  setSelected]  = useState<LiveChat | null>(null);
  const [thread,    setThread]    = useState<ChatMessage[]>([]);
  const [reply,     setReply]     = useState('');
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ── fetch chat list ── */
  const fetchChats = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string | number> = { limit: 60 };
        if (filter) params.status = filter;
        const res: any = await api.get('/live-chat/admin/chats', { params });
      setChats(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  /* ── auto-refresh every 8 s ── */
  useEffect(() => {
    const id = setInterval(fetchChats, 8000);
    return () => clearInterval(id);
  }, [fetchChats]);

  /* ── fetch thread when a chat is selected ── */
  const fetchThread = useCallback(async (chatId: string) => {
    try {
      const res: any = await api.get(`/live-chat/admin/chats/${chatId}`);
      setThread(res.data?.messages || []);
      setSelected(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => fetchThread(selected.id), 5000);
    return () => clearInterval(id);
  }, [selected, fetchThread]);

  /* ── auto-scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const openChat = (chat: LiveChat) => {
    setSelected(chat);
    setThread([]);
    fetchThread(chat.id);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/live-chat/admin/chats/${selected.id}/reply`, { content: reply.trim() });
      setReply('');
      await fetchThread(selected.id);
      fetchChats();
    } catch (e: any) {
      setError(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (chatId: string, status: ChatStatus) => {
    try {
      await api.patch(`/live-chat/admin/chats/${chatId}/status`, { status });
      fetchChats();
      if (selected?.id === chatId) setSelected(s => s ? { ...s, status } : s);
    } catch (e: any) {
      setError(e.message || 'Status update failed');
    }
  };

  const unreadCount = chats.filter(c => c.status === 'OPEN' || c.status === 'ASSIGNED').length;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MessageSquareMore className="w-5 h-5 text-emerald-400" /> Live Chat Inbox
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Reply to visitor messages in real time.</p>
        </div>
        <button onClick={fetchChats} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Status filters */}
      <div className="flex gap-2 flex-shrink-0 flex-wrap">
        <button onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${!filter ? 'bg-violet-600/20 border-violet-500/40 text-white' : 'bg-[#111118] border-white/8 text-gray-400 hover:text-white'}`}>
          All ({chats.length})
        </button>
        {STATUSES.map(s => {
          const n = chats.filter(c => c.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s === filter ? '' : s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${filter === s ? 'bg-violet-600/20 border-violet-500/40 text-white' : 'bg-[#111118] border-white/8 text-gray-400 hover:text-white'}`}>
              {s} ({n})
            </button>
          );
        })}
      </div>

      {/* Chat split pane */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: chat list */}
        <div className="w-72 flex-shrink-0 bg-[#111118] border border-white/8 rounded-2xl overflow-y-auto flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Loading…</div>
          ) : chats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 text-sm gap-2 p-6 text-center">
              <MessageSquareMore className="w-10 h-10 opacity-30" />
              <p>No chats yet</p>
            </div>
          ) : (
            chats.map(chat => {
              const lastMsg = chat.messages?.[0];
              const isActive = selected?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`w-full text-left p-4 border-b border-white/5 transition hover:bg-white/5 ${isActive ? 'bg-violet-600/10 border-l-2 border-l-violet-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-white text-sm truncate">
                      {chat.visitorName || chat.visitorEmail || `Visitor #${chat.id.slice(-6)}`}
                    </p>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[chat.status]}`}>
                      {chat.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.subject || 'General enquiry'}</p>
                  {lastMsg && (
                    <p className="text-[11px] text-gray-600 truncate mt-1">
                      {lastMsg.senderType === 'admin' ? '↩ You: ' : ''}{lastMsg.content}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-700 mt-1">{formatDate(chat.updatedAt)}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Right: chat thread */}
        <div className="flex-1 bg-[#111118] border border-white/8 rounded-2xl flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
              <MessageSquareMore className="w-14 h-14 opacity-20" />
              <p className="text-sm">Select a chat to view the conversation</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 flex-shrink-0">
                <div>
                  <p className="font-bold text-white">
                    {selected.visitorName || selected.visitorEmail || `Visitor #${selected.id.slice(-6)}`}
                  </p>
                  <p className="text-xs text-gray-500">{selected.subject || 'General enquiry'} · {selected.visitorEmail || 'anonymous'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selected.status}
                    onChange={e => updateStatus(selected.id, e.target.value as ChatStatus)}
                    className="bg-[#0a0a0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {thread.length === 0 ? (
                  <p className="text-center text-gray-600 text-sm py-10">No messages yet. Waiting for visitor to write.</p>
                ) : (
                  thread.map(msg => {
                    const isAdmin = msg.senderType === 'admin';
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isAdmin
                            ? 'bg-violet-600/30 border border-violet-500/30 text-white rounded-br-md'
                            : 'bg-white/8 border border-white/10 text-gray-200 rounded-bl-md'
                        }`}>
                          <p className="leading-relaxed">{msg.content}</p>
                          <div className={`flex items-center gap-1.5 mt-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-gray-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isAdmin && <CheckCheck className={`w-3 h-3 ${msg.isRead ? 'text-violet-400' : 'text-gray-600'}`} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              {selected.status !== 'CLOSED' && (
                <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Type a reply… (Enter to send)"
                      className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? '…' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
              {selected.status === 'CLOSED' && (
                <div className="px-5 py-3 border-t border-white/8 text-center text-xs text-gray-600">
                  This chat is closed. Change status to reply.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
