'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getEscrowByOrder, generateEscrowPaymentLink } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  ShieldCheck, MessageSquare, AlertTriangle, CheckCircle, Truck,
  HandCoins, FileText, X, Lock, ExternalLink, Loader2, Copy,
  Clock, Eye, EyeOff, Star, Package,
} from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/lib/useCurrency';

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
  seller?: { userId: string; storeName: string; isVerified?: boolean; averageRating?: number };
  escrow?: { amount: string; status: string; currency: string };
  orderItems: Array<{
    listing: {
      id: string;
      title: string;
      gameName: string;
      price: string;
      images?: string[];
    };
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Awaiting Payment',
  PAID: 'Funds in Escrow',
  IN_PROGRESS: 'Delivered — Awaiting Confirmation',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const ESCROW_SELLER_WINDOW_MS = 60 * 60 * 1000;
const ESCROW_BUYER_WINDOW_MS = 60 * 60 * 1000;

function formatCountdown(ms: number): string {
  if (!ms || ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function countdownColor(ms: number | null): string {
  if (ms === null) return 'text-gray-400';
  if (ms <= 0) return 'text-red-400';
  if (ms < 600_000) return 'text-red-400 animate-pulse';
  if (ms < 1800_000) return 'text-yellow-400';
  return 'text-emerald-400';
}

const STEP_KEYS = ['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED'] as const;

function statusToIndex(status: string, order: Order): number {
  switch (status) {
    case 'PENDING': return 0;
    case 'PAID': return 1;
    case 'IN_PROGRESS': return 2;
    case 'COMPLETED': return 3;
    case 'DISPUTED':
      if (order.deliveryData || (order as any).deliveredAt) return 2;
      return 1;
    default: return 0;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20';
    case 'DISPUTED': return 'bg-red-950/40 text-red-400 border border-red-500/20';
    case 'IN_PROGRESS': return 'bg-brand/10 text-brand-light border border-brand/30';
    case 'PAID': return 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20';
    default: return 'bg-gray-800/60 text-gray-400 border border-borderBg';
  }
}

function CopyableText({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-borderBg/50 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-white font-mono mt-0.5 break-all">{value}</p>
      </div>
      <button onClick={copy} className="flex-shrink-0 p-1.5 text-gray-500 hover:text-brand transition rounded-lg">
        {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function OrderTrackingContent({ id }: { id: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintDescription, setComplaintDescription] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [deliveryMsg, setDeliveryMsg] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);

  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadOrder = useCallback(async (silent = false) => {
    try {
      const response = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
      if (response.success) setOrder(response.data);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load order tracker');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    loadOrder();
  }, [id, user, authLoading, router, loadOrder]);

  useEffect(() => {
    if (!order) return;
    if (['COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED'].includes(order.status)) return;
    const interval = setInterval(() => loadOrder(true), 10000);
    return () => clearInterval(interval);
  }, [order, loadOrder]);

  useEffect(() => {
    if (!order || order.status !== 'PENDING' || user?.id !== order.buyerId) {
      setPaymentLink(null);
      return;
    }
    let active = true;
    (async () => {
      setPaymentLoading(true);
      try {
        const res = await getEscrowByOrder(id);
        if (active) setPaymentLink(res?.paymentLink || null);
      } catch {
        if (active) setPaymentLink(null);
      } finally {
        if (active) setPaymentLoading(false);
      }
    })();
    return () => { active = false; };
  }, [order, id, user?.id]);

  const handleGeneratePayment = async () => {
    try {
      const res = await generateEscrowPaymentLink(id);
      if (res?.url) {
        const win = window.open(res.url, '_blank', 'noopener,noreferrer');
        if (!win) window.location.href = res.url;
        setTimeout(() => loadOrder(), 4000);
      } else if (res && res.configured === false) {
        alert('The selected payment method is not available. Please choose a different one or contact support.');
      }
    } catch (err: any) {
      alert(err?.message || 'Could not generate the payment link');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!confirm('Confirm receipt and release funds to the seller? This cannot be undone.')) return;
    setLoading(true);
    try {
      const response = await api.patch<{ success: boolean }>(`/orders/${id}/confirm-delivery`);
      if (response.success) await loadOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to release funds');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await api.patch<{ success: boolean }>(`/orders/${id}/accept`);
      if (response.success) await loadOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to accept order');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDelivery(true);
    try {
      const response = await api.patch<{ success: boolean }>(`/orders/${id}/mark-delivered`, {
        deliveryData: { message: deliveryMsg, deliveredAt: new Date().toISOString() },
      });
      if (response.success) { setDeliveryMsg(''); await loadOrder(); }
    } catch (err: any) {
      alert(err.message || 'Failed to mark as delivered');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDispute(true);
    try {
      const response = await api.post<{ success: boolean }>('/disputes', { orderId: id, reason: disputeReason, description: disputeDescription });
      if (response.success) { alert('Dispute opened. A moderator will review your case.'); setShowDisputeModal(false); await loadOrder(); }
    } catch (err: any) {
      alert(err.message || 'Failed to open dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingComplaint(true);
    try {
      const response = await api.post<{ success: boolean }>('/support/complaints', { orderId: id, description: complaintDescription });
      if (response.success) { alert('Complaint filed. Our support team will follow up.'); setShowComplaintModal(false); setComplaintDescription(''); }
    } catch (err: any) {
      alert(err.message || 'Failed to file complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { orderId: id, rating: reviewRating, comment: reviewComment });
      setReviewDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading order tracker...</div>;
  if (error || !order) {
    return (
      <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
        <p className="text-red-400 text-lg font-semibold">{error || 'Order not found'}</p>
      </div>
    );
  }

  const isBuyer = user?.id === order.buyerId;
  const isSeller = user?.id === order.seller?.userId;
  const item = order.orderItems?.[0];
  const currentIndex = statusToIndex(order.status, order);
  const isDisputed = order.status === 'DISPUTED';
  const escrowAmount = Number(order.escrow?.amount || order.totalAmount);
  const fee = Number(order.commissionAmount || 0);
  const payout = Number(order.sellerPayout || 0);
  const otherPartyName = isBuyer ? order.seller?.storeName || 'Seller' : [order.buyer?.firstName, order.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer';
  const otherPartyId = isBuyer ? order.seller?.userId : order.buyer?.id;

  const sellerDeadlineMs = order.sellerDeliverDeadline ? new Date(order.sellerDeliverDeadline).getTime() : (order.acceptedAt ? new Date(order.acceptedAt).getTime() + ESCROW_SELLER_WINDOW_MS : null);
  const buyerDeadlineMs = order.buyerConfirmDeadline ? new Date(order.buyerConfirmDeadline).getTime() : null;
  const sellerWindowRemaining = sellerDeadlineMs != null ? sellerDeadlineMs - now : null;
  const buyerWindowRemaining = buyerDeadlineMs != null ? buyerDeadlineMs - now : null;
  const sellerOverdue = order.status === 'PAID' && sellerDeadlineMs != null && sellerWindowRemaining != null && sellerWindowRemaining <= 0;
  const buyerOverdue = order.status === 'IN_PROGRESS' && buyerDeadlineMs != null && buyerWindowRemaining != null && buyerWindowRemaining <= 0;

  // Parse delivery data for structured display
  const deliveryDetails: Array<{ key: string; value: string }> = [];
  if (order.deliveryData?.message) {
    // Try to parse key:value pairs from the delivery message
    const lines = String(order.deliveryData.message).split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 30) {
        deliveryDetails.push({ key: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() });
      }
    }
  }
  const hasStructuredDelivery = deliveryDetails.length > 0;
  const rawDeliveryMsg = order.deliveryData?.message || '';

  const DisputeComplaint = (
    <div className="flex flex-col sm:flex-row gap-3">
      <button onClick={() => setShowDisputeModal(true)} className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-bold transition text-white flex items-center justify-center gap-2">
        <AlertTriangle className="w-5 h-5" /> File a Dispute
      </button>
      <button onClick={() => setShowComplaintModal(true)} className="flex-1 bg-background border border-borderBg hover:border-brand/40 px-4 py-3 rounded-xl font-bold transition text-gray-300 flex items-center justify-center gap-2">
        <MessageSquare className="w-5 h-5" /> File a Complaint
      </button>
    </div>
  );

  const PaymentActions = (
    <div>
      {paymentLoading ? (
        <span className="inline-flex items-center gap-2 bg-white/5 border border-borderBg px-4 py-3 rounded-xl text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading payment link...
        </span>
      ) : paymentLink ? (
        <a href={paymentLink} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => loadOrder(), 4000)}
          className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-5 py-3 rounded-xl font-bold text-white text-sm shadow-lg shadow-brand/20 transition w-full">
          <ExternalLink className="w-4 h-4" /> Pay Now — Complete Your Payment
        </a>
      ) : (
        <button type="button" onClick={handleGeneratePayment}
          className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-5 py-3 rounded-xl font-bold text-white text-sm shadow-lg shadow-brand/20 transition w-full">
          <ExternalLink className="w-4 h-4" /> Generate Payment Link
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 my-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-borderBg pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Track Order</h1>
          <p className="text-gray-400 text-sm mt-1">
            Order <span className="text-brand-light font-bold">#{order.orderNumber.toUpperCase()}</span> • Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusBadgeClass(order.status)}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* PENDING payment banner */}
      {order.status === 'PENDING' && (
        <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 text-yellow-200 text-sm">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Awaiting payment confirmation</p>
            <p className="mt-1 text-xs text-gray-400">This order is reserved but not yet paid. Complete payment below to lock funds in escrow. If you were redirected back, your payment may still be processing.</p>
            {isBuyer && <div className="mt-3">{PaymentActions}</div>}
          </div>
        </div>
      )}

      {/* IN_PROGRESS delivery urgent banner for buyer */}
      {order.status === 'IN_PROGRESS' && isBuyer && buyerWindowRemaining != null && (
        <div className={`${buyerWindowRemaining < 600_000 ? 'bg-red-950/30 border-red-500/30' : 'bg-brand/10 border-brand/30'} border rounded-2xl p-4 flex items-center gap-3`}>
          <Clock className={`w-5 h-5 flex-shrink-0 ${buyerWindowRemaining < 600_000 ? 'text-red-400' : 'text-brand'}`} />
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Your item has been delivered — please confirm receipt</p>
            <p className="text-xs text-gray-400 mt-0.5">Time remaining to confirm: <span className={`font-mono font-bold ${countdownColor(buyerWindowRemaining)}`}>{formatCountdown(buyerWindowRemaining)}</span></p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Stepper */}
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand" />
              <h3 className="text-xl font-bold text-white">Escrow Progression</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
              {STEP_KEYS.map((key, idx) => {
                const done = idx < currentIndex;
                const current = idx === currentIndex && !isDisputed;
                return (
                  <div key={key} className="flex-1 flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0">
                    <div className="flex items-center sm:flex-col w-full">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition ${done ? 'bg-emerald-500 text-black' : current ? 'bg-brand text-white ring-4 ring-brand/20' : 'bg-gray-800 text-gray-500'}`}>
                        {done ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                      </div>
                      {idx < STEP_KEYS.length - 1 && (
                        <div className={`hidden sm:block h-1 flex-1 mx-2 rounded ${done ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                      )}
                    </div>
                    <div className="sm:mt-3">
                      <p className={`font-bold text-sm ${done || current ? 'text-white' : 'text-gray-500'}`}>
                        {key === 'PENDING' && 'Order Placed'}
                        {key === 'PAID' && 'Funds in Escrow'}
                        {key === 'IN_PROGRESS' && 'Seller Delivered'}
                        {key === 'COMPLETED' && 'Funds Released'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 max-w-[120px]">
                        {key === 'PENDING' && 'Awaiting secure payment.'}
                        {key === 'PAID' && 'Payment verified, held safely.'}
                        {key === 'IN_PROGRESS' && 'Account details handed over.'}
                        {key === 'COMPLETED' && 'Released to the seller.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {isDisputed && (
              <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-300 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-bold">This order is under moderation review.</p>
                  <p className="mt-1 text-xs text-gray-400">Our support staff is reviewing the case and will execute the release or refund.</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Details — shown when seller has delivered, visible to buyer */}
          {(order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') && rawDeliveryMsg && isBuyer && (
            <div className="bg-cardBg border border-brand/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand" />
                  <h3 className="text-lg font-bold text-white">Login / Delivery Details</h3>
                </div>
                <button onClick={() => setShowDeliveryDetails(v => !v)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
                  {showDeliveryDetails ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Reveal</>}
                </button>
              </div>
              {showDeliveryDetails ? (
                <div className="bg-background border border-borderBg rounded-2xl p-4 space-y-1">
                  {hasStructuredDelivery ? (
                    deliveryDetails.map(({ key, value }) => (
                      <CopyableText key={key} label={key} value={value} />
                    ))
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <pre className="text-sm text-white whitespace-pre-wrap font-mono flex-1">{rawDeliveryMsg}</pre>
                      <button onClick={() => { navigator.clipboard.writeText(rawDeliveryMsg); }} className="flex-shrink-0 p-1.5 text-gray-500 hover:text-brand transition rounded-lg">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-background border border-borderBg rounded-2xl p-4 flex items-center gap-3 text-gray-500 text-sm cursor-pointer" onClick={() => setShowDeliveryDetails(true)}>
                  <Eye className="w-4 h-4" />
                  <span>Click "Reveal" to view login credentials / delivery details</span>
                </div>
              )}
              {order.status === 'IN_PROGRESS' && (
                <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Only confirm receipt after you've successfully logged in and verified the account details.
                </p>
              )}
            </div>
          )}

          {/* Delivery details for seller's own reference */}
          {(order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') && rawDeliveryMsg && isSeller && (
            <div className="bg-cardBg border border-borderBg rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                <h3 className="text-lg font-bold text-white">Your Delivery Message</h3>
              </div>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-background border border-borderBg rounded-xl p-4 font-mono">{rawDeliveryMsg}</pre>
            </div>
          )}

          {/* Order Actions */}
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 sm:p-8 space-y-5">
            <h3 className="text-xl font-bold text-white">Order Actions</h3>

            {(() => {
              if (isSeller) {
                if (order.status === 'PAID' && !order.acceptedAt) {
                  return (
                    <div className="space-y-4">
                      <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 text-sm text-gray-300">
                        <Lock className="w-5 h-5 text-brand flex-shrink-0" />
                        <p>The buyer has paid. Funds are held in escrow. Accept to start the <strong>1-hour delivery timer</strong>.</p>
                      </div>
                      <button onClick={handleAccept} disabled={loading}
                        className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-50">
                        <CheckCircle className="w-5 h-5" /> Accept Order & Start Delivery Timer
                      </button>
                    </div>
                  );
                }
                if (order.status === 'PAID' && order.acceptedAt) {
                  return (
                    <div className="space-y-4">
                      <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 text-yellow-200 text-sm">
                        <Truck className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Deliver within</p>
                          <p className={`text-2xl font-black font-mono mt-1 ${countdownColor(sellerWindowRemaining)}`}>{formatCountdown(sellerWindowRemaining ?? 0)}</p>
                          <p className="text-xs text-gray-400 mt-1">Miss this window and the buyer can open a dispute.</p>
                        </div>
                      </div>
                      <form onSubmit={handleMarkDelivered} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Message</label>
                          <p className="text-xs text-gray-500 mb-2">Include login credentials line by line in <strong>Key: Value</strong> format so the buyer can copy them easily. E.g.:</p>
                          <pre className="text-xs text-gray-600 bg-background rounded-lg p-2 mb-2">Email: user@example.com{'\n'}Password: SecretPass123{'\n'}Recovery Email: backup@email.com</pre>
                          <textarea
                            className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand h-28 resize-none font-mono text-sm"
                            placeholder={'Email: user@example.com\nPassword: SecretPass123\nRecovery Email: backup@email.com\nAny extra info...'}
                            value={deliveryMsg}
                            onChange={(e) => setDeliveryMsg(e.target.value)}
                          />
                        </div>
                        <button type="submit" disabled={submittingDelivery}
                          className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-50">
                          <Truck className="w-5 h-5" />
                          {submittingDelivery ? 'Marking as Delivered...' : 'Mark as Delivered'}
                        </button>
                      </form>
                      {sellerOverdue && DisputeComplaint}
                    </div>
                  );
                }
                if (order.status === 'IN_PROGRESS') {
                  return (
                    <div className="space-y-4">
                      <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 flex gap-3 text-brand-light text-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Delivered — awaiting buyer confirmation</p>
                          {buyerWindowRemaining != null && (
                            <p className="text-xs text-gray-400 mt-1">Buyer has <span className={`font-mono font-bold ${countdownColor(buyerWindowRemaining)}`}>{formatCountdown(buyerWindowRemaining)}</span> to confirm.</p>
                          )}
                        </div>
                      </div>
                      {buyerOverdue && (
                        <>
                          <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-300 text-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p>The buyer hasn't confirmed receipt in time. You can now file a complaint to escalate.</p>
                          </div>
                          <button onClick={() => setShowComplaintModal(true)} className="block w-full bg-background border border-borderBg hover:border-brand/40 px-4 py-3 rounded-xl font-bold transition text-gray-300 text-center">
                            File a Complaint
                          </button>
                        </>
                      )}
                    </div>
                  );
                }
                if (order.status === 'COMPLETED') {
                  return (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-300 text-sm">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                      <p>Order completed — escrow funds have been credited to your wallet.</p>
                    </div>
                  );
                }
                return (
                  <div className="bg-background border border-borderBg rounded-2xl p-4 text-sm text-gray-400">
                    <p>Awaiting buyer payment. You'll receive an email once paid.</p>
                  </div>
                );
              }

              // BUYER VIEW
              if (order.status === 'PENDING') {
                return (
                  <div className="space-y-4">
                    <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 flex flex-col gap-3 text-yellow-200 text-sm">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 flex-shrink-0" />
                        <p className="font-bold">Complete your payment to lock funds in escrow</p>
                      </div>
                      <p className="text-xs text-gray-400">Your order is reserved. Pay now — the seller will be notified once payment is confirmed.</p>
                      {PaymentActions}
                    </div>
                  </div>
                );
              }
              if (order.status === 'PAID' && !order.acceptedAt) {
                return (
                  <div className="bg-background border border-borderBg rounded-2xl p-4 text-sm text-gray-400 flex gap-3">
                    <Lock className="w-5 h-5 text-brand flex-shrink-0" />
                    <p>Payment confirmed and held in escrow. Waiting for the seller to accept your order.</p>
                  </div>
                );
              }
              if (order.status === 'PAID' && order.acceptedAt) {
                return (
                  <div className="space-y-4">
                    <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 text-yellow-200 text-sm">
                      <Truck className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Seller accepted — delivery expected within</p>
                        <p className={`text-2xl font-black font-mono mt-1 ${countdownColor(sellerWindowRemaining)}`}>{formatCountdown(sellerWindowRemaining ?? 0)}</p>
                      </div>
                    </div>
                    {sellerOverdue && DisputeComplaint}
                  </div>
                );
              }
              if (order.status === 'IN_PROGRESS') {
                return (
                  <div className="space-y-4">
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 text-emerald-200 text-sm">
                      <p className="font-bold">✅ The seller has delivered your item</p>
                      <p className="text-xs text-gray-400 mt-1">Review the login details above, log in successfully, then confirm receipt to release funds.</p>
                    </div>
                    <button onClick={handleConfirmDelivery}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-bold transition text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Confirm Receipt & Release Funds
                    </button>
                    {buyerWindowRemaining != null && (
                      <p className="text-center text-xs text-gray-500">
                        Confirm within <span className={`font-mono font-bold ${countdownColor(buyerWindowRemaining)}`}>{formatCountdown(buyerWindowRemaining)}</span>
                        {buyerOverdue ? ' — window expired but you can still confirm.' : '.'}
                      </p>
                    )}
                    <button onClick={() => setShowComplaintModal(true)}
                      className="block w-full bg-background border border-borderBg hover:border-red-500/40 px-4 py-3 rounded-xl font-bold transition text-red-400 text-center flex items-center justify-center gap-2">
                      <MessageSquare className="w-5 h-5" /> Problem? File a Complaint
                    </button>
                  </div>
                );
              }
              if (order.status === 'DISPUTED') {
                return (
                  <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-300 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">This order is under moderation review.</p>
                      <p className="mt-1 text-xs text-gray-400">Our support staff is reviewing statements and logs.</p>
                    </div>
                  </div>
                );
              }
              // COMPLETED — show review prompt if not done
              if (order.status === 'COMPLETED') {
                return (
                  <div className="space-y-4">
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-300 text-sm">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Order successfully completed!</p>
                        <p className="mt-1 text-xs text-gray-400">Funds have been released to the seller.</p>
                      </div>
                    </div>
                    {!reviewDone ? (
                      <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-4">
                        <h4 className="font-bold text-white text-sm">Leave a review for {order.seller?.storeName || 'the seller'}</h4>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setReviewRating(star)} className="transition">
                              <Star className={`w-7 h-7 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand h-20 resize-none"
                          placeholder="How was your experience? (optional)"
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                        />
                        <form onSubmit={handleReview}>
                          <button type="submit" disabled={!reviewRating || submittingReview}
                            className="bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl font-bold text-white text-sm transition disabled:opacity-50">
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 text-emerald-300 text-sm text-center">
                        <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                        Thanks for your review!
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 space-y-5">
            <h3 className="text-lg font-bold text-white border-b border-borderBg pb-4">Item Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Item</p>
                <p className="font-bold text-white mt-1">{item?.listing?.title || 'Gaming Assets'}</p>
                <p className="text-xs text-brand-light font-semibold mt-1">{item?.listing?.gameName}</p>
              </div>

              <div className="border-t border-borderBg pt-4 text-gray-300">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">
                  {isBuyer ? 'Your Instructions to Seller' : 'Note from Buyer'}
                </span>
                <p className="text-xs italic bg-background p-3 rounded-lg border border-borderBg">
                  {order.buyerNote || 'No special note provided.'}
                </p>
              </div>

              <div className="border-t border-borderBg pt-4 space-y-3">
                <div className="flex justify-between text-gray-400">
                  <span className="flex items-center gap-1.5"><HandCoins className="w-4 h-4 text-brand" /> Item Price</span>
                  <span className="text-white font-bold">{fmt(item?.listing?.price || '0')}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Platform fee (10%)</span>
                  <span className="text-yellow-400">{fmt(fee)}</span>
                </div>
                <div className="border-t border-borderBg pt-3 flex justify-between text-gray-300">
                  <span className="font-semibold">Total Escrow</span>
                  <span className="text-white font-bold text-base">{fmt(escrowAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs bg-background p-2.5 rounded-lg">
                  <span>Seller receives</span>
                  <span className="text-emerald-400 font-semibold">{fmt(payout)}</span>
                </div>
              </div>

              <div className="border-t border-borderBg pt-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{isBuyer ? 'Seller' : 'Buyer'}</p>
                <p className="font-semibold text-white mt-1">{otherPartyName}</p>
                {isBuyer && order.seller?.isVerified && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Seller
                  </span>
                )}
              </div>

              {otherPartyId && (
                <Link
                  href={`/messages?buyerId=${isBuyer ? order.buyerId : otherPartyId}&sellerId=${isBuyer ? otherPartyId : order.seller?.userId}`}
                  className="flex items-center justify-center gap-2 w-full bg-background border border-borderBg hover:border-brand/40 py-3 rounded-xl font-bold transition text-gray-300 text-xs mt-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat with {isBuyer ? 'Seller' : 'Buyer'}
                </Link>
              )}

              {/* Share order link */}
              <div className="border-t border-borderBg pt-4">
                <p className="text-xs text-gray-500 mb-2">Order link</p>
                <div className="flex items-center gap-2 bg-background border border-borderBg rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 truncate flex-1">orders/{id.slice(-8)}</span>
                  <button onClick={() => navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/orders/${id}`)}
                    className="text-gray-500 hover:text-brand transition flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dispute/Confirmation Timer - for IN_PROGRESS status */}
          {order.status === 'IN_PROGRESS' && isBuyer && buyerWindowRemaining != null && (
            <div className={`rounded-3xl p-6 border ${buyerWindowRemaining < 600_000 ? 'bg-red-950/30 border-red-500/30' : 'bg-brand/10 border-brand/30'}`}>
              <div className="flex items-start gap-3">
                <Clock className={`w-6 h-6 flex-shrink-0 mt-0.5 ${buyerWindowRemaining < 600_000 ? 'text-red-400 animate-pulse' : 'text-brand'}`} />
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">Confirm Receipt Window</p>
                  <p className={`text-3xl font-black font-mono mt-2 ${countdownColor(buyerWindowRemaining)}`}>
                    {formatCountdown(buyerWindowRemaining)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Confirm your item before this timer expires. After expiration, you can open a dispute for a refund.
                  </p>
                  {buyerOverdue && (
                    <p className="text-xs text-red-400 mt-2 font-semibold">
                      ⚠️ Window expired — you can still confirm or file a dispute.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispute modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg border border-borderBg rounded-3xl max-w-md w-full p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-white">File Escrow Dispute</h3>
                <p className="text-gray-400 text-xs mt-1">Submit your case for arbitration.</p>
              </div>
              <button onClick={() => setShowDisputeModal(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason</label>
                <select required className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
                  value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}>
                  <option value="">Choose reason</option>
                  <option value="Product not delivered">Product not delivered</option>
                  <option value="Product not as described">Product not as described</option>
                  <option value="Account credentials don't work">Account credentials don't work</option>
                  <option value="Seller uncooperative">Seller uncooperative</option>
                  <option value="Fraud suspicious activity">Suspicious / fraudulent details</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea required className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand h-24 resize-none"
                  placeholder="Describe the issue in detail..." value={disputeDescription} onChange={(e) => setDisputeDescription(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDisputeModal(false)} className="flex-1 bg-background border border-borderBg py-3 rounded-xl font-bold transition text-gray-400 text-xs">Cancel</button>
                <button type="submit" disabled={submittingDispute} className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold transition text-white text-xs disabled:opacity-50">
                  {submittingDispute ? 'Filing...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg border border-borderBg rounded-3xl max-w-md w-full p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-white">File a Complaint</h3>
                <p className="text-gray-400 text-xs mt-1">Raise a trackable support case.</p>
              </div>
              <button onClick={() => setShowComplaintModal(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFileComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">What went wrong?</label>
                <textarea required className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand h-28 resize-none"
                  placeholder="Describe the problem..." value={complaintDescription} onChange={(e) => setComplaintDescription(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowComplaintModal(false)} className="flex-1 bg-background border border-borderBg py-3 rounded-xl font-bold transition text-gray-400 text-xs">Cancel</button>
                <button type="submit" disabled={submittingComplaint} className="flex-1 bg-brand hover:bg-brand-dark py-3 rounded-xl font-bold transition text-white text-xs disabled:opacity-50">
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
