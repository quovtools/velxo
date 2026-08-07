'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Loader2, UserCheck, ZoomIn } from 'lucide-react';
import { api } from '@/lib/api';
import { ErrorBanner, PageHeader, RefreshButton, AdminTextarea } from '@/components/admin/ui';

interface KycSubmission {
  id: string; storeName: string; kycStatus: string; kycIdType?: string | null;
  kycFullName?: string | null; kycDocumentNumber?: string | null;
  kycIdImageUrl?: string | null; kycSelfieImageUrl?: string | null;
  kycSubmittedAt?: string | null;
  user?: { email?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null };
}

const ID_LABEL: Record<string, string> = {
  NATIONAL_ID: 'National ID', PASSPORT: 'Passport', DRIVERS_LICENSE: "Driver's License",
};

export default function AdminKycPage() {
  const [items, setItems]           = useState<KycSubmission[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');

  const fetchPending = async () => {
    setLoading(true); setError('');
    try { const res = await api.get<any>('/admin/kyc/pending'); setItems(Array.isArray(res.data) ? res.data : []); }
    catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const approve = async (id: string) => {
    setActionLoading(id); setError('');
    try {
      await api.patch(`/admin/kyc/${id}/approve`);
      setItems(l => l.filter(x => x.id !== id));
      showToast('KYC approved — verified badge granted.');
    } catch (e: any) { setError(e?.message || 'Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id); setError('');
    try {
      await api.patch(`/admin/kyc/${id}/reject`, { reason: rejectReason });
      setItems(l => l.filter(x => x.id !== id));
      setRejectId(null); setRejectReason('');
      showToast('KYC submission rejected.');
    } catch (e: any) { setError(e?.message || 'Failed to reject'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={UserCheck} title="KYC Verification Queue"
        subtitle="Review seller ID & selfie submissions and grant the verified badge."
        action={<RefreshButton onClick={fetchPending} loading={loading} />} />

      {toast && (
        <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 text-emerald-300 text-sm px-4 py-3 rounded-xl">
          <CheckCircle className="w-4 h-4" />{toast}
        </div>
      )}
      <ErrorBanner message={error} onClose={() => setError('')} />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111118] border border-white/8 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-white">Queue empty</p>
          <p className="text-xs text-gray-600 mt-1">No pending KYC submissions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {items.map(s => (
            <div key={s.id} className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{s.storeName}</p>
                  <p className="text-[11px] text-gray-600">{s.user?.email}</p>
                  {s.user?.phone && <p className="text-[11px] text-gray-600">{s.user.phone}</p>}
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[{ url: s.kycIdImageUrl, label: 'ID Document' }, { url: s.kycSelfieImageUrl, label: 'Selfie' }].map(({ url, label }) => (
                  <a key={label} href={url || '#'} target="_blank" rel="noreferrer"
                    className="group relative rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition">
                    <img src={url || ''} alt={label} className="w-full aspect-[4/3] object-cover bg-black" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[10px] text-center text-gray-500 py-1">{label}</p>
                  </a>
                ))}
              </div>

              <div className="bg-white/4 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Full Name</span><span className="text-white">{s.kycFullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ID Type</span><span className="text-white">{ID_LABEL[s.kycIdType||'']||s.kycIdType}</span></div>
                {s.kycDocumentNumber && <div className="flex justify-between"><span className="text-gray-500">Doc #</span><span className="text-white font-mono">{s.kycDocumentNumber}</span></div>}
                {s.kycSubmittedAt && <div className="flex justify-between"><span className="text-gray-500">Submitted</span><span className="text-gray-400">{new Date(s.kycSubmittedAt).toLocaleString()}</span></div>}
              </div>

              {rejectId === s.id ? (
                <div className="space-y-2">
                  <AdminTextarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                    placeholder="Reason for rejection (required)…" />
                  <div className="flex gap-2">
                    <button onClick={() => reject(s.id)} disabled={actionLoading === s.id || !rejectReason.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-40">
                      {actionLoading === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}Confirm Reject
                    </button>
                    <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                      className="px-4 text-xs text-gray-500 hover:text-white border border-white/8 rounded-xl transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => approve(s.id)} disabled={actionLoading === s.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-40 shadow-sm shadow-violet-500/20">
                    {actionLoading === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}Approve & Verify
                  </button>
                  <button onClick={() => setRejectId(s.id)} disabled={actionLoading === s.id}
                    className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-40">
                    <XCircle className="w-3.5 h-3.5" />Reject
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
