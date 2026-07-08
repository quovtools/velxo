'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Loader2, ShieldCheck, AlertCircle, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'notoken'>('verifying');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resentError, setResentError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('notoken');
      return;
    }

    api.post<{ success: boolean }>('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        updateUser({ emailVerified: true });
        setTimeout(() => router.push('/'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'This link has expired or is invalid.');
      });
  }, [token]);

  const resendVerification = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setResending(true);
    setResentError('');
    try {
      await api.post('/auth/resend-verification', {});
      setResent(true);
    } catch (err: any) {
      setResentError(err?.message || 'Could not resend the email. Please try again.');
    }
    finally { setResending(false); }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
          <p className="text-gray-400 text-sm">Your email has been verified. Redirecting you now...</p>
          <div className="w-8 h-1 bg-brand rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  if (status === 'notoken') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-brand" />
          </div>
          <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
          <p className="text-gray-400 text-sm">
            {resent
              ? 'A new verification email has been sent. Check your inbox.'
              : 'Check your inbox for a verification link, or resend the email below.'}
          </p>
          {!resent && (
            <button onClick={resendVerification} disabled={resending}
              className="flex items-center gap-2 mx-auto bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold text-white transition disabled:opacity-50">
              {resending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Resend Verification Email'}
            </button>
          )}
          {resentError && (
            <p className="flex items-center justify-center gap-1.5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {resentError}
            </p>
          )}
          <p className="text-gray-500 text-xs">If you don't see it, check spam or use a different email.</p>
          <a href="/" className="block text-sm text-brand hover:text-brand-light font-medium">Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
        <p className="text-gray-400 text-sm">{message}</p>
        <button onClick={resendVerification} disabled={resending}
          className="flex items-center gap-2 mx-auto bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold text-white transition disabled:opacity-50">
          {resending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Resend Verification Email'}
        </button>
        {resentError && (
          <p className="flex items-center justify-center gap-1.5 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {resentError}
          </p>
        )}
        <p className="text-gray-500 text-xs">If you don't see it, check spam or use a different email.</p>
        <a href="/auth/login" className="block text-sm text-gray-400 hover:text-white">Back to Login</a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
