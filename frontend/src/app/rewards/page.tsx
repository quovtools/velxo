'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Coins, Gift, Loader2, X, History, CheckCircle } from 'lucide-react';

interface CoinWallet {
  id: string;
  balance: number;
  currency: string;
}

interface CatalogItem {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  coinCost: number;
  imageUrl?: string | null;
  isActive: boolean;
}

interface CoinTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  GIFT_CARD: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  TOP_UP: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  ITEM: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  COUPON: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export default function RewardsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [wallet, setWallet] = useState<CoinWallet | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'catalog' | 'history'>('catalog');

  const [confirmItem, setConfirmItem] = useState<CatalogItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const [w, c, t] = await Promise.all([
        api.get<{ success: boolean; data: CoinWallet }>('/rewards/coins'),
        api.get<{ success: boolean; data: CatalogItem[] }>('/rewards/catalog'),
        api.get<{ success: boolean; data: CoinTransaction[] }>('/rewards/transactions?limit=30'),
      ]);
      if (w?.data) setWallet(w.data);
      if (c?.data) setCatalog(c.data);
      if (t?.data) setTransactions(t.data);
    } catch {
      showToast('Could not load rewards', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/rewards');
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  const redeem = async () => {
    if (!confirmItem) return;
    setRedeeming(true);
    try {
      await api.post('/rewards/redeem', { catalogId: confirmItem.id });
      showToast(`Redeemed "${confirmItem.name}" — pending fulfilment`, true);
      setConfirmItem(null);
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Redemption failed', false);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Piyrox Rewards</h1>
            <p className="text-gray-400 text-sm">Earn coins for activity, redeem them for rewards.</p>
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-bg)] px-5 py-3 flex items-center gap-3">
          <Coins className="w-6 h-6 text-brand" />
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-bold">Balance</p>
            <p className="text-xl font-black text-white leading-tight">
              {balance.toLocaleString()} <span className="text-brand text-sm">{wallet?.currency || 'VXC'}</span>
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-bg)]">
        {([
          ['catalog', 'Reward catalog', Gift],
          ['history', 'Coin history', History],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition ${
              tab === key ? 'text-brand border-brand' : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'catalog' && (
        <>
          {catalog.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">No rewards available right now — check back soon.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.map((item) => {
                const affordable = balance >= item.coinCost;
                const typeStyle = TYPE_COLORS[item.type] || 'text-gray-400 bg-white/5 border-white/10';
                return (
                  <div key={item.id} className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeStyle}`}>{item.type.replace('_', ' ')}</span>
                      <span className="flex items-center gap-1 text-brand font-black text-sm">
                        <Coins className="w-4 h-4" /> {item.coinCost.toLocaleString()}
                      </span>
                    </div>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-brand/5 border border-brand/10 flex items-center justify-center">
                        <Gift className="w-8 h-8 text-brand/50" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{item.name}</p>
                      {item.description && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.description}</p>}
                    </div>
                    <button
                      disabled={!affordable}
                      onClick={() => setConfirmItem(item)}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${
                        affordable
                          ? 'bg-brand text-black hover:opacity-90'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      {affordable ? 'Redeem' : 'Not enough coins'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">No coin activity yet.</div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-2xl divide-y divide-[var(--border-bg)]">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-black ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-500">bal {tx.balanceAfter.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Confirm modal */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-bg)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-5 shadow-2xl fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Confirm redemption</h3>
              <button onClick={() => setConfirmItem(null)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl bg-white/5 border border-[var(--border-bg)] p-4 space-y-2">
              <p className="font-bold text-white text-sm">{confirmItem.name}</p>
              <p className="text-xs text-gray-400">{confirmItem.description}</p>
              <p className="flex items-center gap-1.5 text-sm font-black text-brand pt-1">
                <Coins className="w-4 h-4" /> {confirmItem.coinCost.toLocaleString()} coins
              </p>
              <p className="text-xs text-gray-500">
                Balance after redemption: {(balance - confirmItem.coinCost).toLocaleString()} {wallet?.currency || 'VXC'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 text-gray-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={redeem}
                disabled={redeeming}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-brand text-black hover:opacity-90 transition disabled:opacity-50"
              >
                {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {redeeming ? 'Redeeming…' : 'Redeem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
