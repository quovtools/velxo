'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Loader2, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  // Request reset mode
  const [email, setEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // New password mode
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setRequestSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setError('Passwords do not match'); return; }
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: newPw });
      setResetDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  if (resetDone) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Password Updated!</h2>
          <p className="text-gray-400 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Has token — show new password form
  if (token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-black tracking-wider">VELXO</span>
            </Link>
            <h1 className="text-2xl font-bold">Set New Password</h1>
            <p className="text-gray-400 text-sm mt-1">Choose a strong password for your account</p>
          </div>

          <div className="bg-cardBg border border-borderBg rounded-2xl p-8 space-y-5">
            {error && (
              <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} required minLength={8}
                    value={newPw} onChange={e => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-brand transition"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                <input
                  type="password" required
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <><Check className="w-4 h-4" /> Update Password</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // No token — show request reset form
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black tracking-wider">VELXO</span>
          </Link>
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-gray-400 text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-8 space-y-5">
          {requestSent ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="font-semibold text-white">Check your inbox!</p>
              <p className="text-sm text-gray-400">We sent a reset link to <strong>{email}</strong></p>
              <p className="text-xs text-gray-500">Don't see it? Check your spam folder.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="gaming@velxo.shop"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition disabled:opacity-50">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
          <p className="text-center text-sm text-gray-400">
            <Link href="/auth/login" className="text-brand hover:text-brand-light font-semibold">← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
