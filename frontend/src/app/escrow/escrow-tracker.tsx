'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { getEscrowByOrder, EscrowData } from '@/lib/api';
import { formatMoney, formatDate, ErrorBanner } from '@/components/admin/ui';

const STATUS_ICON: Record<string, React.ReactNode> = {
  HELD: <Lock className="w-5 h-5" />,
  PENDING: <Clock className="w-5 h-5" />,
  RELEASED: <CheckCircle className="w-5 h-5" />,
  REFUNDED: <AlertTriangle className="w-5 h-5" />,
  DISPUTED: <AlertTriangle className="w-5 h-5" />,
};

const STATUS_LABEL: Record<string, string> = {
  HELD: 'Funds Held in Escrow',
  PENDING: 'Awaiting Payment',
  RELEASED: 'Released to Seller',
  REFUNDED: 'Refunded',
  DISPUTED: 'In Dispute',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  HELD: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
  PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
  RELEASED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
  REFUNDED: 'bg-blue-500/20 text-blue-400 border border-blue-500/20',
  DISPUTED: 'bg-red-500/20 text-red-400 border border-red-500/20',
};

export default function EscrowTracker() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [polling, setPolling] = useState(false);

  const fetchEscrow = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getEscrowByOrder(orderId);
      setEscrow(data);
      const status = (data.status || '').toUpperCase();
      setPaid(status !== 'PENDING');
    } catch (e: any) {
      setError(e.message || 'Could not load escrow status');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    fetchEscrow();
    setPolling(true);
    const interval = setInterval(() => {
      fetchEscrow();
    }, 8000);
    return () => clearInterval(interval);
  }, [orderId, fetchEscrow]);

  if (!orderId) {
    return (
      <div className="bg-cardBg border border-borderBg rounded-3xl p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-7 h-7 text-brand" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Your Escrow Dashboard</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          When you place an order, its escrow status, payment link, and live updates appear here.
          Head to a listing and click <span className="text-white font-semibold">Pay</span> to get started.
        </p>
      </div>
    );
  }

  const status = (escrow?.status || 'PENDING').toUpperCase();
  const order = escrow?.order;

  return (
    <div className="bg-cardBg border border-borderBg rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Escrow Status</h2>
            <p className="text-gray-400 text-xs">Order #{String(orderId).slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <button
          onClick={fetchEscrow}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {loading && !escrow ? (
        <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading escrow status...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status banner */}
          <div className="flex items-center gap-4 bg-background border border-borderBg rounded-2xl p-5">
            <span className="text-brand">
              {STATUS_ICON[status] || <Clock className="w-5 h-5" />}
            </span>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Current status</p>
              <p className="text-lg font-bold text-white">
                {STATUS_LABEL[status] || status}
              </p>
            </div>
            {escrow && <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE_CLASS[status] || 'bg-gray-700 text-gray-300'}`}>{status}</span>}
          </div>

          {/* Payment link — prominent */}
          {escrow?.paymentLink ? (
            <a
              href={escrow.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(fetchEscrow, 4000)}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold text-white text-base shadow-lg shadow-brand/20 transition"
            >
              <ExternalLink className="w-5 h-5" />
              {paid ? 'Open Payment Link' : 'Pay Now — Complete Your Payment'}
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-white/5 border border-borderBg py-4 rounded-xl text-gray-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Payment link is not available yet. Refresh to check again.
            </div>
          )}

          {/* Order summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-background border border-borderBg rounded-2xl p-4">
              <p className="text-xs text-gray-400">Amount in Escrow</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatMoney(escrow?.amount, escrow?.currency)}
              </p>
            </div>
            <div className="bg-background border border-borderBg rounded-2xl p-4">
              <p className="text-xs text-gray-400">Order</p>
              <p className="text-sm font-semibold text-white mt-1 truncate">
                {order?.metadata?.title || order?.orderNumber || '—'}
              </p>
            </div>
            <div className="bg-background border border-borderBg rounded-2xl p-4">
              <p className="text-xs text-gray-400">Seller</p>
              <p className="text-sm font-semibold text-white mt-1 truncate">
                {order?.seller?.storeName || '—'}
              </p>
            </div>
          </div>

          {order?.createdAt && (
            <p className="text-xs text-gray-500">Order placed {formatDate(order.createdAt)}</p>
          )}

          <p className="text-xs text-gray-500 leading-relaxed flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-brand flex-shrink-0 mt-0.5" />
            This page auto-refreshes every few seconds. Once your payment is confirmed, the status will
            update automatically. Funds stay locked in escrow until delivery is confirmed.
          </p>
        </div>
      )}
    </div>
  );
}
