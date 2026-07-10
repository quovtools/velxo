'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import {
  Bell, CheckCheck, Trash2, ShoppingBag, MessageSquare,
  ShieldAlert, Wallet, Info, Loader2, Package, ChevronRight,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  ORDER_STATUS:      <ShoppingBag className="w-4 h-4 text-blue-400" />,
  MESSAGE:           <MessageSquare className="w-4 h-4 text-brand-light" />,
  DISPUTE:           <ShieldAlert className="w-4 h-4 text-red-400" />,
  WITHDRAWAL:        <Wallet className="w-4 h-4 text-emerald-400" />,
  LISTING_APPROVED:  <Package className="w-4 h-4 text-emerald-400" />,
  LISTING_REJECTED:  <Package className="w-4 h-4 text-red-400" />,
  FRAUD_ALERT:       <ShieldAlert className="w-4 h-4 text-orange-400" />,
  SYSTEM:            <Info className="w-4 h-4 text-gray-400" />,
};

const TYPE_BG: Record<string, string> = {
  ORDER_STATUS:     'bg-blue-900/20 border-blue-500/20',
  MESSAGE:          'bg-brand/10 border-brand/20',
  DISPUTE:          'bg-red-900/20 border-red-500/20',
  WITHDRAWAL:       'bg-emerald-900/20 border-emerald-500/20',
  LISTING_APPROVED: 'bg-emerald-900/20 border-emerald-500/20',
  LISTING_REJECTED: 'bg-red-900/20 border-red-500/20',
  FRAUD_ALERT:      'bg-orange-900/20 border-orange-500/20',
  SYSTEM:           'bg-hoverBg border-borderBg',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsPage() {
  const router                          = useRouter();
  const { user, loading: authLoading }  = useAuth();
  const [notifications, setNotifs]      = useState<Notification[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    (async () => {
      try {
        const res = await api.get<{ data: Notification[] }>('/notifications');
        setNotifs(res.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, authLoading, router]);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/mark-all-read').catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const remove = async (id: string) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const unread   = notifications.filter(n => !n.isRead).length;
  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  function hrefFor(n: Notification): string {
    const d = n.data || {};
    if (d.conversationId) return `/messages?conversationId=${d.conversationId}`;
    if (d.orderId) return `/orders/${d.orderId}`;
    if (n.type === 'LISTING_APPROVED' || n.type === 'LISTING_REJECTED') return '/seller/dashboard';
    if (n.type === 'KYC_APPROVED' || n.type === 'KYC_REJECTED') return '/seller/kyc';
    if (n.type === 'WITHDRAWAL') return '/wallet';
    return '/notifications';
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 py-6 fade-in">
      <div className="h-8 skeleton rounded-xl w-40" />
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand" /> Notifications
            {unread > 0 && (
              <span className="bg-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light transition">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-cardBg border border-borderBg rounded-xl p-1 w-fit">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition capitalize ${
              filter === f ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}>
            {f} {f === 'unread' && unread > 0 && `(${unread})`}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl space-y-3">
          <Bell className="w-12 h-12 text-gray-700 mx-auto" />
          <p className="text-gray-400 font-semibold">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-xs text-gray-600">We&apos;ll notify you when something important happens.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markRead(n.id);
                router.push(hrefFor(n));
              }}
              className={`group flex items-start gap-4 p-4 rounded-2xl border transition cursor-pointer ${
                n.isRead
                  ? 'bg-cardBg border-borderBg opacity-70 hover:opacity-100 hover:border-brand/20'
                  : 'bg-cardBg border-brand/20 hover:border-brand/40'
              }`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${TYPE_BG[n.type] || TYPE_BG.SYSTEM}`}>
                {TYPE_ICON[n.type] || <Info className="w-4 h-4 text-gray-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold truncate ${n.isRead ? 'text-gray-300' : 'text-white'}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-gray-500 flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                {/* Show destination hint */}
                {hrefFor(n) !== '/notifications' && (
                  <p className="text-[10px] text-brand/70 mt-1 flex items-center gap-0.5">
                    <ChevronRight className="w-3 h-3" />
                    {n.data?.orderId ? 'View order' : n.data?.conversationId ? 'Open message' : 'Go to dashboard'}
                  </p>
                )}
              </div>

              {/* Unread dot + delete */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand mt-1" />}
                <button
                  onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 transition rounded-lg hover:bg-red-900/20"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
