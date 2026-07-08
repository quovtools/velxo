'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setSession } from '@/lib/auth';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';

// Handles redirect back from Google OAuth
// URL hash: #token=<jwt>&userId=<id>
export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const hash = window.location.hash.slice(1); // remove #
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const userId = params.get('userId');

    if (!token || !userId) {
      router.replace('/auth/login?error=google_failed');
      return;
    }

    // Build the user object directly from the OAuth redirect (no extra API call
    // needed) so Google sign-in works even if /auth/me is slow/unavailable.
    const googleUser = {
      id: userId,
      email: params.get('email') || '',
      firstName: params.get('firstName') || '',
      lastName: params.get('lastName') || '',
      role: params.get('role') || 'BUYER',
      emailVerified: params.get('emailVerified') === '1',
    };
    setSession(token, googleUser);

    // Enrich with extra profile fields (phone, avatar) when possible — non-fatal.
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: any }>('/auth/me');
        if (res.success && res.data) {
          setSession(token, {
            id: res.data.id,
            email: res.data.email,
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            role: res.data.role,
            emailVerified: res.data.emailVerified,
          });
        }
      } catch {}

      refreshSession();
      router.replace('/');
    })();
  }, [router, refreshSession]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}
