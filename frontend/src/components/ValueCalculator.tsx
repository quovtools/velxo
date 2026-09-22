'use client';

/**
 * ValueCalculator
 *
 * A self-contained widget that calls POST /ai/value-estimate and renders the
 * valuation result.  Used in two places:
 *   1. Sell flow — Step 4 (Pricing), to help sellers price their account.
 *   2. Listing detail page — "What is this worth?" panel for buyers.
 *
 * Props
 * ─────
 * gameName      – required; pre-filled from the parent context
 * rank          – optional; pre-filled from listing/form
 * level         – optional
 * platform      – optional
 * region        – optional
 * loginMethod   – optional
 * skinsCount    – optional (derived or asked inline)
 * askingPrice   – optional; the seller's current price field value
 * onApplyPrice  – optional callback; called with the estimated value so the
 *                 sell form can insert it into the price field
 * compact       – render a condensed inline version (no factor list)
 */

import React, { useState, useCallback } from 'react';
import {
  Sparkles, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  AlertCircle, Loader2, RefreshCw, DollarSign,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValuationFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  note: string;
}

interface ComparableStats {
  count: number;
  currency: string;
  min: number;
  max: number;
  median: number;
  p25: number;
  p75: number;
  mean: number;
  soldCount: number;
  avgDaysToSell: number | null;
}

interface ValuationResult {
  requestId: string | null;
  estimatedValue: number;
  currency: string;
  rangeLow: number;
  rangeHigh: number;
  confidence: 'low' | 'medium' | 'high';
  factors: ValuationFactor[];
  advice: string;
  demandNote: string;
  source: 'ai' | 'statistics';
  stats: ComparableStats;
}

type FeedbackVerdict = 'helpful' | 'too_low' | 'too_high';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ValueCalculatorProps {
  gameName: string;
  rank?: string;
  level?: number | string;
  platform?: string;
  region?: string;
  loginMethod?: string;
  skinsCount?: number;
  askingPrice?: number | string;
  onApplyPrice?: (price: number) => void;
  compact?: boolean;
  /** Extra CSS classes on the outer wrapper */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number, currency = 'USD'): string {
  if (!Number.isFinite(value)) return '—';
  // Try to show 0 decimal places for large integers, 2 for fractional values
  const decimals = value % 1 === 0 ? 0 : 2;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-orange-400',
};

const IMPACT_ICON: Record<string, React.ElementType> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
};

