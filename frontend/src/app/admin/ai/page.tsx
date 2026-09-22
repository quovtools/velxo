'use client';

import React, {
  useCallback, useEffect, useRef, useState, useTransition,
} from 'react';
import Link from 'next/link';
import {
  Sparkles, Send, Square, Plus, Trash2, MessageSquare,
  Wrench, Check, X, AlertTriangle, Loader2, ChevronLeft,
  ChevronRight, ShieldAlert, RefreshCw, Database, BarChart3,
  Terminal, Copy, CheckCheck, ArrowLeft, Menu,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MarkdownLite } from '@/components/admin/markdown-lite';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const PASSWORD_KEY = 'piyrox_admin_password';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface SqlResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  capped: boolean;
  executedSql?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolEvent[];
  sqlResults?: SqlResult[];
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

let _uid = 0;
const uid = () => `m-${++_uid}-${Date.now()}`;

const SUGGESTIONS = [
  'What are the platform KPIs right now?',
  'Show revenue for the past 7 days vs the 7 before that.',
  'Any fraud signals or suspicious users in the last 48 hours?',
  'What games have the highest buyer demand but low supply?',
  'List the 5 oldest pending moderation items.',
  'How many open disputes are over $50?',
];

// ─── Tool icon helper ─────────────────────────────────────────────────────────
function toolIcon(name: string) {
  if (name.includes('sql'))      return <Database className="w-3 h-3" />;
  if (name.includes('revenue') || name.includes('analytics')) return <BarChart3 className="w-3 h-3" />;
  return <Terminal className="w-3 h-3" />;
}

