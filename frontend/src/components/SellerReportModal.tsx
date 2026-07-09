'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { X, Flag, Loader2, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';

const REPORT_REASONS = [
  'Fake or misleading listing',
  'Scam or fraud',
  'Stolen / hacked account',
  'Inappropriate behavior',
  'Spam or spam messages',
  'Intellectual property violation',
  'Other',
];

interface Props {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
}

export default function SellerReportModal({ open, onClose, sellerId, sellerName }: Props) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const reset = () => {
    setReason('');
    setDetails('');
    setStatus('idle');
    setErrorMsg('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = `/auth/login?redirect=/seller/${sellerId}`;
      return;
    }
    if (!reason) {
      setStatus('error');
      setErrorMsg('Please choose a reason for the report.');
      return;
    }
    setSubmitting(true);
    setStatus('idle');
    setErrorMsg('');
    try {
      await api.post(`/sellers/${sellerId}/report`, { reason, details: details.trim() || undefined });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full sm:max-w-md bg-cardBg border border-borderBg rounded-t-3xl sm:rounded-2xl shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        {status === 'success' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold">Report submitted</h3>
            <p className="text-sm text-gray-400">
              Thank you. Our trust &amp; safety team will review this report about <span className="text-white font-semibold">{sellerName}</span> and take appropriate action.
            </p>
            <button
              onClick={close}
              className="w-full mt-2 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold leading-tight">Report seller</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">{sellerName}</p>
                </div>
              </div>
              <button type="button" onClick={close} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-hoverBg/40 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</label>
              <div className="relative">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full appearance-none bg-background border border-borderBg rounded-xl px-3 py-3 pr-9 text-sm text-white focus:outline-none focus:border-brand transition"
                >
                  <option value="">Select a reason…</option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Details <span className="text-gray-600 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Add any context that will help our team investigate…"
                className="w-full bg-background border border-borderBg rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand transition resize-none"
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={close}
                className="flex-1 bg-background border border-borderBg hover:border-gray-500 text-gray-300 font-semibold py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                Submit report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
