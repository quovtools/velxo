'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        '/auth/register',
        { email, password, firstName, lastName },
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
    <div className="max-w-md mx-auto my-12 bg-cardBg border border-borderBg rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
        <p className="text-gray-400 mt-2">Join Africa&apos;s No.1 Gaming Marketplace</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">First Name</label>
            <input
              type="text"
              required
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
              placeholder="Precious"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Last Name</label>
            <input
              type="text"
              required
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand transition"
              placeholder="Dev"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1">Email Address</label>
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
          <label className="block text-sm font-semibold text-gray-300 mb-1">Password</label>
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
          className="w-full bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition shadow-lg shadow-brand/20 disabled:opacity-50 text-white mt-4"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-8">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-brand hover:underline font-semibold">
          Sign In
        </Link>
      </p>
    </div>
  );
}