const IMPACT_COLOR: Record<string, string> = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  neutral: 'text-gray-500',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ValueCalculator({
  gameName,
  rank,
  level,
  platform,
  region,
  loginMethod,
  skinsCount,
  askingPrice,
  onApplyPrice,
  compact = false,
  className = '',
}: ValueCalculatorProps) {
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFactors, setShowFactors] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackVerdict | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // For listing-detail mode the user can tweak parameters before running
  const [localSkins, setLocalSkins] = useState<string>(
    skinsCount !== undefined ? String(skinsCount) : '',
  );

  const runEstimate = useCallback(async () => {
    if (!gameName) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setFeedback(null);
    setFeedbackSent(false);

    const body: Record<string, any> = { gameName };
    if (rank) body.rank = rank;
    if (level) body.level = Number(level);
    if (platform) body.platform = platform;
    if (region) body.region = region;
    if (loginMethod) body.loginMethod = loginMethod;
    const skins = localSkins !== '' ? Number(localSkins) : skinsCount;
    if (skins !== undefined && !Number.isNaN(Number(skins))) body.skinsCount = Number(skins);
    const asking = Number(askingPrice);
    if (Number.isFinite(asking) && asking > 0) body.price = asking;

    try {
      const res = await fetch(`${API_BASE}/ai/value-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg: string = json?.message ?? 'The valuation engine is unavailable right now.';
        setError(msg);
        return;
      }

      const data: ValuationResult = json?.data ?? json;
      setResult(data);
      setShowFactors(!compact);
    } catch (err: any) {
      setError(err?.message || 'Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }, [gameName, rank, level, platform, region, loginMethod, skinsCount, localSkins, askingPrice, compact]);

  const sendFeedback = useCallback(async (verdict: FeedbackVerdict) => {
    if (!result?.requestId || feedbackSent) return;
    setFeedback(verdict);
    setFeedbackSent(true);
    try {
      await fetch(`${API_BASE}/ai/value-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: result.requestId, verdict }),
      });
    } catch {
      // fire-and-forget; UI already shows the state
    }
  }, [result, feedbackSent]);

  // ── Price-to-estimate comparison (for seller flow) ──────────────────────────
  const askingNum = Number(askingPrice);
  const priceVsEstimate: 'low' | 'fair' | 'high' | null =
    result && Number.isFinite(askingNum) && askingNum > 0
      ? askingNum < result.rangeLow * 0.9
        ? 'low'
        : askingNum > result.rangeHigh * 1.1
        ? 'high'
        : 'fair'
      : null;

  const canApply = !!onApplyPrice && result;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      result
        ? 'border-violet-500/30 bg-violet-500/4'
        : 'border-[var(--border-bg)] bg-[var(--card-bg)]'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-bg)]">
        <div className="w-7 h-7 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none">AI Value Estimate</p>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-none">
            {result
              ? `Based on ${result.stats.count} comparable ${gameName} listing${result.stats.count !== 1 ? 's' : ''}`
              : `What is this ${gameName} account worth?`}
          </p>
        </div>
        {result && (
          <button
            onClick={runEstimate}
            disabled={loading}
            title="Recalculate"
            className="p-1.5 text-gray-600 hover:text-violet-400 transition rounded-lg disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Skin count input (shown when not pre-filled) */}
        {skinsCount === undefined && !compact && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-400 whitespace-nowrap">Skins / items</label>
            <input
              type="number"
              min="0"
              max="10000"
              value={localSkins}
              onChange={e => setLocalSkins(e.target.value)}
              placeholder="0"
              className="input !py-1.5 !text-sm w-24 flex-shrink-0"
            />
            <p className="text-[11px] text-gray-600 leading-snug">
              Approximate number of skins, outfits, or rare items on the account.
            </p>
          </div>
        )}

        {/* CTA */}
        {!result && !loading && (
          <button
            onClick={runEstimate}
            disabled={loading || !gameName}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm
              bg-violet-600 hover:bg-violet-500 text-white transition disabled:opacity-40
              shadow-lg shadow-violet-500/20"
          >
            <Sparkles className="w-4 h-4" />
            Get AI Price Estimate
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-sm text-gray-400">Analysing {result?.stats.count ?? ''} comparable listings…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-3.5 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={runEstimate}
                className="mt-2 text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Main estimate */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
                  Estimated value
                </p>
                <span className="text-3xl font-black text-white tracking-tight">
                  {fmt(result.estimatedValue, result.currency)}
                </span>
                <div className="mt-0.5 text-xs text-gray-500">
                  Range:&nbsp;
                  <span className="text-gray-300">
                    {fmt(result.rangeLow, result.currency)} – {fmt(result.rangeHigh, result.currency)}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-xs font-bold ${CONFIDENCE_COLOR[result.confidence]}`}>
                  {CONFIDENCE_LABEL[result.confidence]}
                </span>
                {result.stats.soldCount > 0 && (
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {result.stats.soldCount} sold recently
                    {result.stats.avgDaysToSell !== null &&
                      ` · avg ${result.stats.avgDaysToSell}d to sell`}
                  </p>
                )}
                <p className="text-[10px] text-gray-700 mt-0.5">
                  via {result.source === 'ai' ? 'AI + market data' : 'market statistics'}
                </p>
              </div>
            </div>

            {/* Price comparison badge (sell flow) */}
            {priceVsEstimate && (
              <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold border ${
                priceVsEstimate === 'fair'
                  ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
                  : priceVsEstimate === 'low'
                  ? 'bg-amber-500/8 border-amber-500/20 text-amber-300'
                  : 'bg-red-500/8 border-red-500/20 text-red-300'
              }`}>
                {priceVsEstimate === 'fair' && <TrendingUp className="w-4 h-4 flex-shrink-0" />}
                {priceVsEstimate === 'low'  && <TrendingDown className="w-4 h-4 flex-shrink-0" />}
                {priceVsEstimate === 'high' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {priceVsEstimate === 'fair' && 'Your price is in the market range — good call.'}
                {priceVsEstimate === 'low'  && 'Your price is below market — you could earn more.'}
                {priceVsEstimate === 'high' && 'Your price is above the typical market range.'}
              </div>
            )}

            {/* Advice */}
            {result.advice && (
              <p className="text-xs text-gray-400 leading-relaxed border-l-2 border-violet-500/40 pl-3">
                {result.advice}
              </p>
            )}

            {/* Demand note */}
            {result.demandNote && (
              <p className="text-[11px] text-gray-500 leading-relaxed">{result.demandNote}</p>
            )}

            {/* Apply button */}
            {canApply && (
              <button
                onClick={() => onApplyPrice!(result.estimatedValue)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm
                  border border-violet-500/40 text-violet-300 bg-violet-500/8 hover:bg-violet-500/15
                  transition"
              >
                <DollarSign className="w-4 h-4" />
                Use {fmt(result.estimatedValue, result.currency)} as my price
              </button>
            )}

            {/* Factors accordion */}
            {!compact && result.factors.length > 0 && (
              <div className="border border-[var(--border-bg)] rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowFactors(f => !f)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition"
                >
                  Pricing factors ({result.factors.length})
                  {showFactors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showFactors && (
                  <div className="divide-y divide-[var(--border-bg)] border-t border-[var(--border-bg)]">
                    {result.factors.map((f, i) => {
                      const Icon = IMPACT_ICON[f.impact] ?? Minus;
                      return (
                        <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5">
                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${IMPACT_COLOR[f.impact]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white">{f.name}</p>
                            {f.note && <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{f.note}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Market stats mini-row */}
            {result.stats.count > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Market median', val: fmt(result.stats.median, result.currency) },
                  { label: 'Lowest ask', val: fmt(result.stats.min, result.currency) },
                  { label: 'Highest ask', val: fmt(result.stats.max, result.currency) },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-gray-600 leading-none">{label}</p>
                    <p className="text-xs font-bold text-white mt-1">{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback */}
            {result.requestId && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-[11px] text-gray-600">Was this estimate helpful?</p>
                <div className="flex gap-1.5 ml-auto">
                  {(['helpful', 'too_low', 'too_high'] as FeedbackVerdict[]).map(v => (
                    <button
                      key={v}
                      onClick={() => sendFeedback(v)}
                      disabled={feedbackSent}
                      title={v === 'helpful' ? 'Helpful' : v === 'too_low' ? 'Too low' : 'Too high'}
                      className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition disabled:opacity-50 ${
                        feedback === v
                          ? 'border-violet-500/60 bg-violet-500/15 text-violet-300'
                          : 'border-[var(--border-bg)] text-gray-600 hover:border-violet-500/30 hover:text-gray-300'
                      }`}
                    >
                      {v === 'helpful' ? (
                        <><ThumbsUp className="w-3 h-3" /> Helpful</>
                      ) : v === 'too_low' ? (
                        <><TrendingDown className="w-3 h-3" /> Too low</>
                      ) : (
                        <><TrendingUp className="w-3 h-3" /> Too high</>
                      )}
                    </button>
                  ))}
                </div>
                {feedbackSent && <p className="text-[10px] text-emerald-400 ml-1">Thanks!</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
