'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Share2, Copy, ExternalLink, Users, MousePointerClick, TrendingUp, DollarSign, Loader2 } from 'lucide-react';

interface AffiliateStats {
  totalClicks: number;
  totalSignups: number;
  totalTrades: number;
  totalEarned: string;
  referrals: any[];
}

export default function AffiliateDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referral, setReferral] = useState<{ id: string; referralCode: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [meRes, statsRes] = await Promise.all([
          api.get<{ data: { id: string; referralCode: string } }>('/affiliate/me'),
          api.get<{ data: AffiliateStats }>('/affiliate/me/stats'),
        ]);
        setReferral(meRes.data);
        setStats(statsRes.data);
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
        <p className="text-gray-400 font-semibold">Please sign in to view your affiliate dashboard.</p>
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
    <div className="max-w-5xl mx-auto space-y-8 my-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white">Affiliate Dashboard</h1>
        <p className="text-gray-400 text-sm">Earn commission on every trade your referrals make on Velxo.</p>
      </div>

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
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
            <MousePointerClick className="w-5 h-5 text-[#06B6D4] mb-1" />
            <p className="text-3xl font-black text-white">{stats.totalClicks}</p>
            <p className="text-xs text-gray-500 font-medium">Total Clicks</p>
          </div>
          <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
            <Users className="w-5 h-5 text-[#8B5CF6] mb-1" />
            <p className="text-3xl font-black text-white">{stats.totalSignups}</p>
            <p className="text-xs text-gray-500 font-medium">Signups</p>
          </div>
          <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
            <p className="text-3xl font-black text-white">{stats.totalTrades}</p>
            <p className="text-xs text-gray-500 font-medium">Completed Trades</p>
          </div>
          <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
            <DollarSign className="w-5 h-5 text-yellow-400 mb-1" />
            <p className="text-3xl font-black text-white">${Number(stats.totalEarned).toFixed(2)}</p>
            <p className="text-xs text-gray-500 font-medium">Total Earned</p>
          </div>
        </div>
      )}

      {stats && stats.referrals.length > 0 && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Recent Referrals</h3>
          <div className="space-y-3">
            {stats.referrals.slice(0, 10).map((r) => (
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
  );
}
