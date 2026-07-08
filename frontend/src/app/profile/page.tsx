'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  User, Mail, Phone, ShieldCheck, Camera,
  Check, AlertTriangle, Loader2, Lock, LogOut,
  Settings, Bell, CreditCard, Globe
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
}

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-xl fade-in ${
      ok ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/30' : 'bg-red-900/90 text-red-200 border-red-500/30'
    }`}>
      {ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

const TABS = ['Account', 'Notifications', 'Security', 'Verification', 'Language'] as const;
type Tab = typeof TABS[number];

export default function ProfilePage() {
  const router        = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState<Tab>('Account');
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  // Account form
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [avatarUrl, setAvatar]    = useState('');

  // Security form
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: ProfileData }>('/auth/me');
        if (res.success && res.data) {
          const p = res.data;
          setProfile(p);
          setFirstName(p.firstName || '');
          setLastName(p.lastName   || '');
          setPhone(p.phone         || '');
          setAvatar(p.avatarUrl    || '');
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, router]);

  const showToast = (msg: string, ok: boolean) => setToast({ msg, ok });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', { firstName, lastName, phone, avatarUrl });
      showToast('Profile updated successfully', true);
    } catch (err: any) {
      showToast(err.message || 'Update failed', false);
    } finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { showToast('Passwords do not match', false); return; }
    if (newPw.length < 8)    { showToast('Password must be at least 8 characters', false); return; }
    setSaving(true);
    try {
      await api.post('/auth/reset-password', { newPassword: newPw });
      showToast('Password changed successfully', true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      showToast(err.message || 'Password change failed', false);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-6 py-6 fade-in max-w-3xl mx-auto">
      <div className="h-32 skeleton rounded-2xl" />
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );

  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const roleColor = { ADMIN: 'text-red-400', SUPER_ADMIN: 'text-red-400', SELLER: 'text-yellow-400', BUYER: 'text-brand-light', MODERATOR: 'text-purple-400' };

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-4 fade-in">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      {/* Profile header - Mobile friendly */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-5 md:p-6">
        <div className="flex items-start gap-4 md:gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={initials}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-borderBg" />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-brand/10 border-2 border-brand/20 flex items-center justify-center">
                <span className="text-xl md:text-2xl font-black text-brand-light">{initials}</span>
              </div>
            )}
            <button className="absolute -bottom-1 -right-1 w-7 h-7 md:w-8 md:h-8 bg-brand rounded-lg flex items-center justify-center shadow-lg">
              <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl md:text-2xl font-black truncate">{profile?.firstName} {profile?.lastName}</h1>
              <button onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/20 border border-red-500/20 rounded-xl transition">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
            <p className="text-gray-500 text-sm md:text-base truncate mb-3">{profile?.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-hoverBg border border-borderBg ${(roleColor as any)[profile?.role || 'BUYER'] || 'text-gray-400'}`}>
                {profile?.role}
              </span>
              {profile?.emailVerified
                ? <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Email verified
                  </span>
                : <span className="text-xs text-yellow-400 flex items-center gap-1 bg-yellow-900/20 px-2 py-0.5 rounded-full border border-yellow-500/20">
                    <AlertTriangle className="w-3 h-3" /> Verify email
                  </span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Mobile tabs */}
      <div className="flex overflow-x-auto scrollbar-none gap-1 bg-cardBg border border-borderBg rounded-xl p-1 w-fit md:w-full md:justify-center">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              tab === t ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-hoverBg/50'
            }`}>
            {t === 'Account' && <User className="w-4 h-4" />}
            {t === 'Notifications' && <Bell className="w-4 h-4" />}
            {t === 'Security' && <Lock className="w-4 h-4" />}
            {t === 'Verification' && <ShieldCheck className="w-4 h-4" />}
            {t === 'Language' && <Globe className="w-4 h-4" />}
            <span className="hidden sm:inline">{t}</span>
          </button>
        ))}
      </div>

      {/* Tab: Account */}
      {tab === 'Account' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 md:p-6 space-y-5">
          <h2 className="font-bold flex items-center gap-2 text-lg md:text-xl"><User className="w-5 h-5 text-brand" /> Personal Information</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" value={profile?.email || ''} disabled
                  className="w-full bg-hoverBg/40 border border-borderBg rounded-xl pl-10 pr-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full bg-background border border-borderBg rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Avatar URL</label>
              <input type="url" value={avatarUrl} onChange={e => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
            </div>

            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-sm md:text-base font-bold transition text-white disabled:opacity-50 shadow-lg shadow-brand/20">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Notifications */}
      {tab === 'Notifications' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2 text-lg md:text-xl"><Bell className="w-5 h-5 text-brand" /> Notifications</h2>
          <div className="space-y-3">
            {[
              { label: 'Email Notifications', desc: 'Receive updates via email', enabled: true },
              { label: 'Order Updates', desc: 'Get notified when orders change', enabled: true },
              { label: 'New Messages', desc: 'Alerts for new messages', enabled: true },
              { label: 'Promotional Emails', desc: 'Special offers and updates', enabled: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl border border-borderBg/50">
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${item.enabled ? 'bg-brand' : 'bg-gray-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${item.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {tab === 'Security' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 md:p-6 space-y-5">
          <h2 className="font-bold flex items-center gap-2 text-lg md:text-xl"><Lock className="w-5 h-5 text-brand" /> Security</h2>
          <div className="space-y-4">
            <div className="p-4 bg-hoverBg/30 rounded-xl border border-borderBg/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">Password</p>
                  <p className="text-xs text-gray-400 mt-0.5">Last changed: {new Date().toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Secure
                </span>
              </div>
              <button onClick={() => setTab('Security')} className="text-sm text-brand hover:text-brand-light font-medium">
                Change Password
              </button>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white mt-4">Change Password</h3>
          <form onSubmit={changePassword} className="space-y-4">
            {[
              { label: 'Current Password', val: currentPw, set: setCurrentPw, ph: '••••••••' },
              { label: 'New Password',     val: newPw,     set: setNewPw,     ph: 'Min. 8 characters' },
              { label: 'Confirm Password', val: confirmPw, set: setConfirmPw, ph: 'Repeat new password' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{f.label}</label>
                <input type="password" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
              </div>
            ))}
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-sm md:text-base font-bold transition text-white disabled:opacity-50 shadow-lg shadow-brand/20">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Verification */}
      {tab === 'Verification' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 md:p-6 space-y-5">
          <h2 className="font-bold flex items-center gap-2 text-lg md:text-xl"><ShieldCheck className="w-5 h-5 text-brand" /> Identity Verification</h2>

          <div className="space-y-3">
            {[
              { label: 'Email Address', value: profile?.email, status: profile?.emailVerified ? 'verified' : 'pending', icon: Mail },
              { label: 'Phone Number',  value: phone || 'Not provided', status: phone ? 'pending' : 'missing', icon: Phone },
              { label: 'Identity (KYC)', value: profile?.isVerified ? 'Verified' : 'Not submitted', status: profile?.isVerified ? 'verified' : 'missing', icon: ShieldCheck },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl border border-borderBg/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.status === 'verified' ? 'bg-emerald-500/10' : 'bg-gray-500/10'
                    }`}>
                      <Icon className={`w-5 h-5 ${item.status === 'verified' ? 'text-emerald-400' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    item.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    item.status === 'pending'  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {item.status === 'verified' ? 'Verified' : item.status === 'pending' ? 'Pending' : 'Not Verified'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-500/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Upgrade to Verified Seller</h3>
            <p className="text-xs text-gray-400 mb-3">
              Complete KYC verification to unlock higher selling limits, verified badge, and priority support.
            </p>
            <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-xl text-xs font-bold transition text-white">
              <ShieldCheck className="w-4 h-4" /> Start Verification
            </button>
          </div>
        </div>
      )}

      {/* Tab: Language */}
      {tab === 'Language' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 md:p-6 space-y-5">
          <h2 className="font-bold flex items-center gap-2 text-lg md:text-xl"><Globe className="w-5 h-5 text-brand" /> Language</h2>
          <div className="space-y-3">
            {[
              { name: 'English', code: 'en', selected: true },
              { name: 'French', code: 'fr', selected: false },
              { name: 'Spanish', code: 'es', selected: false },
              { name: 'Hausa', code: 'ha', selected: false },
            ].map((lang, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl border border-borderBg/50">
                <span className="text-sm font-semibold text-white">{lang.name}</span>
                {lang.selected ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Selected</span>
                  </div>
                ) : (
                  <button className="text-sm text-brand hover:text-brand-light">Select</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
