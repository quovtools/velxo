'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

export function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Badge({
  color = 'gray',
  children,
}: {
  color?: 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'brand';
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    gray: 'bg-white/10 text-gray-300',
    green: 'bg-green-500/15 text-green-400',
    red: 'bg-red-500/15 text-red-400',
    yellow: 'bg-yellow-500/15 text-yellow-400',
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
    brand: 'bg-brand/15 text-brand',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>
      {children}
    </span>
  );
}

export function statusColor(status: string): 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'brand' {
  const s = status?.toUpperCase() || '';
  if (['ACTIVE', 'COMPLETED', 'APPROVED', 'PUBLISHED', 'VERIFIED', 'PAID', 'OPEN', 'RELEASED'].includes(s))
    return 'green';
  if (['REJECTED', 'BANNED', 'SUSPENDED', 'CANCELLED', 'FAILED', 'CLOSED', 'REFUNDED'].includes(s))
    return 'red';
  if (['PENDING', 'PENDING_APPROVAL', 'SUBMITTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'PROCESSING'].includes(s))
    return 'yellow';
  if (['RESOLVED_BUYER', 'RESOLVED_SELLER', 'RESOLVED_PLATFORM', 'INACTIVE'].includes(s)) return 'blue';
  return 'gray';
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const widths = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} bg-cardBg border border-borderBg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-borderBg">
            <h3 className="font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-borderBg flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 rounded-xl bg-cardBg border border-borderBg text-gray-300 text-sm disabled:opacity-40 hover:border-brand/40 transition"
      >
        Prev
      </button>
      <span className="text-sm text-gray-400 px-2">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 rounded-xl bg-cardBg border border-borderBg text-gray-300 text-sm disabled:opacity-40 hover:border-brand/40 transition"
      >
        Next
      </button>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: any;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center py-16 bg-cardBg border border-borderBg rounded-2xl">
      {Icon && <Icon className="w-12 h-12 text-gray-600 mx-auto mb-3" />}
      <p className="text-white font-bold">{title}</p>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function ErrorBanner({ message, onClose }: { message: string; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl flex justify-between items-center">
      {message}
      {onClose && (
        <button onClick={onClose} className="text-red-300 hover:text-white ml-4">
          ✕
        </button>
      )}
    </div>
  );
}

export function confirmAction(message: string): Promise<boolean> {
  return Promise.resolve(window.confirm(message));
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatMoney(amount?: number | string | null, currency = 'USD') {
  if (amount === null || amount === undefined) return '—';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Generic toggle/action button used across admin pages
export function ActionButton({
  onClick,
  loading,
  variant = 'default',
  children,
  disabled,
  title,
}: {
  onClick: () => void;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'brand';
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  const styles: Record<string, string> = {
    default: 'bg-cardBg border border-borderBg text-gray-300 hover:border-brand/40 hover:text-white',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    success: 'bg-green-600 hover:bg-green-500 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-500 text-white',
    brand: 'bg-brand hover:bg-brand-dark text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50 ${styles[variant]}`}
    >
      {loading && <Spinner className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
