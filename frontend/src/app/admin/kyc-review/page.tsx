'use client';

import React, { useState, useEffect } from 'react';
import { BadgeCheck, X, Check, Loader2, ZoomIn, Calendar, FileText, CreditCard, Video, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, AdminTextarea, AdminInput } from '@/components/admin/ui';

interface KycSubmission {
  id: string; storeName: string; kycStatus: string; kycIdType?: string;
  kycFullName?: string; kycDocumentNumber?: string; kycIdImageUrl?: string;
  kycSelfieImageUrl?: string; kycSubmittedAt?: string; totalSales?: number;
  subscriptionTier?: string;
}

const TABS = [
  { key: 'id' as const,      label: 'ID Submissions',       icon: BadgeCheck },
  { key: 'pro' as const,     label: 'Pro Verifications',    icon: CreditCard },
  { key: 'premium' as const, label: 'Premium Video Calls',  icon: Video },
];

export default function AdminKycReviewPage() {
  const [tab, setTab]             = useState<'id'|'pro'|'premium'>('id');
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState('');

  const selected = submissions.find(s => s.id === selectedId);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/admin/kyc/pending');
      const all = res.data || [];
      const filtered = all.filter((s: KycSubmission) => {
        if (tab === 'premium') return s.kycStatus === 'VIDEO_PENDING';
        if (tab === 'pro')     return s.kycStatus === 'SUBMITTED' && s.subscriptionTier === 'PRO';
        return s.kycStatus === 'SUBMITTED' && s.subscriptionTier !== 'PRO';
      });
      setSubmissions(filtered);
    } catch { setSubmissions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubmissions(); }, [tab]);

  const approve = async (sellerId: string) => {
    setSubmitting(true);
    const tier = tab === 'premium' ? 'PREMIUM' : tab === 'pro' ? 'PRO' : 'VERIFIED';
    try {
      await api.patch(`/admin/sellers/${sellerId}/kyc/approve`, { tier });
      setSubmissions(p => p.filter(s => s.id !== sellerId));
      setSelectedId(null); showToast('KYC approved ✓');
    } catch (e: any) { showToast(e.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const reject = async (sellerId: string) => {
    if (!rejectReason.trim()) { showToast('Please enter a rejection reason'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/admin/sellers/${sellerId}/kyc/reject`, { reason: rejectReason });
      setSubmissions(p => p.filter(s => s.id !== sellerId));
      setSelectedId(null); setRejectReason(''); showToast('KYC rejected');
    } catch (e: any) { showToast(e.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const scheduleVideo = async (sellerId: string) => {
    if (!videoLink.trim()) { showToast('Enter a meeting link'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/admin/sellers/${sellerId}/kyc/schedule-video`, { meetingLink: videoLink });
      showToast('Meeting link sent to seller ✓'); setVideoLink('');
    } catch (e: any) { showToast(e.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={BadgeCheck} title="KYC Review Queue" subtitle="Review and approve seller identity verification submissions." />

      {toast && (
        <div className="bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm px-4 py-3 rounded-xl">{toast}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8 pb-0">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px ${
              tab===t.key ? 'border-violet-500 text-white' : 'border-transparent text-gray-600 hover:text-gray-300'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <p className="text-xs font-semibold text-white">{submissions.length} pending</p>
            <button onClick={fetchSubmissions} className="text-[11px] text-violet-400 hover:text-violet-300">Refresh</button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-violet-400 animate-spin" /></div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-600 text-xs gap-2">
              <AlertCircle className="w-8 h-8 opacity-30" />No pending submissions
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {submissions.map(s => (
                <button key={s.id} onClick={() => { setSelectedId(s.id); setRejectReason(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-white/3 ${selectedId===s.id ? 'bg-violet-600/8 border-l-2 border-l-violet-500' : ''}`}>
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-violet-400">
                    {s.storeName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.storeName}</p>
                    <p className="text-[11px] text-gray-600">{s.kycFullName || 'No name'} · {s.kycSubmittedAt ? new Date(s.kycSubmittedAt).toLocaleDateString() : '—'}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">PENDING</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-600 text-xs gap-2">
              <FileText className="w-10 h-10 opacity-20" />Select a submission to review
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{selected.storeName}</p>
                  <p className="text-xs text-gray-500">{selected.kycFullName} · {selected.kycIdType}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1.5 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white/4 rounded-xl p-3 space-y-1 text-xs">
                {[['Full Name', selected.kycFullName], ['ID Type', selected.kycIdType], ['Doc #', selected.kycDocumentNumber], ['Total Sales', selected.totalSales], ['Tier', selected.subscriptionTier]].map(([l, v]) =>
                  v != null && (
                    <div key={String(l)} className="flex justify-between gap-4">
                      <span className="text-gray-500">{l}</span>
                      <span className="text-white font-medium">{String(v)}</span>
                    </div>
                  )
                )}
              </div>

              {(selected.kycIdImageUrl || selected.kycSelfieImageUrl) && (
                <div className="grid grid-cols-2 gap-2">
                  {[{ url: selected.kycIdImageUrl, label: 'ID Doc' }, { url: selected.kycSelfieImageUrl, label: 'Selfie' }].map(({ url, label }) =>
                    url ? (
                      <a key={label} href={url} target="_blank" rel="noreferrer"
                        className="group relative rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition">
                        <img src={url} alt={label} className="w-full aspect-video object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-[10px] text-center text-gray-600 py-1">{label}</p>
                      </a>
                    ) : null
                  )}
                </div>
              )}

              {tab === 'premium' && (
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Schedule Video Call</p>
                  <AdminInput type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="https://meet.google.com/…" />
                  <button onClick={() => scheduleVideo(selected.id)} disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 py-2.5 rounded-xl text-xs font-semibold text-white transition disabled:opacity-40">
                    <Calendar className="w-3.5 h-3.5" />Send Meeting Link
                  </button>
                </div>
              )}

              <AdminTextarea label="Rejection reason (required to reject)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} placeholder="e.g. ID image is blurry…" />

              <div className="flex gap-2">
                <button onClick={() => reject(selected.id)} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-40">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}Reject
                </button>
                <button onClick={() => approve(selected.id)} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-40">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Approve
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
