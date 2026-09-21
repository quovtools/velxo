'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Lock, DollarSign,
  TrendingUp, Plus, X, Loader2, CreditCard, Clock, AlertCircle,
} from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

interface WalletData { balance: string; lockedBalance: string; totalEarnings: string; totalWithdrawn: string; }
interface Transaction {
  id: string; type: string; amount: string; description: string; balanceAfter: string; createdAt: string;
}

const TX_CFG: Record<string, { color: string; bg: string; sign: string; label: string }> = {
  CREDIT:  { color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   sign: '+', label: 'Credit' },
  RELEASE: { color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   sign: '+', label: 'Released' },
  REFUND:  { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     sign: '+', label: 'Refund' },
  DEBIT:   { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       sign: '-', label: 'Debit' },
  HOLD:    { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',   sign: '-', label: 'Held' },
  FEE:     { color: 'text-gray-400',   bg: 'bg-white/5 border-white/10',            sign: '-', label: 'Fee' },
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-5 shadow-2xl fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { fmt, currency, currencyCode } = useCurrency();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState('all');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Deposit form
  const [depAmount, setDepAmount] = useState('');
  const [depProvider, setDepProvider] = useState<'FLUTTERWAVE' | 'PAYMENT_IO'>('FLUTTERWAVE');
  const [depPending, setDepPending] = useState(false);

  // Withdraw form
  const [wdAmount, setWdAmount] = useState('');
  const [wdMethod, setWdMethod] = useState('bank');
  const [wdDest, setWdDest] = useState('');
  const [wdPending, setWdPending] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    Promise.all([
      api.get<{ success: boolean; data: WalletData }>('/wallet'),
      api.get<{ success: boolean; data: Transaction[] }>('/wallet/transactions'),
    ]).then(([w, t]) => {
      if (w.success) setWallet(w.data);
      if (t.success) setTxns(Array.isArray(t.data) ? t.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depAmount);
    if (!amount || amount <= 0) { showToast('Enter a valid amount', false); return; }
    setDepPending(true);
    try {
      const res = await api.post<{ data: { paymentUrl?: string } }>(
        '/wallet/topup/initiate',
        { amount, currency: currencyCode, provider: depProvider }
      );
      setShowDeposit(false); setDepAmount('');
      if (res.data?.paymentUrl) window.location.href = res.data.paymentUrl;
      else showToast('Deposit initiated — redirecting to payment...', true);
    } catch (err: any) { showToast(err.message || 'Deposit failed', false); }
    finally { setDepPending(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(wdAmount);
    if (!amount || amount <= 0) { showToast('Enter a valid amount', false); return; }
    if (wallet && amount > parseFloat(wallet.balance)) { showToast('Amount exceeds available balance', false); return; }
    setWdPending(true);
    try {
      await api.post('/wallet/withdraw', { amount, method: wdMethod, destination: wdDest });
      showToast('Withdrawal request submitted — processed within 24–48 hrs', true);
      setShowWithdraw(false); setWdAmount(''); setWdDest('');
    } catch (err: any) { showToast(err.message || 'Withdrawal failed', false); }
    finally { setWdPending(false); }
  };

  const filteredTxns = txFilter === 'all' ? txns
    : txns.filter(t => {
        if (txFilter === 'in') return ['CREDIT', 'RELEASE', 'REFUND'].includes(t.type);
        if (txFilter === 'out') return ['DEBIT', 'HOLD', 'FEE'].includes(t.type);
        return true;
      });

  if (loading) return (
    <div className="space-y-5 fade-in">
      <div className="h-8 skeleton rounded-xl w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
      </div>
      <div className="h-72 skeleton rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 fade-in pb-24 sm:pb-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border fade-in ${
          toast.ok ? 'bg-green-900/90 text-green-200 border-green-500/30' : 'bg-red-900/90 text-red-200 border-red-500/30'
        }`}>
          {toast.ok ? '✓' : <AlertCircle className="w-4 h-4" />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand" /> Wallet
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your earnings and withdrawals</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDeposit(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-green-900/30">
            <Plus className="w-4 h-4" /> Deposit
          </button>
          <button onClick={() => setShowWithdraw(true)}
            className="btn-primary rounded-xl gap-2">
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Balance', value: fmt(wallet?.balance || 0), icon: DollarSign, color: 'text-brand', bg: 'bg-brand/10 border-brand/20', highlight: true },
          { label: 'In Escrow', value: fmt(wallet?.lockedBalance || 0), icon: Lock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Total Earned', value: fmt(wallet?.totalEarnings || 0), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Total Withdrawn', value: fmt(wallet?.totalWithdrawn || 0), icon: ArrowUpRight, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' },
        ].map(({ label, value, icon: Icon, color, bg, highlight }) => (
          <div key={label} className={`rounded-2xl p-5 space-y-3 border ${highlight ? 'bg-brand/5 border-brand/20' : 'bg-[var(--card-bg)] border-[var(--border-bg)]'}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-black ${highlight ? 'text-white' : 'text-gray-300'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-bg)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-bg)]">
          <h3 className="font-black text-white">Transaction History</h3>
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'in', label: 'Credits' },
              { id: 'out', label: 'Debits' },
            ].map(t => (
              <button key={t.id} onClick={() => setTxFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  txFilter === t.id ? 'bg-brand/10 text-brand' : 'text-gray-500 hover:text-white'
                }`}>{t.label}</button>
            ))}
          </div>
        </div>

        {filteredTxns.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Wallet className="w-10 h-10 text-gray-700 mx-auto" />
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-bg)]">
            {filteredTxns.map(t => {
              const cfg = TX_CFG[t.type] || TX_CFG.DEBIT;
              const isCredit = ['CREDIT', 'RELEASE', 'REFUND'].includes(t.type);
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--hover-bg)] transition">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${cfg.bg}`}>
                    {isCredit
                      ? <ArrowDownLeft className={`w-4 h-4 ${cfg.color}`} />
                      : <ArrowUpRight className={`w-4 h-4 ${cfg.color}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-black ${cfg.color}`}>{cfg.sign}{fmt(t.amount)}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">Bal: {fmt(t.balanceAfter || 0)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <Modal title="Add Funds" onClose={() => setShowDeposit(false)}>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Quick Amount</p>
            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 25, 50, 100].map(usd => {
                const local = Math.round(usd * currency.rate);
                return (
                  <button key={usd} onClick={() => setDepAmount(String(local))}
                    className={`py-2 rounded-xl text-sm font-bold border transition ${
                      depAmount === String(local) ? 'bg-brand border-brand text-black' : 'border-[var(--border-bg)] text-gray-300 hover:border-brand/40'
                    }`}>
                    {fmt(usd)}
                  </button>
                );
              })}
            </div>
          </div>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Amount ({currencyCode})</label>
              <input type="number" required min="1" step="0.01" value={depAmount}
                onChange={e => setDepAmount(e.target.value)} className="input" placeholder="Enter amount" />
            </div>
            <div className="space-y-2">
              {([['FLUTTERWAVE', 'Card / Mobile Money', 'Via Flutterwave'], ['PAYMENT_IO', 'Crypto (USDT)', 'Via Paymento']] as const).map(([val, label, sub]) => (
                <button key={val} type="button" onClick={() => setDepProvider(val)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition ${
                    depProvider === val ? 'border-brand bg-brand/5' : 'border-[var(--border-bg)] hover:border-brand/30'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${depProvider === val ? 'border-brand' : 'border-gray-600'}`}>
                    {depProvider === val && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDeposit(false)} className="btn-secondary flex-1 rounded-xl justify-center">Cancel</button>
              <button type="submit" disabled={depPending || !depAmount}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                {depPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Deposit ${depAmount ? fmt(Number(depAmount) / currency.rate) : ''}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <Modal title="Withdraw Funds" onClose={() => setShowWithdraw(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Available balance</span>
            <span className="font-black text-lg text-white">{fmt(wallet?.balance || 0)}</span>
          </div>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Method</label>
              <select value={wdMethod} onChange={e => setWdMethod(e.target.value)} className="select">
                <option value="bank">Bank Transfer (NGN / GHS)</option>
                <option value="crypto">USDT — TRC-20</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Amount ({currencyCode})</label>
              <input type="number" required min="1" step="0.01" value={wdAmount}
                onChange={e => setWdAmount(e.target.value)} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Destination</label>
              <input type="text" required value={wdDest} onChange={e => setWdDest(e.target.value)}
                className="input" placeholder={wdMethod === 'crypto' ? 'USDT wallet address' : 'Account number & bank name'} />
            </div>
            <div className="flex items-start gap-2 bg-[var(--surface)] border border-[var(--border-bg)] rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">Requests are processed within 24–48 hours after security review.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowWithdraw(false)} className="btn-secondary flex-1 rounded-xl justify-center">Cancel</button>
              <button type="submit" disabled={wdPending}
                className="btn-primary flex-1 rounded-xl justify-center disabled:opacity-50">
                {wdPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Withdrawal'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
