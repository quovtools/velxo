'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Loader2, RefreshCw, UserCheck, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface KycSubmission {
  id: string;
  storeName: string;
  kycStatus: string;
  kycIdType?: string | null;
  kycFullName?: string | null;
  kycDocumentNumber?: string | null;
  kycIdImageUrl?: string | null;
  kycSelfieImageUrl?: string | null;
  kycSubmittedAt?: string | null;
  user?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
}

const ID_LABEL: Record<string, string> = {
  NATIONAL_ID: 'National ID',
  PASSPORT: 'Passport',
  DRIVERS_LICENSE: "Driver's License",
};

export default function AdminKycPage() {
  const [items, setItems] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ data: KycSubmission[] }>('/admin/kyc/pending');
      setItems((res as any).data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      await api.patch(`/admin/kyc/${id}/approve`);
      setItems((l) => l.filter((x) => x.id !== id));
      setToast(`Seller verified — blue badge granted.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    setError('');
    try {
      await api.patch(`/admin/kyc/${id}/reject`, { reason: rejectReason });
      setItems((l) => l.filter((x) => x.id !== id));
      setRejectId(null);
      setRejectReason('');
      setToast('KYC submission rejected.');
      setTimeout(() => setToast(''), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 rounded-xl">
            <UserCheck className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">KYC Verification Queue</h1>
            <p className="text-sm text-gray-400">Review seller ID & selfie submissions and grant the verified badge.</p>
          </div>
        </div>
        <button onClick={fetchPending} className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white border border-borderBg px-4 py-2 rounded-xl transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {toast && (
        <div className="bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {toast}
        </div>
      )}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No pending KYC submissions. All caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {items.map((s) => (
            <div key={s.id} className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {s.storeName}
                  </h2>
                  <p className="text-xs text-gray-400">{s.user?.email}</p>
                  {s.user?.phone && <p className="text-xs text-gray-500">{s.user.phone}</p>}
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  PENDING
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl overflow-hidden border border-borderBg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.kycIdImageUrl || ''} alt="ID" className="w-full aspect-[4/3] object-cover bg-black" />
                  <p className="text-[11px] text-center text-gray-400 py-1">ID Document</p>
                </div>
                <div className="rounded-xl overflow-hidden border border-borderBg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.kycSelfieImageUrl || ''} alt="Selfie" className="w-full aspect-[4/3] object-cover bg-black" />
                  <p className="text-[11px] text-center text-gray-400 py-1">Selfie</p>
                </div>
              </div>

              <div className="text-sm text-gray-300 space-y-1 bg-hoverBg/30 rounded-xl p-3">
                <p><span className="text-gray-500">Full Name:</span> {s.kycFullName}</p>
                <p><span className="text-gray-500">ID Type:</span> {ID_LABEL[s.kycIdType || ''] || s.kycIdType}</p>
                {s.kycDocumentNumber && <p><span className="text-gray-500">Document #:</span> {s.kycDocumentNumber}</p>}
                {s.kycSubmittedAt && <p className="text-xs text-gray-500">Submitted {new Date(s.kycSubmittedAt).toLocaleString()}</p>}
              </div>

              {rejectId === s.id ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="Reason for rejection (required)"
                    className="w-full bg-background border border-borderBg rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reject(s.id)}
                      disabled={actionLoading === s.id || !rejectReason.trim()}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-xl transition"
                    >
                      {actionLoading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirm Reject
                    </button>
                    <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-borderBg rounded-xl">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(s.id)}
                    disabled={actionLoading === s.id}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition"
                  >
                    {actionLoading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Approve & Verify
                  </button>
                  <button
                    onClick={() => setRejectId(s.id)}
                    disabled={actionLoading === s.id}
                    className="flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold px-4 py-2.5 rounded-xl transition border border-red-500/20"
                  >
                    <AlertTriangle className="w-4 h-4" /> Reject
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
