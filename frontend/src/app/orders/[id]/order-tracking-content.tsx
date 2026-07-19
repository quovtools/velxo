'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getEscrowByOrder, generateEscrowPaymentLink } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  ShieldCheck, MessageSquare, AlertTriangle, CheckCircle, Truck,
  HandCoins, FileText, X, Lock, ExternalLink, Loader2, Copy,
  Clock, Eye, EyeOff, Star, Package, ArrowLeft, Zap,
  ChevronRight, Send, Shield, History,
} from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/lib/useCurrency';
import SellerLevelBadge from '@/components/SellerLevelBadge';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  commissionAmount: string;
  sellerPayout: string;
  status: string;
  buyerNote: string;
  deliveryData?: any;
  createdAt: string;
  acceptedAt?: string;
  sellerDeliverDeadline?: string;
  deliveredAt?: string;
  buyerConfirmDeadline?: string;
  buyerId: string;
  sellerId: string;
  buyer?: { id: string; firstName: string; lastName: string; email: string };
  seller?: {
    userId: string; storeName: string; isVerified?: boolean;
    averageRating?: number; sellerLevel?: string;
    avgResponseTimeHours?: number; deliverySuccessRate?: number;
  };
  escrow?: { amount: string; status: string; currency: string };
  orderItems: Array<{ listing: { id: string; title: string; gameName: string; price: string; images?: string[] } }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Awaiting Payment',
  PAID: 'Funds in Escrow',
  IN_PROGRESS: 'Delivered — Awaiting Confirmation',
  COMPLETED: 'Completed',
  DISPUTED: 'In Dispute',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const ESCROW_SELLER_WINDOW_MS = 60 * 60 * 1000;
const ESCROW_BUYER_WINDOW_MS = 60 * 60 * 1000;

