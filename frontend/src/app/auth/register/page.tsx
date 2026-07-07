'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { user: any; accessToken: string } }>(
        '/auth/register', { email, password, firstName, lastName },
      );
      setSession(res.data.accessToken, res.data.user);
      refreshSession();
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 fade-in">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black tracking-wider">VELXO</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Join Africa&apos;s No.1 gaming marketplace</p>
        </div>

        {/* Card */}
        <div className="bg-cardBg border border-borderBg rounded-2xl p-8 space-y-5 shadow-xl">

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => { window.location.href = `${API_BASE}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 border border-borderBg hover:border-brand/40 bg-hoverBg/40 hover:bg-hoverBg py-3 rounded-xl text-sm font-semibold transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-borderBg" />
            <span className="text-xs text-gray-500">or register with email</span>
            <div className="flex-1 h-px bg-borderBg" />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">First Name</label>
                <input type="text" required autoComplete="given-name"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-brand transition"
                  placeholder="John"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Last Name</label>
                <input type="text" required autoComplete="family-name"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-brand transition"
                  placeholder="Doe"
                  value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" required autoComplete="email"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-brand transition"
                placeholder="gaming@velxo.shop"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required minLength={8} autoComplete="new-password"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 pr-11 text-sm placeholder-gray-600 focus:outline-none focus:border-brand transition"
                  placeholder="Min. 8 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              <div className="flex gap-1 mt-2">
                {[8, 12, 16].map((len, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    password.length >= len
                      ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-yellow-400' : 'bg-emerald-400'
                      : 'bg-borderBg'
                  }`} />
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition shadow-lg shadow-brand/20 disabled:opacity-50 text-white mt-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand hover:text-brand-light font-semibold transition">
              Sign In
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5 text-brand/50" />
          <span>All trades protected by Velxo Escrow</span>
        </div>
      </div>
    </div>
  );
}
