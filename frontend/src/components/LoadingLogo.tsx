'use client';

import { Loader2 } from 'lucide-react';

type Size = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<Size, { box: string; logo: string; ring: string; text: string }> = {
  sm: { box: 'w-10 h-10', logo: 'w-6 h-6', ring: '-inset-1.5 rounded-2xl', text: 'text-xs' },
  md: { box: 'w-14 h-14', logo: 'w-9 h-9', ring: '-inset-2 rounded-3xl', text: 'text-sm' },
  lg: { box: 'w-20 h-20', logo: 'w-12 h-12', ring: '-inset-3 rounded-[2rem]', text: 'text-base' },
};

export default function LoadingLogo({
  label = 'Loading...',
  size = 'md',
  fullScreen = false,
  showLabel = true,
}: {
  label?: string;
  size?: Size;
  fullScreen?: boolean;
  showLabel?: boolean;
}) {
  const s = SIZE_MAP[size];

  const content = (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="relative flex items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-brand/30 blur-2xl animate-pulse" />
        {/* Rotating ring */}
        <div
          className={`absolute ${s.ring} border-2 border-borderBg border-t-brand border-r-brand/50 animate-spin`}
        />
        {/* Logo box */}
        <div className={`relative ${s.box} rounded-2xl bg-cardBg border border-borderBg flex items-center justify-center overflow-hidden shadow-xl`}>
          <img src="/logo.png" alt="Velxo" className={`${s.logo} rounded-lg animate-[spin_1.6s_linear_infinite]`} />
        </div>
      </div>
      {showLabel && (
        <span className={`${s.text} text-gray-400 font-medium tracking-wide`}>{label}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

/* Area loader: centered Velxo logo with a message, fills its container */
export function LoadingArea({
  label = 'Loading...',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`w-full flex items-center justify-center py-20 ${className}`}>
      <LoadingLogo label={label} size="md" />
    </div>
  );
}

export function InlineSpinner({ className = 'w-5 h-5' }: { className?: string }) {
  return <Loader2 className={`${className} text-brand animate-spin`} />;
}
