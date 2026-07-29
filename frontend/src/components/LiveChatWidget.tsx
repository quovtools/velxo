'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, ChevronDown, ShieldCheck } from 'lucide-react';

/* Pages where the chat widget is allowed to appear */
const ALLOWED_PATHS = ['/', '/profile', '/support'];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';


/* ── Generate / retrieve a stable visitor ID ─────────────────────────── */
function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('vlx_visitor_id');
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('vlx_visitor_id', id);
  }
  return id;
}

interface ChatMsg { id: string; senderType: string; content: string; createdAt: string; }

type Step = 'idle' | 'intro' | 'chat';

export default function LiveChatWidget({ showAlways }: { showAlways?: boolean }) {
  const [step,       setStep]       = useState<Step>('idle');
  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [input,      setInput]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [starting,   setStarting]   = useState(false);
  const [chatStatus, setChatStatus] = useState<string>('OPEN');
  const [unread,     setUnread]     = useState(0);
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [lastPoll,   setLastPoll]   = useState<string | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const visitorId  = useRef(getVisitorId());

  // Only show by default on these frontend paths
  const pathname = usePathname?.() ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  const allowedDefault = ['/profile', '/support'];
  const allowed = showAlways || allowedDefault.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!allowed) return null;


  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Focus input when opening ── */
  useEffect(() => {
    if (step === 'chat') setTimeout(() => inputRef.current?.focus(), 120);
  }, [step]);

  /* ── Polling for new messages every 4 s while chat is open ── */
  const poll = useCallback(async () => {
    try {
      const url = `${API_BASE}/live-chat/poll?visitorId=${encodeURIComponent(visitorId.current)}${lastPoll ? `&since=${encodeURIComponent(lastPoll)}` : ''}`;
      const res  = await fetch(url);
      if (!res.ok) return;
      const d = await res.json();
      const newMsgs: ChatMsg[] = d.data?.messages ?? [];
      if (newMsgs.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          const fresh = newMsgs.filter(m => !ids.has(m.id));
          if (!fresh.length) return prev;
          setLastPoll(fresh[fresh.length - 1].createdAt);
          // Count unread admin replies when widget is minimised
          if (step !== 'chat') {
            setUnread(u => u + fresh.filter(m => m.senderType === 'admin').length);
          }
          return [...prev, ...fresh];
        });
      }
      setChatStatus(d.data?.chatStatus ?? 'OPEN');
    } catch { /* ignore */ }
  }, [lastPoll, step]);

  useEffect(() => {
    if (step !== 'chat') return;
    const id = setInterval(poll, 4_000);
    return () => clearInterval(id);
  }, [step, poll]);

  /* ── Start / open chat ── */
  const handleOpen = () => {
    setUnread(0);
    setStep(s => s === 'idle' ? 'intro' : s === 'intro' ? 'idle' : 'chat');
  };

  const startChat = async () => {
    setStarting(true);
    try {
      const res = await fetch(`${API_BASE}/live-chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: visitorId.current,
          visitorName:  name.trim()  || undefined,
          visitorEmail: email.trim() || undefined,
          subject: 'General enquiry',
        }),
      });
      const d = await res.json();
      const existingMsgs: ChatMsg[] = d.data?.messages ?? [];
      setMessages(existingMsgs);
      if (existingMsgs.length) setLastPoll(existingMsgs[existingMsgs.length - 1].createdAt);
      setStep('chat');
    } catch { /* still open chat — backend may be starting */ setStep('chat'); }
    finally { setStarting(false); }
  };

  /* ── Send a message ── */
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    // Optimistic
    const optimistic: ChatMsg = { id: `opt_${Date.now()}`, senderType: 'visitor', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    try {
      await fetch(`${API_BASE}/live-chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: visitorId.current, content: text }),
      });
    } catch { /* keep optimistic msg */ }
    finally { setSending(false); }
  };

  /* ── Dismiss / minimise ── */
  const closeWidget = () => { setStep('idle'); setUnread(0); };

  /* ────────────────────────────────────────────────── RENDER ─────── */
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col items-end gap-3 pointer-events-none">

      {/* ── Chat window ── */}
      {step !== 'idle' && (
        <div
          className="pointer-events-auto w-[340px] sm:w-[360px] bg-[#111118] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100dvh - 100px)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-700 to-brand px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Velxo Support</p>
                <p className="text-[11px] text-white/70 leading-none mt-0.5">
                  {chatStatus === 'ASSIGNED' ? '● Admin online' : '● Typically replies within 1 hr'}
                </p>
              </div>
            </div>
            <button onClick={closeWidget} className="text-white/70 hover:text-white transition p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Intro / name-email form ── */}
          {step === 'intro' && (
            <div className="flex-1 flex flex-col p-5 space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Hi there 👋 Welcome to <span className="text-white font-semibold">Velxo Support</span>. Leave your name and email so we can follow up, then type your message.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition"
                />
              </div>
              <button
                onClick={startChat}
                disabled={starting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-brand hover:from-violet-700 hover:to-brand-dark text-white text-sm font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-lg shadow-violet-500/20 mt-auto"
              >
                {starting ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</> : 'Start Chat →'}
              </button>
              <p className="text-[10px] text-gray-600 text-center">
                By chatting you agree to our{' '}
                <a href="/terms" target="_blank" rel="noreferrer" className="text-brand hover:underline">Terms</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noreferrer" className="text-brand hover:underline">Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* ── Chat thread ── */}
          {step === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {/* Welcome bubble */}
                {messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm text-gray-200 leading-relaxed">
                        Hi! How can we help you today? 😊
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">Velxo Support</p>
                    </div>
                  </div>
                )}
                {messages.map(msg => {
                  const isVisitor = msg.senderType === 'visitor';
                  return (
                    <div key={msg.id} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isVisitor
                          ? 'bg-gradient-to-br from-violet-600/40 to-brand/30 border border-violet-500/30 text-white rounded-br-md'
                          : 'bg-white/8 border border-white/10 text-gray-200 rounded-bl-md'
                      }`}>
                        <p className="leading-relaxed break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isVisitor ? 'text-white/50 text-right' : 'text-gray-600'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {!isVisitor && <span className="ml-1">· Velxo Support</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {chatStatus === 'RESOLVED' && (
                  <div className="text-center py-2">
                    <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
                      Chat resolved — thanks for reaching out!
                    </span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-white/8 flex gap-2 flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                  placeholder="Type a message…"
                  className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition disabled:opacity-40"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating trigger button ── */}
      <button
        onClick={handleOpen}
        className="pointer-events-auto relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-brand shadow-2xl shadow-violet-500/40 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200"
        aria-label="Open live chat"
      >
        {step !== 'idle'
          ? <ChevronDown className="w-6 h-6" />
          : <MessageCircle className="w-6 h-6" />
        }
        {/* Unread badge */}
        {unread > 0 && step === 'idle' && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-red-500/50 animate-bounce">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {/* Pulse ring */}
        {step === 'idle' && (
          <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
        )}
      </button>
    </div>
  );
}
