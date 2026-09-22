'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Sparkles, Send, Square, Plus, Trash2, MessageSquare, Wrench,
  Check, X, AlertTriangle, RefreshCw, ShieldAlert, Loader2, ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/admin/ui';
import { MarkdownLite } from '@/components/admin/markdown-lite';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolEvent {
  id: string;
  name: string;
  state: 'running' | 'done' | 'failed';
  summary?: string;
}

interface PendingCard {
  actionId: string;
  toolName: string;
  summary: string;
  args: any;
  resolution?: 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  resultSummary?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolEvent[];
  pending?: PendingCard[];
  usage?: { promptTokens: number; completionTokens: number };
  model?: string;
  streaming?: boolean;
  error?: boolean;
}

interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

let localIdCounter = 0;
const localId = () => `local-${++localIdCounter}`;

const SUGGESTIONS = [
  'How did sales perform this week compared to last week?',
  'Which games have the highest buyer demand right now?',
  'Flag any suspicious seller or listing activity in the last 24 hours',
  "What's the refund and dispute rate this month, and what's driving it?",
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminAiPage() {
  const [status, setStatus]         = useState<{ enabled: boolean; primaryModel?: string; toolCount?: number } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [conversations, setConversations]       = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId]     = useState<string | null>(null);
  const [messages, setMessages]                 = useState<ChatMessage[]>([]);
  const [input, setInput]                       = useState('');
  const [streaming, setStreaming]               = useState(false);
  const [error, setError]                       = useState('');
  const [confirmingId, setConfirmingId]         = useState<string | null>(null);
  const [convOpen, setConvOpen]                 = useState(false);

  const abortRef      = useRef<AbortController | null>(null);
  const scrollRef     = useRef<HTMLDivElement | null>(null);
  const assistantIdRef = useRef<string | null>(null);

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    try {
      const res: any = await api.get('/ai/admin/status');
      const data = res?.data ?? res;
      setStatus({ enabled: Boolean(data?.aiEnabled), primaryModel: data?.primaryModel, toolCount: data?.toolCount });
    } catch {
      setStatus({ enabled: false });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res: any = await api.get('/ai/admin/conversations');
      const data = res?.data ?? res;
      setConversations(Array.isArray(data) ? data : []);
    } catch { /* sidebar is non-critical */ }
  }, []);

  useEffect(() => {
    loadStatus();
    loadConversations();
  }, [loadStatus, loadConversations]);

  // ─── History ───────────────────────────────────────────────────────────────

  const openConversation = useCallback(async (id: string) => {
    if (streaming) return;
    setError('');
    setConversationId(id);
    setConvOpen(false);
    setMessages([]);
    try {
      const res: any = await api.get(`/ai/admin/conversations/${id}`);
      const conv = res?.data ?? res;
      const mapped: ChatMessage[] = [];
      for (const row of conv?.messages ?? []) {
        if (row.role === 'user') {
          mapped.push({ id: row.id, role: 'user', content: row.content });
        } else if (row.role === 'assistant') {
          const msg: ChatMessage = { id: row.id, role: 'assistant', content: row.content || '', model: row.model };
          const calls = Array.isArray(row.toolCalls) ? row.toolCalls : [];
          if (calls.length) {
            msg.tools = calls.map((c: any) => ({
              id: c?.id ?? localId(),
              name: c?.function?.name ?? 'tool',
              state: 'done',
            }));
          }
          mapped.push(msg);
        } else if (row.role === 'tool' && mapped.length) {
          // Attach tool results to the nearest assistant message
          const target = [...mapped].reverse().find((m) => m.role === 'assistant');
          if (target) {
            let parsed: any = null;
            try { parsed = JSON.parse(row.content); } catch { parsed = null; }
            const chip: ToolEvent = {
              id: row.id,
              name: row.toolName ?? 'tool',
              state: parsed?.ok === false ? 'failed' : 'done',
              summary: parsed?.status === 'awaiting_confirmation'
                ? 'Awaiting confirmation'
                : parsed?.summary ?? '',
            };
            target.tools = [...(target.tools ?? []), chip];
          }
        }
      }
      // Live pending actions → render as confirmation cards
      const pending: PendingCard[] = (conv?.pendingActions ?? []).map((a: any) => ({
        actionId: a.actionId,
        toolName: a.toolName,
        summary: a.summary,
        args: a.args,
      }));
      if (pending.length) {
        const last = mapped[mapped.length - 1];
        if (last?.role === 'assistant') last.pending = pending;
        else mapped.push({ id: localId(), role: 'assistant', content: '', pending });
      }
      setMessages(mapped);
    } catch (err: any) {
      setError(err?.message || 'Could not load this conversation.');
    }
  }, [streaming]);

  const startNewChat = () => {
    if (streaming) return;
    setConversationId(null);
    setMessages([]);
    setError('');
    setConvOpen(false);
  };

  const deleteConversation = async (id: string) => {
    if (!window.confirm('Delete this conversation permanently?')) return;
    try {
      await api.delete(`/ai/admin/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) startNewChat();
    } catch (err: any) {
      setError(err?.message || 'Could not delete the conversation.');
    }
  };

  // ─── Streaming ─────────────────────────────────────────────────────────────

  const updateAssistant = (fn: (msg: ChatMessage) => ChatMessage) => {
    const id = assistantIdRef.current;
    if (!id) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  };

  const runStream = useCallback(async (body: { conversationId?: string; message?: string; resume?: boolean }) => {
    setError('');
    setStreaming(true);

    assistantIdRef.current = localId();
    const assistantMsg: ChatMessage = { id: assistantIdRef.current, role: 'assistant', content: '', streaming: true };
    setMessages((prev) => [...prev, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    let receivedConversation = false;
    try {
      const password = typeof window !== 'undefined' ? sessionStorage.getItem('piyrox_admin_password') : null;
      const res = await fetch(`${API_BASE_URL}/ai/admin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(password ? { 'x-admin-password': password } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        let message = 'The assistant is unavailable right now.';
        try {
          message = JSON.parse(text)?.message ?? message;
        } catch { /* non-JSON body */ }
        throw new Error(message);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      const handleEvent = (event: any) => {
        switch (event?.event) {
          case 'delta':
            updateAssistant((m) => ({ ...m, content: m.content + (event.content ?? '') }));
            break;
          case 'tool_call':
            updateAssistant((m) => ({
              ...m,
              tools: [...(m.tools ?? []), { id: event.id, name: event.name, state: 'running' }],
            }));
            break;
          case 'tool_result':
            updateAssistant((m) => ({
              ...m,
              tools: (m.tools ?? []).map((t) =>
                t.id === event.id || t.name === event.name
                  ? { ...t, state: event.ok === false ? 'failed' : 'done', summary: event.summary }
                  : t,
              ),
            }));
            break;
          case 'confirmation_required':
            updateAssistant((m) => ({
              ...m,
              pending: [...(m.pending ?? []), ...(event.actions ?? [])],
            }));
            break;
          case 'usage':
            updateAssistant((m) => ({
              ...m,
              usage: { promptTokens: event.promptTokens ?? 0, completionTokens: event.completionTokens ?? 0 },
            }));
            break;
          case 'done':
            if (event.conversationId) {
              receivedConversation = true;
              setConversationId(event.conversationId);
            }
            if (event.message) updateAssistant((m) => ({ ...m, content: m.content + `\n\n*${event.message}*` }));
            break;
          case 'error':
            setError(event.message || 'The assistant hit an unexpected error.');
            break;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = buf.indexOf('\n\n')) !== -1) {
          const block = buf.slice(0, sep);
          buf = buf.slice(sep + 2);
          for (const line of block.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            try {
              handleEvent(JSON.parse(trimmed.slice(5).trim()));
            } catch { /* skip malformed frame */ }
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError(err?.message || 'Lost connection to the assistant.');
      }
    } finally {
      updateAssistant((m) => ({ ...m, streaming: false }));
      setStreaming(false);
      abortRef.current = null;
      if (receivedConversation || body.conversationId) loadConversations();
    }
  }, [loadConversations]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || streaming) return;
    setInput('');
    setMessages((prev) => [...prev, { id: localId(), role: 'user', content: message }]);
    await runStream({ conversationId: conversationId ?? undefined, message });
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  // ─── Confirmation gate ─────────────────────────────────────────────────────

  const resolveAction = async (actionId: string, decision: 'confirm' | 'cancel') => {
    if (streaming || confirmingId) return;
    setConfirmingId(actionId);
    setError('');
    try {
      const res: any = await api.post('/ai/admin/confirm', {
        actionId,
        decision,
        conversationId: conversationId ?? undefined,
      });
      const result = res?.data ?? res;

      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          pending: (m.pending ?? []).map((card) =>
            card.actionId === actionId
              ? {
                  ...card,
                  resolution: result?.ok === false || result?.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
                  resultSummary: result?.summary,
                }
              : card,
          ),
        })),
      );

      if (decision === 'confirm' && conversationId) {
        // Let the model summarise what actually happened
        await runStream({ conversationId, resume: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Could not process the confirmation.');
    } finally {
      setConfirmingId(null);
    }
  };

  // ─── Auto scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const disabled = statusLoading || status?.enabled === false;

  return (
    <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-140px)] min-h-[540px]">
      {/* Conversations sidebar */}
      <aside className={`${convOpen ? 'flex' : 'hidden'} xl:flex xl:w-64 flex-shrink-0 flex-col bg-[#111118] border border-white/8 rounded-2xl overflow-hidden`}>
        <div className="flex items-center gap-2 p-3 border-b border-white/6">
          <button onClick={startNewChat} disabled={streaming}
            className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[12px] font-semibold py-2 rounded-xl transition">
            <Plus className="w-3.5 h-3.5" /> New chat
          </button>
          <button onClick={() => setConvOpen(false)} className="xl:hidden p-2 text-gray-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/6">
          {conversations.length === 0 && (
            <p className="text-[11px] text-gray-600 px-2 py-4 text-center leading-relaxed">
              No conversations yet.<br />Ask your first question to get started.
            </p>
          )}
          {conversations.map((conv) => (
            <div key={conv.id}
              className={`group flex items-center gap-1 rounded-xl transition ${conversationId === conv.id ? 'bg-violet-600/15 border border-violet-500/25' : 'hover:bg-white/4 border border-transparent'}`}>
              <button onClick={() => openConversation(conv.id)}
                className="flex-1 flex items-center gap-2 px-2.5 py-2 text-left min-w-0">
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${conversationId === conv.id ? 'text-violet-400' : 'text-gray-600'}`} />
                <span className="truncate text-[12px] text-gray-300">{conv.title || 'Untitled'}</span>
              </button>
              <button onClick={() => deleteConversation(conv.id)}
                className="p-1.5 mr-1 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/6">
          <p className="text-[10px] text-gray-600 leading-relaxed">
            {status?.primaryModel
              ? `Model: ${status.primaryModel}`
              : 'Model: —'}
            {status?.toolCount ? ` · ${status.toolCount} tools` : ''}
          </p>
        </div>
      </aside>

      {/* Chat area */}
      <section className="flex-1 flex flex-col bg-[#111118] border border-white/8 rounded-2xl overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
          <button onClick={() => setConvOpen(true)} className="xl:hidden p-1.5 text-gray-500 hover:text-white transition rounded-lg">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl flex items-center justify-center ring-1 ring-violet-500/30 shadow-sm shadow-violet-500/25 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[14px] font-bold text-white leading-tight">Piyrox Copilot</h1>
            <p className="text-[11px] text-gray-600">Analytics, moderation & finance assistant — connected to live data</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {status?.enabled && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/8 border border-emerald-500/20 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            )}
            <button onClick={() => { loadStatus(); loadConversations(); }}
              className="p-1.5 text-gray-600 hover:text-white transition rounded-lg" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Disabled banner */}
        {statusLoading && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/2 border-b border-white/6 text-[12px] text-gray-500">
            <Spinner className="w-3.5 h-3.5" /> Checking AI configuration…
          </div>
        )}
        {!statusLoading && status?.enabled === false && (
          <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/6 border-b border-amber-500/20 text-[12px] text-amber-300/90">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">AI assistant is not configured</p>
              <p className="mt-0.5 text-amber-300/70">
                Set <code className="font-mono bg-amber-500/10 px-1 rounded">OPENROUTER_API_KEY</code> in the backend
                environment (Railway / backend .env), then restart the server. See <code className="font-mono bg-amber-500/10 px-1 rounded">backend/.env.example</code> for all AI variables.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 px-4 py-2.5 bg-red-500/6 border-b border-red-500/20 text-[12px] text-red-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-violet-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Ask anything about your marketplace</h2>
              <p className="text-[13px] text-gray-500 mt-1.5 max-w-md leading-relaxed">
                Revenue analysis, seller performance, fraud signals, demand trends — or give direct commands
                like <span className="text-gray-300">“refund order ABC123”</span> (sensitive actions always ask for confirmation).
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mt-6 w-full max-w-xl">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => !disabled && send(s)} disabled={disabled}
                    className="text-left text-[12px] text-gray-400 bg-[#0a0a0f] border border-white/8 hover:border-violet-500/40 hover:text-gray-200 rounded-xl px-3.5 py-3 transition disabled:opacity-40 disabled:hover:border-white/8 disabled:hover:text-gray-400">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[80%] bg-violet-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-[88%] space-y-2.5">
                  {/* Tool chips */}
                  {(msg.tools ?? []).map((tool) => (
                    <div key={tool.id} className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className={`flex items-center gap-1.5 border rounded-lg px-2 py-1 font-medium
                        ${tool.state === 'running' ? 'border-violet-500/30 bg-violet-500/8 text-violet-300'
                          : tool.state === 'failed' ? 'border-red-500/25 bg-red-500/6 text-red-400'
                          : 'border-emerald-500/25 bg-emerald-500/6 text-emerald-400'}`}>
                        {tool.state === 'running'
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Wrench className="w-3 h-3" />}
                        {tool.name}
                      </span>
                      {tool.summary && (
                        <span className="truncate text-gray-600" title={tool.summary}>{tool.summary}</span>
                      )}
                    </div>
                  ))}

                  {/* Content */}
                  {(msg.content || msg.streaming) && (
                    <div className="bg-[#0a0a0f] border border-white/8 rounded-2xl rounded-bl-md px-4 py-3">
                      {msg.content
                        ? <MarkdownLite content={msg.content} />
                        : <span className="flex items-center gap-1.5 text-[12px] text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:300ms]" />
                            thinking…
                          </span>}
                      {msg.streaming && msg.content && (
                        <span className="inline-block w-1.5 h-3.5 bg-violet-400/80 ml-0.5 animate-pulse rounded-sm" />
                      )}
                      {(msg.usage || msg.model) && !msg.streaming && (
                        <p className="mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-700">
                          {msg.model ?? ''}{msg.usage ? `${msg.model ? ' · ' : ''}${msg.usage.promptTokens + msg.usage.completionTokens} tokens` : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Confirmation cards */}
                  {(msg.pending ?? []).map((card) => {
                    const busy = confirmingId === card.actionId;
                    return (
                      <div key={card.actionId} className={`border rounded-2xl overflow-hidden
                        ${card.resolution === 'CONFIRMED' ? 'border-emerald-500/25 bg-emerald-500/4'
                          : card.resolution === 'CANCELLED' ? 'border-white/8 bg-white/2'
                          : 'border-amber-500/30 bg-amber-500/6'}`}>
                        <div className="flex items-start gap-2.5 px-4 py-3">
                          <ShieldAlert className={`w-4 h-4 mt-0.5 flex-shrink-0
                            ${card.resolution ? 'text-gray-600' : 'text-amber-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-bold ${card.resolution ? 'text-gray-500' : 'text-amber-300'}`}>
                              {card.resolution === 'CONFIRMED' ? 'Action executed'
                                : card.resolution === 'CANCELLED' ? 'Action cancelled'
                                : 'Confirmation required'}
                            </p>
                            <p className="mt-1 text-[12px] text-gray-300 leading-relaxed break-words">{card.summary}</p>
                            {card.resultSummary && (
                              <p className="mt-1 text-[11px] text-emerald-400/80 break-words">{card.resultSummary}</p>
                            )}
                          </div>
                        </div>
                        {!card.resolution && (
                          <div className="flex gap-2 px-4 pb-3">
                            <button onClick={() => resolveAction(card.actionId, 'confirm')} disabled={busy || streaming}
                              className="flex items-center gap-1.5 flex-1 justify-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[12px] font-semibold py-2 rounded-xl transition">
                              {busy ? <Spinner className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                              {busy ? 'Executing…' : 'Confirm & run'}
                            </button>
                            <button onClick={() => resolveAction(card.actionId, 'cancel')} disabled={busy || streaming}
                              className="flex items-center gap-1.5 flex-1 justify-center bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-gray-300 text-[12px] font-semibold py-2 rounded-xl transition">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-white/6 p-3">
          <form onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-end gap-2 bg-[#0a0a0f] border border-white/10 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/15 rounded-2xl px-3.5 py-2.5 transition">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              rows={1}
              maxLength={4000}
              disabled={disabled}
              placeholder={disabled ? 'AI assistant is offline — configure OPENROUTER_API_KEY' : 'Ask about revenue, sellers, fraud… (Shift+Enter for a new line)'}
              className="flex-1 bg-transparent text-[13px] text-white placeholder-gray-700 focus:outline-none resize-none max-h-32 disabled:cursor-not-allowed"
              style={{ height: 'auto' }}
            />
            {streaming ? (
              <button type="button" onClick={stop}
                className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 text-red-400 text-[12px] font-semibold px-3.5 py-2 rounded-xl hover:bg-red-500/25 transition">
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            ) : (
              <button type="submit" disabled={disabled || !input.trim()}
                className="flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-white w-9 h-9 rounded-xl transition flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
          <p className="mt-1.5 px-1 text-[10px] text-gray-700">
            Copilot can read all tables and run moderation actions. Money-moving or destructive actions always require your confirmation.
          </p>
        </div>
      </section>
    </div>
  );
}
