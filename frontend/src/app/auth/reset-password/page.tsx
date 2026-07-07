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
    <div className="max-w-md mx-auto my-12 bg-cardBg border border-borderBg rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white">Reset Password</h1>
        <p className="text-gray-400 mt-2">Enter email to recover account access</p>
      </div>

      {success ? (
        <div className="bg-emerald-950/40 border border-emerald-500 text-emerald-200 text-sm px-4 py-4 rounded-lg mb-6 text-center">
          Check your email! We sent a password reset link to your inbox.
        </div>
      ) : (
        <>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition shadow-lg shadow-brand/20 disabled:opacity-50 text-white"
            >
              {loading ? 'Sending email...' : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
