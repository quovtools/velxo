'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { getStoredReferralCode } from '@/lib/referral';
import {
  Eye, EyeOff, Loader2, ShieldCheck,
  Gamepad2, ShoppingCart, Users, ChevronRight
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const ACCOUNT_TYPES = [
  {
    value: 'BUYER',
    icon: ShoppingCart,
    title: 'Buyer',
    desc: 'Browse and buy game accounts, coins, and services',
  },
  {
    value: 'SELLER',
    icon: Gamepad2,
    title: 'Seller',
    desc: 'Sell your game accounts, coins, and gaming items',
  },
];

const GAME_OPTIONS = ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'Mobile Legends', 'Blood Strike', 'Delta Force', 'Valorant', 'Roblox', 'eFootball', 'Other'];
const INTEREST_OPTIONS = ['Buy game accounts', 'Buy coins/top-ups', 'Sell my items', 'Find boosting services'];
const REGION_OPTIONS = ['Africa', 'Europe', 'North America', 'Asia', 'Middle East', 'Global'];

export default function RegisterPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  // Steps: 0 = account type, 1 = details form, 2 = onboarding, 3 = done
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [region, setRegion] = useState<string>('');

  const toggleInArray = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleDetailsContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { user: any; accessToken: string } }>(
        '/auth/register', {
          email, password, firstName, lastName,
          role: accountType,
          preferences: { games, interests, region },
          referralCode: getStoredReferralCode() || undefined,
        },
      );
      setSession(res.data.accessToken, res.data.user);
      refreshSession();
      setStep(3); // show done screen
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 0: Account type selection
  if (step === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 fade-in">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-black tracking-tighter">VELXO</span>
            </Link>
            <h1 className="text-2xl font-bold">Join Velxo</h1>
            <p className="text-gray-400 text-sm mt-1">How will you be using Velxo?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACCOUNT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setAccountType(type.value as 'BUYER' | 'SELLER')}
                  className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 space-y-3 ${
                    accountType === type.value
                      ? 'border-brand bg-brand/5'
                      : 'border-borderBg hover:border-brand/40 bg-cardBg'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    accountType === type.value ? 'bg-brand/20' : 'bg-hoverBg/50'
                  }`}>
                    <Icon className={`w-6 h-6 ${accountType === type.value ? 'text-brand' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{type.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{type.desc}</p>
                  </div>
                  {accountType === type.value && (
                    <div className="flex items-center gap-1 text-brand text-xs font-bold">
                      <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        </svg>
                      </div>
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-cardBg border border-borderBg rounded-2xl p-4 flex gap-3">
            <Users className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              You can always switch roles later. Sellers need to complete a quick store setup before listing items.
            </p>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition shadow-lg shadow-brand/20"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand hover:text-brand-light font-semibold">Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 3: Verification sent
  if (step === 3) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 fade-in">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Account Created!</h1>
          <p className="text-gray-400 text-sm">
            Welcome to Velxo, <strong>{firstName}</strong>!
            {' '}A verification email was sent to <strong className="text-white">{email}</strong>.
          </p>
          <p className="text-xs text-gray-500">
            Check your inbox (or spam folder) and click the link to verify your email.
          </p>
          {accountType === 'SELLER' ? (
            <div className="space-y-3">
              <Link
                href="/sell"
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3.5 rounded-xl font-bold text-white transition shadow-lg shadow-brand/20"
              >
                <Gamepad2 className="w-4 h-4" /> Set Up My Store
              </Link>
              <Link href="/" className="block text-sm text-gray-400 hover:text-white transition">
                Skip for now
              </Link>
            </div>
          ) : (
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3.5 rounded-xl font-bold text-white transition shadow-lg shadow-brand/20"
            >
              Start Browsing
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Details form
  if (step === 1) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 fade-in">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-black tracking-tighter">VELXO</span>
            </Link>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-gray-400 text-sm mt-1">
              Registering as a <span className="text-brand font-semibold">{accountType === 'SELLER' ? 'Seller' : 'Buyer'}</span>
            </p>
          </div>

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
              <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <form onSubmit={handleDetailsContinue} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">First Name</label>
                  <input type="text" required autoComplete="given-name"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                    placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Last Name</label>
                  <input type="text" required autoComplete="family-name"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                    placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" required autoComplete="email"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                  placeholder="gaming@velxo.shop" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required minLength={8} autoComplete="new-password"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-brand transition"
                    placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-1 mt-2">
                  {[8, 12, 16].map((len, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                      password.length >= len
                        ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-yellow-400' : 'bg-emerald-400'
                        : 'bg-borderBg'
                    }`} />
                  ))}
                </div>
              </div>

              <button type="submit"
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition shadow-lg shadow-brand/20">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand hover:text-brand-light font-semibold">Sign In</Link>
            </p>
          </div>

          <button onClick={() => setStep(0)} className="text-xs text-gray-500 hover:text-gray-300 mx-auto block">
            ← Change account type
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Onboarding questions
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 fade-in">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black tracking-tighter">VELXO</span>
          </Link>
          <h1 className="text-2xl font-bold">Tell us about you</h1>
          <p className="text-gray-400 text-sm mt-1">A few quick questions to personalize your experience</p>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-8 space-y-7 shadow-xl">
          {error && (
            <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-bold text-white">Which games do you play?</p>
            <div className="flex flex-wrap gap-2">
              {GAME_OPTIONS.map((g) => (
                <button key={g} type="button" onClick={() => toggleInArray(games, setGames, g)}
                  className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition ${
                    games.includes(g)
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-borderBg bg-hoverBg/40 text-gray-300 hover:border-brand/40'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-white">What brings you to Velxo?</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((it) => (
                <button key={it} type="button" onClick={() => toggleInArray(interests, setInterests, it)}
                  className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition ${
                    interests.includes(it)
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-borderBg bg-hoverBg/40 text-gray-300 hover:border-brand/40'
                  }`}>
                  {it}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-white">Your region?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REGION_OPTIONS.map((r) => (
                <button key={r} type="button" onClick={() => setRegion(r)}
                  className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition ${
                    region === r
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-borderBg bg-hoverBg/40 text-gray-300 hover:border-brand/40'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition disabled:opacity-50 shadow-lg shadow-brand/20"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</> : <>Finish <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>

        <button onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-gray-300 mx-auto block">
          ← Back to details
        </button>
      </div>
    </div>
  );
}
