'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    async function verify() {
      try {
        const res = await api.post<{ success: boolean }>('/auth/verify-email', { token });
        if (res.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to verify email. Please try again.');
      }
    }

    verify();
  }, [token, router]);

  if (status === 'verifying') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Verifying your email address...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
          <p className="text-gray-400 text-sm">{message}</p>
          <div className="animate-pulse">
            <span className="text-brand text-sm font-semibold">Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
        <p className="text-gray-400 text-sm">{message}</p>
        <a href="/auth/login" className="inline-flex items-center gap-2 text-brand hover:text-brand-light font-semibold transition">
          Back to Login
        </a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Verifying your email address...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
