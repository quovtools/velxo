'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Bell, Loader2, CheckCheck, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const res = await api.get<{ data: Notification[] }>('/notifications');
        setNotifications(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  async function markAsRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-400 font-semibold">Please sign in to view notifications.</p>
        <a href="/auth/login" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-white font-bold transition">Sign In</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 my-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-brand" />
            Notifications
          </h1>
          <p className="text-gray-400 text-sm">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-light transition">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-3xl space-y-4">
          <Bell className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-gray-400 font-semibold">No notifications yet</p>
          <p className="text-xs text-gray-500">We&apos;ll notify you when something important happens.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-cardBg border rounded-2xl p-5 flex items-start gap-4 transition ${
                n.isRead ? 'border-borderBg opacity-70' : 'border-brand/30'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? 'bg-gray-600' : 'bg-brand'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white truncate">{n.title}</h3>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.body}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.isRead && (
                  <button onClick={() => markAsRead(n.id)} className="p-2 text-gray-400 hover:text-brand transition" title="Mark as read">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => deleteNotification(n.id)} className="p-2 text-gray-400 hover:text-red-400 transition" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
