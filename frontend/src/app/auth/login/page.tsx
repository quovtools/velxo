'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { GAME_NAMES } from '@/lib/games';
import { usePlatformStats, formatCount } from '@/lib/usePlatformStats';
import { Eye, EyeOff, Loader2, ShieldCheck, Zap, BadgeCheck, ArrowRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') || '/';
  const { refreshSession } = useAuth();
  const platformStats = usePlatformStats();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { user: any; accessToken: string } }>(
        '/auth/login', { email, password }
      );
      setSession(res.data.accessToken, res.data.user);
      refreshSession();
      router.push(decodeURIComponent(callbackUrl));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex fade-in" data-fullscreen>
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 bg-[var(--surface)] border-r border-[var(--border-bg)]"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 80%,rgba(212,160,23,0.07),transparent),var(--surface)' }}>
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden">
              <img src="/logo-new.png" alt="Piyrox" className="w-7 h-7 object-contain" />
            </div>
            <span className="text-2xl font-black tracking-widest text-white">PIYROX</span>
          </Link>
          <h2 className="text-3xl font-black text-white leading-tight mb-3">
            The Safest Way to<br />Trade Game Assets
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Buy and sell game accounts, coins, and services with full escrow protection.
          </p>
        </div>

        <div className="space-y-4 my-10">
          {[
            { icon: ShieldCheck, color: 'text-brand', bg: 'bg-brand/10 border-brand/20', title: 'Trust-Trade Escrow', desc: 'Funds locked until you confirm delivery.' },
            { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', title: 'Instant Delivery', desc: 'Most sellers respond within 1 hour.' },
            { icon: BadgeCheck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', title: 'Verified Sellers', desc: 'ID-checked sellers on every listing.' },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-3">
            Trusted by{' '}
            <span className="text-white font-semibold">
              {platformStats ? `${formatCount(platformStats.totalUsers)} gamers` : 'gamers worldwide'}
            </span>{' '}
            across Africa
          </p>
          <div className="flex flex-wrap gap-2">
            {GAME_NAMES.map(g => (
              <span key={g} className="px-2.5 py-1 rounded-lg bg-white/5 border border-[var(--border-bg)] text-xs text-gray-400">{g}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 bg-[var(--background)]">
        <div className="w-full max-w-[400px] space-y-6">

          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden">
                <img src="/logo-new.png" alt="Piyrox" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-xl font-black tracking-widest text-white">PIYROX</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Session expired */}
          {callbackUrl !== '/' && (
            <div className="bg-[var(--warning-bg)] border border-amber-500/30 text-amber-300 text-sm px-4 py-3 rounded-xl">
              ⚠️ Your session expired — sign in to continue where you left off.
            </div>
          )}

          {/* Google OAuth */}
          <button onClick={() => { window.location.href = `${API_BASE}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 border border-[var(--border-bg)] hover:border-brand/40 bg-[var(--surface)] hover:bg-brand/5 py-3.5 rounded-xl text-sm font-semibold transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border-bg)]" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-[var(--border-bg)]" />
          </div>

          {error && (
            <div className="bg-[var(--error-bg)] border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
              <input id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="gaming@piyrox.shop" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password</label>
                <Link href="/auth/reset-password" className="text-xs text-brand hover:text-brand-light transition">Forgot?</Link>
              </div>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="input pr-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label="Toggle password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center rounded-xl py-3.5 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            No account?{' '}
            <Link href="/auth/register" className="text-brand hover:text-brand-light font-semibold transition">
              Create one free
            </Link>
          </p>

          <p className="text-center text-xs text-gray-600">
            By signing in you agree to our{' '}
            <Link href="/terms" className="text-brand/70 hover:text-brand">Terms</Link> &amp;{' '}
            <Link href="/privacy" className="text-brand/70 hover:text-brand">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
