'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import VerifiedBadge from '@/components/VerifiedBadge';
import {
  Store, Shield, CreditCard, Bell, Lock,
  Check, Loader2, X, Eye, EyeOff, ExternalLink,
  AlertTriangle, Wallet, ChevronRight, TrendingUp,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeDescription: string | null;
  isVerified: boolean;
  reputationScore: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  responseRate: number;
  responseTime: number | null;
  subscriptionTier: string;   // FREE | PRO | PREMIUM
  kycStatus: string;           // NOT_SUBMITTED | SUBMITTED | APPROVED | REJECTED
  kycTier: string;
  sellerLevel: string;
  verifiedAt?: string | null;
  subscriptionEndsAt?: string | null;
}

interface NotificationPrefs {
  ORDER_STATUS: boolean;
  MESSAGE: boolean;
  DISPUTE: boolean;
  WITHDRAWAL: boolean;
  LISTING_APPROVED: boolean;
  LISTING_REJECTED: boolean;
  KYC_APPROVED: boolean;
  KYC_REJECTED: boolean;
  SYSTEM: boolean;
}

// ─── Subscription plan definitions (mirrors backend SUBSCRIPTION_PLANS) ──────

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    commission: '10%',
    color: 'gray',
    features: [
      'Standard 10% escrow commission',
      'Unlimited listings',
      'Escrow-backed payments',
      'Seller dashboard & analytics',
      'Wallet & withdrawals',
    ],
  },
  {
    id: 'PRO',
    name: 'Seller Pro',
    price: 19.99,
    commission: '5%',
    color: 'violet',
    features: [
      'Public shareable live store link',
      'Half-price 5% escrow commission',
      'Verified "Seller Pro" badge',
      'Up to 3 featured listings',
      'Priority search placement',
      'Advanced store analytics',
      'Priority support',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Seller Pro Premium',
    price: 49.99,
    commission: '3%',
    color: 'yellow',
    features: [
      'Everything in Seller Pro',
      'Lowest 3% escrow commission',
      'Up to 10 featured listings',
      'Premium store theme & branding',
      'Top-of-search "Verified Pro" boost',
      'Dedicated account manager',
    ],
  },
] as const;

const NOTIF_LABELS: Record<keyof NotificationPrefs, { label: string; desc: string }> = {
  ORDER_STATUS:     { label: 'Order Status Updates',  desc: 'Alerts when your orders change status' },
  MESSAGE:          { label: 'New Messages',           desc: 'Alerts when buyers message you' },
  DISPUTE:          { label: 'Dispute Opened',         desc: 'Notified when a dispute is raised on your order' },
  WITHDRAWAL:       { label: 'Withdrawals & Payments', desc: 'Alerts about wallet credits and payouts' },
  LISTING_APPROVED: { label: 'Listing Approved',       desc: 'When your listing passes review' },
  LISTING_REJECTED: { label: 'Listing Rejected',       desc: 'When your listing is declined with a reason' },
  KYC_APPROVED:     { label: 'KYC Approved',           desc: 'When your identity verification passes' },
  KYC_REJECTED:     { label: 'KYC Rejected',           desc: 'When your KYC needs re-submission' },
  SYSTEM:           { label: 'System Announcements',   desc: 'Platform updates and maintenance notices' },
};

