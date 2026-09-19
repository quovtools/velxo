'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { fileToDataUrl } from '@/lib/file';
import { uploadAvatar } from '@/lib/upload';
import Link from 'next/link';
import {
  User, Mail, Phone, ShieldCheck, Camera,
  Check, AlertTriangle, Loader2, Lock, LogOut,
  Bell, Globe, Package, Star, Wallet, Settings,
  Eye, EyeOff, AlertCircle, ChevronRight, Crown
} from 'lucide-react';

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  notificationPreferences?: Record<string, boolean> | null;
}

interface CreatorProfile {
  status: string;
  isVerified: boolean;
  tier: string;
  handle: string | null;
}

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-xl fade-in ${
      ok ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/30' : 'bg-red-900/90 text-red-200 border-red-500/30'
    }`}>
      {ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
] as const;
type TabId = typeof TABS[number]['id'];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabId>('account');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatar] = useState('');

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    orderUpdates: true,
    newMessages: true,
    listingApprovals: true,
    payments: true,
    promotions: false,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeOrderCount, setActiveOrderCount] = useState<number | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  const showToast = (msg: string, ok: boolean) => setToast({ msg, ok });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }

    // Seed from the session so the profile is never empty while /auth/me loads
    // (or if it fails) — important for Google sign-in where session already has the data.
    setProfile(prev => prev ?? {
      id: user.id,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: '',
      avatarUrl: '',
      emailVerified: !!user.emailVerified,
      role: user.role,
      createdAt: '',
    });

    api.get<{ success: boolean; data: ProfileData }>('/auth/me')
      .then(res => {
        if (res.success && res.data) {
          const p = res.data;
          setProfile(p);
          setFirstName(p.firstName || '');
          setLastName(p.lastName || '');
          setPhone(p.phone || '');
          setAvatar(p.avatarUrl || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load active order count for the quick-link badge
    api.get<{ success: boolean; data: any[] }>('/orders/me')
      .then(res => {
        if (res.success) {
          const active = (res.data || []).filter((o: any) =>
            !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.status)
          );
          setActiveOrderCount(active.length);
        }
      })
      .catch(() => {});

    // Load creator profile for badge
    api.get<{ data: CreatorProfile | null }>('/affiliate/creator/me')
      .then(res => setCreatorProfile((res as any).data))
      .catch(() => {});
  }, [user, authLoading, router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch<{ success: boolean; data: any }>('/users/me', { firstName, lastName, phone });
      if (avatarUrl !== profile?.avatarUrl) {
        await api.post('/users/avatar', { avatarUrl });
      }
      updateUser({ firstName, lastName });
      setProfile(prev => prev ? { ...prev, firstName, lastName, phone, avatarUrl } : prev);
      showToast('Profile updated', true);
    } catch (err: any) {
      showToast(err.message || 'Update failed', false);
    } finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { showToast('Passwords do not match', false); return; }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters', false); return; }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      showToast('Password changed successfully', true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      showToast(err.message || 'Password change failed', false);
    } finally { setSaving(false); }
  };

  const resendVerification = async () => {
    try {
      await api.post('/auth/resend-verification', {});
      showToast('Verification email sent!', true);
    } catch (err: any) {
      showToast(err.message || 'Failed to send email', false);
    }
  };

  const saveNotif = async () => {
    setSavingNotif(true);
    try {
      await api.patch<{ success: boolean; data: any }>('/users/me', { notificationPreferences: notifPrefs });
      showToast('Notification preferences saved', true);
    } catch (err: any) {
      showToast(err.message || 'Failed to save preferences', false);
    } finally { setSavingNotif(false); }
  };

  const deactivateAccount = async () => {
    setSaving(true);
    try {
      await api.patch<{ success: boolean }>('/users/me/deactivate');
      logout();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account', false);
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 py-6">
      <div className="h-28 skeleton rounded-2xl" />
      <div className="h-12 skeleton rounded-xl w-64" />
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );

  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '';

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4 fade-in">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Settings className="w-5 h-5 text-brand" /> Profile Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your account information, security and preferences.</p>
        </div>
        <button onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 border border-red-500/20 rounded-xl transition">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={initials} className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--border-bg)]" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand/15 border border-brand/25 flex items-center justify-center">
                <span className="text-2xl font-black text-brand">{initials}</span>
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-light transition shadow-lg">
              <Camera className="w-3 h-3 text-black" />
              <input type="file" accept="image/*" className="sr-only" onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await uploadAvatar(file);
                  setAvatar(url);
                } catch {
                  const dataUrl = await fileToDataUrl(file);
                  setAvatar(dataUrl);
                }
              }} />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-white">{profile?.firstName} {profile?.lastName}</h2>
            <p className="text-gray-500 text-sm truncate">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] text-gray-500">Member since {memberSince}</span>
              {profile?.emailVerified ? (
                <span className="text-[10px] text-brand flex items-center gap-0.5 bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
                  <Check className="w-2.5 h-2.5" /> Verified
                </span>
              ) : (
                <button onClick={resendVerification}
                  className="text-[10px] text-yellow-400 flex items-center gap-0.5 bg-yellow-900/20 px-2 py-0.5 rounded-full border border-yellow-500/20 hover:bg-yellow-900/30 transition">
                  <AlertTriangle className="w-2.5 h-2.5" /> Verify email
                </button>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                profile?.role === 'SELLER' ? 'bg-brand/10 text-brand border-brand/20' :
                profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-white/5 text-gray-400 border-white/10'
              }`}>{profile?.role}</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col gap-2">
            <Link href="/sell" className="flex items-center gap-1.5 bg-brand hover:bg-brand-light text-black font-bold text-xs px-4 py-2 rounded-xl transition">
              Sell on Piyrox
            </Link>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-[var(--border-bg)]">
          <Link href="/orders" className="relative flex flex-col items-center gap-1 p-3 bg-black/20 rounded-xl hover:bg-brand/10 hover:border-brand/20 border border-transparent transition">
            <Package className="w-4 h-4 text-brand" />
            <span className="text-[10px] text-gray-400">Orders</span>
            {activeOrderCount != null && activeOrderCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand text-black text-[9px] font-bold flex items-center justify-center">
                {activeOrderCount > 9 ? '9+' : activeOrderCount}
              </span>
            )}
          </Link>
          <Link href="/wallet" className="flex flex-col items-center gap-1 p-3 bg-black/20 rounded-xl hover:bg-brand/10 hover:border-brand/20 border border-transparent transition">
            <Wallet className="w-4 h-4 text-brand" />
            <span className="text-[10px] text-gray-400">Wallet</span>
          </Link>
          {profile?.role === 'SELLER' ? (
            <Link href="/seller/dashboard" className="flex flex-col items-center gap-1 p-3 bg-black/20 rounded-xl hover:bg-brand/10 hover:border-brand/20 border border-transparent transition">
              <Settings className="w-4 h-4 text-brand" />
              <span className="text-[10px] text-gray-400">Store</span>
            </Link>
          ) : (
            <Link href="/sell" className="flex flex-col items-center gap-1 p-3 bg-black/20 rounded-xl hover:bg-brand/10 hover:border-brand/20 border border-transparent transition">
              <Star className="w-4 h-4 text-brand" />
              <span className="text-[10px] text-gray-400">Sell</span>
            </Link>
          )}
          <Link href="/affiliate" className="flex flex-col items-center gap-1 p-3 bg-black/20 rounded-xl hover:bg-brand/10 hover:border-brand/20 border border-transparent transition">
            <Crown className={`w-4 h-4 ${creatorProfile?.status === 'APPROVED' ? 'text-brand' : 'text-gray-500'}`} />
            <span className="text-[10px] text-gray-400">{creatorProfile?.status === 'APPROVED' ? 'Creator' : 'Affiliate'}</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-none gap-1 bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap flex-1 justify-center ${
                tab === t.id
                  ? 'bg-brand text-black shadow-sm shadow-brand/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Account */}
      {tab === 'account' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-5 md:p-6 space-y-5">
          <h2 className="text-base font-black text-white flex items-center gap-2"><User className="w-5 h-5 text-brand" /> Personal Info</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-black/30 border border-[var(--border-bg)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full bg-black/30 border border-[var(--border-bg)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" value={profile?.email || ''} disabled
                  className="w-full bg-[var(--hover-bg)]/40 border border-[var(--border-bg)] rounded-xl pl-10 pr-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full bg-background border border-[var(--border-bg)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Profile Picture</label>
              <label className="flex items-center gap-2 cursor-pointer bg-black/30 border border-[var(--border-bg)] rounded-xl px-4 py-3 text-sm text-gray-400 focus-within:border-brand transition overflow-hidden">
                {avatarUrl ? <span className="truncate text-white">Image selected</span> : <span>Choose a photo…</span>}
                <input type="file" accept="image/*" className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadAvatar(file);
                      setAvatar(url);
                    } catch {
                      // fallback to local preview if upload fails
                      setAvatar(await fileToDataUrl(file));
                    }
                  }} />
              </label>
              <p className="text-xs text-gray-500 mt-1">Upload a photo from your device</p>
            </div>
            {avatarUrl && (
              <div className="flex items-center gap-3 p-3 bg-[var(--hover-bg)]/40 rounded-xl border border-[var(--border-bg)]">
                <img src={avatarUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-[var(--border-bg)]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-xs text-gray-400">Preview</span>
              </div>
            )}
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Security */}
      {tab === 'security' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-5 md:p-6 space-y-5">
          <h2 className="text-base font-black text-white flex items-center gap-2"><Lock className="w-5 h-5 text-brand" /> Change Password</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                placeholder="Your current password"
                className="w-full bg-black/30 border border-[var(--border-bg)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">New Password</label>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-black/30 border border-[var(--border-bg)] rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-brand transition" />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-black/30 border border-[var(--border-bg)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
              {confirmPw && newPw !== confirmPw && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords don&apos;t match</p>
              )}
            </div>
            <button type="submit" disabled={saving || !currentPw || !newPw || newPw !== confirmPw}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
            </button>
          </form>

          <div className="border-t border-[var(--border-bg)] pt-5">
            <h3 className="text-sm font-bold text-white mb-3">Danger Zone</h3>
            <div className="space-y-3">
              <button onClick={logout}
                className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border-bg)] text-gray-300 hover:bg-[var(--hover-bg)] rounded-xl text-sm font-medium transition">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-900/20 rounded-xl text-sm font-medium transition">
                  <AlertTriangle className="w-4 h-4" /> Delete Account
                </button>
              ) : (
                <div className="p-4 bg-red-900/10 border border-red-500/30 rounded-xl space-y-3">
                  <p className="text-sm text-red-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Are you sure? This cannot be undone.</p>
                  <div className="flex items-center gap-2">
                    <button onClick={deactivateAccount} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Confirm Delete'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                      className="px-4 py-2 border border-[var(--border-bg)] text-gray-300 hover:bg-[var(--hover-bg)] rounded-xl text-sm font-medium transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notifications */}
      {tab === 'notifications' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2"><Bell className="w-5 h-5 text-brand" /> Notification Preferences</h2>
          <p className="text-xs text-gray-500">Manage how you receive notifications from Piyrox. Changes are saved automatically via the button below.</p>
          <div className="space-y-3">
            {[
              { key: 'orderUpdates', label: 'Order Updates', desc: 'When your order status changes' },
              { key: 'newMessages', label: 'New Messages', desc: 'When you receive a new message' },
              { key: 'listingApprovals', label: 'Listing Approvals', desc: 'When your listing goes live or is rejected' },
              { key: 'payments', label: 'Payment Notifications', desc: 'When money hits your wallet' },
              { key: 'promotions', label: 'Promotions', desc: 'Special offers and new features' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-[var(--hover-bg)]/30 rounded-xl border border-[var(--border-bg)]/50">
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <button type="button" onClick={() => setNotifPrefs(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${notifPrefs[item.key] ? 'bg-brand' : 'bg-gray-600'}`}
                  aria-pressed={notifPrefs[item.key]}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={saveNotif} disabled={savingNotif}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
            {savingNotif ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Preferences</>}
          </button>
          <p className="text-xs text-emerald-400/80">Your preferences are stored on your account and applied across all devices.</p>
        </div>
      )}

      {/* Tab: Verification */}
      {tab === 'verification' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl p-5 md:p-6 space-y-5">
          <h2 className="text-base font-black text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-brand" /> Account Verification</h2>
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center justify-between p-4 bg-[var(--hover-bg)]/30 rounded-xl border border-[var(--border-bg)]/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${profile?.emailVerified ? 'bg-emerald-500/10' : 'bg-yellow-500/10'}`}>
                  <Mail className={`w-5 h-5 ${profile?.emailVerified ? 'text-emerald-400' : 'text-yellow-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Email Address</p>
                  <p className="text-xs text-gray-400">{profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  profile?.emailVerified
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  {profile?.emailVerified ? 'Verified' : 'Unverified'}
                </span>
                {!profile?.emailVerified && (
                  <button onClick={resendVerification}
                    className="text-xs text-brand hover:text-brand-light font-medium">
                    Send link
                  </button>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-4 bg-[var(--hover-bg)]/30 rounded-xl border border-[var(--border-bg)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Phone Number</p>
                  <p className="text-xs text-gray-400">{phone || 'Not added'}</p>
                </div>
              </div>
              <button onClick={() => setTab('account')}
                className="text-xs text-brand hover:text-brand-light font-medium flex items-center gap-1">
                {phone ? 'Change' : 'Add'} <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* KYC */}
            <div className="flex items-center justify-between p-4 bg-[var(--hover-bg)]/30 rounded-xl border border-[var(--border-bg)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Identity (KYC)</p>
                  <p className="text-xs text-gray-400">Not submitted</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                Not Started
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-brand/10 to-purple-600/10 border border-brand/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-white">Get Verified Seller Status</p>
            <p className="text-xs text-gray-400">Complete identity verification to unlock higher limits, verified badge, and buyer trust.</p>
              <Link href="/seller/kyc"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2 rounded-xl text-xs font-bold text-white transition mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Start KYC
              </Link>
          </div>
        </div>
      )}
    </div>
  );
}
