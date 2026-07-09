'use client';

import { useAuth } from '@/app/providers';
import LoadingLogo from './LoadingLogo';

export default function AppLoader() {
  const { loading } = useAuth();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      <LoadingLogo label="Loading Velxo..." size="lg" />
    </div>
  );
}
