'use client';

import React from 'react';

export type SellerLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'ELITE';

const LEVEL_CONFIG: Record<SellerLevel, {
  label: string;
  gradient: string;
  border: string;
  text: string;
  glow: string;
  icon: string;
  nextAt: string;
}> = {
  BRONZE: {
    label: 'Bronze',
    gradient: 'from-amber-700 via-amber-600 to-amber-500',
    border: 'border-amber-600/40',
    text: 'text-amber-300',
    glow: 'shadow-amber-700/30',
    icon: '🥉',
    nextAt: '10 sales + 4.0★',
  },
  SILVER: {
    label: 'Silver',
    gradient: 'from-slate-400 via-gray-300 to-slate-400',
    border: 'border-slate-400/40',
    text: 'text-slate-200',
    glow: 'shadow-slate-400/30',
    icon: '🥈',
    nextAt: '50 sales + 4.5★',
  },
  GOLD: {
    label: 'Gold',
    gradient: 'from-yellow-500 via-yellow-400 to-amber-400',
    border: 'border-yellow-400/40',
    text: 'text-yellow-200',
    glow: 'shadow-yellow-400/30',
    icon: '🥇',
    nextAt: '200 sales + 4.8★',
  },
  ELITE: {
    label: 'Elite',
    gradient: 'from-violet-500 via-purple-400 to-fuchsia-500',
    border: 'border-purple-400/40',
    text: 'text-purple-100',
    glow: 'shadow-purple-500/40',
    icon: '👑',
    nextAt: 'Max level',
  },
};

interface Props {
  level: SellerLevel | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export default function SellerLevelBadge({
  level,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  className = '',
}: Props) {
  const cfg = LEVEL_CONFIG[(level as SellerLevel)] || LEVEL_CONFIG.BRONZE;

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1',
    lg: 'text-sm px-3 py-1.5 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-black rounded-full border bg-gradient-to-r ${cfg.gradient} ${cfg.border} ${cfg.text} shadow-sm ${cfg.glow} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <span className="leading-none">{cfg.icon}</span>}
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
}

/** Compact level indicator with XP-style progress bar for dashboard use */
export function SellerLevelProgress({
  level,
  totalSales,
  averageRating,
}: {
  level: SellerLevel | string;
  totalSales: number;
  averageRating: number;
}) {
  const cfg = LEVEL_CONFIG[(level as SellerLevel)] || LEVEL_CONFIG.BRONZE;

  // Determine progress toward next level
  const thresholds: Record<SellerLevel, { sales: number; rating: number }> = {
    BRONZE: { sales: 10, rating: 4.0 },
    SILVER: { sales: 50, rating: 4.5 },
    GOLD: { sales: 200, rating: 4.8 },
    ELITE: { sales: 999999, rating: 5.0 },
  };
  const next = thresholds[(level as SellerLevel)] || thresholds.BRONZE;
  const salesPct = Math.min(100, (totalSales / next.sales) * 100);
  const ratingPct = Math.min(100, (averageRating / next.rating) * 100);
  const overallPct = Math.round((salesPct + ratingPct) / 2);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SellerLevelBadge level={level} size="md" />
        <span className="text-xs text-gray-400 font-semibold">Next: {cfg.nextAt}</span>
      </div>
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient} transition-all duration-700`}
          style={{ width: `${overallPct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-500">{overallPct}% toward next level</p>
    </div>
  );
}
