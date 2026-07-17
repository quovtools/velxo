'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Crown, CheckCircle, XCircle, Loader2, AlertCircle, Users, Eye } from 'lucide-react';

interface Creator {
  id: string;
  handle: string | null;
  platform: string;
  followerCount: number;
  status: string;
  isVerified: boolean;
  tier: string;
  hasFreePremium: boolean;
  hasTournamentSlot: boolean;
  bio: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  SUSPENDED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function ReviewModal({
  creator,
  onClose,
  onDone,
}: {
  creator: Creator;
  onClose: () => void;
  onDone: () => void;
}) {
  const [action, setAction] = useState<'APPROVED' | 'REJECTED' | 'SUSPENDED'>('APPROVED');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/affiliate/admin/creators/${creator.id}/review`, {
        status: action,
        rejectionReason: reason || undefined,
      });
      onDone();
    } catch (err: any) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-cardBg border border-borderBg rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" /> Review Creator: {creator.handle || creator.user.firstName}
        </h2>
        <div className="space-y-2 text-sm text-gray-400">
          <p><span className="font-semibold text-white">Platform:</span> {creator.platform}</p>
          <p><span className="font-semibold text-white">Followers:</span> {creator.followerCount.toLocaleString()}</p>
          <p><span className="font-semibold text-white">Email:</span> {creator.user.email}</p>
          {creator.bio && <p><span className="font-semibold text-white">Bio:</span> {creator.bio}</p>}
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-sm text-red-400">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        <div className="flex gap-2">
          {(['APPROVED', 'REJECTED', 'SUSPENDED'] as const).map(s => (
            <button key={s} onClick={() => setAction(s)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                action === s
                  ? s === 'APPROVED' ? 'bg-emerald-500 text-white border-emerald-500'
                    : s === 'REJECTED' ? 'bg-red-500 text-white border-red-500'
                    : 'bg-orange-500 text-white border-orange-500'
                  : 'border-borderBg text-gray-400 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
        {action !== 'APPROVED' && (
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)"
            rows={2}
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition resize-none" />
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-borderBg text-gray-300 hover:bg-hoverBg rounded-xl text-sm font-bold transition">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewing, setReviewing] = useState<Creator | null>(null);

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Creator[] }>('/affiliate/admin/creators', { params: status ? { status, limit: 100 } : { limit: 100 } });
      setCreators((res as any).data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(filter || undefined); }, [filter]);

  return (
    <div className="space-y-6">
      {reviewing && (
        <ReviewModal creator={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); load(filter || undefined); }} />
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Crown className="w-6 h-6 text-yellow-400" /> Creator Applications</h1>
          <p className="text-sm text-gray-400 mt-1">Review, approve, or reject creator program applications.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                filter === s ? 'bg-brand text-white border-brand' : 'border-borderBg text-gray-400 hover:text-white'
              }`}>{s || 'All'}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-brand animate-spin" /></div>
      ) : creators.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No creator applications found.</div>
      ) : (
        <div className="space-y-3">
          {creators.map(c => (
            <div key={c.id} className="bg-cardBg border border-borderBg rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-white">{c.handle || `${c.user.firstName} ${c.user.lastName}`}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                  {c.isVerified && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VERIFIED</span>}
                </div>
                <p className="text-xs text-gray-400">{c.user.email} · {c.platform} · {c.followerCount.toLocaleString()} followers</p>
                {c.bio && <p className="text-xs text-gray-500 line-clamp-1">{c.bio}</p>}
                <p className="text-xs text-gray-600">Applied {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                {c.status === 'PENDING' && (
                  <>
                    <button onClick={() => setReviewing(c)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => { setReviewing(c); }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
                {c.status !== 'PENDING' && (
                  <button onClick={() => setReviewing(c)}
                    className="flex items-center gap-2 px-4 py-2 bg-cardBg border border-borderBg text-gray-400 hover:text-white rounded-xl text-xs font-bold transition">
                    <Eye className="w-3.5 h-3.5" /> Update
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
