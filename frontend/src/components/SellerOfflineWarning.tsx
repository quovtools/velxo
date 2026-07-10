'use client';

/**
 * SellerOfflineWarning
 * Shown on the checkout page when the seller's average response time suggests
 * they may be slow to respond, or when the listing is from a seller that
 * has no recent activity. Purely informational — doesn't block checkout.
 */

import { Clock, Info } from 'lucide-react';

interface Props {
  storeName: string;
  responseTime?: number | null; // minutes
}

export default function SellerOfflineWarning({ storeName, responseTime }: Props) {
  // Only show for slow responders (> 120 min avg or unknown)
  const isLikelySlow = !responseTime || responseTime > 120;
  if (!isLikelySlow) return null;

  return (
    <div className="flex items-start gap-3 bg-yellow-950/30 border border-yellow-500/30 rounded-2xl p-4 text-sm">
      <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-yellow-200">Seller may be offline</p>
        <p className="text-xs text-gray-400 mt-1">
          <strong>{storeName}</strong> may not respond immediately. Your payment is held safely in escrow
          — the seller has <strong>1 hour</strong> after accepting to deliver. You can open a dispute if
          they miss the deadline.
        </p>
      </div>
    </div>
  );
}

/**
 * SellerOfflineBadge
 * Compact inline badge used on listing cards / listing detail pages.
 */
export function SellerOfflineBadge({ responseTime }: { responseTime?: number | null }) {
  if (!responseTime || responseTime <= 60) return null;
  const label = responseTime > 1440 ? 'Responds in days' : responseTime > 120 ? `~${Math.round(responseTime / 60)}h response` : null;
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-400 bg-yellow-950/40 border border-yellow-500/20 px-2 py-0.5 rounded-full">
      <Clock className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
