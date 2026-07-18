'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setSession } from '@/lib/auth';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';

// Allowed roles — reject anything not in this set to prevent privilege escalation
const ALLOWED_ROLES = ['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

function sanitizeString(value: string | null, maxLen = 100): string {
  if (!value) return '';
  // Strip any HTML/script tags and limit length
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function sanitizeRole(value: string | null): AllowedRole {
  const upper = (value || '').toUpperCase() as AllowedRole;
  return ALLOWED_ROLES.includes(upper) ? upper : 'BUYER';
}

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

    // FIX #22: Sanitize all URL-hash-sourced fields before using them.
    // A malicious redirect URL could inject arbitrary values into firstName,
    // lastName, role, email. We strip tags, limit length, and whitelist role.
    const googleUser = {
      id: sanitizeString(userId, 36),
      email: sanitizeString(params.get('email'), 254),
      firstName: sanitizeString(params.get('firstName'), 50),
      lastName: sanitizeString(params.get('lastName'), 50),
      role: sanitizeRole(params.get('role')),
      emailVerified: params.get('emailVerified') === '1',
    };
    setSession(token, googleUser);

    // Enrich with authoritative profile fields from /auth/me — this is the
    // trusted source and overwrites anything from the URL hash.
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: any }>('/auth/me');
        if (res.success && res.data) {
          // Use only server-validated data, never the URL hash values directly
          setSession(token, {
            id: res.data.id,
            email: res.data.email,
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            role: sanitizeRole(res.data.role),
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