// ─── SQL result table ─────────────────────────────────────────────────────────
function SqlTable({ result }: { result: SqlResult }) {
  const [expanded, setExpanded] = useState(false);
  const preview = expanded ? result.rows : result.rows.slice(0, 6);

  return (
    <div className="mt-2 rounded-xl border border-white/8 overflow-hidden text-[11px]">
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border-b border-white/6">
        <div className="flex items-center gap-2 text-gray-400">
          <Database className="w-3 h-3 text-violet-400" />
          <span className="font-semibold">{result.rowCount} row{result.rowCount !== 1 ? 's' : ''}</span>
          {result.capped && <span className="text-amber-400/80">(capped)</span>}
        </div>
        {result.executedSql && (
          <span className="text-gray-600 font-mono truncate max-w-[260px]" title={result.executedSql}>
            {result.executedSql.slice(0, 60)}{result.executedSql.length > 60 ? '…' : ''}
          </span>
        )}
      </div>
      {result.columns.length > 0 && result.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {result.columns.map(col => (
                  <th key={col} className="px-3 py-1.5 text-left font-semibold text-gray-500 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {preview.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  {result.columns.map(col => (
                    <td key={col} className="px-3 py-1.5 text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                      title={String(row[col] ?? '')}>
                      {row[col] === null || row[col] === undefined
                        ? <span className="text-gray-700 italic">null</span>
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.rows.length > 6 && (
        <button onClick={() => setExpanded(e => !e)}
          className="w-full text-center py-1.5 text-[10px] text-gray-600 hover:text-gray-400
            hover:bg-white/[0.02] transition border-t border-white/5">
          {expanded ? '▲ Show less' : `▼ Show all ${result.rowCount} rows`}
        </button>
      )}
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      className="p-1 text-gray-600 hover:text-gray-300 transition rounded"
      title="Copy">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  msg, onConfirm, confirming,
}: {
  msg: ChatMessage;
  onConfirm: (actionId: string, decision: 'confirm' | 'cancel') => void;
  confirming: string | null;
}) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[75%] sm:max-w-[65%] bg-violet-600 text-white rounded-2xl
          rounded-br-sm px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-lg shadow-violet-500/15">
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex justify-start mb-6 gap-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/25
        flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Tool chips */}
        {(msg.tools ?? []).map(tool => (
          <div key={tool.id}
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1
              rounded-lg border mr-1.5 mb-0.5
              ${tool.state === 'running'
                ? 'border-violet-500/30 bg-violet-500/8 text-violet-300'
                : tool.state === 'failed'
                  ? 'border-red-500/25 bg-red-500/6 text-red-400'
                  : 'border-emerald-500/20 bg-emerald-500/6 text-emerald-400'}`}>
            {tool.state === 'running'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : toolIcon(tool.name)}
            <span className="font-mono">{tool.name}</span>
            {tool.summary && tool.state !== 'running' && (
              <span className="text-gray-500 font-sans non-mono ml-0.5 truncate max-w-[140px]"
                title={tool.summary}>
                — {tool.summary}
              </span>
            )}
          </div>
        ))}

        {/* SQL result tables */}
        {(msg.sqlResults ?? []).map((r, i) => (
          <SqlTable key={i} result={r} />
        ))}

        {/* Main content */}
        {(msg.content || msg.streaming) && (
          <div className="bg-[#111118] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3.5
            shadow-sm relative group">
            {/* Copy button */}
            {msg.content && !msg.streaming && (
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition">
                <CopyBtn text={msg.content} />
              </div>
            )}

            {msg.content ? (
              <MarkdownLite content={msg.content} />
            ) : (
              /* Thinking dots */
              <span className="flex items-center gap-1.5 text-[12px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:300ms]" />
                <span className="ml-1">Thinking…</span>
              </span>
            )}

            {/* Streaming cursor */}
            {msg.streaming && msg.content && (
              <span className="inline-block w-1.5 h-3.5 bg-violet-400/70 ml-0.5
                animate-pulse rounded-sm align-text-bottom" />
            )}

            {/* Token / model footer */}
            {(msg.model || msg.usage) && !msg.streaming && (
              <p className="mt-2.5 pt-2 border-t border-white/5 text-[10px] text-gray-700
                flex items-center gap-2">
                {msg.model && <span className="font-mono">{msg.model.split('/').pop()}</span>}
                {msg.usage && (
                  <span>{msg.usage.promptTokens + msg.usage.completionTokens} tokens</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Confirmation cards */}
        {(msg.pending ?? []).map(card => {
          const busy = confirming === card.actionId;
          const resolved = !!card.resolution;
          return (
            <div key={card.actionId}
              className={`rounded-2xl border overflow-hidden
                ${card.resolution === 'CONFIRMED'
                  ? 'border-emerald-500/20 bg-emerald-500/4'
                  : card.resolution === 'CANCELLED'
                    ? 'border-white/6 bg-white/[0.015]'
                    : 'border-amber-500/25 bg-amber-500/5'}`}>
              <div className="flex items-start gap-3 px-4 py-3">
                <ShieldAlert className={`w-4 h-4 mt-0.5 flex-shrink-0
                  ${resolved ? 'text-gray-600' : 'text-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-bold leading-none mb-1
                    ${card.resolution === 'CONFIRMED'
                      ? 'text-emerald-400'
                      : card.resolution === 'CANCELLED'
                        ? 'text-gray-500'
                        : 'text-amber-300'}`}>
                    {card.resolution === 'CONFIRMED' ? 'Action executed'
                      : card.resolution === 'CANCELLED' ? 'Action cancelled'
                      : 'Confirmation required'}
                  </p>
                  <p className="text-[12px] text-gray-300 leading-relaxed break-words">{card.summary}</p>
                  {card.resultSummary && (
                    <p className="mt-1.5 text-[11px] text-emerald-400/80 break-words">{card.resultSummary}</p>
                  )}
                </div>
              </div>
              {!resolved && (
                <div className="flex gap-2 px-4 pb-3.5">
                  <button onClick={() => onConfirm(card.actionId, 'confirm')}
                    disabled={busy}
                    className="flex items-center justify-center gap-1.5 flex-1 bg-emerald-600
                      hover:bg-emerald-500 disabled:opacity-50 text-white text-[12px]
                      font-bold py-2 rounded-xl transition active:scale-95 touch-manipulation">
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {busy ? 'Executing…' : 'Confirm'}
                  </button>
                  <button onClick={() => onConfirm(card.actionId, 'cancel')}
                    disabled={busy}
                    className="flex items-center justify-center gap-1.5 flex-1
                      bg-white/5 hover:bg-white/8 border border-white/10 disabled:opacity-50
                      text-gray-300 text-[12px] font-bold py-2 rounded-xl transition touch-manipulation">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AiCopilotPage() {
  // Status
  const [status, setStatus]           = useState<{ enabled: boolean; primaryModel?: string; toolCount?: number } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Conversations list
  const [convs, setConvs]             = useState<ConversationSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);  // mobile

  // Active chat
  const [convId, setConvId]           = useState<string | null>(null);
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [input, setInput]             = useState('');
  const [streaming, setStreaming]     = useState(false);
  const [error, setError]             = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [, startTransition]           = useTransition();

  const abortRef       = useRef<AbortController | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const scrollRef      = useRef<HTMLDivElement | null>(null);
  const inputRef       = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef      = useRef<HTMLDivElement | null>(null);

  // ── Load status + conversation list ─────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const res: any = await api.get('/ai/admin/status');
      const d = res?.data ?? res;
      setStatus({ enabled: Boolean(d?.aiEnabled), primaryModel: d?.primaryModel, toolCount: d?.toolCount });
    } catch {
      setStatus({ enabled: false });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadConvs = useCallback(async () => {
    try {
      const res: any = await api.get('/ai/admin/conversations');
      const d = res?.data ?? res;
      setConvs(Array.isArray(d) ? d : []);
    } catch { /* sidebar is non-critical */ }
  }, []);

  useEffect(() => {
    loadStatus();
    loadConvs();
  }, [loadStatus, loadConvs]);

  // ── Auto-scroll to bottom when messages update ───────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load existing conversation ───────────────────────────────────────────────
  const openConv = useCallback(async (id: string) => {
    if (streaming) return;
    setError('');
    setConvId(id);
    setMessages([]);
    setSidebarOpen(false);
    try {
      const res: any = await api.get(`/ai/admin/conversations/${id}`);
      const conv = res?.data ?? res;
      const mapped: ChatMessage[] = [];
      for (const row of conv?.messages ?? []) {
        if (row.role === 'user') {
          mapped.push({ id: row.id, role: 'user', content: row.content });
        } else if (row.role === 'assistant') {
          const msg: ChatMessage = {
            id: row.id, role: 'assistant', content: row.content || '', model: row.model,
          };
          const calls = Array.isArray(row.toolCalls) ? row.toolCalls : [];
          if (calls.length) {
            msg.tools = calls.map((c: any) => ({
              id: c?.id ?? uid(), name: c?.function?.name ?? 'tool', state: 'done',
            }));
          }
          mapped.push(msg);
        } else if (row.role === 'tool' && mapped.length) {
          const target = [...mapped].reverse().find(m => m.role === 'assistant');
          if (target) {
            let parsed: any = null;
            try { parsed = JSON.parse(row.content); } catch {}
            // Attach inline SQL table if this is a sql result
            if (parsed?.data?.columns && Array.isArray(parsed.data.rows)) {
              target.sqlResults = [...(target.sqlResults ?? []), {
                columns: parsed.data.columns,
                rows: parsed.data.rows,
                rowCount: parsed.data.rowCount ?? parsed.data.rows.length,
                capped: parsed.data.capped ?? false,
                executedSql: parsed.data.executedSql,
              }];
            }
            const chip: ToolEvent = {
              id: row.id,
              name: row.toolName ?? 'tool',
              state: parsed?.ok === false ? 'failed' : 'done',
              summary: parsed?.status === 'awaiting_confirmation'
                ? 'Awaiting confirmation'
                : (parsed?.summary ?? ''),
            };
            target.tools = [...(target.tools ?? []), chip];
          }
        }
      }
      // Pending actions still needing confirmation
      const pending: PendingCard[] = (conv?.pendingActions ?? []).map((a: any) => ({
        actionId: a.actionId, toolName: a.toolName, summary: a.summary, args: a.args,
      }));
      if (pending.length) {
        const last = mapped[mapped.length - 1];
        if (last?.role === 'assistant') last.pending = pending;
        else mapped.push({ id: uid(), role: 'assistant', content: '', pending });
      }
      setMessages(mapped);
    } catch (err: any) {
      setError(err?.message || 'Could not load conversation.');
    }
  }, [streaming]);

  const newChat = () => {
    if (streaming) return;
    setConvId(null);
    setMessages([]);
    setError('');
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const deleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/ai/admin/conversations/${id}`);
      setConvs(prev => prev.filter(c => c.id !== id));
      if (convId === id) newChat();
    } catch (err: any) {
      setError(err?.message || 'Could not delete.');
    }
  };

  // ── Streaming ────────────────────────────────────────────────────────────────
  const updateAssistant = useCallback((fn: (m: ChatMessage) => ChatMessage) => {
    const id = assistantIdRef.current;
    if (!id) return;
    setMessages(prev => prev.map(m => m.id === id ? fn(m) : m));
  }, []);

  const runStream = useCallback(async (body: {
    conversationId?: string; message?: string; resume?: boolean;
  }) => {
    setError('');
    setStreaming(true);

    const aid = uid();
    assistantIdRef.current = aid;
    setMessages(prev => [...prev, { id: aid, role: 'assistant', content: '', streaming: true }]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let gotConvId = false;

    try {
      const password = typeof window !== 'undefined'
        ? sessionStorage.getItem(PASSWORD_KEY) : null;

      const res = await fetch(`${API_BASE}/ai/admin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(password ? { 'x-admin-password': password } : {}),
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '');
        let msg = 'The assistant is unavailable right now.';
        try { msg = JSON.parse(txt)?.message ?? msg; } catch {}
        throw new Error(msg);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      const handle = (ev: any) => {
        switch (ev?.event) {
          case 'delta':
            updateAssistant(m => ({ ...m, content: m.content + (ev.content ?? '') }));
            break;
          case 'tool_call':
            updateAssistant(m => ({
              ...m,
              tools: [...(m.tools ?? []), { id: ev.id, name: ev.name, state: 'running' }],
            }));
            break;
          case 'tool_result':
            updateAssistant(m => {
              // Attach SQL table when the tool is run_sql_query
              let sqlResults = m.sqlResults ?? [];
              if (
                ev.name === 'run_sql_query' &&
                ev.ok !== false &&
                ev.data?.columns && Array.isArray(ev.data?.rows)
              ) {
                sqlResults = [...sqlResults, {
                  columns: ev.data.columns,
                  rows: ev.data.rows,
                  rowCount: ev.data.rowCount ?? ev.data.rows.length,
                  capped: ev.data.capped ?? false,
                  executedSql: ev.data.executedSql,
                }];
              }
              return {
                ...m,
                sqlResults,
                tools: (m.tools ?? []).map(t =>
                  t.id === ev.id || t.name === ev.name
                    ? { ...t, state: ev.ok === false ? 'failed' : 'done', summary: ev.summary }
                    : t,
                ),
              };
            });
            break;
          case 'confirmation_required':
            updateAssistant(m => ({
              ...m,
              pending: [...(m.pending ?? []), ...(ev.actions ?? [])],
            }));
            break;
          case 'usage':
            updateAssistant(m => ({
              ...m,
              usage: { promptTokens: ev.promptTokens ?? 0, completionTokens: ev.completionTokens ?? 0 },
            }));
            break;
          case 'done':
            if (ev.conversationId) {
              gotConvId = true;
              setConvId(ev.conversationId);
            }
            if (ev.message) {
              updateAssistant(m => ({ ...m, content: m.content + `\n\n*${ev.message}*` }));
            }
            break;
          case 'error':
            setError(ev.message || 'The assistant hit an unexpected error.');
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
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            try { handle(JSON.parse(t.slice(5).trim())); } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError(err?.message || 'Lost connection to the assistant.');
      }
    } finally {
      updateAssistant(m => ({ ...m, streaming: false }));
      setStreaming(false);
      abortRef.current = null;
      if (gotConvId || body.conversationId) loadConvs();
    }
  }, [updateAssistant, loadConvs]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput('');
    setMessages(prev => [...prev, { id: uid(), role: 'user', content: msg }]);
    await runStream({ conversationId: convId ?? undefined, message: msg });
  };

  const stop = () => abortRef.current?.abort();

  // ── Confirmation ─────────────────────────────────────────────────────────────
  const resolveAction = async (actionId: string, decision: 'confirm' | 'cancel') => {
    if (streaming || confirmingId) return;
    setConfirmingId(actionId);
    setError('');
    try {
      const res: any = await api.post('/ai/admin/confirm', {
        actionId, decision, conversationId: convId ?? undefined,
      });
      const result = res?.data ?? res;
      setMessages(prev => prev.map(m => ({
        ...m,
        pending: (m.pending ?? []).map(c =>
          c.actionId === actionId ? {
            ...c,
            resolution: result?.ok === false || result?.status === 'CANCELLED'
              ? 'CANCELLED' : 'CONFIRMED',
            resultSummary: result?.summary,
          } : c,
        ),
      })));
      if (decision === 'confirm' && convId) {
        await runStream({ conversationId: convId, resume: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Could not process the confirmation.');
    } finally {
      setConfirmingId(null);
    }
  };

  // ── Auto-resize textarea ─────────────────────────────────────────────────────
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const disabled = statusLoading || !status?.enabled;

  // ── Conversation sidebar ──────────────────────────────────────────────────────
  const SidebarInner = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-white/6 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/25
          flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <span className="text-[13px] font-black text-white flex-1">Piyrox Copilot</span>
        <button onClick={newChat} disabled={streaming}
          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500
            disabled:opacity-40 text-white text-[11px] font-bold px-2.5 py-1.5
            rounded-lg transition touch-manipulation"
          title="New chat">
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin
        scrollbar-track-transparent scrollbar-thumb-white/6">
        {convs.length === 0 ? (
          <p className="text-[11px] text-gray-600 text-center py-8 px-4 leading-relaxed">
            No conversations yet.<br />Ask your first question to get started.
          </p>
        ) : (
          convs.map(c => (
            <div key={c.id}
              className={`group mx-2 mb-0.5 flex items-center rounded-xl transition cursor-pointer
                ${convId === c.id
                  ? 'bg-violet-600/12 border border-violet-500/20'
                  : 'hover:bg-white/[0.04] border border-transparent'}`}
              onClick={() => openConv(c.id)}>
              <div className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0">
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0
                  ${convId === c.id ? 'text-violet-400' : 'text-gray-600'}`} />
                <div className="min-w-0">
                  <p className="text-[12px] text-gray-200 truncate leading-none mb-0.5">
                    {c.title || 'Untitled'}
                  </p>
                  <p className="text-[10px] text-gray-600 leading-none">
                    {c.messageCount} msg{c.messageCount !== 1 ? 's' : ''} ·{' '}
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button onClick={e => deleteConv(c.id, e)}
                className="mr-2 p-1.5 text-gray-700 hover:text-red-400
                  opacity-0 group-hover:opacity-100 transition rounded-lg touch-manipulation"
                title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/6 flex-shrink-0 space-y-1">
        {status && (
          <p className="text-[10px] text-gray-700 px-1">
            {status.primaryModel
              ? `${status.primaryModel.split('/').pop()} · ${status.toolCount ?? 0} tools`
              : 'AI not configured'}
          </p>
        )}
        <Link href="/admin"
          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12px]
            text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
        </Link>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0 bg-[#0d0d14] border-r border-white/6 flex-col">
        {SidebarInner}
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────── */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0d0d14] border-r border-white/6
            flex flex-col md:hidden animate-[slideInLeft_0.22s_ease-out]">
            {SidebarInner}
          </div>
        </>
      )}

      {/* ── Chat column ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">

        {/* Top bar (mobile only) */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2.5
          border-b border-white/6 bg-[#0d0d14] flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/8
              rounded-lg transition touch-manipulation">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white truncate">
              {convId
                ? (convs.find(c => c.id === convId)?.title || 'Conversation')
                : 'New Chat'}
            </span>
          </div>
          <button onClick={newChat} disabled={streaming}
            className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500
              disabled:opacity-40 text-white text-[11px] font-bold px-2.5 py-1.5
              rounded-lg transition touch-manipulation">
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Status / error banners */}
        {!statusLoading && !status?.enabled && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-500/6
            border-b border-amber-500/20 text-[12px] text-amber-300/90 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              AI assistant is not configured — set{' '}
              <code className="font-mono bg-amber-500/10 px-1 rounded">OPENROUTER_API_KEY</code>{' '}
              in your backend environment and restart the server.
            </p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-500/6
            border-b border-red-500/20 text-[12px] text-red-300 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={() => setError('')}
              className="text-red-400/60 hover:text-red-300 touch-manipulation">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Messages ─────────────────────────────────────── */}
        <div ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 xl:px-24 py-6
            scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/6">
          <div className="max-w-3xl mx-auto">

            {messages.length === 0 ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20
                  flex items-center justify-center mb-5">
                  <Sparkles className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-xl font-black text-white mb-2">Piyrox Copilot</h2>
                <p className="text-[13px] text-gray-500 max-w-sm leading-relaxed mb-8">
                  Connected to live data — ask about revenue, sellers, fraud signals,
                  or give direct moderation commands.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                  {SUGGESTIONS.map(s => (
                    <button key={s}
                      onClick={() => !disabled && send(s)}
                      disabled={disabled}
                      className="text-left text-[12px] text-gray-400 bg-[#0d0d14]
                        border border-white/8 hover:border-violet-500/30 hover:text-gray-200
                        rounded-xl px-3.5 py-3 transition disabled:opacity-30
                        disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onConfirm={resolveAction}
                  confirming={confirmingId}
                />
              ))
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input area ───────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-white/6 bg-[#0a0a0f] px-4 md:px-8
          lg:px-16 xl:px-24 py-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-[#111118] border border-white/10
              focus-within:border-violet-500/50 focus-within:ring-1
              focus-within:ring-violet-500/15 rounded-2xl px-4 py-3 transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={4000}
                disabled={disabled}
                placeholder={
                  statusLoading
                    ? 'Loading…'
                    : !status?.enabled
                      ? 'AI assistant is offline'
                      : 'Ask anything — revenue, fraud, moderation… (Shift+Enter for new line)'
                }
                className="flex-1 bg-transparent text-[13px] text-white placeholder-gray-700
                  focus:outline-none resize-none max-h-40 leading-relaxed
                  disabled:cursor-not-allowed"
                style={{ height: 'auto' }}
              />

              {streaming ? (
                <button onClick={stop}
                  className="flex items-center gap-1.5 flex-shrink-0 bg-red-500/15
                    border border-red-500/25 text-red-400 text-[12px] font-bold
                    px-3 py-2 rounded-xl hover:bg-red-500/25 transition touch-manipulation">
                  <Square className="w-3.5 h-3.5" /> Stop
                </button>
              ) : (
                <button onClick={() => send()}
                  disabled={disabled || !input.trim()}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center
                    bg-violet-600 hover:bg-violet-500 disabled:opacity-30
                    disabled:hover:bg-violet-600 text-white rounded-xl transition
                    touch-manipulation active:scale-95">
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="mt-1.5 text-[10px] text-gray-700 text-center">
              Copilot reads all tables and can run moderation actions.
              Destructive actions always ask for confirmation first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
