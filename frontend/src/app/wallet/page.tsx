'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Clock, Plus,
  TrendingUp, Lock, DollarSign, X, Loader2, AlertCircle,
} from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

interface WalletData {
  balance: string;
  lockedBalance: string;
  totalEarnings: string;
  totalWithdrawn: string;
}

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'REFUND' | 'FEE';
  amount: string;
  description: string;
  balanceAfter: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string; sign: string }> = {
  CREDIT:  { color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-500/20', label: 'Credit',  sign: '+' },
  RELEASE: { color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-500/20', label: 'Released', sign: '+' },
  REFUND:  { color: 'text-blue-400',    bg: 'bg-blue-900/20 border-blue-500/20',        label: 'Refund',  sign: '+' },
  DEBIT:   { color: 'text-red-400',     bg: 'bg-red-900/20 border-red-500/20',          label: 'Debit',   sign: '-' },
  HOLD:    { color: 'text-yellow-400',  bg: 'bg-yellow-900/20 border-yellow-500/20',    label: 'Held',    sign: '-' },
  FEE:     { color: 'text-gray-400',    bg: 'bg-gray-800/40 border-gray-600/20',        label: 'Fee',     sign: '-' },
};

function StatCard({ label, value, sub, icon, highlight }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`bg-cardBg border rounded-2xl p-5 space-y-3 ${highlight ? 'border-brand/30' : 'border-borderBg'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? 'bg-brand/10' : 'bg-hoverBg'}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-black ${highlight ? 'text-white' : 'text-gray-300'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt } = useCurrency();
  const [wallet, setWallet]           = useState<WalletData | null>(null);
  const [transactions, setTxns]       = useState<Transaction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [withdrawAmount, setAmount]   = useState('');
  const [method, setMethod]           = useState('bank');
  const [destination, setDest]        = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    (async () => {
      try {
        const [w, t] = await Promise.all([
          api.get<{ success: boolean; data: WalletData }>('/wallet'),
          api.get<{ success: boolean; data: Transaction[] }>('/wallet/transactions'),
        ]);
        if (w.success) setWallet(w.data);
        if (t.success) setTxns(t.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, authLoading, router]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || parseFloat(withdrawAmount) > parseFloat(wallet.balance)) {
      showToast('Amount exceeds available balance', false);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/wallet/withdraw', { amount: parseFloat(withdrawAmount), method, destination });
      showToast('Withdrawal request submitted — processed within 24–48 hrs', true);
      setShowModal(false);
      setAmount(''); setDest('');
    } catch (err: any) {
      showToast(err.message || 'Withdrawal failed', false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 py-6 fade-in">
      <div className="h-8 skeleton rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
      </div>
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 py-4 fade-in">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition ${
          toast.ok ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500/30' : 'bg-red-900/90 text-red-200 border border-red-500/30'
        }`}>
          {toast.ok ? '✓' : <AlertCircle className="w-4 h-4" />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand" /> Wallet
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage earnings and withdrawals</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-xl text-sm font-bold transition text-white shadow-lg shadow-brand/20">
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Available" value={fmt(wallet?.balance || 0)}
          sub="Ready to withdraw" icon={<DollarSign className="w-4 h-4 text-brand" />} highlight />
        <StatCard label="In Escrow" value={fmt(wallet?.lockedBalance || 0)}
          sub="Held until order complete" icon={<Lock className="w-4 h-4 text-yellow-400" />} />
        <StatCard label="Total Earned" value={fmt(wallet?.totalEarnings || 0)}
          sub="Lifetime earnings" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Withdrawn" value={fmt(wallet?.totalWithdrawn || 0)}
          sub="Total paid out" icon={<ArrowUpRight className="w-4 h-4 text-gray-400" />} />
      </div>

      {/* Transactions */}
      <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-borderBg">
          <h3 className="font-bold">Transaction History</h3>
          <span className="text-xs text-gray-500">{transactions.length} records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Wallet className="w-10 h-10 text-gray-700 mx-auto" />
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-borderBg">
            {transactions.map((t) => {
              const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.DEBIT;
              const isCredit = ['CREDIT', 'RELEASE', 'REFUND'].includes(t.type);
              return (
                <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-hoverBg/30 transition">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cfg.bg} flex-shrink-0`}>
                    {isCredit
                      ? <ArrowDownLeft className={`w-4 h-4 ${cfg.color}`} />
                      : <ArrowUpRight  className={`w-4 h-4 ${cfg.color}`} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-black ${cfg.color}`}>
                      {cfg.sign}{fmt(t.amount)}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Bal: {fmt(t.balanceAfter || 0)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg border border-borderBg rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Withdraw Funds</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-hoverBg rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-hoverBg/40 border border-borderBg rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Available balance</span>
              <span className="font-black text-lg">{fmt(wallet?.balance || 0)}</span>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)} required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand">
                  <option value="bank">Bank Transfer (NGN / GHS)</option>
                  <option value="crypto">USDT — TRC-20</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Amount (USD)</label>
                <input type="number" required min="1" step="0.01" value={withdrawAmount} onChange={e => setAmount(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Destination</label>
                <input type="text" required value={destination} onChange={e => setDest(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
                  placeholder={method === 'crypto' ? 'USDT wallet address' : 'Account number & bank name'} />
              </div>

              <div className="flex items-start gap-2 bg-background border border-borderBg rounded-xl px-4 py-3 text-xs text-gray-500">
                <Clock className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                <span>Requests are processed within 24–48 hours after security review.</span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-borderBg py-3 rounded-xl text-sm font-semibold hover:bg-hoverBg transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3 rounded-xl text-sm font-bold transition text-white disabled:opacity-50">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Request Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
