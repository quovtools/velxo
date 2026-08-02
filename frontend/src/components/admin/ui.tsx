'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Base: bg-[#0a0a0f]  Surface: bg-[#111118]  Border: border-white/8
// Accent: violet-500   Success: emerald-500   Danger: red-500   Warn: amber-500

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = 'gray' | 'green' | 'red' | 'yellow' | 'violet' | 'purple' | 'brand' | 'blue' | 'orange';

export function Badge({ color = 'gray', children }: { color?: BadgeColor; children: React.ReactNode }) {
  const styles: Record<BadgeColor, string> = {
    gray:   'bg-white/8 text-gray-300 border-white/10',
    green:  'bg-emerald-500/12 text-emerald-400 border-emerald-500/20',
    red:    'bg-red-500/12 text-red-400 border-red-500/20',
    yellow: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
    violet: 'bg-violet-500/12 text-violet-400 border-violet-500/20',
    purple: 'bg-purple-500/12 text-purple-400 border-purple-500/20',
    brand:  'bg-violet-500/12 text-violet-300 border-violet-500/20',
    blue:   'bg-blue-500/12 text-blue-400 border-blue-500/20',
    orange: 'bg-orange-500/12 text-orange-400 border-orange-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${styles[color]}`}>
      {children}
    </span>
  );
}

// ─── statusColor ──────────────────────────────────────────────────────────────
export function statusColor(status: string): BadgeColor {
  const s = (status || '').toUpperCase();
  if (['ACTIVE','COMPLETED','APPROVED','PUBLISHED','VERIFIED','PAID','OPEN','RELEASED'].includes(s)) return 'green';
  if (['REJECTED','BANNED','SUSPENDED','CANCELLED','FAILED','CLOSED','REFUNDED'].includes(s)) return 'red';
  if (['PENDING','PENDING_APPROVAL','SUBMITTED','IN_PROGRESS','UNDER_REVIEW','PROCESSING'].includes(s)) return 'yellow';
  if (['RESOLVED_BUYER','RESOLVED_SELLER','RESOLVED_PLATFORM'].includes(s)) return 'violet';
  if (['INACTIVE','DRAFT'].includes(s)) return 'gray';
  return 'gray';
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
type BtnVariant = 'default' | 'danger' | 'success' | 'warning' | 'brand' | 'ghost';

export function ActionButton({
  onClick, loading, variant = 'default', children, disabled, title, className = '',
}: {
  onClick: () => void; loading?: boolean; variant?: BtnVariant;
  children: React.ReactNode; disabled?: boolean; title?: string; className?: string;
}) {
  const styles: Record<BtnVariant, string> = {
    default: 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20',
    danger:  'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300',
    success: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300',
    warning: 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300',
    brand:   'bg-violet-600 border border-violet-500 text-white hover:bg-violet-500 shadow-sm shadow-violet-500/20',
    ghost:   'text-gray-400 hover:text-white',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} title={title}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}>
      {loading && <Spinner className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({
  open, onClose, title, children, footer, size = 'md',
}: {
  open: boolean; onClose: () => void; title?: React.ReactNode;
  children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} bg-[#111118] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 max-h-[92vh] flex flex-col`}>
        {title !== undefined && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
            <h3 className="font-bold text-white text-sm">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-white/8 flex justify-end gap-2 flex-shrink-0 bg-white/2 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 transition">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-gray-500 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 font-medium">
        {page} / {totalPages}
      </span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 transition">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-[#111118] border border-white/8 rounded-2xl">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
      )}
      <p className="text-sm font-semibold text-white">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onClose }: { message: string; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-400/70 hover:text-red-300 transition flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── SuccessBanner ────────────────────────────────────────────────────────────
export function SuccessBanner({ message, onClose }: { message: string; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-emerald-500/8 border border-emerald-500/20 text-emerald-300 text-sm px-4 py-3 rounded-xl">
      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-emerald-400/70 hover:text-emerald-300 transition flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  icon: Icon, title, subtitle, iconColor = 'text-violet-400', action,
}: {
  icon: any; title: string; subtitle?: string; iconColor?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, empty }: {
  headers: string[]; children: React.ReactNode; empty?: React.ReactNode;
}) {
  return (
    <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {headers.map((h, i) => (
                <th key={i} className={`px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${i === headers.length - 1 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">{children}</tbody>
        </table>
      </div>
      {empty}
    </div>
  );
}

export function Tr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick}
      className={`group transition-colors ${onClick ? 'cursor-pointer hover:bg-white/4' : 'hover:bg-white/3'}`}>
      {children}
    </tr>
  );
}

export function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td className={`px-4 py-3 text-gray-300 ${right ? 'text-right' : ''}`}>{children}</td>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111118] border border-white/8 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
export function SectionCard({ title, children, action }: {
  title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

// ─── Input / Select / Textarea ────────────────────────────────────────────────
const inputBase = 'w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition';

export function AdminInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-gray-500 mb-1.5">{label}</span>}
      <input {...props} className={`${inputBase} ${props.className || ''}`} />
    </label>
  );
}

export function AdminSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-gray-500 mb-1.5">{label}</span>}
      <select {...props} className={`${inputBase} ${props.className || ''}`}>{children}</select>
    </label>
  );
}

export function AdminTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-gray-500 mb-1.5">{label}</span>}
      <textarea {...props} className={`${inputBase} resize-none ${props.className || ''}`} />
    </label>
  );
}

// ─── RefreshButton ────────────────────────────────────────────────────────────
import { RefreshCw } from 'lucide-react';
export function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick}
      className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition"
      title="Refresh">
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, color = 'text-violet-400', sub }: {
  icon: any; label: string; value: React.ReactNode; color?: string; sub?: string;
}) {
  return (
    <div className="bg-[#111118] border border-white/8 rounded-2xl p-4 flex items-start gap-3 hover:border-white/15 transition-colors">
      <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-xl font-black text-white mt-0.5 tabular-nums leading-none">{value}</p>
        {sub && <p className="text-[11px] text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatDate(v?: string | null) {
  if (!v) return '—';
  return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatMoney(amount?: number | string | null, currency = 'USD') {
  if (amount === null || amount === undefined) return '—';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}

export function confirmAction(msg: string): Promise<boolean> {
  return Promise.resolve(window.confirm(msg));
}

// ─── DetailRow ────────────────────────────────────────────────────────────────
export function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-500 text-xs shrink-0">{label}</span>
      <span className={`text-white text-xs text-right break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value ?? '—'}</span>
    </div>
  );
}

// ─── FilterRow ────────────────────────────────────────────────────────────────
export function FilterRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
