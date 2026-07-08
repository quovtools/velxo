'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectToVerify() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    router.replace(token ? `/verify-email?token=${encodeURIComponent(token)}` : '/verify-email');
  }, [router, token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Redirecting to verification…</p>
    </div>
  );
}

export default function AuthVerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      }
    >
      <RedirectToVerify />
    </Suspense>
  );
}
