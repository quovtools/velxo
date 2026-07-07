'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  User, Mail, Phone, ShieldCheck, Camera,
  Check, AlertTriangle, Loader2, Lock, LogOut,
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

const TABS = ['Account', 'Security', 'Verification'] as const;
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

      {/* Profile hero card */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={initials}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-borderBg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand/10 border-2 border-brand/20 flex items-center justify-center">
                <span className="text-2xl font-black text-brand-light">{initials}</span>
              </div>
            )}
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand rounded-lg flex items-center justify-center shadow-lg">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate">{profile?.firstName} {profile?.lastName}</h1>
            <p className="text-gray-500 text-sm truncate">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-hoverBg border border-borderBg ${(roleColor as any)[profile?.role || 'BUYER'] || 'text-gray-400'}`}>
                {profile?.role}
              </span>
              {profile?.emailVerified
                ? <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Email verified</span>
                : <span className="text-xs text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Email not verified</span>
              }
            </div>
          </div>

          <button onClick={logout}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 border border-red-500/20 rounded-xl transition">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cardBg border border-borderBg rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Account */}
      {tab === 'Account' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
          <h2 className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-brand" /> Personal Information</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-sm font-bold transition text-white disabled:opacity-50 shadow-lg shadow-brand/20">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Security */}
      {tab === 'Security' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
          <h2 className="font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-brand" /> Change Password</h2>
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
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-sm font-bold transition text-white disabled:opacity-50 shadow-lg shadow-brand/20">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Verification */}
      {tab === 'Verification' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
          <h2 className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand" /> Identity Verification</h2>

          {/* Status items */}
          <div className="space-y-3">
            {[
              { label: 'Email Address', value: profile?.email, status: profile?.emailVerified ? 'verified' : 'pending' },
              { label: 'Phone Number',  value: phone || 'Not provided', status: phone ? 'pending' : 'missing' },
              { label: 'Identity (KYC)', value: 'Not submitted', status: 'missing' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-background border border-borderBg rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{item.label}</p>
                  <p className="text-sm font-semibold mt-0.5 truncate max-w-xs">{item.value}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  item.status === 'verified' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' :
                  item.status === 'pending'  ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/20' :
                                              'bg-red-900/20 text-red-400 border-red-500/20'
                }`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-sm text-gray-400 space-y-1">
            <p className="font-semibold text-white text-sm">KYC Verification</p>
            <p>To unlock full selling privileges and higher withdrawal limits, verify your identity with a government-issued ID.</p>
            <p className="text-xs text-gray-500">Upload functionality coming soon — contact support to fast-track verification.</p>
          </div>

          <button className="flex items-center gap-2 bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand-light px-5 py-3 rounded-xl text-sm font-bold transition">
            <ShieldCheck className="w-4 h-4" /> Submit KYC Documents
          </button>
        </div>
      )}
    </div>
  );
}
