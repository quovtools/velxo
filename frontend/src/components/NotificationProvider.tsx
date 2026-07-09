'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface AppNotification {
  id: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  connected: boolean;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unread: 0,
  loading: true,
  refresh: async () => {},
  markAllRead: async () => {},
  markRead: async () => {},
  connected: false,
});

export const useNotifications = () => useContext(NotificationContext);

function notificationHref(n: AppNotification): string {
  const d = n.data || {};
  if (d.conversationId) return `/messages?conversationId=${d.conversationId}`;
  if (d.orderId) return `/orders/${d.orderId}`;
  return '/notifications';
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: AppNotification[] }>('/notifications');
      const list = res.data || [];
      setNotifications(list);
      setUnread(list.filter((n) => !n.isRead).length);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await api.patch(`/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    await api.patch('/notifications/mark-all-read').catch(() => {});
  }, []);

  const pushToast = useCallback((n: AppNotification) => {
    setToasts((prev) => [n, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== n.id));
    }, 6000);
  }, []);

  // Connect to the real-time notification socket and keep an up-to-date unread
  // count. Also poll as a fallback in case the socket drops.
  useEffect(() => {
    if (!user) return;
    refresh();

    let poll: ReturnType<typeof setInterval> | null = null;
    try {
      const socketUrl = API_BASE.replace(/\/api\/v1$/, '');
      const socket = io(`${socketUrl}/notifications`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('authenticate', user.id);
      });
      socket.on('disconnect', () => setConnected(false));

      socket.on('newNotification', (n: AppNotification) => {
        if (!n || !n.id) return;
        if (n.userId && n.userId !== user.id) return;
        setNotifications((prev) => [n, ...prev].slice(0, 50));
        setUnread((u) => u + 1);
        // Chat messages are surfaced inside the conversation UI, so avoid a
        // duplicate toast for those — every other notification gets one.
        if (n.type !== 'MESSAGE') pushToast(n);

        // Try to surface a native browser notification (best effort).
        try {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification(n.title, { body: n.body });
            } else if (Notification.permission === 'default') {
              Notification.requestPermission().then((perm) => {
                if (perm === 'granted') new Notification(n.title, { body: n.body });
              });
            }
          }
        } catch {
          /* ignore */
        }
      });

      poll = setInterval(refresh, 30000);
    } catch {
      /* socket unavailable — polling covers delivery */
    }

    return () => {
      if (poll) clearInterval(poll);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, refresh, pushToast]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unread, loading, refresh, markAllRead, markRead, connected }}
    >
      {children}

      {/* Live toast stack */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-[60] flex flex-col gap-2 w-[min(20rem,calc(100vw-2rem))]">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              router.push(notificationHref(t));
              setToasts((prev) => prev.filter((x) => x.id !== t.id));
              if (!t.isRead) markRead(t.id);
            }}
            className="text-left bg-cardBg border border-brand/30 rounded-xl shadow-lg shadow-black/40 p-3 flex items-start gap-3 fade-in"
          >
            <Bell className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{t.title}</p>
              <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{t.body}</p>
            </div>
            <X
              className="w-4 h-4 text-gray-500 hover:text-white flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setToasts((prev) => prev.filter((x) => x.id !== t.id));
              }}
            />
          </button>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
