'use client';

import React, { useEffect, useState } from 'react';
import { Scale, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Dispute {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  order?: { orderNumber: string; totalAmount: number; currency: string };
  initiator?: { firstName: string; lastName: string; email: string };
}

const statusColor: Record<string, string> = {
  OPEN: 'bg-yellow-500/20 text-yellow-300',
  UNDER_REVIEW: 'bg-blue-500/20 text-blue-300',
  RESOLVED_BUYER: 'bg-green-500/20 text-green-300',
  RESOLVED_SELLER: 'bg-purple-500/20 text-purple-300',
  RESOLVED_PLATFORM: 'bg-gray-500/20 text-gray-300',
  CLOSED: 'bg-gray-700/40 text-gray-400',
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Dispute[] }>('/disputes/open');
      setDisputes((res as any).data || []);
    } catch {
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const resolve = async (id: string) => {
    if (!resolution) return;
    setActionLoading(true);
    try {
      await api.patch(`/disputes/${id}/resolve`, { resolutionType: resolution, resolutionNotes: notes });
      setDisputes(d => d.filter(x => x.id !== id));
      setResolveId(null);
      setResolution('');
      setNotes('');
    } catch (e: any) {
      alert(e.message || 'Failed to resolve dispute');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand" /> Dispute Court
          </h1>
          <p className="text-gray-400 text-sm mt-1">Arbitrate open buyer/seller disputes.</p>
        </div>
        <button onClick={fetchDisputes} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-bold">No open disputes</p>
          <p className="text-gray-400 text-sm mt-1">All disputes have been resolved.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(dispute => (
            <div key={dispute.id} className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[dispute.status] || 'bg-gray-700 text-gray-300'}`}>
                      {dispute.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white font-semibold">{dispute.reason}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    {dispute.order && (
                      <p>Order: <span className="text-gray-300">#{dispute.order.orderNumber}</span> —
                        <span className="text-gray-300"> {dispute.order.currency} {Number(dispute.order.totalAmount).toFixed(2)}</span>
                      </p>
                    )}
                    {dispute.initiator && (
                      <p>Initiated by: <span className="text-gray-300">{dispute.initiator.firstName} {dispute.initiator.lastName} ({dispute.initiator.email})</span></p>
                    )}
                  </div>
                </div>

                {dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW' ? (
                  <button
                    onClick={() => { setResolveId(dispute.id); setResolution(''); setNotes(''); }}
                    className="flex-shrink-0 bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                  >
                    Resolve
                  </button>
                ) : null}
              </div>

              {/* Resolve panel */}
              {resolveId === dispute.id && (
                <div className="pt-4 border-t border-borderBg space-y-3">
                  <select
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition"
                  >
                    <option value="">— Select resolution type —</option>
                    <option value="REFUND_BUYER">Refund Buyer</option>
                    <option value="RELEASE_TO_SELLER">Release to Seller</option>
                    <option value="SPLIT">Split Payment</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Resolution notes (optional)..."
                    rows={3}
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolve(dispute.id)}
                      disabled={!resolution || actionLoading}
                      className="bg-brand hover:bg-brand-dark text-white text-sm font-bold px-5 py-2 rounded-xl transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Resolving...' : 'Confirm Resolution'}
                    </button>
                    <button onClick={() => setResolveId(null)} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
