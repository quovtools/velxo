'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  ShieldCheck, MessageSquare, AlertTriangle, CheckCircle, Truck,
  HandCoins, FileText, X, Lock,
} from 'lucide-react';
import Link from 'next/link';

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
  seller?: { userId: string; storeName: string };
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
  IN_PROGRESS: 'Delivered',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

// Escrow timing windows (ms) — must match the backend ESCROW_*_WINDOW_MS.
const ESCROW_SELLER_WINDOW_MS = 60 * 60 * 1000
const ESCROW_BUYER_WINDOW_MS = 60 * 60 * 1000

function formatCountdown(deadlineMs: number): string {
  if (!deadlineMs || deadlineMs <= 0) return '00:00'
  const totalSec = Math.floor(deadlineMs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

const STEP_KEYS = ['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED'] as const;

function statusToIndex(status: string, order: Order): number {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'PAID':
      return 1;
    case 'IN_PROGRESS':
      return 2;
    case 'COMPLETED':
      return 3;
    case 'DISPUTED':
      // Keep the timeline at the last non-disputed milestone.
      if (order.deliveryData || (order as any).deliveredAt) return 2;
      return 1;
    default:
      return 0;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20';
    case 'DISPUTED':
      return 'bg-red-950/40 text-red-400 border border-red-500/20';
    case 'IN_PROGRESS':
      return 'bg-brand/10 text-brand-light border border-brand/30';
    case 'PAID':
      return 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20';
    default:
      return 'bg-gray-800/60 text-gray-400 border border-borderBg';
  }
}

export default function OrderTrackingContent({ id }: { id: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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

  // Live clock so countdowns tick every second.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadOrder = useCallback(async (silent = false) => {
    try {
      const response = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load order tracker');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadOrder();
  }, [id, user, authLoading, router, loadOrder]);

  // Poll for status changes while the order is still in-flight so a returning
  // payment or seller delivery is reflected without a manual reload.
  useEffect(() => {
    if (!order) return;
    if (['COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED'].includes(order.status)) return;
    const interval = setInterval(() => loadOrder(true), 10000);
    return () => clearInterval(interval);
  }, [order, loadOrder]);

  const handleConfirmDelivery = async () => {
    if (!confirm('Are you sure you want to release funds to the seller? This action is irreversible.')) return;
    setLoading(true);
    try {
      const response = await api.patch<{ success: boolean }>(`/orders/${id}/confirm-delivery`);
      if (response.success) {
        alert('Funds released successfully!');
        await loadOrder();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete escrow release');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await api.patch<{ success: boolean }>(`/orders/${id}/accept`);
      if (response.success) {
        await loadOrder();
      }
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
      if (response.success) {
        setDeliveryMsg('');
        await loadOrder();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to mark order as delivered');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDispute(true);
    try {
      const response = await api.post<{ success: boolean }>('/disputes', {
        orderId: id,
        reason: disputeReason,
        description: disputeDescription,
      });
      if (response.success) {
        alert('Dispute opened. A moderator will review your case shortly.');
        setShowDisputeModal(false);
        await loadOrder();
      }
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
      const response = await api.post<{ success: boolean }>('/support/complaints', {
        orderId: id,
        description: complaintDescription,
      });
      if (response.success) {
        alert('Complaint filed. Our support team will review it and follow up shortly.');
        setShowComplaintModal(false);
        setComplaintDescription('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to file complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading escrow tracking console...</div>;
  }

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

  // Escrow countdown windows.
  const acceptedAtMs = order.acceptedAt ? new Date(order.acceptedAt).getTime() : null;
  // Prefer the server-persisted deadline; fall back to acceptedAt + window for
  // legacy orders accepted before the deadline column existed.
  const sellerDeadlineMs = order.sellerDeliverDeadline
    ? new Date(order.sellerDeliverDeadline).getTime()
    : acceptedAtMs
    ? acceptedAtMs + ESCROW_SELLER_WINDOW_MS
    : null;
  const buyerDeadlineMs = order.buyerConfirmDeadline ? new Date(order.buyerConfirmDeadline).getTime() : null;
  const sellerWindowRemaining = sellerDeadlineMs != null ? sellerDeadlineMs - now : null;
  const buyerWindowRemaining = buyerDeadlineMs != null ? buyerDeadlineMs - now : null;

  // Seller accepted but didn't deliver within 60 min → both can dispute.
  const sellerOverdue =
    order.status === 'PAID' && sellerDeadlineMs != null && sellerWindowRemaining != null && sellerWindowRemaining <= 0;
  // Delivered but buyer hasn't confirmed within the buyer window → seller can complain.
  const buyerOverdue =
    order.status === 'IN_PROGRESS' && buyerDeadlineMs != null && buyerWindowRemaining != null && buyerWindowRemaining <= 0;

  const otherPartyName = isBuyer
    ? order.seller?.storeName || 'Seller'
    : [order.buyer?.firstName, order.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer';
  const otherPartyId = isBuyer ? order.seller?.userId : order.buyer?.id;

  return (
    <div className="space-y-8 my-6">
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

      {order.status === 'PENDING' && (
        <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 text-yellow-200 text-sm">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold">Awaiting payment confirmation</p>
            <p className="mt-1 text-xs text-gray-400">
              This order is reserved but not yet paid. Complete the payment to lock funds in escrow. If you were redirected back, your payment may still be processing.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Escrow progression stepper */}
          <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-8">
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
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition ${
                          done
                            ? 'bg-emerald-500 text-black'
                            : current
                            ? 'bg-brand text-white ring-4 ring-brand/20'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
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
                  <p className="mt-1 text-xs text-gray-400">Our support staff is reviewing statements and logs to execute the release/refund.</p>
                </div>
              </div>
            )}
          </div>

          {/* Role-aware actions */}
          <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-white">Order Actions</h3>

            {(() => {
              const DisputeComplaint = (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-bold transition text-white flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-5 h-5" /> File a Dispute
                  </button>
                  <button
                    onClick={() => setShowComplaintModal(true)}
                    className="flex-1 bg-background border border-borderBg hover:border-brand/40 px-4 py-3 rounded-xl font-bold transition text-gray-300 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" /> File a Complaint
                  </button>
                </div>
              )

              if (isSeller) {
                if (order.status === 'PAID' && !order.acceptedAt) {
                  return (
                    <div className="space-y-4">
                      <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 text-sm text-gray-300">
                        <Lock className="w-5 h-5 text-brand flex-shrink-0" />
                        <p>The buyer has paid and funds are held in escrow. Accept the order to start the 60-minute delivery timer.</p>
                      </div>
                      <button
                        onClick={handleAccept}
                        disabled={loading}
                        className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" /> Accept Order &amp; Start Timer
                      </button>
                    </div>
                  )
                }
                if (order.status === 'PAID' && order.acceptedAt) {
                  return (
                    <div className="space-y-4">
                      <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 text-yellow-200 text-sm">
                        <Truck className="w-5 h-5 flex-shrink-0" />
                        <p>Deliver to the buyer within <span className="font-bold">{formatCountdown(sellerWindowRemaining ?? 0)}</span>. Miss this window and the buyer can open a dispute.</p>
                      </div>
                      <form onSubmit={handleMarkDelivered} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Message (optional)</label>
                          <textarea
                            className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand h-24 resize-none"
                            placeholder="e.g. Account email, password, and any recovery details the buyer needs..."
                            value={deliveryMsg}
                            onChange={(e) => setDeliveryMsg(e.target.value)}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingDelivery}
                          className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Truck className="w-5 h-5" />
                          {submittingDelivery ? 'Marking as Delivered...' : 'Mark as Delivered'}
                        </button>
                      </form>
                      {sellerOverdue && DisputeComplaint}
                    </div>
                  )
                }
                if (order.status === 'IN_PROGRESS') {
                  return (
                    <div className="space-y-4">
                      <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 flex gap-3 text-brand-light text-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p>Marked as delivered — awaiting buyer confirmation{order.buyerConfirmDeadline ? ` within ${formatCountdown(buyerWindowRemaining ?? 0)}` : ''}.</p>
                      </div>
                      {buyerOverdue && (
                        <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-300 text-sm">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          <p>The buyer hasn&apos;t confirmed receipt in time. You can now file a complaint to escalate.</p>
                        </div>
                      )}
                      {buyerOverdue && (
                        <button
                          onClick={() => setShowComplaintModal(true)}
                          className="block w-full bg-background border border-borderBg hover:border-brand/40 px-4 py-3 rounded-xl font-bold transition text-gray-300 text-center"
                        >
                          File a Complaint
                        </button>
                      )}
                    </div>
                  )
                }
                if (order.status === 'COMPLETED') {
                  return (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-300 text-sm">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                      <p>Order completed — escrow funds have been credited to your wallet.</p>
                    </div>
                  )
                }
                return (
                  <div className="bg-background border border-borderBg rounded-2xl p-4 text-sm text-gray-400">
                    {order.status === 'PENDING' ? 'This order is awaiting payment.' : 'No actions available for this order state.'}
                  </div>
                )
              }

              // ── BUYER VIEW ──
              if (order.status === 'PAID' && !order.acceptedAt) {
                return (
                  <div className="bg-background border border-borderBg rounded-2xl p-4 text-sm text-gray-400 flex gap-3">
                    <Lock className="w-5 h-5 text-brand flex-shrink-0" />
                    <p>Awaiting the seller to accept your order. The delivery timer starts once they accept.</p>
                  </div>
                )
              }
              if (order.status === 'PAID' && order.acceptedAt) {
                return (
                  <div className="space-y-4">
                    <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 text-yellow-200 text-sm">
                      <Truck className="w-5 h-5 flex-shrink-0" />
                      <p>Seller accepted — awaiting delivery. Seller must deliver within <span className="font-bold">{formatCountdown(sellerWindowRemaining ?? 0)}</span>.</p>
                    </div>
                    {sellerOverdue && DisputeComplaint}
                  </div>
                )
              }
              if (order.status === 'IN_PROGRESS') {
                return (
                  <div className="space-y-4">
                    <button
                      onClick={handleConfirmDelivery}
                      className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> Confirm Receipt / Release Funds
                    </button>
                    {order.buyerConfirmDeadline && (
                      <p className="text-center text-xs text-gray-500">
                        Confirm receipt within <span className="text-yellow-400 font-bold">{formatCountdown(buyerWindowRemaining ?? 0)}</span>.
                        {buyerOverdue ? ' Window expired — seller may file a complaint, but you can still confirm.' : ''}
                      </p>
                    )}
                    <button
                      onClick={() => setShowComplaintModal(true)}
                      className="block w-full bg-background border border-borderBg hover:border-red-500/40 px-4 py-3 rounded-xl font-bold transition text-red-400 text-center flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" /> File a Complaint
                    </button>
                  </div>
                )
              }
              if (order.status === 'DISPUTED') {
                return (
                  <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-300 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">This order is under moderation review.</p>
                      <p className="mt-1 text-xs text-gray-400">Our support staff is reviewing statements and logs to execute the release/refund.</p>
                    </div>
                  </div>
                )
              }
              return (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-300 text-sm">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Order successfully completed!</p>
                    <p className="mt-1 text-xs text-gray-400">Escrow funds have been credited to the seller&apos;s balance.</p>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-borderBg pb-4">Item Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Item</p>
                <p className="font-bold text-white mt-1">{item?.listing?.title || 'Gaming Assets'}</p>
                <p className="text-xs text-brand-light font-semibold mt-1">{item?.listing?.gameName}</p>
              </div>

              <div className="border-t border-borderBg pt-4 text-gray-300">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">
                  {isBuyer ? 'Instructions to Seller' : 'Note from Buyer'}
                </span>
                <p className="text-xs italic bg-background p-3 rounded-lg border border-borderBg">
                  {order.buyerNote || 'No special note provided.'}
                </p>
              </div>

              {order.deliveryData?.message && (
                <div className="border-t border-borderBg pt-4 text-gray-300">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Delivery Details
                  </span>
                  <p className="text-xs bg-background p-3 rounded-lg border border-borderBg whitespace-pre-line">
                    {order.deliveryData.message}
                  </p>
                </div>
              )}

              <div className="border-t border-borderBg pt-4 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span className="flex items-center gap-1.5"><HandCoins className="w-4 h-4 text-brand" /> Escrow Total</span>
                  <span className="text-white font-bold">${escrowAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Platform fee (10%)</span>
                  <span className="text-yellow-400">${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Seller payout</span>
                  <span className="text-emerald-400">${payout.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-borderBg pt-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{isBuyer ? 'Seller' : 'Buyer'}</p>
                <p className="font-semibold text-white mt-1">{otherPartyName}</p>
              </div>

              {otherPartyId && (
                <Link
                  href={`/messages?buyerId=${isBuyer ? order.buyerId : otherPartyId}&sellerId=${isBuyer ? otherPartyId : order.seller?.userId}`}
                  className="flex items-center justify-center gap-2 w-full bg-background border border-borderBg hover:border-brand/40 py-3.5 rounded-xl font-bold transition text-gray-300 mt-4 text-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat with {isBuyer ? 'Seller' : 'Buyer'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg border border-borderBg rounded-3xl max-w-md w-full p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-white">File Escrow Dispute</h3>
                <p className="text-gray-400 text-xs mt-1">Submit your case for arbitration by support moderators.</p>
              </div>
              <button onClick={() => setShowDisputeModal(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason</label>
                <select
                  required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                >
                  <option value="">Choose reason</option>
                  <option value="Product not delivered">Product not delivered</option>
                  <option value="Product not as described">Product not as described</option>
                  <option value="Seller uncooperative">Seller uncooperative</option>
                  <option value="Fraud suspicious activity">Suspicious fraudulent details</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand h-24 resize-none"
                  placeholder="Provide precise arguments and state clearly what is missing..."
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 bg-background border border-borderBg py-3 rounded-xl font-bold transition text-gray-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold transition text-white text-xs disabled:opacity-50"
                >
                  {submittingDispute ? 'Filing case...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg border border-borderBg rounded-3xl max-w-md w-full p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-white">File a Complaint</h3>
                <p className="text-gray-400 text-xs mt-1">Raise a trackable support case for this order. Our team will review and follow up.</p>
              </div>
              <button onClick={() => setShowComplaintModal(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">What went wrong?</label>
                <textarea
                  required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand h-28 resize-none"
                  placeholder="Describe the problem — e.g. the seller hasn't delivered, or the buyer hasn't confirmed receipt in time..."
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="flex-1 bg-background border border-borderBg py-3 rounded-xl font-bold transition text-gray-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="flex-1 bg-brand hover:bg-brand-dark py-3 rounded-xl font-bold transition text-white text-xs disabled:opacity-50"
                >
                  {submittingComplaint ? 'Filing complaint...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
