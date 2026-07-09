'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { ShieldCheck, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  buyerNote: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
  seller?: { userId: string };
  orderItems: Array<{
    listing: {
      id: string;
      title: string;
      gameName: string;
      price: string;
    };
  }>;
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

  const loadOrder = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order tracker');
    } finally {
      setLoading(false);
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

  const item = order.orderItems?.[0];

  return (
    <div className="space-y-8 my-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-borderBg pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Track Order</h1>
          <p className="text-gray-400 text-sm mt-1">
            Order ID: <span className="text-brand-light font-bold">#{order.orderNumber.toUpperCase()}</span> • Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
            order.status === 'COMPLETED'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
              : order.status === 'DISPUTED'
              ? 'bg-red-950/40 text-red-400 border border-red-500/20'
              : 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20'
          }`}>
            Status: {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-white">Escrow Progression</h3>

            <div className="relative pl-8 space-y-8 border-l border-borderBg">
              <div className="relative">
                <span className="absolute -left-11 top-0.5 bg-emerald-500 text-black p-1 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center">
                  ✓
                </span>
                <div>
                  <h4 className="font-bold text-white">Funds Deposited</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Payment verified and locked in secure escrow.</p>
                </div>
              </div>

              <div className="relative">
                <span className={`absolute -left-11 top-0.5 p-1 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center ${
                  ['IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'DISPUTED'].includes(order.status)
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {['IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'DISPUTED'].includes(order.status) ? '✓' : '2'}
                </span>
                <div>
                  <h4 className="font-bold text-white">Seller Transfer</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Seller transfers gaming credentials or starts the boost service.</p>
                </div>
              </div>

              <div className="relative">
                <span className={`absolute -left-11 top-0.5 p-1 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center ${
                  order.status === 'COMPLETED' ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-400'
                }`}>
                  {order.status === 'COMPLETED' ? '✓' : '3'}
                </span>
                <div>
                  <h4 className="font-bold text-white">Funds Released</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Buyer confirms receipt, releasing funds to seller wallet.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-white">Order Actions</h3>

            {order.status !== 'COMPLETED' && order.status !== 'DISPUTED' ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleConfirmDelivery}
                  className="flex-1 bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Release Funds (Confirm Delivery)
                </button>

                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="bg-background border border-borderBg hover:border-red-500/40 px-6 py-4 rounded-xl font-bold transition text-red-400 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  File a Dispute
                </button>
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
            )}
          </div>
        </div>

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
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">Instructions from Buyer</span>
                <p className="text-xs italic bg-background p-3 rounded-lg border border-borderBg">
                  {order.buyerNote || 'No special note provided.'}
                </p>
              </div>

              <div className="border-t border-borderBg pt-4 flex justify-between font-black text-white text-lg">
                <span>Escrow Total</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>

              {user && user.id !== order.seller?.userId && (
                <Link
                  href={`/messages?userId=${order.seller?.userId}`}
                  className="flex items-center justify-center gap-2 w-full bg-background border border-borderBg hover:border-brand/40 py-3.5 rounded-xl font-bold transition text-gray-300 mt-4 text-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat with Seller
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg border border-borderBg rounded-3xl max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-extrabold text-white">File Escrow Dispute</h3>
              <p className="text-gray-400 text-xs mt-1">Submit your case for arbitration by support moderators.</p>
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
