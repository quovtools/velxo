'use client';

import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, DollarSign, Store, Mail, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { ErrorBanner, PageHeader, RefreshButton, AdminInput } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';
import { formatNativeAmount } from '@/lib/currency';

interface Listing {
  id: string; title: string; gameName: string; price: number; currency: string;
  status: string; createdAt: string;
  seller?: { storeName: string; user?: { email: string } };
  images?: string[];
}

export default function ModerationPage() {
  const [listings, setListings]       = useState<Listing[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId]       = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError]             = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/admin/listings/pending');
      setListings(res.data || []);
    } catch { setListings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(); }, []);

  const approve = async (id: string) => {
    setActionLoading(id); setError('');
    try { await api.patch(`/admin/listings/${id}/approve`); setListings(l => l.filter(x => x.id !== id)); }
    catch (e: any) { setError(e.message || 'Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id); setError('');
    try {
      await api.patch(`/admin/listings/${id}/reject`, { reason: rejectReason });
      setListings(l => l.filter(x => x.id !== id));
      setRejectId(null); setRejectReason('');
    } catch (e: any) { setError(e.message || 'Failed to reject'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={Eye} title="Moderation" subtitle="Review and approve or reject pending listings."
        action={<RefreshButton onClick={fetchListings} loading={loading} />} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {loading ? <LoadingArea label="Loading pending listings…" /> : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111118] border border-white/8 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-white">All clear!</p>
          <p className="text-xs text-gray-600 mt-1">No listings pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <div key={listing.id} className="bg-[#111118] border border-white/8 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/8" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{listing.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{listing.gameName}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatNativeAmount(listing.price, listing.currency)}</span>
                    <span className="flex items-center gap-1"><Store className="w-3 h-3" />{listing.seller?.storeName || '—'}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{listing.seller?.user?.email || '—'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(listing.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approve(listing.id)} disabled={actionLoading === listing.id}
                    className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => { setRejectId(listing.id); setRejectReason(''); }}
                    disabled={actionLoading === listing.id}
                    className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
              {rejectId === listing.id && (
                <div className="mt-4 pt-4 border-t border-white/8 flex gap-2">
                  <AdminInput autoFocus value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection…" className="flex-1" />
                  <button onClick={() => reject(listing.id)}
                    disabled={!rejectReason.trim() || actionLoading === listing.id}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40">
                    Confirm
                  </button>
                  <button onClick={() => setRejectId(null)}
                    className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-xl transition">
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
