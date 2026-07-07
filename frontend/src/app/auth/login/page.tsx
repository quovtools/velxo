'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ success: boolean; data: { user: any; accessToken: string } }>(
        '/auth/login',
        { email, password },
      );
      setSession(res.data.accessToken, res.data.user);
      refreshSession();
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-cardBg border border-borderBg rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white">Welcome Back</h1>
        <p className="text-gray-400 mt-2">Sign in to your Velxo account</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
          <input
            type="email"
            required
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
            placeholder="gaming@velxo.shop"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-300">Password</label>
            <Link href="/auth/reset-password" className="text-xs text-brand hover:underline">
              Forgot Password?
            </Link>
          </div>
          <input
            type="password"
            required
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition shadow-lg shadow-brand/20 disabled:opacity-50 text-white"
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-8">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-brand hover:underline font-semibold">
          Create one now
        </Link>
      </p>
    </div>
  );
}
