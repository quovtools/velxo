'use client';
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getEscrowByOrder, generateEscrowPaymentLink } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  ShieldCheck, MessageSquare, AlertTriangle, CheckCircle, Truck,
  FileText, X, Lock, ExternalLink, Loader2, Copy,
  Clock, Eye, EyeOff, Star, Package, ArrowLeft,
  Shield, History, Wallet, XCircle, ChevronRight,
  UserCheck, Timer,
} from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/lib/useCurrency';
import SellerLevelBadge from '@/components/SellerLevelBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string | number;
  commissionAmount: string | number;
  commissionRate: string | number;
  sellerPayout: string | number;
  status: string;
  buyerNote?: string;
  deliveryData?: any;
  createdAt: string;
  paidAt?: string | null;
  acceptedAt?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  sellerDeliverDeadline?: string | null;
  deliveredAt?: string | null;
  buyerConfirmDeadline?: string | null;
  buyerId: string;
  sellerId: string;
  currency?: string;
  buyer?: { id: string; firstName: string; lastName: string; email: string };
  seller?: {
    userId: string; storeName: string; isVerified?: boolean;
    averageRating?: number; sellerLevel?: string;
    avgResponseTimeHours?: number; deliverySuccessRate?: number;
    isOnline?: boolean;
  };
  escrow?: { amount: string | number; status: string; currency: string };
  orderItems: Array<{ listing?: { id: string; title: string; gameName: string; price: string | number; images?: string[] } }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING:     'Awaiting Payment',
  PAID:        'Funds in Escrow',
  IN_PROGRESS: 'Awaiting Confirmation',
  COMPLETED:   'Completed',
  DISPUTED:    'In Dispute',
  CANCELLED:   'Cancelled',
  REFUNDED:    'Refunded',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:     'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  PAID:        'bg-blue-500/10 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-brand/10 text-brand border-brand/30',
  COMPLETED:   'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  DISPUTED:    'bg-red-500/10 text-red-300 border-red-500/30',
  CANCELLED:   'bg-gray-800/60 text-gray-400 border-gray-700',
  REFUNDED:    'bg-gray-800/60 text-gray-400 border-gray-700',
};

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const SELLER_WINDOW_MS = 60 * 60 * 1000;
const BUYER_WINDOW_MS = 60 * 60 * 1000;

