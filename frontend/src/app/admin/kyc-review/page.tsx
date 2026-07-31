'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import {
  BadgeCheck, X, Check, Loader2, ExternalLink, ZoomIn, Calendar,
  FileText, CreditCard, Home, Video, AlertCircle,
} from 'lucide-react';

interface KycSubmission {
  id: string;
  userId: string;
  storeName: string;
  kycStatus: string;
  kycIdType?: string;
  kycFullName?: string;
  kycDocumentNumber?: string;
  kycIdImageUrl?: string;
  kycSelfieImageUrl?: string;
  kycSubmittedAt?: string;
  kycRejectionReason?: string;
  totalSales?: number;
  subscriptionTier?: string;
  metadata?: any;
}

const TIER_META: Record<string, { label: string; icon: any; color: string }> = {
  VERIFIED: { label: 'ID Verified', icon: BadgeCheck, color: 'text-emerald-400' },
  PRO:      { label: 'Pro (Bank)', icon: CreditCard, color: 'text-violet-400' },
  PREMIUM:  { label: 'Premium (Video)', icon: Video, color: 'text-amber-400' },
};

export default function AdminKycReviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'id' | 'pro' | 'premium'>('id');
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const selected = submissions.find(s => s.id === selectedId);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') { router.push('/'); return; }
    fetchSubmissions();
  }, [user, authLoading, router, tab]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: KycSubmission[] }>('/admin/kyc/pending');
      const all = res.data || [];
      // Filter by tab: id = SUBMITTED, pro = SUBMITTED+PRO subscription, premium = VIDEO_PENDING
      const filtered = all.filter(s => {
        if (tab === 'premium') return s.kycStatus === 'VIDEO_PENDING';
        if (tab === 'pro')     return s.kycStatus === 'SUBMITTED' && s.subscriptionTier === 'PRO';
        return s.kycStatus === 'SUBMITTED' && s.subscriptionTier !== 'PRO';
      });
      setSubmissions(filtered);
    } catch { setSubmissions([]); }
    finally { setLoading(false); }
  };

  const approve = async (sellerId: string) => {
    setSubmitting(true);
    const tier = tab === 'premium' ? 'PREMIUM' : tab === 'pro' ? 'PRO' : 'VERIFIED';
    try {
      await api.patch(`/admin/sellers/${sellerId}/kyc/approve`, { tier });
      setSubmissions(prev => prev.filter(s => s.id !== sellerId));
      setSelectedId(null);
      showToast('KYC approved ✓');
    } catch (err: any) { showToast(err.message || 'Approve failed'); }
    finally { setSubmitting(false); }
  };

  const reject = async (sellerId: string) => {
    if (!rejectReason.trim()) { showToast('Please provide a rejection reason'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/admin/sellers/${sellerId}/kyc/reject`, { reason: rejectReason });
      setSubmissions(prev => prev.filter(s => s.id !== sellerId));
      setSelectedId(null); setRejectReason('');
      showToast('KYC rejected');
    } catch (err: any) { showToast(err.message || 'Reject failed'); }
    finally { setSubmitting(false); }
  };

  const scheduleVideo = async (sellerId: string) => {
    if (!videoLink.trim()) { showToast('Please enter a meeting link'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/admin/sellers/${sellerId}/kyc/schedule-video`, { meetingLink: videoLink });
      showToast('Video call scheduled — seller notified ✓');
      setVideoLink('');
    } catch (err: any) { showToast(err.message || 'Schedule failed'); }
    finally { setSubmitting(false); }
  };

  const TABS = [
    { key: 'id',      label: 'ID Submissions',       icon: <BadgeCheck className="w-4 h-4" /> },
    { key: 'pro',     label: 'Pro Bank Verifications', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'premium', label: 'Premium Video Calls',    icon: <Video className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-cardBg border border-brand/30 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <BadgeCheck className="w-6 h-6 text-brand" /> KYC Review Queue
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Review and approve seller identity verification submissions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-borderBg pb-0">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === t.key ? 'border-brand text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: submissions table */}
        <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-borderBg flex items-center justify-between">
            <p className="text-sm font-bold">{submissions.length} pending</p>
            <button onClick={fetchSubmissions} className="text-xs text-brand hover:text-brand-light">Refresh</button>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-700" />
              No pending submissions in this queue
            </div>
          ) : (
            <div className="divide-y divide-borderBg">
              {submissions.map(s => (
                <button key={s.id} onClick={() => { setSelectedId(s.id); setRejectReason(''); }}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition hover:bg-hoverBg/30 ${selectedId === s.id ? 'bg-brand/5 border-l-2 border-brand' : ''}`}>
                  <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand">
                    {s.storeName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.storeName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.kycFullName || 'No name'} · {s.kycSubmittedAt ? new Date(s.kycSubmittedAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border bg-yellow-950/30 text-yellow-400 border-yellow-500/20 shrink-0`}>
                    Pending
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-5">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-600 text-sm gap-2">
              <FileText className="w-12 h-12 text-gray-700" />
              Select a submission to review
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{selected.storeName}</h3>
                  <p className="text-xs text-gray-500">{selected.kycFullName} · {selected.kycIdType}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-hoverBg rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Personal details */}
              <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2 text-sm">
                {[
                  ['Full Name', selected.kycFullName],
                  ['ID Type', selected.kycIdType],
                  ['Document Number', selected.kycDocumentNumber],
                  ['Total Sales', selected.totalSales],
                  ['Subscription', selected.subscriptionTier],
                  ['Submitted', selected.kycSubmittedAt ? new Date(selected.kycSubmittedAt).toLocaleString() : '—'],
                ].map(([label, val]) => val != null && (
                  <div key={String(label)} className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">{label}</span>
                    <span className="text-white font-medium text-right truncate">{String(val)}</span>
                  </div>
                ))}
              </div>

              {/* Document images */}
              {(selected.kycIdImageUrl || selected.kycSelfieImageUrl) && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Documents</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.kycIdImageUrl && (
                      <a href={selected.kycIdImageUrl} target="_blank" rel="noreferrer"
                        className="group relative aspect-video bg-background border border-borderBg rounded-xl overflow-hidden hover:border-brand/40 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selected.kycIdImageUrl} alt="ID Document" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">ID Doc</span>
                      </a>
                    )}
                    {selected.kycSelfieImageUrl && (
                      <a href={selected.kycSelfieImageUrl} target="_blank" rel="noreferrer"
                        className="group relative aspect-video bg-background border border-borderBg rounded-xl overflow-hidden hover:border-brand/40 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selected.kycSelfieImageUrl} alt="Selfie" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">Selfie</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Video call scheduling (premium only) */}
              {tab === 'premium' && (
                <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Schedule Video Call
                  </p>
                  <input type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)}
                    placeholder="e.g. https://meet.google.com/abc-defg-hij"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                  <button onClick={() => scheduleVideo(selected.id)} disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
                    <Calendar className="w-4 h-4" /> Send Meeting Link to Seller
                  </button>
                </div>
              )}

              {/* Reject reason */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
                  Rejection Reason (required to reject)
                </label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                  placeholder="e.g. ID image is blurry, selfie doesn't match ID..."
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand resize-none" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={() => reject(selected.id)} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-900/20 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject
                </button>
                <button onClick={() => approve(selected.id)} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                </button>
              </div>

              {/* View seller profile */}
              <a href={`/admin/sellers/${selected.id}`} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-brand transition">
                <ExternalLink className="w-3.5 h-3.5" /> View full seller profile
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
