'use client';

import React from 'react';

export type BadgeType =
  | 'KYC_VERIFIED'
  | 'SELLER_PRO'
  | 'SELLER_PREMIUM'
  | 'TOP_SELLER'
  | 'FAST_RESPONDER'
  | 'RELIABLE_DELIVERY'
  | 'NEW_SELLER';

export interface TrustBadgeData {
  type: BadgeType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface TrustBadgeProps {
  type: BadgeType;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  showTooltip?: boolean;
}

const BADGES: Record<BadgeType, TrustBadgeData> = {
  KYC_VERIFIED:     { type: 'KYC_VERIFIED',     label: 'ID Verified',      description: 'Government ID verified. Max $500/order.', icon: '✅', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20' },
  SELLER_PRO:       { type: 'SELLER_PRO',         label: 'Pro Seller',       description: 'Bank-verified seller with 10+ sales. Max $2,000/order.', icon: '⚡', color: 'text-violet-400 bg-violet-950/40 border-violet-500/20' },
  SELLER_PREMIUM:   { type: 'SELLER_PREMIUM',     label: 'Premium Seller',   description: 'Video-verified seller with 50+ sales. Max $10,000/order.', icon: '👑', color: 'text-amber-400 bg-amber-950/40 border-amber-500/20' },
  TOP_SELLER:       { type: 'TOP_SELLER',         label: 'Top Seller',       description: '50+ sales with 4.5★ average rating.', icon: '🏆', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/20' },
  FAST_RESPONDER:   { type: 'FAST_RESPONDER',     label: 'Fast Responder',   description: 'Responds to buyers in under 1 hour.', icon: '⚡', color: 'text-sky-400 bg-sky-950/40 border-sky-500/20' },
  RELIABLE_DELIVERY:{ type: 'RELIABLE_DELIVERY',  label: 'Reliable Delivery', description: '98%+ delivery success rate.', icon: '📦', color: 'text-green-400 bg-green-950/40 border-green-500/20' },
  NEW_SELLER:       { type: 'NEW_SELLER',         label: 'New Seller',       description: 'Joined recently. Be their first customer!', icon: '🌱', color: 'text-teal-400 bg-teal-950/40 border-teal-500/20' },
};

const SIZE_MAP: Record<string, { icon: number; text: string; pad: string }> = {
  xs: { icon: 12, text: 'text-[10px]', pad: 'px-1.5 py-0.5' },
  sm: { icon: 14, text: 'text-xs', pad: 'px-2 py-0.5' },
  md: { icon: 16, text: 'text-sm', pad: 'px-2.5 py-1' },
};

export default function TrustBadge({ type, size = 'sm', showLabel = true, showTooltip = true }: TrustBadgeProps) {
  const badge = BADGES[type];
  const s = SIZE_MAP[size];

  return (
    <span
      title={showTooltip ? badge.description : undefined}
      className={`inline-flex items-center gap-1 rounded-full border ${badge.color} ${s.pad} ${s.text} font-semibold shrink-0`}
    >
      <span style={{ fontSize: s.icon, lineHeight: 1 }}>{badge.icon}</span>
      {showLabel && <span>{badge.label}</span>}
    </span>
  );
}

export { BADGES };
