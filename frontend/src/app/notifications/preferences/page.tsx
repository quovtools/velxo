'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import {
  Bell, ShoppingBag, MessageSquare, ShieldAlert, Wallet,
  Package, Info, BadgeCheck, ArrowLeft, Loader2,
} from 'lucide-react';

interface PrefItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

const PREF_ITEMS: PrefItem[] = [
  { key: 'ORDER_STATUS',     label: 'Order Updates',        description: 'Payment confirmed, seller accepted, delivery, completion.',     icon: <ShoppingBag className="w-4 h-4 text-violet-400" />,  iconBg: 'bg-violet-900/30 border-violet-500/20' },
  { key: 'MESSAGE',          label: 'New Messages',         description: 'When a buyer or seller sends you a message.',                   icon: <MessageSquare className="w-4 h-4 text-brand-light" />, iconBg: 'bg-brand/10 border-brand/20' },
  { key: 'DISPUTE',          label: 'Dispute Updates',      description: 'New disputes, status changes, and admin resolutions.',          icon: <ShieldAlert className="w-4 h-4 text-red-400" />,     iconBg: 'bg-red-900/30 border-red-500/20' },
  { key: 'WITHDRAWAL',       label: 'Withdrawals',          description: 'Withdrawal requests approved or rejected.',                     icon: <Wallet className="w-4 h-4 text-emerald-400" />,      iconBg: 'bg-emerald-900/30 border-emerald-500/20' },
  { key: 'LISTING_APPROVED', label: 'Listing Approved',     description: 'When your listing passes admin review and goes live.',          icon: <Package className="w-4 h-4 text-emerald-400" />,     iconBg: 'bg-emerald-900/30 border-emerald-500/20' },
  { key: 'LISTING_REJECTED', label: 'Listing Rejected',     description: 'When a listing fails review with a reason.',                   icon: <Package className="w-4 h-4 text-red-400" />,         iconBg: 'bg-red-900/30 border-red-500/20' },
  { key: 'KYC_APPROVED',     label: 'KYC Approved',         description: 'Your identity verification was approved.',                     icon: <BadgeCheck className="w-4 h-4 text-emerald-400" />,  iconBg: 'bg-emerald-900/30 border-emerald-500/20' },
  { key: 'KYC_REJECTED',     label: 'KYC Rejected',         description: 'Your identity verification was rejected (includes reason).',   icon: <BadgeCheck className="w-4 h-4 text-red-400" />,      iconBg: 'bg-red-900/30 border-red-500/20' },
  { key: 'FRAUD_ALERT',      label: 'Fraud Alerts',         description: 'Suspicious activity detected on your account.',                icon: <ShieldAlert className="w-4 h-4 text-orange-400" />,  iconBg: 'bg-orange-900/30 border-orange-500/20' },
  { key: 'SYSTEM',           label: 'System Announcements', description: 'Platform news, maintenance windows, and feature updates.',     icon: <Info className="w-4 h-4 text-gray-400" />,           iconBg: 'bg-hoverBg border-borderBg' },
];

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    api.get<{ data: Record<string, boolean> }>('/notifications/preferences')
      .then(res => setPrefs(res.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const toggle = (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await api.patch('/notifications/preferences', { [key]: next[key] });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch { /* silent */ }
    }, 500);
  };

  if (loading) return (
    <div className="max-w-xl mx-auto py-10 space-y-4 fade-in">
      <div className="h-8 skeleton rounded-xl w-56" />
      {[...Array(6)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto py-4 space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-2 hover:bg-hoverBg rounded-xl transition text-gray-400 hover:text-white"
          aria-label="Go back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand" /> Notification Preferences
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Choose which events trigger notifications</p>
        </div>
        {saved && (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Push permission banner */}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
        <div className="bg-brand/10 border border-brand/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Bell className="w-5 h-5 text-brand flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Enable push notifications</p>
            <p className="text-xs text-gray-400 mt-0.5">Get notified even when the app is closed</p>
          </div>
          <button
            onClick={() => Notification.requestPermission()}
            className="px-3 py-1.5 bg-brand hover:bg-brand-dark rounded-lg text-xs font-bold text-white transition flex-shrink-0"
          >
            Enable
          </button>
        </div>
      )}

      {/* Preference toggles */}
      <div className="bg-cardBg border border-borderBg rounded-2xl divide-y divide-borderBg overflow-hidden">
        {PREF_ITEMS.map(item => {
          const enabled = prefs[item.key] !== false; // default true for everything except SYSTEM
          return (
            <div key={item.key} className="flex items-center gap-4 px-5 py-4 hover:bg-hoverBg/20 transition">
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${item.iconBg}`}>
                {item.icon}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => toggle(item.key)}
                role="switch"
                aria-checked={enabled}
                aria-label={`Toggle ${item.label}`}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-cardBg ${
                  enabled ? 'border-brand bg-brand' : 'border-gray-600 bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                  enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 text-center px-4">
        In-app and email notifications follow these settings. Push notifications also require browser permission.
      </p>
    </div>
  );
}