function fmtCountdown(ms: number): string {
  if (!ms || ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

function countdownColorClass(ms: number | null): string {
  if (ms === null) return 'text-gray-400';
  if (ms <= 0) return 'text-red-400';
  if (ms < 600_000) return 'text-red-400 animate-pulse';
  if (ms < 1800_000) return 'text-yellow-400';
  return 'text-emerald-400';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    COMPLETED:   'bg-emerald-950/50 text-emerald-300 border-emerald-500/30',
    DISPUTED:    'bg-red-950/50 text-red-300 border-red-500/30',
    IN_PROGRESS: 'bg-brand/10 text-brand-light border-brand/30',
    PAID:        'bg-yellow-950/40 text-yellow-300 border-yellow-500/30',
    PENDING:     'bg-gray-800/60 text-gray-300 border-borderBg',
    REFUNDED:    'bg-gray-800/60 text-gray-400 border-borderBg',
    CANCELLED:   'bg-gray-800/60 text-gray-400 border-borderBg',
  };
  return `px-3 py-1.5 rounded-full text-xs font-bold border ${map[status] || map.PENDING}`;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-borderBg/50 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm text-white font-mono mt-0.5 break-all leading-relaxed">{value}</p>
      </div>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="flex-shrink-0 p-2 text-gray-500 hover:text-brand transition rounded-lg hover:bg-brand/10">
        {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Escrow timeline steps config
const STEPS = [
  { key: 'PENDING',     label: 'Order Placed',      sub: 'Awaiting secure payment',       icon: Package },
  { key: 'PAID',        label: 'Funds in Escrow',   sub: 'Payment verified & locked',     icon: Shield },
  { key: 'IN_PROGRESS', label: 'Seller Delivered',  sub: 'Delivery confirmed',            icon: Truck },
  { key: 'COMPLETED',   label: 'Funds Released',    sub: 'Trade complete',                icon: CheckCircle },
] as const;

function stepIndex(status: string, order: Order): number {
  switch (status) {
    case 'PENDING':     return 0;
    case 'PAID':        return 1;
    case 'IN_PROGRESS': return 2;
    case 'COMPLETED':   return 3;
    case 'DISPUTED':    return order.deliveredAt ? 2 : 1;
    default:            return 0;
  }
}

export default function OrderTrackingContent({ id }: { id: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintDesc, setComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [deliveryMsg, setDeliveryMsg] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [deliveryTab, setDeliveryTab] = useState<'credentials' | 'notes' | 'raw'>('credentials');
  const [timeline, setTimeline] = useState<any[] | null>(null);

  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatConvoId, setChatConvoId] = useState<string | null>(null);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const load = useCallback(async (silent = false) => {
    try {
      const res = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
      if (res.success) setOrder(res.data);
      try {
        const tRes = await api.get<{ success: boolean; data: any[] }>(`/orders/${id}/timeline`);
        if (tRes.success) setTimeline(tRes.data);
      } catch { /* non-fatal */ }
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

  // Load payment link for PENDING orders
  useEffect(() => {
    if (!order || order.status !== 'PENDING' || user?.id !== order.buyerId) { setPaymentLink(null); return; }
    let active = true;
    (async () => {
      setPaymentLoading(true);
      try {
        const res = await getEscrowByOrder(id);
        if (active) setPaymentLink(res?.paymentLink || null);
      } catch { if (active) setPaymentLink(null); }
      finally { if (active) setPaymentLoading(false); }
    })();
    return () => { active = false; };
  }, [order, id, user?.id]);

  const handleGeneratePayment = async () => {
    try {
      const res = await generateEscrowPaymentLink(id);
      if (res?.url) {
        const win = window.open(res.url, '_blank', 'noopener,noreferrer');
        if (!win) window.location.href = res.url;
        setTimeout(() => load(), 4000);
      } else if (res && res.configured === false) {
        alert('Payment method unavailable. Please contact support or try a different method.');
      }
    } catch (err: any) {
      alert(err?.message || 'Could not generate payment link');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!confirm('Release funds to the seller? This confirms you received the item and cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await api.patch<{ success: boolean }>(`/orders/${id}/confirm-delivery`);
      if (res.success) await load();
    } catch (err: any) { alert(err.message || 'Failed to release funds'); }
    finally { setLoading(false); }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await api.patch<{ success: boolean }>(`/orders/${id}/accept`);
      if (res.success) await load();
    } catch (err: any) { alert(err.message || 'Failed to accept order'); }
    finally { setLoading(false); }
  };

  const handleMarkDelivered = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDelivery(true);
    try {
      const res = await api.patch<{ success: boolean }>(`/orders/${id}/mark-delivered`, {
        deliveryData: { message: deliveryMsg, deliveredAt: new Date().toISOString() },
      });
      if (res.success) { setDeliveryMsg(''); await load(); }
    } catch (err: any) { alert(err.message || 'Failed'); }
    finally { setSubmittingDelivery(false); }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDispute(true);
    try {
      const res = await api.post<{ success: boolean }>('/disputes', { orderId: id, reason: disputeReason, description: disputeDesc });
      if (res.success) { alert('Dispute opened. Our moderators will review within 24–72h.'); setShowDispute(false); await load(); }
    } catch (err: any) { alert(err.message || 'Failed'); }
    finally { setSubmittingDispute(false); }
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingComplaint(true);
    try {
      const res = await api.post<{ success: boolean }>('/support/complaints', { orderId: id, description: complaintDesc });
      if (res.success) { alert('Complaint filed. Our support team will follow up shortly.'); setShowComplaint(false); setComplaintDesc(''); }
    } catch (err: any) { alert(err.message || 'Failed'); }
    finally { setSubmittingComplaint(false); }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { orderId: id, rating: reviewRating, comment: reviewComment });
      setReviewDone(true);
    } catch (err: any) { alert(err.message || 'Failed'); }
    finally { setSubmittingReview(false); }
  };

  const handleQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !order) return;
    setSendingChat(true);
    try {
      // Create or find conversation
      if (!chatConvoId) {
        const convoRes = await api.post<{ success: boolean; data: { id: string } }>('/messages/conversation', {
          buyerId: order.buyerId,
          sellerId: order.seller?.userId,
        });
        if (convoRes.success) {
          const cId = convoRes.data.id;
          setChatConvoId(cId);
          await api.post(`/messages/conversation/${cId}/send`, { content: chatText });
        }
      } else {
        await api.post(`/messages/conversation/${chatConvoId}/send`, { content: chatText });
      }
      setChatText('');
    } catch (err: any) { alert(err.message || 'Failed to send'); }
    finally { setSendingChat(false); }
  };

  if (loading) return (
    <div className="space-y-5 py-6 fade-in">
      <div className="h-10 skeleton rounded-xl w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 skeleton rounded-3xl" />
          <div className="h-64 skeleton rounded-3xl" />
        </div>
        <div className="h-80 skeleton rounded-3xl" />
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="text-center py-20 bg-cardBg border border-borderBg rounded-3xl fade-in">
      <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
      <p className="text-red-400 font-semibold mb-3">{error || 'Order not found'}</p>
      <Link href="/orders" className="text-brand hover:text-brand-light font-semibold text-sm transition">← Back to orders</Link>
    </div>
  );

  const isBuyer = user?.id === order.buyerId;
  const isSeller = user?.id === order.seller?.userId;
  const item = order.orderItems?.[0];
  const curIdx = stepIndex(order.status, order);
  const isDisputed = order.status === 'DISPUTED';
  const escrowAmt = Number(order.escrow?.amount || order.totalAmount);
  const fee = Number(order.commissionAmount || 0);
  const payout = Number(order.sellerPayout || 0);

  const sellerDeadlineMs = order.sellerDeliverDeadline
    ? new Date(order.sellerDeliverDeadline).getTime()
    : order.acceptedAt ? new Date(order.acceptedAt).getTime() + ESCROW_SELLER_WINDOW_MS : null;
  const buyerDeadlineMs = order.buyerConfirmDeadline ? new Date(order.buyerConfirmDeadline).getTime() : null;
  const sellerRemaining = sellerDeadlineMs != null ? sellerDeadlineMs - now : null;
  const buyerRemaining = buyerDeadlineMs != null ? buyerDeadlineMs - now : null;
  const sellerOverdue = order.status === 'PAID' && sellerRemaining != null && sellerRemaining <= 0;
  const buyerOverdue = order.status === 'IN_PROGRESS' && buyerRemaining != null && buyerRemaining <= 0;

  // Parse structured delivery data
  const rawDelivery = order.deliveryData?.message || '';
  const deliveryFields: { key: string; value: string }[] = [];
  if (rawDelivery) {
    rawDelivery.split('\n').forEach((line: string) => {
      const ci = line.indexOf(':');
      if (ci > 0 && ci < 35) deliveryFields.push({ key: line.slice(0, ci).trim(), value: line.slice(ci + 1).trim() });
    });
  }

  const otherName = isBuyer
    ? (order.seller?.storeName || 'Seller')
    : ([order.buyer?.firstName, order.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer');

  const PayBtn = (
    <div>
      {paymentLoading ? (
        <span className="inline-flex items-center gap-2 bg-white/5 border border-borderBg px-5 py-3 rounded-xl text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </span>
      ) : paymentLink ? (
        <a href={paymentLink} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => load(), 4000)}
          className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-dark px-6 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-brand/25 transition">
          <ExternalLink className="w-4 h-4" /> Pay Now — Complete Payment
        </a>
      ) : (
        <button onClick={handleGeneratePayment}
          className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-dark px-6 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-brand/25 transition">
          <ExternalLink className="w-4 h-4" /> Generate Payment Link
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5 my-4 fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-5 border-b border-borderBg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/orders" className="text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-black text-white">Track Order</h1>
          </div>
          <p className="text-gray-400 text-sm">
            <span className="text-brand-light font-bold">#{order.orderNumber.slice(-10).toUpperCase()}</span>
            <span className="mx-2 text-gray-600">·</span>
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span className={statusBadge(order.status)}>{STATUS_LABELS[order.status] || order.status}</span>
      </div>

      {/* ── Urgent banners ── */}
      {order.status === 'PENDING' && (
        <div className="bg-yellow-950/20 border border-yellow-500/25 rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-yellow-200">Payment required to lock funds in escrow</p>
            <p className="text-xs text-gray-400 mt-1">Your order is reserved. Complete payment to notify the seller and start the delivery timer. If you already paid, wait a moment for confirmation.</p>
            {isBuyer && <div className="mt-3">{PayBtn}</div>}
          </div>
        </div>
      )}

      {order.status === 'IN_PROGRESS' && isBuyer && buyerRemaining != null && (
        <div className={`border rounded-2xl p-4 flex items-center gap-4 ${buyerRemaining < 600_000 ? 'bg-red-950/30 border-red-500/30' : 'bg-brand/8 border-brand/25'}`}>
          <Clock className={`w-6 h-6 flex-shrink-0 ${buyerRemaining < 600_000 ? 'text-red-400' : 'text-brand'}`} />
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Your item has been delivered — confirm receipt</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Time remaining: <span className={`font-mono font-black ${countdownColorClass(buyerRemaining)}`}>{fmtCountdown(buyerRemaining)}</span>
            </p>
          </div>
          <button onClick={handleConfirmDelivery}
            className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-black font-black px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/25">
            Confirm Receipt
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Escrow Progression Stepper */}
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand" />
              <h3 className="font-bold text-white text-lg">Escrow Progression</h3>
            </div>

            {/* Stepper */}
            <div className="relative">
              {/* connector line */}
              <div className="absolute left-[17px] top-9 bottom-9 w-0.5 bg-borderBg hidden sm:block" />
              <div className="space-y-0">
                {STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const done = idx < curIdx;
                  const active = idx === curIdx && !isDisputed;
                  const timestamps: Record<string, string | undefined> = {
                    'PENDING':     order.createdAt,
                    'PAID':        order.deliveryData?.paidAt || undefined,
                    'IN_PROGRESS': order.deliveredAt,
                    'COMPLETED':   undefined,
                  };
                  const ts = timestamps[step.key];
                  return (
                    <div key={step.key} className={`relative flex items-start gap-4 py-3 sm:pl-14 ${idx < STEPS.length - 1 ? 'border-b border-borderBg/40' : ''}`}>
                      {/* dot */}
                      <div className={`absolute left-0 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300
                        ${done ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : active ? 'bg-brand ring-4 ring-brand/20 shadow-lg shadow-brand/25' : 'bg-background border border-borderBg'}`}>
                        {done ? <CheckCircle className="w-4 h-4 text-black" /> : <StepIcon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-bold text-sm ${done || active ? 'text-white' : 'text-gray-500'}`}>{step.label}</p>
                          {ts && <span className="text-[10px] text-gray-600 flex-shrink-0">{new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                        <p className={`text-xs mt-0.5 ${active ? 'text-gray-300' : 'text-gray-600'}`}>{step.sub}</p>
                        {/* Active step timers */}
                        {step.key === 'PAID' && active && order.acceptedAt && sellerRemaining != null && (
                          <div className="mt-2 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-xs text-gray-400">Seller delivery window: </span>
                            <span className={`font-mono font-bold text-sm ${countdownColorClass(sellerRemaining)}`}>{fmtCountdown(sellerRemaining)}</span>
                          </div>
                        )}
                        {step.key === 'IN_PROGRESS' && active && buyerRemaining != null && (
                          <div className="mt-2 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-brand" />
                            <span className="text-xs text-gray-400">Buyer confirm window: </span>
                            <span className={`font-mono font-bold text-sm ${countdownColorClass(buyerRemaining)}`}>{fmtCountdown(buyerRemaining)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Escrow fee breakdown */}
            <div className="bg-background border border-borderBg rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Escrow Breakdown</p>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Order Total</span><span className="font-bold text-white">{fmt(escrowAmt)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Platform Fee (10%)</span><span className="font-semibold text-gray-400">- {fmt(fee)}</span></div>
              <div className="flex justify-between text-sm border-t border-borderBg pt-2 mt-2"><span className="text-gray-300 font-semibold">Seller Payout</span><span className="font-black text-emerald-400">{fmt(payout)}</span></div>
            </div>

            {isDisputed && (
              <div className="bg-red-950/20 border border-red-500/25 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-300 text-sm">Under Moderation Review</p>
                  <p className="text-xs text-gray-400 mt-1">Our team is reviewing evidence from both parties and will issue a resolution within 24–72 hours.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Delivery Details (buyer view) ── */}
          {(order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') && rawDelivery && isBuyer && (
            <div className="bg-cardBg border border-brand/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand" />
                  <h3 className="font-bold text-white">Delivery Details</h3>
                </div>
                <button onClick={() => setShowDelivery(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-borderBg hover:border-brand/30">
                  {showDelivery ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Reveal</>}
                </button>
              </div>

              {/* Tab bar */}
              {showDelivery && (
                <div className="flex gap-1 bg-background border border-borderBg rounded-xl p-1">
                  {(['credentials', 'notes', 'raw'] as const).map(t => (
                    <button key={t} onClick={() => setDeliveryTab(t)}
                      className={`flex-1 text-xs font-bold py-2 rounded-lg capitalize transition ${deliveryTab === t ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {showDelivery ? (
                <div className="bg-background border border-borderBg rounded-2xl p-4">
                  {deliveryTab === 'credentials' && (
                    deliveryFields.length > 0 ? (
                      deliveryFields.map(({ key, value }) => <CopyField key={key} label={key} value={value} />)
                    ) : (
                      <div className="flex items-start gap-2">
                        <pre className="text-sm text-white font-mono whitespace-pre-wrap flex-1">{rawDelivery}</pre>
                        <button onClick={() => navigator.clipboard.writeText(rawDelivery)} className="p-2 text-gray-500 hover:text-brand rounded-lg hover:bg-brand/10 transition flex-shrink-0">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  )}
                  {deliveryTab === 'notes' && (
                    <pre className="text-sm text-white font-mono whitespace-pre-wrap">{order.deliveryData?.message || 'No notes provided.'}</pre>
                  )}
                  {deliveryTab === 'raw' && (
                    <pre className="text-sm text-white font-mono whitespace-pre-wrap">{rawDelivery}</pre>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowDelivery(true)}
                  className="w-full bg-background border border-borderBg rounded-2xl p-4 flex items-center gap-3 text-gray-500 text-sm hover:border-brand/30 transition">
                  <Eye className="w-4 h-4" /> Click Reveal to view login credentials
                </button>
              )}
              {order.status === 'IN_PROGRESS' && (
                <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Only confirm receipt after you have successfully tested the account details.
                </p>
              )}
            </div>
          )}

          {/* ── Order Activity (real timeline) ── */}
          {timeline && timeline.length > 0 && (
            <div className="bg-cardBg border border-borderBg rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-white">Order Activity</h3>
              </div>
              <ul className="space-y-0">
                {timeline.map((ev, i) => {
                  const status = ev.status || 'pending';
                  const dot = status === 'done'
                    ? 'bg-emerald-500'
                    : status === 'active'
                      ? 'bg-brand ring-4 ring-brand/20'
                      : 'bg-background border border-borderBg';
                  return (
                    <li key={ev.id || i} className={`relative flex items-start gap-4 py-3 ${i < timeline.length - 1 ? 'border-b border-borderBg/40' : ''}`}>
                      <div className={`flex-shrink-0 w-3.5 h-3.5 rounded-full mt-1.5 ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${status === 'pending' ? 'text-gray-500' : 'text-white'}`}>{ev.label}</p>
                        {ev.timestamp && (
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ev.timestamp).toLocaleString()}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ── Seller delivery message (seller view) ── */}
          {(order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') && rawDelivery && isSeller && (
            <div className="bg-cardBg border border-borderBg rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-white">Your Delivery Message</h3>
              </div>
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap bg-background border border-borderBg rounded-2xl p-4">{rawDelivery}</pre>
            </div>
          )}

          {/* ── Order Actions Panel ── */}
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 space-y-5">
            <h3 className="font-bold text-white text-lg">Order Actions</h3>

            {isSeller && (() => {
              if (order.status === 'PAID' && !order.acceptedAt) return (
                <div className="space-y-4">
                  <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 text-sm text-gray-300">
                    <Lock className="w-5 h-5 text-brand flex-shrink-0" />
                    <p>Buyer has paid. Funds are locked in escrow. Accept to start the <strong className="text-white">1-hour</strong> delivery window.</p>
                  </div>
                  <button onClick={handleAccept} disabled={loading}
                    className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-lg shadow-brand/20">
                    <CheckCircle className="w-5 h-5" /> Accept Order & Start Delivery Timer
                  </button>
                </div>
              );

              if (order.status === 'PAID' && order.acceptedAt) return (
                <div className="space-y-4">
                  <div className="bg-yellow-950/20 border border-yellow-500/25 rounded-2xl p-4 flex gap-4">
                    <Truck className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-yellow-200">Deliver within</p>
                      <p className={`text-3xl font-black font-mono mt-1 ${countdownColorClass(sellerRemaining)}`}>{fmtCountdown(sellerRemaining ?? 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Miss this window and the buyer can open a dispute.</p>
                    </div>
                  </div>
                  <form onSubmit={handleMarkDelivered} className="space-y-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Message (Key: Value format)</label>
                    <pre className="text-[10px] text-gray-600 bg-background rounded-xl p-2.5 font-mono">Email: user@example.com{'\n'}Password: MyPass123{'\n'}Recovery: backup@email.com</pre>
                    <textarea value={deliveryMsg} onChange={e => setDeliveryMsg(e.target.value)} rows={5}
                      placeholder={'Email: user@example.com\nPassword: MyPass123\nRecovery Email: backup@email.com'}
                      className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-brand resize-none transition" />
                    <button type="submit" disabled={submittingDelivery}
                      className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-lg shadow-brand/20">
                      <Truck className="w-5 h-5" /> {submittingDelivery ? 'Marking...' : 'Mark as Delivered'}
                    </button>
                  </form>
                  {sellerOverdue && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => setShowDispute(true)} className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition">
                        <AlertTriangle className="w-4 h-4" /> File a Dispute
                      </button>
                      <button onClick={() => setShowComplaint(true)} className="flex-1 bg-background border border-borderBg hover:border-brand/40 py-3 rounded-xl font-bold text-gray-300 flex items-center justify-center gap-2 transition">
                        <MessageSquare className="w-4 h-4" /> File a Complaint
                      </button>
                    </div>
                  )}
                </div>
              );

              if (order.status === 'IN_PROGRESS') return (
                <div className="space-y-4">
                  <div className="bg-brand/8 border border-brand/25 rounded-2xl p-4 flex gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-light flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-brand-light text-sm">Delivered — Awaiting buyer confirmation</p>
                      {buyerRemaining != null && (
                        <p className="text-xs text-gray-400 mt-1">Buyer confirm window: <span className={`font-mono font-bold ${countdownColorClass(buyerRemaining)}`}>{fmtCountdown(buyerRemaining)}</span></p>
                      )}
                    </div>
                  </div>
                  {buyerOverdue && (
                    <div className="space-y-3">
                      <div className="bg-red-950/20 border border-red-500/25 rounded-2xl p-4 flex gap-3 text-red-300 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p>Buyer hasn't confirmed receipt. File a complaint to escalate.</p>
                      </div>
                      <button onClick={() => setShowComplaint(true)} className="w-full bg-background border border-borderBg hover:border-brand/40 py-3 rounded-xl font-bold text-gray-300 flex items-center justify-center gap-2 transition">
                        <MessageSquare className="w-4 h-4" /> File a Complaint
                      </button>
                    </div>
                  )}
                </div>
              );

              if (order.status === 'COMPLETED') return (
                <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-2xl p-4 flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-300 text-sm font-semibold">Completed — escrow funds have been credited to your wallet.</p>
                </div>
              );

              return (
                <div className="bg-background border border-borderBg rounded-2xl p-4 text-sm text-gray-400">
                  Awaiting buyer payment. You'll be notified once paid.
                </div>
              );
            })()}

            {isBuyer && (() => {
              if (order.status === 'PENDING') return (
                <div className="space-y-4">
                  <div className="bg-yellow-950/20 border border-yellow-500/25 rounded-2xl p-4 text-yellow-200 text-sm flex gap-3">
                    <Lock className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Complete payment to reserve your item</p>
                      <p className="text-xs text-gray-400 mt-1">Funds are held in escrow — not released to the seller until you confirm receipt.</p>
                    </div>
                  </div>
                  {PayBtn}
                </div>
              );

              if (order.status === 'PAID') return (
                <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 text-sm text-gray-300">
                  <ShieldCheck className="w-5 h-5 text-brand flex-shrink-0" />
                  <p>Funds locked in escrow. Waiting for the seller to accept and deliver.</p>
                </div>
              );

              if (order.status === 'IN_PROGRESS') return (
                <div className="space-y-4">
                  <button onClick={handleConfirmDelivery} disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20">
                    <HandCoins className="w-5 h-5" /> {loading ? 'Processing...' : 'Confirm Receipt & Release Funds'}
                  </button>
                  {(sellerOverdue || buyerOverdue) && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => setShowDispute(true)} className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition">
                        <AlertTriangle className="w-4 h-4" /> File a Dispute
                      </button>
                      <button onClick={() => setShowComplaint(true)} className="flex-1 bg-background border border-borderBg hover:border-brand/40 py-3 rounded-xl font-bold text-gray-300 flex items-center justify-center gap-2 transition">
                        <MessageSquare className="w-4 h-4" /> File a Complaint
                      </button>
                    </div>
                  )}
                </div>
              );

              if (order.status === 'COMPLETED' && !reviewDone) return (
                <div className="space-y-4">
                  <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-2xl p-4 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-emerald-300 text-sm font-semibold">Order completed! Leave a review for the seller.</p>
                  </div>
                  <form onSubmit={handleReview} className="space-y-3">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} type="button" onClick={() => setReviewRating(i)}
                          className={`w-9 h-9 rounded-lg transition ${i <= reviewRating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}>
                          <Star className={`w-6 h-6 mx-auto ${i <= reviewRating ? 'fill-yellow-400' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3}
                      placeholder="Share your experience..." className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand resize-none transition" />
                    <button type="submit" disabled={!reviewRating || submittingReview}
                      className="bg-brand hover:bg-brand-dark px-6 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              );

              if (order.status === 'COMPLETED' && reviewDone) return (
                <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-2xl p-4 text-emerald-300 text-sm font-semibold flex gap-2 items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> Review submitted — thanks!
                </div>
              );

              return null;
            })()}
          </div>

          {/* ── Quick Chat ── */}
          {(isBuyer || isSeller) && !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status) && (
            <div className="bg-cardBg border border-borderBg rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand" />
                  <h3 className="font-bold text-white">Message {isBuyer ? 'Seller' : 'Buyer'}</h3>
                </div>
                <Link href={`/messages?buyerId=${order.buyerId}&sellerId=${order.seller?.userId}`}
                  className="text-xs font-semibold text-brand hover:text-brand-light flex items-center gap-1 transition">
                  Open full chat <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <form onSubmit={handleQuickMessage} className="flex gap-2">
                <input value={chatText} onChange={e => setChatText(e.target.value)} placeholder={`Message ${otherName}...`}
                  className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition" />
                <button type="submit" disabled={!chatText.trim() || sendingChat}
                  className="w-12 h-12 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center disabled:opacity-40 transition flex-shrink-0">
                  {sendingChat ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Right column: Item + Seller card ── */}
        <div className="space-y-4">
          {/* Item card */}
          <div className="bg-cardBg border border-borderBg rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-widest text-gray-400">Item</h3>
            {item?.listing && (
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-background border border-borderBg flex-shrink-0">
                  {item.listing.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.listing.images[0]} alt={item.listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-600" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm leading-snug line-clamp-2">{item.listing.title}</p>
                  <p className="text-xs text-brand-light font-semibold mt-1">{item.listing.gameName}</p>
                  <p className="text-lg font-black text-white mt-1">{fmt(item.listing.price)}</p>
                </div>
              </div>
            )}
            {order.buyerNote && (
              <div className="bg-background border border-borderBg rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Buyer Note</p>
                <p className="text-xs text-gray-300">{order.buyerNote}</p>
              </div>
            )}
          </div>

          {/* Seller card */}
          {order.seller && (
            <div className="bg-cardBg border border-borderBg rounded-3xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm uppercase tracking-widest text-gray-400">{isBuyer ? 'Seller' : 'Buyer'}</h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-purple-600 p-0.5 flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-cardBg flex items-center justify-center text-sm font-black text-white">
                    {(order.seller.storeName || 'S')[0].toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{order.seller.storeName}</p>
                  {order.seller.sellerLevel && (
                    <SellerLevelBadge level={order.seller.sellerLevel} size="xs" className="mt-1" />
                  )}
                </div>
                {order.seller.isVerified && (
                  <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold flex-shrink-0">✓</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-background border border-borderBg rounded-xl p-2.5">
                  <p className="text-xs font-black text-white">{(order.seller.averageRating || 0).toFixed(1)}★</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Rating</p>
                </div>
                <div className="bg-background border border-borderBg rounded-xl p-2.5">
                  <p className="text-xs font-black text-white">{Math.round(order.seller.deliverySuccessRate ?? 100)}%</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Delivery</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={`/seller/${order.sellerId}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-background border border-borderBg hover:border-brand/40 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition">
                  <Zap className="w-3.5 h-3.5" /> View Seller Profile
                </Link>
                <Link href={`/messages?buyerId=${order.buyerId}&sellerId=${order.seller.userId}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-brand/10 border border-brand/20 hover:bg-brand/20 rounded-xl text-xs font-bold text-brand-light transition">
                  <MessageSquare className="w-3.5 h-3.5" /> Open Chat
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Dispute Modal ── */}
      {showDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-white">File a Dispute</h3>
              </div>
              <button onClick={() => setShowDispute(false)} className="text-gray-500 hover:text-white transition p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDispute} className="space-y-3">
              <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} required
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition">
                <option value="">Select reason...</option>
                <option>Item not as described</option>
                <option>Seller did not deliver</option>
                <option>Wrong item delivered</option>
                <option>Delivery window expired</option>
                <option>Account already changed</option>
                <option>Other</option>
              </select>
              <textarea value={disputeDesc} onChange={e => setDisputeDesc(e.target.value)} rows={4} required
                placeholder="Describe the issue in detail. Include any evidence..."
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 resize-none transition" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDispute(false)} className="flex-1 bg-background border border-borderBg py-3 rounded-xl font-bold text-gray-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={submittingDispute}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition">
                  {submittingDispute ? 'Filing...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Complaint Modal ── */}
      {showComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-white">File a Complaint</h3>
              </div>
              <button onClick={() => setShowComplaint(false)} className="text-gray-500 hover:text-white transition p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleComplaint} className="space-y-3">
              <textarea value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} rows={4} required
                placeholder="Describe the issue. Our support team will follow up within 24h..."
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand resize-none transition" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowComplaint(false)} className="flex-1 bg-background border border-borderBg py-3 rounded-xl font-bold text-gray-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={submittingComplaint}
                  className="flex-1 bg-brand hover:bg-brand-dark py-3 rounded-xl font-bold text-white disabled:opacity-50 transition">
                  {submittingComplaint ? 'Filing...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
