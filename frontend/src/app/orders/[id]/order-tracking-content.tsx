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

  const [deliveryMsg, setDeliveryMsg] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

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

            {isSeller ? (
              // ── SELLER VIEW ──
              order.status === 'PAID' ? (
                <form onSubmit={handleMarkDelivered} className="space-y-4">
                  <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 text-sm text-gray-300">
                    <Truck className="w-5 h-5 text-brand flex-shrink-0" />
                    <p>The buyer has paid and funds are held in escrow. Transfer the account credentials, then mark this order as delivered.</p>
                  </div>
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
              ) : order.status === 'IN_PROGRESS' ? (
                <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 flex gap-3 text-brand-light text-sm">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p>Marked as delivered — awaiting the buyer to confirm receipt and release escrow funds.</p>
                </div>
              ) : order.status === 'COMPLETED' ? (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-300 text-sm">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <p>Order completed — escrow funds have been credited to your wallet.</p>
                </div>
              ) : (
                <div className="bg-background border border-borderBg rounded-2xl p-4 text-sm text-gray-400">
                  {order.status === 'PENDING'
                    ? 'This order is awaiting payment. You can mark it delivered once the buyer pays.'
                    : 'No actions available for this order state.'}
                </div>
              )
            ) : (
              // ── BUYER VIEW ──
              order.status !== 'COMPLETED' && order.status !== 'DISPUTED' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  {order.status === 'IN_PROGRESS' && (
                    <button
                      onClick={handleConfirmDelivery}
                      className="flex-1 bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Confirm Receipt / Release Funds
                    </button>
                  )}
                  {(order.status === 'PAID' || order.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="bg-background border border-borderBg hover:border-red-500/40 px-6 py-4 rounded-xl font-bold transition text-red-400 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      File a Dispute
                    </button>
                  )}
                </div>
              ) : order.status === 'DISPUTED' ? (
                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-300 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">This order is under moderation review.</p>
                    <p className="mt-1 text-xs text-gray-400">Our support staff is reviewing statements and logs to execute the release/refund.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-300 text-sm">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Order successfully completed!</p>
                    <p className="mt-1 text-xs text-gray-400">Escrow funds have been credited to the seller&apos;s balance.</p>
                  </div>
                </div>
              )
            )}
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
    </div>
  );
}
