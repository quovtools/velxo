'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setSession } from '@/lib/auth';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Suspense } from 'react';

// Allowed roles — reject anything not in this set to prevent privilege escalation.
const ALLOWED_ROLES = ['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

function sanitizeRole(value: string | null): AllowedRole {
  const upper = (value || '').toUpperCase() as AllowedRole;
  return ALLOWED_ROLES.includes(upper) ? upper : 'BUYER';
}

/**
 * Handles the redirect back from the Google OAuth callback.
 *
 * FIX (Security): The backend now sends a short-lived one-time `code` in the
 * query string (e.g., /auth/callback?code=abc123) instead of the full JWT in
 * the URL hash (#token=...). This page exchanges the code for a real JWT via a
 * POST request — the JWT never appears in the browser URL, history, or server
 * access logs.
 *
 * Falls back gracefully to the old hash-based flow so existing sessions are not
 * broken during a rolling deployment.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        // ── New flow: exchange short-lived code for JWT ──────────────────
        const code = searchParams.get('code');
        if (code) {
          const res = await api.post<{ success: boolean; data: { accessToken: string; user: any } }>(
            '/auth/exchange-code',
            { code },
          );
          if (!res.success || !res.data?.accessToken) {
            throw new Error('Code exchange failed');
          }
          setSession(res.data.accessToken, {
            id: res.data.user.id,
            email: res.data.user.email,
            firstName: res.data.user.firstName,
            lastName: res.data.user.lastName,
            role: sanitizeRole(res.data.user.role),
            emailVerified: res.data.user.emailVerified,
          });
          refreshSession();
          router.replace('/');
          return;
        }

        // ── Legacy fallback: hash-based token (pre-fix deployments) ─────
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const token = params.get('token');
        const userId = params.get('userId');

        if (!token || !userId) {
          router.replace('/auth/login?error=google_failed');
          return;
        }

        // Bootstrap session from hash values, then enrich from /auth/me.
        const preliminaryUser = {
          id: userId.slice(0, 36),
          email: (params.get('email') || '').slice(0, 254),
          firstName: (params.get('firstName') || '').slice(0, 50),
          lastName: (params.get('lastName') || '').slice(0, 50),
          role: sanitizeRole(params.get('role')),
          emailVerified: params.get('emailVerified') === '1',
        };
        setSession(token, preliminaryUser);

        try {
          const meRes = await api.get<{ success: boolean; data: any }>('/auth/me');
          if (meRes.success && meRes.data) {
            setSession(token, {
              id: meRes.data.id,
              email: meRes.data.email,
              firstName: meRes.data.firstName,
              lastName: meRes.data.lastName,
              role: sanitizeRole(meRes.data.role),
              emailVerified: meRes.data.emailVerified,
            });
          }
        } catch { /* use preliminary session */ }

        refreshSession();
        router.replace('/');
      } catch {
        router.replace('/auth/login?error=google_failed');
      }
    })();
  }, [router, refreshSession, searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
