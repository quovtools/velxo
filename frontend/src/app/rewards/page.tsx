'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Award, Users, TrendingUp, Coins, Gift, Trophy, Loader2, Copy, DollarSign, MousePointerClick } from 'lucide-react';

interface AffiliateStats {
  totalClicks: number;
  totalSignups: number;
  totalTrades: number;
  totalEarned: string;
  referrals: any[];
}

interface RewardTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  relatedId?: string;
}

export default function RewardsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'affiliate' | 'velxo-coins' | 'redeem'>('overview');
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [referral, setReferral] = useState<{ id: string; referralCode: string } | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [meRes, statsRes, coinsRes, txRes] = await Promise.all([
          api.get<{ data: { id: string; referralCode: string } }>('/affiliate/me').catch(() => ({ data: null })),
          api.get<{ data: AffiliateStats }>('/affiliate/me/stats').catch(() => ({ data: null })),
          api.get<{ data: { coinBalance: number } }>('/rewards/coins').catch(() => ({ data: { coinBalance: 0 } })),
          api.get<{ data: RewardTransaction[] }>('/rewards/transactions').catch(() => ({ data: [] })),
        ]);
        setReferral(meRes.data);
        setAffiliateStats(statsRes.data);
        setCoinBalance(coinsRes.data?.coinBalance || 0);
        setTransactions(txRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  function copyCode() {
    if (!referral) return;
    const url = `${window.location.origin}/?ref=${referral.referralCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!user) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-400 font-semibold">Please sign in to view your rewards.</p>
        <a href="/auth/login" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-white font-bold transition">Sign In</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 my-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Award className="w-8 h-8 text-brand" />
          Rewards Center
        </h1>
        <p className="text-gray-400 text-sm">Earn Velxo Coins, affiliate commissions, and exclusive perks.</p>
      </div>

      {/* Coin Balance Card */}
      <div className="bg-gradient-to-r from-brand/20 to-brand/5 border border-brand/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-brand uppercase tracking-wider">Your Velxo Coin Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{coinBalance.toLocaleString()}</span>
            <span className="text-sm font-bold text-brand">VXC</span>
          </div>
          <p className="text-xs text-gray-400">Earn coins on every purchase and sale</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-brand hover:bg-brand-dark rounded-xl text-xs font-bold text-white transition">Redeem Coins</button>
          <button className="px-4 py-2 bg-background border border-borderBg hover:border-brand/40 rounded-xl text-xs font-bold text-gray-300 transition">How to Earn</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-borderBg">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'affiliate', label: 'Affiliate' },
          { key: 'velxo-coins', label: 'Velxo Coins' },
          { key: 'redeem', label: 'Redeem' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-bold transition border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-brand border-brand'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
              <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
              <p className="text-3xl font-black text-white">{coinBalance.toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-medium">Velxo Coins</p>
            </div>
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
              <DollarSign className="w-5 h-5 text-emerald-400 mb-1" />
              <p className="text-3xl font-black text-white">${Number(affiliateStats?.totalEarned || 0).toFixed(2)}</p>
              <p className="text-xs text-gray-500 font-medium">Affiliate Earnings</p>
            </div>
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
              <Gift className="w-5 h-5 text-purple-400 mb-1" />
              <p className="text-3xl font-black text-white">0</p>
              <p className="text-xs text-gray-500 font-medium">Rewards Claimed</p>
            </div>
          </div>
        )}

        {activeTab === 'affiliate' && (
          <div className="space-y-6">
            {referral && (
              <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Referral Code</p>
                  <button onClick={copyCode} className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-light transition">
                    <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-3">
                    <p className="text-sm font-mono font-bold text-white truncate">{referral.referralCode}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Share your link and earn 2% commission on every trade your referrals make.</p>
              </div>
            )}

            {affiliateStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
                  <MousePointerClick className="w-5 h-5 text-[#06B6D4] mb-1" />
                  <p className="text-3xl font-black text-white">{affiliateStats.totalClicks}</p>
                  <p className="text-xs text-gray-500 font-medium">Total Clicks</p>
                </div>
                <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
                  <Users className="w-5 h-5 text-[#8B5CF6] mb-1" />
                  <p className="text-3xl font-black text-white">{affiliateStats.totalSignups}</p>
                  <p className="text-xs text-gray-500 font-medium">Signups</p>
                </div>
                <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
                  <p className="text-3xl font-black text-white">{affiliateStats.totalTrades}</p>
                  <p className="text-xs text-gray-500 font-medium">Completed Trades</p>
                </div>
                <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
                  <DollarSign className="w-5 h-5 text-yellow-400 mb-1" />
                  <p className="text-3xl font-black text-white">${Number(affiliateStats.totalEarned).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 font-medium">Total Earned</p>
                </div>
              </div>
            )}

            {affiliateStats && affiliateStats.referrals.length > 0 && (
              <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Recent Referrals</h3>
                <div className="space-y-3">
                  {affiliateStats.referrals.slice(0, 10).map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-borderBg last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-white">{r.referredUser?.email || 'Pending signup'}</p>
                        <p className="text-xs text-gray-600">Joined {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400">${Number(r.totalEarned).toFixed(2)}</p>
                        <p className="text-xs text-gray-600">{r.tradeCount} trades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'velxo-coins' && (
          <div className="space-y-4">
            <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                How to Earn Velxo Coins
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-white">Complete a Purchase</p>
                  <p className="text-xs text-gray-400">Earn 1 coin for every $1 spent</p>
                </div>
                <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-white">Make a Sale</p>
                  <p className="text-xs text-gray-400">Earn 2 coins for every $1 earned</p>
                </div>
                <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-white">Refer Friends</p>
                  <p className="text-xs text-gray-400">Earn 50 coins for each successful referral</p>
                </div>
                <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-white">Leave Reviews</p>
                  <p className="text-xs text-gray-400">Earn 10 coins per review</p>
                </div>
              </div>
            </div>

            <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Recent Coin Activity</h3>
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-500">No coin transactions yet. Start trading to earn coins!</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-borderBg last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-white">{tx.description}</p>
                        <p className="text-xs text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'CREDIT' ? '+' : '-'}{tx.amount.toLocaleString()} VXC
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'redeem' && (
          <div className="space-y-4">
            <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Redeem Your Coins</h3>
              <p className="text-sm text-gray-400">Your current balance: <span className="text-brand font-bold">{coinBalance.toLocaleString()} VXC</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2 text-center">
                  <Gift className="w-8 h-8 text-brand mx-auto" />
                  <p className="text-sm font-bold text-white">Gift Cards</p>
                  <p className="text-xs text-gray-400">From 500 VXC</p>
                </div>
                <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2 text-center">
                  <Coins className="w-8 h-8 text-yellow-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Account Top-Up</p>
                  <p className="text-xs text-gray-400">From 100 VXC</p>
                </div>
                <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2 text-center">
                  <Trophy className="w-8 h-8 text-purple-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Exclusive Items</p>
                  <p className="text-xs text-gray-400">From 1000 VXC</p>
                </div>
              </div>
              <button className="w-full py-3 bg-brand hover:bg-brand-dark rounded-xl text-sm font-bold text-white transition">Browse Rewards Catalog</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
