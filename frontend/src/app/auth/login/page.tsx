'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { Eye, EyeOff, Loader2, ShieldCheck, Zap, BadgeCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { user: any; accessToken: string } }>(
        '/auth/login', { email, password },
      );
      setSession(res.data.accessToken, res.data.user);
      refreshSession();
      router.push(decodeURIComponent(callbackUrl));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const hasCallbackRedirect = callbackUrl && callbackUrl !== '/';

  return (
    <div className="min-h-screen flex fade-in">
      {/* Left marketing panel — hidden on mobile, 40% on lg+ */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10 bg-gradient-to-br from-[#0f0f14] via-[#13111c] to-[#0d1117] border-r border-borderBg">
        {/* Logo + tagline */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <img src="/logo.png" alt="Piyrox" className="w-9 h-9 rounded-lg" />
            <span className="text-2xl font-black tracking-wider">PIYROX</span>
          </Link>
          <h2 className="text-3xl font-extrabold leading-snug text-white mb-2">
            The Safest Way to<br />Trade Game Assets
          </h2>
          <p className="text-gray-400 text-sm mt-3">
            Buy and sell game accounts, coins, and services with full escrow protection.
          </p>
        </div>

        {/* Trust signals */}
        <div className="space-y-5 my-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Trust-Trade Escrow</p>
              <p className="text-xs text-gray-400 mt-0.5">Funds locked until you confirm delivery</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Instant Delivery</p>
              <p className="text-xs text-gray-400 mt-0.5">Most sellers respond within 1 hour</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Verified Sellers</p>
              <p className="text-xs text-gray-400 mt-0.5">ID-checked sellers on every listing</p>
            </div>
          </div>
        </div>

        {/* Social proof + game icons */}
        <div>
          <p className="text-xs text-gray-500 mb-4">
            Trusted by <span className="text-white font-semibold">12,000+ gamers</span> across Africa &amp; beyond
          </p>
          <div className="flex flex-wrap gap-2">
            {['🎮 Free Fire', '🔫 COD', '🪖 PUBG', '⚔️ ML', '🔥 Blood Strike', '⚽ eFootball'].map((g) => (
              <span key={g} className="px-2.5 py-1 rounded-lg bg-hoverBg/60 border border-borderBg text-xs text-gray-400">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form column — full width on mobile, 60% on lg+ */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile-only header */}
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <img src="/logo.png" alt="Piyrox" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-black tracking-wider">PIYROX</span>
            </Link>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Session expired banner */}
          {hasCallbackRedirect && (
            <div className="bg-amber-900/20 border border-amber-500/40 text-amber-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>Your session expired — sign in to continue where you left off.</span>
            </div>
          )}

          {/* Card */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-8 space-y-5 shadow-xl">

            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-borderBg hover:border-brand/40 bg-hoverBg/40 hover:bg-hoverBg py-3 rounded-xl text-sm font-semibold transition"
              aria-label="Continue with Google"
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
              <span className="text-xs text-gray-500">or sign in with email</span>
              <div className="flex-1 h-px bg-borderBg" />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  id="login-email"
                  type="email" required autoComplete="email"
                  aria-label="Email address"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-brand transition"
                  placeholder="gaming@piyrox.shop"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="login-password" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Password</label>
                  <Link href="/auth/reset-password" className="text-xs text-brand hover:text-brand-light transition">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                    aria-label="Password"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 pr-11 text-sm placeholder-gray-600 focus:outline-none focus:border-brand transition"
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-borderBg text-brand focus:ring-brand"
                  aria-label="Remember me"
                />
                <label htmlFor="remember-me" className="text-xs text-gray-400 cursor-pointer">Remember me</label>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition shadow-lg shadow-brand/20 disabled:opacity-50 text-white">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
              </button>

              <p className="text-center text-xs text-gray-500">
                By signing in you agree to our{' '}
                <Link href="/terms" className="text-brand hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>
              </p>
            </form>

            <p className="text-center text-sm text-gray-400">
              No account?{' '}
              <Link href="/auth/register" className="text-brand hover:text-brand-light font-semibold transition">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
