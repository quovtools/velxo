'use client';

import React from 'react';
import TrustBadge, { BadgeType, TrustBadgeData } from './TrustBadge';

interface SellerBadgeRowProps {
  badges: TrustBadgeData[] | BadgeType[];
  max?: number;
}

export default function SellerBadgeRow({ badges, max = 3 }: SellerBadgeRowProps) {
  const normalized: TrustBadgeData[] = badges.map((b) => (typeof b === 'string' ? ({ type: b } as TrustBadgeData) : b));
  const visible = normalized.slice(0, max);
  const overflow = normalized.length - max;

  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {visible.map((b) => (
        <TrustBadge key={b.type} type={b.type} size="xs" showLabel={false} />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 font-medium">
          +{overflow}
        </span>
      )}
    </span>
  );
}