// ─── Small reusable components ────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
        ${checked ? 'bg-brand' : 'bg-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SellerSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'store' | 'notifications' | 'payment' | 'security'>('store');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // — Store tab state
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [responseTime, setResponseTime] = useState(24);
  const [savingStore, setSavingStore] = useState(false);

  // — Notifications tab state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs | null>(null);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [savingNotif, setSavingNotif] = useState<string | null>(null);

  // — Security tab state
  const [showPwModal, setShowPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  }, []);

  // ─── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }

    async function loadSeller() {
      try {
        const res = await api.get<{ success: boolean; data: SellerProfile }>('/sellers/me');
        if (res.success) {
          setSeller(res.data);
          setStoreName(res.data.storeName ?? '');
          setStoreDescription(res.data.storeDescription ?? '');
          setResponseTime(res.data.responseTime ?? 24);
        }
      } catch {
        showToast('Failed to load seller profile', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadSeller();
  }, [user, authLoading, router, showToast]);

  // Load notification preferences when tab becomes active
  useEffect(() => {
    if (activeTab !== 'notifications' || notifPrefs) return;
    setLoadingNotifs(true);
    api.get<{ success: boolean; data: NotificationPrefs }>('/notifications/preferences')
      .then((res) => res.success && setNotifPrefs(res.data))
      .catch(() => showToast('Failed to load notification preferences', 'error'))
      .finally(() => setLoadingNotifs(false));
  }, [activeTab, notifPrefs, showToast]);

  // ─── Store save ───────────────────────────────────────────────────────────

  const saveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || storeName.trim().length < 3) {
      showToast('Store name must be at least 3 characters', 'error');
      return;
    }
    setSavingStore(true);
    try {
      // PATCH /sellers/me/settings — self-service route added in this overhaul
      const res = await api.patch<{ success: boolean; data: SellerProfile }>('/sellers/me/settings', {
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
        responseTime,
      });
      if (res.success) {
        setSeller(res.data);
        showToast('Store settings saved', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSavingStore(false);
    }
  };

  // ─── Notification toggle ──────────────────────────────────────────────────

  const toggleNotif = async (key: keyof NotificationPrefs) => {
    if (!notifPrefs) return;
    const newVal = !notifPrefs[key];
    setNotifPrefs((prev) => prev ? { ...prev, [key]: newVal } : prev);
    setSavingNotif(key);
    try {
      const res = await api.patch<{ success: boolean; data: NotificationPrefs }>(
        '/notifications/preferences', { [key]: newVal }
      );
      if (res.success) setNotifPrefs(res.data);
    } catch (err: any) {
      // Revert on failure
      setNotifPrefs((prev) => prev ? { ...prev, [key]: !newVal } : prev);
      showToast(err.message || 'Failed to update preference', 'error');
    } finally {
      setSavingNotif(null);
    }
  };

  // ─── Change password ──────────────────────────────────────────────────────

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { showToast('New password must be at least 8 characters', 'error'); return; }
    if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return; }
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      showToast('Password changed successfully', 'success');
      setShowPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  // ─── Deactivate account ───────────────────────────────────────────────────

  const deactivateAccount = async () => {
    setDeactivating(true);
    try {
      await api.patch('/users/me/deactivate', {});
      showToast('Account deactivated. Redirecting…', 'success');
      setTimeout(() => { localStorage.removeItem('piyrox_token'); router.push('/'); }, 1500);
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate account', 'error');
    } finally {
      setDeactivating(false);
      setShowDeactivateConfirm(false);
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const tierColor = seller?.subscriptionTier === 'PREMIUM'
    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : seller?.subscriptionTier === 'PRO'
    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
    : 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Seller Settings</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tierColor}`}>
            {seller?.subscriptionTier ?? 'FREE'}
          </span>
          {seller?.isVerified ? (
            <VerifiedBadge size="md" label="Verified Seller" />
          ) : (
            <Link href="/seller/kyc"
              className="text-xs font-bold px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1 hover:bg-violet-500/20 transition">
              <Shield className="w-3 h-3" /> Get Verified
            </Link>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 bg-cardBg border border-borderBg rounded-xl p-1">
        {([
          { id: 'store',         icon: Store,      label: 'Store Info' },
          { id: 'notifications', icon: Bell,       label: 'Notifications' },
          { id: 'payment',       icon: CreditCard, label: 'Payment' },
          { id: 'security',      icon: Lock,       label: 'Security' },
        ] as const).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition
              ${activeTab === tab.id ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-hoverBg/50'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── STORE INFO TAB ── */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          {/* Store Profile card */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Store className="w-5 h-5 text-brand" /> Store Profile
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-brand to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl font-black text-white">
                {storeName[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Store Name</p>
                <p className="text-lg font-bold text-white">{seller?.storeName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Level: <span className="text-brand font-semibold">{seller?.sellerLevel}</span>
                  {' · '}Rating: <span className="text-yellow-400 font-semibold">
                    {seller?.averageRating ? seller.averageRating.toFixed(1) : '—'}
                  </span>
                  {' · '}Sales: <span className="text-emerald-400 font-semibold">{seller?.totalSales ?? 0}</span>
                </p>
              </div>
            </div>

            <form onSubmit={saveStoreSettings} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Store Name <span className="text-red-400">*</span>
                </label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
                  minLength={3} maxLength={100} required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Store Description
                </label>
                <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)}
                  rows={4} maxLength={1000}
                  placeholder="Describe your store, what you sell, and your service quality…"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition resize-none" />
                <p className="text-xs text-gray-500 mt-1 text-right">{storeDescription.length}/1000</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Average Response Time
                </label>
                <select value={responseTime} onChange={(e) => setResponseTime(Number(e.target.value))}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition">
                  {[1, 2, 4, 8, 12, 24].map((h) => (
                    <option key={h} value={h}>{h === 1 ? '1 hour' : `${h} hours`}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Faster response times improve your visibility in search results.
                </p>
              </div>

              <button type="submit" disabled={savingStore}
                className="flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:opacity-90 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-50 transition">
                {savingStore ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Save Changes</>}
              </button>
            </form>
          </div>

          {/* Verification prompt */}
          {seller && !seller.isVerified && (
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl flex-shrink-0">
                  <Shield className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Unlock Verified Seller Status</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    KYC-verified sellers get higher trust, better visibility and access to premium features.
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {['Higher listing limits', 'Verified badge on your store', 'Priority customer support', 'Better search ranking'].map((f) => (
                      <li key={f} className="text-xs text-gray-300 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/seller/kyc"
                    className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-yellow-500/20">
                    <Shield className="w-4 h-4" /> Start Verification
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Subscription / Upgrade */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" /> Upgrade Your Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = seller?.subscriptionTier === plan.id;
                const borderCls = isCurrent ? 'border-brand bg-brand/5' : 'border-borderBg hover:border-brand/30';
                const btnCls = isCurrent
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : plan.id === 'PREMIUM'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white'
                  : 'bg-brand hover:opacity-90 text-white';
                return (
                  <div key={plan.id} className={`relative rounded-2xl border ${borderCls} p-5 transition-all`}>
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-3 py-0.5 rounded-full">
                        Current Plan
                      </div>
                    )}
                    {plan.id === 'PRO' && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-lg font-black text-white mb-0.5">{plan.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">
                      {plan.id === 'FREE' ? 'No monthly fee' : <span className="text-2xl font-black text-brand">${plan.price}<span className="text-xs text-gray-500 font-normal">/mo</span></span>}
                    </p>
                    <p className="text-xs text-emerald-400 font-semibold mb-3">{plan.commission} commission</p>
                    <ul className="space-y-1.5 mb-5">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-gray-400 flex items-start gap-2">
                          <Check className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button disabled={isCurrent}
                      onClick={() => !isCurrent && router.push('/seller/pro')}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${btnCls}`}>
                      {isCurrent ? 'Current Plan' : plan.id === 'FREE' ? 'Downgrade' : 'Upgrade'}
                    </button>
                  </div>
                );
              })}
            </div>
            {seller?.subscriptionEndsAt && seller.subscriptionTier !== 'FREE' && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                Your {seller.subscriptionTier} plan renews on{' '}
                <span className="text-white font-semibold">
                  {new Date(seller.subscriptionEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand" /> Notification Preferences
          </h2>
          <p className="text-xs text-gray-500">
            Choose which events trigger a notification. Changes are saved immediately.
          </p>

          {loadingNotifs ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
            </div>
          ) : notifPrefs ? (
            <div className="space-y-2">
              {(Object.keys(NOTIF_LABELS) as (keyof NotificationPrefs)[]).map((key) => {
                const { label, desc } = NOTIF_LABELS[key];
                const isSaving = savingNotif === key;
                return (
                  <div key={key}
                    className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl border border-borderBg/40">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 text-brand animate-spin flex-shrink-0" />
                    ) : (
                      <Toggle checked={notifPrefs[key]} onChange={() => toggleNotif(key)} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              Could not load preferences.{' '}
              <button className="text-brand hover:underline" onClick={() => setNotifPrefs(null)}>Retry</button>
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENT TAB ── */}
      {activeTab === 'payment' && (
        <div className="space-y-5">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand" /> Payment & Payouts
            </h2>

            {/* KYC status block */}
            <div className={`flex items-start gap-4 p-4 rounded-xl border
              ${seller?.kycStatus === 'APPROVED'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : seller?.kycStatus === 'SUBMITTED'
                ? 'bg-blue-500/10 border-blue-500/30'
                : seller?.kycStatus === 'REJECTED'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'}`}>
              <div className={`p-2.5 rounded-xl flex-shrink-0
                ${seller?.kycStatus === 'APPROVED' ? 'bg-emerald-500/20' : 'bg-yellow-500/20'}`}>
                <Shield className={`w-6 h-6 ${seller?.kycStatus === 'APPROVED' ? 'text-emerald-400' : 'text-yellow-400'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  Identity Verification (KYC) —{' '}
                  <span className={seller?.kycStatus === 'APPROVED' ? 'text-emerald-400' : 'text-yellow-400'}>
                    {seller?.kycStatus === 'APPROVED' ? 'Approved'
                      : seller?.kycStatus === 'SUBMITTED' ? 'Under Review'
                      : seller?.kycStatus === 'REJECTED' ? 'Rejected'
                      : 'Not Submitted'}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {seller?.kycStatus === 'APPROVED'
                    ? 'Your identity is verified. You have access to full withdrawal limits.'
                    : seller?.kycStatus === 'SUBMITTED'
                    ? 'Your documents are under review. We\'ll notify you within 24 hours.'
                    : seller?.kycStatus === 'REJECTED'
                    ? 'Your KYC was rejected. Please re-submit with clearer documents.'
                    : 'Complete KYC verification to unlock withdrawals and higher order limits.'}
                </p>
                {seller?.kycStatus !== 'APPROVED' && seller?.kycStatus !== 'SUBMITTED' && (
                  <Link href="/seller/kyc"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition">
                    <Shield className="w-3.5 h-3.5" /> Complete Verification <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Earnings summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-hoverBg/30 rounded-xl p-4 border border-borderBg/40">
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-xl font-black text-emerald-400">
                  ${typeof seller?.totalRevenue === 'number' ? seller.totalRevenue.toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="bg-hoverBg/30 rounded-xl p-4 border border-borderBg/40">
                <p className="text-xs text-gray-500 mb-1">Total Sales</p>
                <p className="text-xl font-black text-white">{seller?.totalSales ?? 0}</p>
              </div>
              <div className="bg-hoverBg/30 rounded-xl p-4 border border-borderBg/40">
                <p className="text-xs text-gray-500 mb-1">Commission Rate</p>
                <p className="text-xl font-black text-brand">
                  {seller?.subscriptionTier === 'PREMIUM' ? '3%'
                    : seller?.subscriptionTier === 'PRO' ? '5%'
                    : seller?.kycStatus === 'APPROVED' ? '9%' : '10%'}
                </p>
              </div>
            </div>

            {/* Wallet CTA */}
            <Link href="/wallet"
              className="flex items-center justify-between p-4 bg-brand/10 border border-brand/30 rounded-xl hover:bg-brand/20 transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Piyrox Wallet</p>
                  <p className="text-xs text-gray-400">View balance, withdraw funds, transaction history</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-brand group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-400">
                <span className="font-bold">Note:</span> Withdrawals require approved KYC verification.
                Upgrade to Seller Pro or Premium to reduce your commission rate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand" /> Security Settings
            </h2>

            {/* Change Password row */}
            <div className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl border border-borderBg/40">
              <div>
                <p className="text-sm font-semibold text-white">Change Password</p>
                <p className="text-xs text-gray-400">Update your account password</p>
              </div>
              <button
                onClick={() => setShowPwModal(true)}
                className="text-xs font-bold text-brand hover:text-brand-light border border-brand/30 hover:border-brand/60 px-3 py-1.5 rounded-lg transition"
              >
                Change
              </button>
            </div>

            {/* KYC / Verified row */}
            <div className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl border border-borderBg/40">
              <div>
                <p className="text-sm font-semibold text-white">Identity Verification (KYC)</p>
                <p className="text-xs text-gray-400">
                  Status:{' '}
                  <span className={
                    seller?.kycStatus === 'APPROVED' ? 'text-emerald-400 font-semibold' :
                    seller?.kycStatus === 'SUBMITTED' ? 'text-blue-400 font-semibold' :
                    seller?.kycStatus === 'REJECTED' ? 'text-red-400 font-semibold' :
                    'text-yellow-400 font-semibold'
                  }>
                    {seller?.kycStatus === 'APPROVED' ? 'Verified'
                      : seller?.kycStatus === 'SUBMITTED' ? 'Under Review'
                      : seller?.kycStatus === 'REJECTED' ? 'Rejected — re-submit'
                      : 'Not submitted'}
                  </span>
                </p>
              </div>
              <Link
                href="/seller/kyc"
                className="text-xs font-bold text-brand hover:text-brand-light border border-brand/30 hover:border-brand/60 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
              >
                {seller?.kycStatus === 'APPROVED' ? 'View' : 'Complete'} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Active sessions — informational */}
            <div className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl border border-borderBg/40">
              <div>
                <p className="text-sm font-semibold text-white">Active Sessions</p>
                <p className="text-xs text-gray-400">Manage devices signed into your account</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-xs text-emerald-400 font-semibold">This device</span>
              </div>
            </div>

            {/* Subscription tier — informational */}
            <div className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl border border-borderBg/40">
              <div>
                <p className="text-sm font-semibold text-white">Seller Plan</p>
                <p className="text-xs text-gray-400">
                  You are on the <span className="text-brand font-semibold">{seller?.subscriptionTier ?? 'FREE'}</span> plan
                  {seller?.subscriptionEndsAt && seller?.subscriptionTier !== 'FREE' && (
                    <> · renews {new Date(seller.subscriptionEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('store')}
                className="text-xs font-bold text-brand hover:text-brand-light border border-brand/30 hover:border-brand/60 px-3 py-1.5 rounded-lg transition"
              >
                Manage
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-cardBg border border-red-500/20 rounded-2xl p-6">
            <h3 className="text-base font-bold text-red-400 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Deactivating your account will hide your listings and pause all active orders. You can reactivate later.
            </p>
            <button
              onClick={() => setShowDeactivateConfirm(true)}
              className="text-sm font-bold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 px-4 py-2 rounded-xl transition"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand" /> Change Password
              </h3>
              <button onClick={() => { setShowPwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={changePassword} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    required
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-brand transition"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  New Password <span className="text-gray-600 normal-case font-normal">(min 8 chars)</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required minLength={8}
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-brand transition"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                  className={`w-full bg-background border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition
                    ${confirmPw && confirmPw !== newPw ? 'border-red-500' : 'border-borderBg focus:border-brand'}`}
                />
                {confirmPw && confirmPw !== newPw && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setShowPwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white border border-borderBg hover:border-borderBg/80 transition">
                  Cancel
                </button>
                <button type="submit" disabled={savingPw || (!!confirmPw && confirmPw !== newPw)}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand hover:opacity-90 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition">
                  {savingPw ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DEACTIVATE CONFIRM MODAL ── */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-cardBg border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Deactivate Account?</h3>
            </div>
            <p className="text-sm text-gray-400">
              Your listings will be hidden and active orders will be paused. Your account data is retained and you can reactivate at any time by logging back in.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white border border-borderBg transition">
                Cancel
              </button>
              <button onClick={deactivateAccount} disabled={deactivating}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition">
                {deactivating ? <><Loader2 className="w-4 h-4 animate-spin" /> Deactivating…</> : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
