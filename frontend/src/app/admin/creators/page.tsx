'use client';

import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Modal, PageHeader, AdminSelect, AdminTextarea, ActionButton } from '@/components/admin/ui';

interface Creator {
  id: string; handle: string | null; platform: string; followerCount: number;
  status: string; isVerified: boolean; bio: string | null; createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED:  'bg-red-500/10 text-red-400 border-red-500/20',
  SUSPENDED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function ReviewModal({ creator, onClose, onDone }: { creator: Creator; onClose: () => void; onDone: () => void }) {
  const [action, setAction] = useState<'APPROVED'|'REJECTED'|'SUSPENDED'>('APPROVED');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const submit = async () => {
    setSaving(true); setError('');
    try {
      await api.post(`/affiliate/admin/creators/${creator.id}/review`, { status: action, rejectionReason: reason || undefined });
      onDone();
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={<span className="flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" />Review Creator</span>}
      footer={<>
        <button onClick={onClose} className="px-3 py-2 text-sm text-gray-500 hover:text-white transition">Cancel</button>
        <ActionButton variant="brand" loading={saving} onClick={submit}>Confirm</ActionButton>
      </>}>
      <div className="space-y-4 text-sm">
        <div className="space-y-1">
          <p className="text-white font-semibold">{creator.handle || `${creator.user.firstName} ${creator.user.lastName}`}</p>
          <p className="text-xs text-gray-500">{creator.user.email} · {creator.platform} · {creator.followerCount.toLocaleString()} followers</p>
          {creator.bio && <p className="text-xs text-gray-600">{creator.bio}</p>}
        </div>
        {error && <div className="text-red-400 text-xs bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2">{error}</div>}
        <div className="flex gap-2">
          {(['APPROVED','REJECTED','SUSPENDED'] as const).map(s => (
            <button key={s} onClick={() => setAction(s)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                action===s ? s==='APPROVED' ? 'bg-emerald-600 border-emerald-500 text-white' : s==='REJECTED' ? 'bg-red-600 border-red-500 text-white' : 'bg-orange-600 border-orange-500 text-white'
                : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}>
              {s}
            </button>
          ))}
        </div>
        {action !== 'APPROVED' && (
          <AdminTextarea value={reason} onChange={e => setReason(e.target.value)} label="Reason (optional)" rows={2} />
        )}
      </div>
    </Modal>
  );
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [reviewing, setReviewing] = useState<Creator | null>(null);

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const res = await api.get<any>('/affiliate/admin/creators', { params: status ? { status, limit: 100 } : { limit: 100 } });
      setCreators(res.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(filter || undefined); }, [filter]);

  return (
    <div className="space-y-5">
      {reviewing && <ReviewModal creator={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); load(filter || undefined); }} />}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-amber-400">
            <Crown className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Creator Applications</h1>
            <p className="text-xs text-gray-500 mt-0.5">Review, approve or reject creator program applications.</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['','PENDING','APPROVED','REJECTED','SUSPENDED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filter===s ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
      ) : creators.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm">No creator applications found.</div>
      ) : (
        <div className="space-y-2">
          {creators.map(c => (
            <div key={c.id} className="bg-[#111118] border border-white/8 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/16 transition-colors">
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{c.handle || `${c.user.firstName} ${c.user.lastName}`}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${STATUS_COLOR[c.status]||''}`}>{c.status}</span>
                  {c.isVerified && <Badge color="green">VERIFIED</Badge>}
                </div>
                <p className="text-[11px] text-gray-500">{c.user.email} · {c.platform} · {c.followerCount.toLocaleString()} followers</p>
                {c.bio && <p className="text-[11px] text-gray-600 truncate">{c.bio}</p>}
                <p className="text-[11px] text-gray-700">Applied {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {c.status === 'PENDING' ? (
                  <>
                    <ActionButton variant="success" onClick={() => setReviewing(c)}>
                      <CheckCircle className="w-3 h-3" />Approve
                    </ActionButton>
                    <ActionButton variant="danger" onClick={() => setReviewing(c)}>
                      <XCircle className="w-3 h-3" />Reject
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton variant="default" onClick={() => setReviewing(c)}>
                    <Eye className="w-3 h-3" />Update
                  </ActionButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