const STEPS = [
  { key: 'PENDING',     label: 'Order Placed',     sub: 'Awaiting secure payment',   icon: Package },
  { key: 'PAID',        label: 'Funds in Escrow',  sub: 'Payment locked in escrow',  icon: Shield },
  { key: 'IN_PROGRESS', label: 'Seller Delivered', sub: 'Delivery confirmed',        icon: Truck },
  { key: 'COMPLETED',   label: 'Funds Released',   sub: 'Trade complete',            icon: CheckCircle },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(v: string | number | undefined | null): number {
  return Number(v ?? 0);
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function cdColor(ms: number | null): string {
  if (ms === null) return 'text-gray-400';
  if (ms <= 0) return 'text-red-400';
  if (ms < 600_000) return 'text-red-400 animate-pulse';
  if (ms < 1_800_000) return 'text-yellow-400';
  return 'text-emerald-400';
}

function stepIndex(status: string, deliveredAt?: string | null): number {
  switch (status) {
    case 'PENDING':     return 0;
    case 'PAID':        return 1;
    case 'IN_PROGRESS': return 2;
    case 'COMPLETED':   return 3;
    case 'DISPUTED':    return deliveredAt ? 2 : 1;
    default:            return 0;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-borderBg/40 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm text-white font-mono mt-0.5 break-all">{value}</p>
      </div>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-brand hover:bg-brand/10 transition">
        {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function InfoRow({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-borderBg/30 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${valueClass ?? 'text-white'}`}>{value}</span>
    </div>
  );
}

function StarRow({ rating, setRating }: { rating: number; setRating: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => setRating(i)}>
          <Star className={`w-7 h-7 transition ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`} />
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OrderTrackingContent({ id }: { id: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt } = useCurrency();

  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [now, setNow]         = useState(() => Date.now());
  const [timeline, setTimeline] = useState<any[] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment
  const [paymentLink, setPaymentLink]       = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Delivery form (seller)
  const [deliveryEmail, setDeliveryEmail]   = useState('');
  const [deliveryPass, setDeliveryPass]     = useState('');
  const [deliveryExtra, setDeliveryExtra]   = useState('');
  const [deliveryNotes, setDeliveryNotes]   = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Delivery reveal (buyer)
  const [showDelivery, setShowDelivery] = useState(false);
  const [deliveryTab, setDeliveryTab]   = useState<'credentials' | 'notes' | 'raw'>('credentials');

  // Dispute / review / cancel modals
  const [showDispute, setShowDispute]               = useState(false);
  const [disputeReason, setDisputeReason]           = useState('');
  const [disputeDesc, setDisputeDesc]               = useState('');
  const [submittingDispute, setSubmittingDispute]   = useState(false);

  const [showCancelConfirm, setShowCancelConfirm]   = useState(false);
  const [cancelling, setCancelling]                 = useState(false);

  const [reviewRating, setReviewRating]             = useState(0);
  const [reviewComment, setReviewComment]           = useState('');
  const [submittingReview, setSubmittingReview]     = useState(false);
  const [reviewDone, setReviewDone]                 = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => setToast({ msg, type }), []);

  // ── Tick every second ──────────────────────────────────────────────────────
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // ── Load order ─────────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    try {
      const res = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
      if (res.success) setOrder(res.data);
      const tRes = await api.get<{ success: boolean; data: any[] }>(`/orders/${id}/timeline`).catch(() => null);
      if (tRes?.success) setTimeline(tRes.data);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load order');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    load();
  }, [id, user, authLoading, router, load]);

  // Auto-refresh for active orders
  useEffect(() => {
    if (!order || ['COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED'].includes(order.status)) return;
    const t = setInterval(() => load(true), 8000);
    return () => clearInterval(t);
  }, [order, load]);

  // Load payment link for PENDING buyer
  useEffect(() => {
    if (!order || order.status !== 'PENDING' || user?.id !== order.buyerId) { setPaymentLink(null); return; }
    let active = true;
    setPaymentLoading(true);
    getEscrowByOrder(id)
      .then(res => { if (active) setPaymentLink(res?.paymentLink || null); })
      .catch(() => {})
      .finally(() => { if (active) setPaymentLoading(false); });
    return () => { active = false; };
  }, [order?.status, id, user?.id]);

  // ── Derived values ─────────────────────────────────────────────────────────
  if (!order && !loading && !error) return null;

  const isBuyer  = user?.id === order?.buyerId;
  const isSeller = user?.id === order?.seller?.userId;
  const item     = order?.orderItems?.[0];

  const escrowAmt = n(order?.escrow?.amount ?? order?.totalAmount);
  const fee       = n(order?.commissionAmount);
  const payout    = n(order?.sellerPayout);
  const commRate  = Math.round(n(order?.commissionRate) * 100);

  // Timers
  const sellerDeadlineMs = order?.sellerDeliverDeadline
    ? new Date(order.sellerDeliverDeadline).getTime()
    : order?.acceptedAt ? new Date(order.acceptedAt).getTime() + SELLER_WINDOW_MS : null;
  const buyerDeadlineMs  = order?.buyerConfirmDeadline ? new Date(order.buyerConfirmDeadline).getTime() : null;
  const orderCreatedMs   = order?.createdAt ? new Date(order.createdAt).getTime() : null;

  const sellerRemaining = sellerDeadlineMs != null ? sellerDeadlineMs - now : null;
  const buyerRemaining  = buyerDeadlineMs  != null ? buyerDeadlineMs  - now : null;
  const pendingAgeMs    = orderCreatedMs   != null ? now - orderCreatedMs    : 0;
  // Seller can close unpaid order after 3hrs
  const canSellerCancel = order?.status === 'PENDING' && isSeller && pendingAgeMs >= THREE_HOURS_MS;
  const sellerCancelCooldownMs = order?.status === 'PENDING' && isSeller && pendingAgeMs < THREE_HOURS_MS
    ? THREE_HOURS_MS - pendingAgeMs : 0;

  const curIdx      = order ? stepIndex(order.status, order.deliveredAt) : 0;
  const isDisputed  = order?.status === 'DISPUTED';
  const isCancelled = order?.status === 'CANCELLED' || order?.status === 'REFUNDED';
  const isDone      = order?.status === 'COMPLETED' || isCancelled;

  // Parse delivery data – backend expects { credentials, notes }
  const creds   = order?.deliveryData?.credentials ?? {};
  const rawNote = order?.deliveryData?.notes ?? order?.deliveryData?.message ?? '';
  const rawFull = [
    creds.email    ? `Email: ${creds.email}`    : '',
    creds.password ? `Password: ${creds.password}` : '',
    creds.username ? `Username: ${creds.username}` : '',
    creds.loginMethod ? `Login Method: ${creds.loginMethod}` : '',
    rawNote        ? `Notes: ${rawNote}` : '',
  ].filter(Boolean).join('\n') || rawNote;

  const credFields = Object.entries(creds).filter(([, v]) => v);

  const otherName = isBuyer
    ? (order?.seller?.storeName || 'Seller')
    : ([order?.buyer?.firstName, order?.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer');

  // ── Action handlers ────────────────────────────────────────────────────────

  const act = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try { await fn(); await load(); }
    catch (err: any) { showToast(err.message || 'Something went wrong', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleGeneratePayment = () =>
    act(async () => {
      const res = await generateEscrowPaymentLink(id);
      if (res?.url) {
        const win = window.open(res.url, '_blank', 'noopener,noreferrer');
        if (!win) window.location.href = res.url;
      } else {
        throw new Error('Payment method unavailable. Please contact support.');
      }
    });

  const handleAccept = () => act(async () => {
    await api.patch(`/orders/${id}/accept`);
    showToast('Order accepted — delivery timer started', 'success');
  });

  const handleMarkDelivered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryEmail && !deliveryPass && !deliveryExtra) {
      showToast('Please fill in at least one credential field', 'error'); return;
    }
    setSubmittingDelivery(true);
    try {
      await api.patch(`/orders/${id}/mark-delivered`, {
        deliveryData: {
          credentials: {
            email:       deliveryEmail  || undefined,
            password:    deliveryPass   || undefined,
            username:    deliveryExtra  || undefined,
            loginMethod: undefined,
          },
          notes: deliveryNotes || undefined,
        },
      });
      showToast('Delivery confirmed — awaiting buyer', 'success');
      setDeliveryEmail(''); setDeliveryPass(''); setDeliveryExtra(''); setDeliveryNotes('');
      await load();
    } catch (err: any) { showToast(err.message || 'Failed to mark delivered', 'error'); }
    finally { setSubmittingDelivery(false); }
  };

  const handleConfirmDelivery = () => act(async () => {
    await api.patch(`/orders/${id}/confirm-delivery`);
    showToast('Receipt confirmed — funds released to seller', 'success');
  });

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/orders/${id}/cancel`, {});
      showToast('Order cancelled', 'success');
      setShowCancelConfirm(false);
      await load();
    } catch (err: any) { showToast(err.message || 'Failed to cancel', 'error'); }
    finally { setCancelling(false); }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDispute(true);
    try {
      await api.post('/disputes', { orderId: id, reason: disputeReason, description: disputeDesc });
      showToast('Dispute opened — our team will review within 24–72h', 'success');
      setShowDispute(false);
      await load();
    } catch (err: any) { showToast(err.message || 'Failed to open dispute', 'error'); }
    finally { setSubmittingDispute(false); }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { orderId: id, rating: reviewRating, comment: reviewComment });
      setReviewDone(true);
      showToast('Review submitted — thank you!', 'success');
    } catch (err: any) { showToast(err.message || 'Failed to submit review', 'error'); }
    finally { setSubmittingReview(false); }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) return (
    <div className="space-y-5 py-6 animate-pulse">
      <div className="h-8 bg-cardBg rounded-xl w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-52 bg-cardBg rounded-3xl" />
          <div className="h-40 bg-cardBg rounded-3xl" />
          <div className="h-64 bg-cardBg rounded-3xl" />
        </div>
        <div className="h-96 bg-cardBg rounded-3xl" />
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="text-center py-20 bg-cardBg border border-borderBg rounded-3xl">
      <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
      <p className="text-red-400 font-semibold mb-3">{error || 'Order not found'}</p>
      <Link href="/orders" className="text-brand hover:underline font-semibold text-sm">← Back to orders</Link>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-10">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-borderBg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/orders" className="p-1 text-gray-500 hover:text-white transition rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-black text-white">Track Order</h1>
          </div>
          <p className="text-xs text-gray-500 pl-7">
            <span className="text-brand font-bold">#{order.orderNumber.slice(-10).toUpperCase()}</span>
            <span className="mx-2 opacity-30">·</span>
            {new Date(order.createdAt).toLocaleString()}
            {order.paidAt && (
              <><span className="mx-2 opacity-30">·</span>Paid {new Date(order.paidAt).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <span className={`self-start sm:self-auto px-4 py-1.5 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* ─── Urgent banners ────────────────────────────────────────────────── */}

      {/* Buyer: unpaid banner with payment button */}
      {order.status === 'PENDING' && isBuyer && (
        <div className="bg-yellow-950/20 border border-yellow-500/25 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-yellow-500/15 rounded-xl flex-shrink-0">
              <Lock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-yellow-200">Payment required to lock funds in escrow</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Your item is reserved. Complete payment to notify the seller. If you already paid, wait a moment.
              </p>
            </div>
          </div>
          {paymentLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking payment status…
            </div>
          ) : paymentLink ? (
            <a href={paymentLink} target="_blank" rel="noopener noreferrer"
              onClick={() => setTimeout(() => load(), 4000)}
              className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:opacity-90 px-5 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-brand/25 transition text-sm">
              <ExternalLink className="w-4 h-4" /> Pay Now — Complete Payment
            </a>
          ) : (
            <button onClick={handleGeneratePayment} disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:opacity-90 px-5 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-brand/25 disabled:opacity-50 transition text-sm">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Generate Payment Link
            </button>
          )}
        </div>
      )}

      {/* Seller: buyer hasn't paid — close order countdown */}
      {order.status === 'PENDING' && isSeller && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-yellow-500/10 rounded-xl flex-shrink-0">
              <Timer className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Awaiting buyer payment</p>
              {canSellerCancel ? (
                <p className="text-xs text-emerald-400 mt-0.5">3 hours elapsed — you can close this unpaid order now.</p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">
                  You can close this order in{' '}
                  <span className={`font-mono font-bold ${cdColor(sellerCancelCooldownMs)}`}>
                    {fmtCountdown(sellerCancelCooldownMs)}
                  </span>
                  {' '}if the buyer hasn&apos;t paid.
                </p>
              )}
            </div>
          </div>
          {canSellerCancel && (
            <button onClick={() => setShowCancelConfirm(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 transition">
              <XCircle className="w-4 h-4" /> Close Unpaid Order
            </button>
          )}
        </div>
      )}

      {/* Buyer: delivery received, confirm CTA */}
      {order.status === 'IN_PROGRESS' && isBuyer && (
        <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4
          ${buyerRemaining !== null && buyerRemaining < 600_000 ? 'bg-red-950/30 border-red-500/30' : 'bg-brand/5 border-brand/25'}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Truck className={`w-6 h-6 flex-shrink-0 ${buyerRemaining !== null && buyerRemaining < 600_000 ? 'text-red-400' : 'text-brand'}`} />
            <div>
              <p className="font-bold text-white text-sm">Your item has been delivered — confirm receipt</p>
              {buyerRemaining !== null && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Auto-releases in{' '}
                  <span className={`font-mono font-black ${cdColor(buyerRemaining)}`}>{fmtCountdown(buyerRemaining)}</span>
                </p>
              )}
            </div>
          </div>
          <button onClick={handleConfirmDelivery} disabled={actionLoading}
            className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-black font-black px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2">
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirm & Release Funds
          </button>
        </div>
      )}

      {/* ─── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── LEFT column (2/3) ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Escrow Progression */}
          <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-borderBg">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <h3 className="font-bold text-white text-sm">Trust-Trade Escrow</h3>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.escrow?.status ?? order.status] ?? 'text-gray-400 border-gray-700'}`}>
                {order.escrow?.status ?? 'HELD'}
              </span>
            </div>

            {/* Stepper */}
            {!isCancelled ? (
              <div className="px-6 py-5">
                <div className="flex items-start justify-between relative">
                  {/* connector line */}
                  <div className="absolute top-[18px] left-[18px] right-[18px] h-0.5 bg-borderBg z-0" />
                  <div
                    className="absolute top-[18px] left-[18px] h-0.5 bg-brand z-0 transition-all duration-500"
                    style={{ width: `${(curIdx / (STEPS.length - 1)) * (100 - (100 / STEPS.length))}%` }}
                  />
                  {STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const done   = idx < curIdx;
                    const active = idx === curIdx && !isDisputed;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                          ${done   ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                          : active ? 'bg-brand ring-4 ring-brand/20 shadow-lg shadow-brand/20'
                          : 'bg-background border-2 border-borderBg'}`}>
                          {done
                            ? <CheckCircle className="w-4 h-4 text-white" />
                            : <StepIcon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />}
                        </div>
                        <p className={`text-[10px] font-bold mt-2 text-center leading-tight
                          ${done || active ? 'text-white' : 'text-gray-600'}`}>
                          {step.label}
                        </p>
                        <p className="text-[9px] text-gray-600 text-center mt-0.5 hidden sm:block">{step.sub}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Active step countdowns */}
                {order.status === 'PAID' && order.acceptedAt && sellerRemaining !== null && (
                  <div className="mt-4 flex items-center gap-2 text-xs bg-yellow-950/20 border border-yellow-500/20 rounded-xl px-4 py-2.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-400">Seller delivery window:</span>
                    <span className={`font-mono font-black text-sm ml-auto ${cdColor(sellerRemaining)}`}>{fmtCountdown(sellerRemaining)}</span>
                  </div>
                )}
                {order.status === 'IN_PROGRESS' && buyerRemaining !== null && (
                  <div className="mt-4 flex items-center gap-2 text-xs bg-brand/5 border border-brand/20 rounded-xl px-4 py-2.5">
                    <Clock className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                    <span className="text-gray-400">Buyer confirmation window:</span>
                    <span className={`font-mono font-black text-sm ml-auto ${cdColor(buyerRemaining)}`}>{fmtCountdown(buyerRemaining)}</span>
                  </div>
                )}
                {isDisputed && (
                  <div className="mt-4 flex items-start gap-3 bg-red-950/20 border border-red-500/25 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-300">Under Moderation</p>
                      <p className="text-xs text-gray-400 mt-0.5">Our team is reviewing both parties and will resolve within 24–72 hours.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-5 flex items-center gap-3 text-gray-400">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Order {order.status === 'REFUNDED' ? 'Refunded' : 'Cancelled'}</p>
                  {order.cancelledAt && <p className="text-xs text-gray-500 mt-0.5">on {new Date(order.cancelledAt).toLocaleString()}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Escrow Breakdown — own dedicated card */}
          <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-borderBg">
              <Wallet className="w-4 h-4 text-brand" />
              <h3 className="font-bold text-white text-sm">Escrow Breakdown</h3>
            </div>
            <div className="px-6 py-5 space-y-0">
              <InfoRow label="Order Total (Buyer pays)"
                value={fmt(escrowAmt)} valueClass="font-bold text-white" />
              <InfoRow
                label={`Platform Fee (${commRate > 0 ? commRate : 10}%)`}
                value={`- ${fmt(fee)}`} valueClass="text-gray-400" />
              <div className="pt-3 mt-1 border-t border-borderBg flex items-center justify-between">
                <span className="text-sm font-bold text-white">Seller Payout</span>
                <span className="text-lg font-black text-emerald-400">{fmt(payout)}</span>
              </div>
              {isBuyer && (
                <p className="text-[10px] text-gray-600 mt-3 pt-3 border-t border-borderBg/40">
                  Funds are locked in Piyrox Trust-Trade escrow until you confirm receipt.
                  They are never released until you confirm — or a dispute is resolved.
                </p>
              )}
              {isSeller && (
                <p className="text-[10px] text-gray-600 mt-3 pt-3 border-t border-borderBg/40">
                  Your payout is released to your Piyrox wallet once the buyer confirms receipt.
                </p>
              )}
            </div>
          </div>

          {/* Item details */}
          {item?.listing && (
            <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-borderBg">
                <Package className="w-4 h-4 text-brand" />
                <h3 className="font-bold text-white text-sm">Order Item</h3>
              </div>
              <div className="px-6 py-5 flex items-center gap-4">
                {item.listing.images?.[0] ? (
                  <img src={item.listing.images[0]} alt={item.listing.title}
                    className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-borderBg" />
                ) : (
                  <div className="w-16 h-16 bg-background border border-borderBg rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{item.listing.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.listing.gameName}</p>
                  <p className="text-sm font-black text-brand mt-1">{fmt(n(item.listing.price))}</p>
                </div>
                <Link href={`/listings/${item.listing.id}`}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-brand border border-borderBg hover:border-brand/30 rounded-lg transition">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Delivery Details — buyer view */}
          {(order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') && isBuyer && (
            <div className="bg-cardBg border border-brand/30 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-borderBg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" />
                  <h3 className="font-bold text-white text-sm">Delivery Details</h3>
                </div>
                <button onClick={() => setShowDelivery(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-borderBg text-gray-400 hover:text-white hover:border-brand/30 transition">
                  {showDelivery ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Reveal</>}
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {!showDelivery ? (
                  <button onClick={() => setShowDelivery(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-background border border-dashed border-borderBg rounded-xl text-gray-500 text-sm hover:border-brand/40 hover:text-gray-300 transition">
                    <Eye className="w-4 h-4" /> Click Reveal to view account credentials
                  </button>
                ) : (
                  <>
                    <div className="flex gap-1 bg-background border border-borderBg rounded-xl p-1">
                      {(['credentials', 'notes', 'raw'] as const).map(t => (
                        <button key={t} onClick={() => setDeliveryTab(t)}
                          className={`flex-1 text-xs font-bold py-2 rounded-lg capitalize transition
                            ${deliveryTab === t ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="bg-background border border-borderBg rounded-xl p-4">
                      {deliveryTab === 'credentials' && (
                        credFields.length > 0 ? (
                          credFields.map(([k, v]) => <CopyRow key={k} label={k} value={String(v)} />)
                        ) : rawFull ? (
                          rawFull.split('\n').map((line, i) => {
                            const ci = line.indexOf(':');
                            if (ci > 0 && ci < 35) return <CopyRow key={i} label={line.slice(0, ci).trim()} value={line.slice(ci + 1).trim()} />;
                            return <p key={i} className="text-sm text-white font-mono py-1">{line}</p>;
                          })
                        ) : (
                          <p className="text-sm text-gray-500">No credentials provided yet.</p>
                        )
                      )}
                      {deliveryTab === 'notes' && (
                        <pre className="text-sm text-white font-mono whitespace-pre-wrap">{rawNote || 'No notes provided.'}</pre>
                      )}
                      {deliveryTab === 'raw' && (
                        <div className="flex items-start gap-2">
                          <pre className="text-sm text-white font-mono whitespace-pre-wrap flex-1">{rawFull || 'Nothing delivered yet.'}</pre>
                          {rawFull && (
                            <button onClick={() => navigator.clipboard.writeText(rawFull)}
                              className="p-1.5 text-gray-500 hover:text-brand rounded-lg hover:bg-brand/10 transition flex-shrink-0">
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {order.status === 'IN_PROGRESS' && (
                      <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        Only confirm receipt after you have successfully tested the account credentials.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Seller: your delivery message */}
          {(order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') && isSeller && (
            <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-borderBg">
                <FileText className="w-4 h-4 text-brand" />
                <h3 className="font-bold text-white text-sm">Your Delivery (sent to buyer)</h3>
              </div>
              <div className="px-6 py-5">
                {rawFull ? (
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap bg-background border border-borderBg rounded-xl p-4">{rawFull}</pre>
                ) : (
                  <p className="text-sm text-gray-500">Delivery data not available.</p>
                )}
              </div>
            </div>
          )}

          {/* Order Activity Timeline */}
          {timeline && timeline.length > 0 && (
            <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-borderBg">
                <History className="w-4 h-4 text-brand" />
                <h3 className="font-bold text-white text-sm">Order Activity</h3>
              </div>
              <ul className="px-6 py-4 space-y-0">
                {timeline.map((ev, i) => {
                  const st  = ev.status ?? 'pending';
                  const dot = st === 'done'   ? 'bg-emerald-500'
                             : st === 'active' ? 'bg-brand ring-4 ring-brand/20'
                             : 'bg-background border-2 border-borderBg';
                  return (
                    <li key={ev.id ?? i}
                      className={`flex items-start gap-4 py-3 ${i < timeline.length - 1 ? 'border-b border-borderBg/30' : ''}`}>
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${st === 'pending' ? 'text-gray-500' : 'text-white'}`}>{ev.label}</p>
                        {ev.timestamp && (
                          <p className="text-[10px] text-gray-500 mt-0.5">{new Date(ev.timestamp).toLocaleString()}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Order Actions */}
          {!isCancelled && (
            <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-borderBg">
                <h3 className="font-bold text-white text-sm">Order Actions</h3>
              </div>
              <div className="px-6 py-5 space-y-4">

                {/* ── SELLER ACTIONS ── */}
                {isSeller && order.status === 'PAID' && !order.acceptedAt && (
                  <>
                    <div className="flex items-start gap-3 bg-brand/5 border border-brand/20 rounded-xl p-4">
                      <Lock className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Funds are locked in escrow. Accept to start your <span className="font-bold text-white">1-hour</span> delivery window.</p>
                    </div>
                    <button onClick={handleAccept} disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 bg-brand hover:opacity-90 py-4 rounded-xl font-black text-white disabled:opacity-50 transition shadow-lg shadow-brand/20">
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      Accept Order & Start Delivery Timer
                    </button>
                  </>
                )}

                {isSeller && order.status === 'PAID' && order.acceptedAt && (
                  <>
                    <div className="flex items-center gap-4 bg-yellow-950/20 border border-yellow-500/20 rounded-xl p-4">
                      <Truck className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-yellow-300 font-bold uppercase tracking-widest">Deliver within</p>
                        <p className={`text-2xl font-black font-mono ${cdColor(sellerRemaining)}`}>{fmtCountdown(sellerRemaining ?? 0)}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Miss this window and the buyer can open a dispute.</p>
                      </div>
                    </div>
                    <form onSubmit={handleMarkDelivered} className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account Credentials</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase tracking-wide font-bold block mb-1">Email / UID</label>
                          <input type="text" value={deliveryEmail} onChange={e => setDeliveryEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-brand transition" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase tracking-wide font-bold block mb-1">Password</label>
                          <input type="text" value={deliveryPass} onChange={e => setDeliveryPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-brand transition" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide font-bold block mb-1">Username / Extra Info</label>
                        <input type="text" value={deliveryExtra} onChange={e => setDeliveryExtra(e.target.value)}
                          placeholder="Username, recovery email, login method, etc."
                          className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-brand transition" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide font-bold block mb-1">Notes to Buyer (optional)</label>
                        <textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} rows={2}
                          placeholder="e.g. Log in via Facebook · do not change email"
                          className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand resize-none transition" />
                      </div>
                      <button type="submit" disabled={submittingDelivery}
                        className="w-full flex items-center justify-center gap-2 bg-brand hover:opacity-90 py-4 rounded-xl font-black text-white disabled:opacity-50 transition shadow-lg shadow-brand/20">
                        {submittingDelivery ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                        {submittingDelivery ? 'Submitting…' : 'Mark as Delivered'}
                      </button>
                    </form>
                  </>
                )}

                {isSeller && order.status === 'IN_PROGRESS' && (
                  <div className="flex items-start gap-3 bg-brand/5 border border-brand/20 rounded-xl p-4">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-300 text-sm">Delivered — Awaiting buyer confirmation</p>
                      {buyerRemaining !== null && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Auto-releases in <span className={`font-mono font-bold ${cdColor(buyerRemaining)}`}>{fmtCountdown(buyerRemaining)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {isSeller && order.status === 'COMPLETED' && (
                  <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <p className="text-sm font-bold text-emerald-300">Payout credited to your Piyrox wallet.</p>
                    <Link href="/wallet" className="ml-auto text-xs font-bold text-brand flex items-center gap-1">
                      Wallet <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* ── BUYER ACTIONS ── */}
                {isBuyer && order.status === 'IN_PROGRESS' && (
                  <button onClick={handleConfirmDelivery} disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-black py-4 rounded-xl text-sm disabled:opacity-50 transition shadow-lg shadow-emerald-500/20">
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    Confirm Receipt & Release Funds
                  </button>
                )}

                {/* Dispute — available to buyer when PAID or IN_PROGRESS */}
                {isBuyer && (order.status === 'PAID' || order.status === 'IN_PROGRESS') && !isDisputed && (
                  <button onClick={() => setShowDispute(true)}
                    className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 py-3 rounded-xl text-sm font-bold text-red-400 transition">
                    <AlertTriangle className="w-4 h-4" /> Open a Dispute
                  </button>
                )}

                {/* Buyer cancel PENDING */}
                {isBuyer && order.status === 'PENDING' && (
                  <button onClick={() => setShowCancelConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-background border border-borderBg hover:border-red-500/40 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-400 transition">
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </button>
                )}

                {/* Leave a review after completion */}
                {isBuyer && order.status === 'COMPLETED' && !reviewDone && (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Leave a Review</p>
                    <form onSubmit={handleReview} className="space-y-3">
                      <StarRow rating={reviewRating} setRating={setReviewRating} />
                      <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={2}
                        placeholder="How was your experience with this seller?"
                        className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand resize-none transition" />
                      <button type="submit" disabled={!reviewRating || submittingReview}
                        className="w-full flex items-center justify-center gap-2 bg-brand hover:opacity-90 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition">
                        {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                        Submit Review
                      </button>
                    </form>
                  </div>
                )}
                {isBuyer && order.status === 'COMPLETED' && reviewDone && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" /> Review submitted — thank you!
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
        {/* ── End left column ──────────────────────────────────────────────── */}

        {/* ── RIGHT sidebar (1/3) ──────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Counterparty card */}
          <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-borderBg">
              <UserCheck className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-white">{isBuyer ? 'Seller' : 'Buyer'}</h3>
              {order.seller?.isOnline && isBuyer && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Online
                </span>
              )}
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center flex-shrink-0 font-black text-white text-lg">
                  {otherName[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{otherName}</p>
                  {order.seller?.sellerLevel && isBuyer && (
                    <SellerLevelBadge level={order.seller.sellerLevel} size="sm" />
                  )}
                </div>
              </div>

              {isBuyer && order.seller && (
                <div className="space-y-0 pt-1">
                  <InfoRow label="Rating"
                    value={order.seller.averageRating ? `${order.seller.averageRating.toFixed(1)} ★` : '—'}
                    valueClass="text-yellow-400 font-bold" />
                  <InfoRow label="Delivery"
                    value={`${order.seller.deliverySuccessRate ?? 100}%`}
                    valueClass="text-emerald-400 font-bold" />
                  <InfoRow label="Avg Response"
                    value={order.seller.avgResponseTimeHours ? `${order.seller.avgResponseTimeHours}h` : '< 1h'}
                    valueClass="text-white" />
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {isBuyer && order.seller && (
                  <Link href={`/seller/${order.sellerId}`}
                    className="flex items-center justify-center gap-2 py-2.5 bg-hoverBg/40 hover:bg-hoverBg border border-borderBg rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition">
                    <UserCheck className="w-3.5 h-3.5" /> View Seller Profile
                  </Link>
                )}
                <Link href={`/messages?order=${id}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-brand hover:opacity-90 rounded-xl text-xs font-bold text-white transition shadow-sm shadow-brand/20">
                  <MessageSquare className="w-3.5 h-3.5" /> Open Chat
                </Link>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-borderBg">
              <FileText className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-white">Order Summary</h3>
            </div>
            <div className="px-5 py-4 space-y-0">
              <InfoRow label="Order #" value={order.orderNumber.slice(-10).toUpperCase()} valueClass="font-mono text-brand" />
              <InfoRow label="Placed" value={new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
              {order.paidAt && <InfoRow label="Paid" value={new Date(order.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} valueClass="text-emerald-400" />}
              {order.acceptedAt && <InfoRow label="Accepted" value={new Date(order.acceptedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} />}
              {order.deliveredAt && <InfoRow label="Delivered" value={new Date(order.deliveredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} />}
              {order.completedAt && <InfoRow label="Completed" value={new Date(order.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} valueClass="text-emerald-400" />}
              <div className="pt-3 mt-1 border-t border-borderBg/40 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-300">Total</span>
                <span className="text-base font-black text-white">{fmt(escrowAmt)}</span>
              </div>
            </div>
          </div>

          {/* Buyer note */}
          {order.buyerNote && (
            <div className="bg-cardBg border border-borderBg rounded-2xl px-5 py-4 space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Buyer Note</p>
              <p className="text-sm text-gray-300">{order.buyerNote}</p>
            </div>
          )}

        </div>
        {/* ── End right sidebar ─────────────────────────────────────────────── */}
      </div>
      {/* ── End main grid ─────────────────────────────────────────────────── */}

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Cancel confirm */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-cardBg border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 rounded-xl"><XCircle className="w-5 h-5 text-red-400" /></div>
              <h3 className="font-bold text-white">
                {isSeller ? 'Close Unpaid Order?' : 'Cancel Order?'}
              </h3>
            </div>
            <p className="text-sm text-gray-400">
              {isSeller
                ? 'The order will be cancelled and the listing will become available again. The buyer was not charged.'
                : 'Your order will be cancelled. The listing will become available to other buyers. No payment was taken.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white border border-borderBg transition">
                Keep Order
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition">
                {cancelling ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling…</> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute modal */}
      {showDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-cardBg border border-red-500/20 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                <h3 className="font-bold text-white">Open a Dispute</h3>
              </div>
              <button onClick={() => setShowDispute(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Disputes are reviewed by our moderation team within 24–72 hours. Provide as much detail as possible.
            </p>
            <form onSubmit={handleDispute} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Reason</label>
                <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                  <option value="">Select a reason…</option>
                  <option value="ITEM_NOT_RECEIVED">Item not received / no credentials</option>
                  <option value="ITEM_NOT_AS_DESCRIBED">Account not as described</option>
                  <option value="ACCOUNT_BANNED">Account was banned / suspended</option>
                  <option value="WRONG_CREDENTIALS">Credentials don&apos;t work</option>
                  <option value="SELLER_UNRESPONSIVE">Seller is unresponsive</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea value={disputeDesc} onChange={e => setDisputeDesc(e.target.value)}
                  rows={4} required minLength={20}
                  placeholder="Describe the issue in detail…"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand resize-none transition" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowDispute(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white border border-borderBg transition">
                  Cancel
                </button>
                <button type="submit" disabled={submittingDispute}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition">
                  {submittingDispute ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Open Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
