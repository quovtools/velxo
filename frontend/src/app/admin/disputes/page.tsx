'use client';

import React, { useEffect, useState } from 'react';
import { Scale, CheckCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, ErrorBanner, PageHeader, RefreshButton, AdminSelect, AdminTextarea } from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface Dispute {
  id: string; reason: string; status: string; createdAt: string;
  order?: { orderNumber: string; totalAmount: number; currency: string };
  initiator?: { firstName: string; lastName: string; email: string };
}

const STATUS_COLOR: Record<string,string> = {
  OPEN:              'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  UNDER_REVIEW:      'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  RESOLVED_BUYER:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  RESOLVED_SELLER:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  RESOLVED_PLATFORM: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  CLOSED:            'bg-white/5 text-gray-500 border border-white/8',
};

export default function DisputesPage() {
  const [disputes, setDisputes]     = useState<Dispute[]>([]);
  const [loading, setLoading]       = useState(true);
  const [resolveId, setResolveId]   = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [notes, setNotes]           = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]           = useState('');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/disputes/open');
      setDisputes(res.data || []);
    } catch { setDisputes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const resolve = async (id: string) => {
    if (!resolution) return;
    setActionLoading(true); setError('');
    try {
      await api.patch(`/disputes/${id}/resolve`, { resolutionType: resolution, resolutionNotes: notes });
      setDisputes(d => d.filter(x => x.id !== id));
      setResolveId(null); setResolution(''); setNotes('');
    } catch (e: any) { setError(e.message || 'Failed to resolve'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={Scale} title="Dispute Court" subtitle="Arbitrate open buyer/seller disputes."
        action={<RefreshButton onClick={fetchDisputes} loading={loading} />} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {loading ? <LoadingArea label="Loading disputes…" /> : disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111118] border border-white/8 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-white">No open disputes</p>
          <p className="text-xs text-gray-600 mt-1">All cases resolved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <div key={d.id} className="bg-[#111118] border border-white/8 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${STATUS_COLOR[d.status] || 'bg-white/5 text-gray-400'}`}>
                      {d.status.replace(/_/g,' ')}
                    </span>
                    <span className="text-[11px] text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{d.reason}</p>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {d.order && <p>Order <span className="text-gray-400 font-mono">#{d.order.orderNumber}</span> — {d.order.currency} {Number(d.order.totalAmount).toFixed(2)}</p>}
                    {d.initiator && <p>By <span className="text-gray-400">{d.initiator.firstName} {d.initiator.lastName} ({d.initiator.email})</span></p>}
                  </div>
                </div>
                {(d.status === 'OPEN' || d.status === 'UNDER_REVIEW') && (
                  <button onClick={() => { setResolveId(d.id); setResolution(''); setNotes(''); }}
                    className="flex-shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm shadow-violet-500/20">
                    Resolve
                  </button>
                )}
              </div>

              {resolveId === d.id && (
                <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
                  <AdminSelect value={resolution} onChange={e => setResolution(e.target.value)}>
                    <option value="">— Select resolution type —</option>
                    <option value="REFUND_BUYER">Refund Buyer</option>
                    <option value="RELEASE_TO_SELLER">Release to Seller</option>
                    <option value="SPLIT">Split Payment</option>
                    <option value="OTHER">Other</option>
                  </AdminSelect>
                  <AdminTextarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Resolution notes (optional)…" rows={2} />
                  <div className="flex gap-2">
                    <button onClick={() => resolve(d.id)} disabled={!resolution || actionLoading}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-40">
                      {actionLoading ? 'Resolving…' : 'Confirm'}
                    </button>
                    <button onClick={() => setResolveId(null)}
                      className="text-gray-500 hover:text-white text-sm px-3 py-2 rounded-xl transition">Cancel</button>
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
