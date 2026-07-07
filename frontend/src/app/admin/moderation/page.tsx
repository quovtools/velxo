'use client';

import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, RefreshCw, AlertTriangle, DollarSign, Store, Mail, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface Listing {
  id: string;
  title: string;
  gameName: string;
  price: number;
  currency: string;
  status: string;
  createdAt: string;
  seller?: { storeName: string; user?: { email: string } };
  images?: string[];
}

export default function ModerationPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Listing[] }>('/admin/listings/pending');
      setListings((res as any).data || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const approve = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/listings/${id}/approve`);
      setListings(l => l.filter(x => x.id !== id));
    } catch (e: any) {
      alert(e.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    try {
      await api.patch(`/admin/listings/${id}/reject`, { reason: rejectReason });
      setListings(l => l.filter(x => x.id !== id));
      setRejectId(null);
      setRejectReason('');
    } catch (e: any) {
      alert(e.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-brand" /> Listings Moderation
          </h1>
          <p className="text-gray-400 text-sm mt-1">Review and approve or reject pending listings.</p>
        </div>
        <button onClick={fetchListings} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-bold">All clear!</p>
          <p className="text-gray-400 text-sm mt-1">No listings pending review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map(listing => (
            <div key={listing.id} className="bg-cardBg border border-borderBg rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Thumbnail */}
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-gray-500" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{listing.title}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{listing.gameName}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{listing.currency} {Number(listing.price).toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Store className="w-3 h-3" />{listing.seller?.storeName || 'Unknown store'}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{listing.seller?.user?.email || '—'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(listing.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve(listing.id)}
                    disabled={actionLoading === listing.id}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectId(listing.id); setRejectReason(''); }}
                    disabled={actionLoading === listing.id}
                    className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>

              {/* Reject reason input */}
              {rejectId === listing.id && (
                <div className="mt-4 pt-4 border-t border-borderBg flex gap-3">
                  <input
                    autoFocus
                    type="text"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                  />
                  <button
                    onClick={() => reject(listing.id)}
                    disabled={!rejectReason.trim() || actionLoading === listing.id}
                    className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setRejectId(null)}
                    className="text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
