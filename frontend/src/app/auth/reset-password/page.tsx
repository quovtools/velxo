'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="Velxo" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black tracking-wider text-white">VELXO</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll send a reset link to your email</p>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-8">
          {success ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-brand-accent/10 border border-brand-accent/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl">✓</span>
              </div>
              <p className="text-white font-semibold">Check your inbox</p>
              <p className="text-gray-500 text-sm">We sent a reset link to <strong className="text-white">{email}</strong></p>
              <Link href="/auth/login" className="block mt-4 text-brand hover:text-brand-light text-sm font-semibold transition">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-surface border border-borderBg rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand transition"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/auth/login" className="text-brand hover:text-brand-light font-semibold transition">
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
