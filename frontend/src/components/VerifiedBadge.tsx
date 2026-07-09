'use client';

import React from 'react';
import { BadgeCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

type BadgeSize = 'sm' | 'md' | 'lg';

interface VerifiedBadgeProps {
  size?: BadgeSize;
  className?: string;
  label?: string;
  showLabel?: boolean;
  variant?: 'badge' | 'solid' | 'pill';
}

const SIZES: Record<BadgeSize, { icon: number; text: string; pad: string }> = {
  sm: { icon: 14, text: 'text-[11px]', pad: 'px-2 py-0.5' },
  md: { icon: 16, text: 'text-xs', pad: 'px-2.5 py-1' },
  lg: { icon: 18, text: 'text-sm', pad: 'px-3 py-1.5' },
};

/**
 * Blue verification badge shown on verified sellers.
 * Driven by the seller's `isVerified` flag (set after KYC approval).
 */
export default function VerifiedBadge({
  size = 'md',
  className = '',
  label = 'Verified',
  showLabel = true,
  variant = 'pill',
}: VerifiedBadgeProps) {
  const s = SIZES[size];

  if (variant === 'badge') {
    return (
      <span
        title="Verified Seller"
        className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.25)] ${className}`}
        style={{ width: s.icon + 10, height: s.icon + 10 }}
      >
        <BadgeCheck style={{ width: s.icon, height: s.icon }} />
      </span>
    );
  }

  if (variant === 'solid') {
    return (
      <span
        title="Verified Seller"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-blue-500 ${s.pad} ${s.text} font-bold text-white shadow-sm shadow-blue-500/30 ${className}`}
      >
        <ShieldCheck style={{ width: s.icon, height: s.icon }} />
        {showLabel && label}
      </span>
    );
  }

  return (
    <span
      title="Verified Seller"
      className={`inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 ${s.pad} ${s.text} font-bold ${className}`}
    >
      <ShieldCheck style={{ width: s.icon, height: s.icon }} />
      {showLabel && label}
    </span>
  );
}

export { CheckCircle2 };
