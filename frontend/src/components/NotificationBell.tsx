'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, Package, MessageSquare, ShoppingBag, ShieldAlert, Wallet, Info } from 'lucide-react';
import { useNotifications, AppNotification } from './NotificationProvider';

const TYPE_ICON: Record<string, React.ReactNode> = {
  ORDER_STATUS: <ShoppingBag className="w-4 h-4 text-blue-400" />,
  MESSAGE: <MessageSquare className="w-4 h-4 text-brand-light" />,
  DISPUTE: <ShieldAlert className="w-4 h-4 text-red-400" />,
  WITHDRAWAL: <Wallet className="w-4 h-4 text-emerald-400" />,
  LISTING_APPROVED: <Package className="w-4 h-4 text-emerald-400" />,
  LISTING_REJECTED: <Package className="w-4 h-4 text-red-400" />,
  FRAUD_ALERT: <ShieldAlert className="w-4 h-4 text-orange-400" />,
  SYSTEM: <Info className="w-4 h-4 text-gray-400" />,
};

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

function hrefFor(n: AppNotification): string {
  const d = n.data || {};
  if (d.conversationId) return `/messages?conversationId=${d.conversationId}`;
  if (d.orderId) return `/orders/${d.orderId}`;
  return '/notifications';
}

export default function NotificationBell() {
  const { notifications, unread, loading, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-gray-300 hover:text-brand transition rounded-lg hover:bg-brand/10"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-cardBg border border-borderBg rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-borderBg">
              <p className="font-bold text-sm">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-light transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-brand animate-spin" />
                </div>
              ) : recent.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-10">No notifications yet</p>
              ) : (
                recent.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                      router.push(hrefFor(n));
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-borderBg/50 transition hover:bg-hoverBg/40 ${
                      n.isRead ? '' : 'bg-brand/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-hoverBg border border-borderBg flex-shrink-0">
                      {TYPE_ICON[n.type] || <Info className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${n.isRead ? 'text-gray-300' : 'text-white'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-brand py-3 border-t border-borderBg hover:bg-hoverBg/40 transition"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
