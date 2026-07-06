'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { ShieldCheck, Eye, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PendingListing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  seller: {
    storeName: string;
  };
}

export default function AdminModerationPage() {
  const { role } = useAuth();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadPending() {
    try {
      const response = await api.get<{ success: boolean; data: PendingListing[] }>('/admin/listings/pending');
      if (response.success) {
        setListings(response.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MODERATOR') {
      loadPending();
    }
  }, [role]);

  const handleApprove = async (id: string) => {
    try {
      const response = await api.patch<{ success: boolean }>(`/admin/listings/${id}/approve`);
      if (response.success) {
        alert('Listing approved and published successfully!');
        await loadPending();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve listing');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId || !rejectReason) return;

    try {
      const response = await api.patch<{ success: boolean }>(`/admin/listings/${rejectId}/reject`, {
        reason: rejectReason,
      });

      if (response.success) {
        alert('Listing rejected successfully!');
        setRejectId(null);
        setRejectReason('');
        await loadPending();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject listing');
    }
  };

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
    return <div className="text-center py-20 text-red-400 font-bold">Access Denied</div>;
  }

  return (
    <div className="space-y-8 my-6">
      <div className="border-b border-borderBg pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Eye className="w-8 h-8 text-brand" />
          Listings Moderation Queue
        </h1>
        <p className="text-gray-400 mt-2">Audit and review seller marketplace submissions for security validation.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading pending requests...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-cardBg border border-borderBg rounded-2xl">
          <p className="text-gray-400">Queue is completely empty! No listings currently require auditing.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => (
            <div key={item.id} className="bg-cardBg border border-borderBg rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="bg-brand/10 text-brand-light text-xs font-semibold px-2 py-0.5 rounded border border-brand/20">
                  {item.gameName}
                </span>
                <h3 className="font-bold text-lg text-white mt-1">{item.title}</h3>
                <p className="text-xs text-gray-500">
                  Seller: <span className="text-brand-light">{item.seller?.storeName}</span> • Platform: {item.platform} • Region: {item.region} • Rank: {item.rank || 'N/A'}
                </p>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between border-t border-borderBg pt-4 md:border-t-0 md:pt-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold">Price</p>
                  <p className="text-xl font-black text-white">${Number(item.price).toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 p-2.5 rounded-xl font-bold transition text-white"
                    title="Approve"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRejectId(item.id)}
                    className="bg-red-600 hover:bg-red-700 p-2.5 rounded-xl font-bold transition text-white"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg border border-borderBg rounded-3xl max-w-md w-full p-8 space-y-6">
            <h3 className="text-2xl font-extrabold text-white">Reject Submission</h3>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rejection Reason</label>
                <textarea
                  required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand h-24"
                  placeholder="Tell the seller why this offer was rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="flex-1 bg-background border border-borderBg py-3 rounded-xl font-bold transition text-gray-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold transition text-white text-xs"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
