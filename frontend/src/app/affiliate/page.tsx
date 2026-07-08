'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Share2, Copy, ExternalLink, Users, MousePointerClick, TrendingUp, DollarSign, Loader2, Activity, Target, Trophy, Star, Gift, ShieldCheck } from 'lucide-react';

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

  const tierThresholds = [
    { name: 'Bronze', minTrades: 0, minEarned: 0, commissionRate: 2, icon: <Trophy className="w-4 h-4 text-[#cd7f32]" /> },
    { name: 'Silver', minTrades: 5, minEarned: 100, commissionRate: 3, icon: <Trophy className="w-4 h-4 text-[#c0c0c0]" /> },
    { name: 'Gold', minTrades: 20, minEarned: 1000, commissionRate: 4, icon: <Trophy className="w-4 h-4 text-[#ffd700]" /> },
    { name: 'Platinum', minTrades: 50, minEarned: 5000, commissionRate: 5, icon: <Trophy className="w-4 h-4 text-[#e5e4e2]" /> },
  ];

  const currentTier = tierThresholds.find(t => stats?.totalTrades >= t.minTrades && stats?.totalEarned >= t.minEarned) || tierThresholds[0];
  const nextTier = tierThresholds.find(t => t.minTrades > currentTier.minTrades && t.minEarned > currentTier.minEarned);

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
            <Share2 className="w-10 h-10 text-brand" />
          </div>
          <h1 className="text-3xl font-black text-white">Join Our Affiliate Program</h1>
          <p className="text-gray-400 text-sm">
            Earn up to 5% commission on every trade your referrals make on Velxo. Start sharing your unique link today!
          </p>
          <div className="flex flex-col gap-3">
            <a href="/auth/login" className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-white font-bold transition shadow-lg shadow-brand/20">
              Sign In to Start Earning
            </a>
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <a href="/auth/login" className="text-brand font-semibold hover:underline">Sign In</a>
            </p>
          </div>
        </div>
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
    <div className="max-w-6xl mx-auto space-y-8 my-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-white">Affiliate Dashboard</h1>
        <p className="text-gray-400 text-sm md:text-base">Earn commission on every trade your referrals make on Velxo. Your unique link: <span className="font-mono text-brand">{referral?.referralCode}</span></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <MousePointerClick className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total Clicks</p>
              <p className="text-2xl font-black text-white">{stats?.totalClicks}</p>
            </div>
          </div>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-500/10 rounded-xl">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Signups</p>
              <p className="text-2xl font-black text-white">{stats?.totalSignups}</p>
            </div>
          </div>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Completed Trades</p>
              <p className="text-2xl font-black text-white">{stats?.totalTrades}</p>
            </div>
          </div>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total Earned</p>
              <p className="text-2xl font-black text-white">${Number(stats?.totalEarned).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier System */}
      <div className="bg-gradient-to-r from-violet-900/20 to-cyan-900/20 border border-violet-500/20 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">Affiliate Tier System</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Tier */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {currentTier.icon}
              <div>
                <h4 className="text-lg font-bold text-white">{currentTier.name} Affiliate</h4>
                <p className="text-xs text-gray-400">Current commission rate: {currentTier.commissionRate}%</p>
              </div>
            </div>
            <div className="bg-cardBg/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Trades needed</span>
                <span className="text-white font-medium">{stats?.totalTrades || 0} / {currentTier.minTrades}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (stats?.totalTrades || 0) / currentTier.minTrades * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Earnings needed</span>
                <span className="text-white font-medium">${Number(stats?.totalEarned || 0).toFixed(2)} / ${currentTier.minEarned}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (Number(stats?.totalEarned || 0) / currentTier.minEarned) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Next Tier */}
          {nextTier && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {nextTier.icon}
                <div>
                  <h4 className="text-lg font-bold text-white">{nextTier.name} Affiliate</h4>
                  <p className="text-xs text-gray-400">Commission rate: {nextTier.commissionRate}%</p>
                </div>
              </div>
              <div className="bg-cardBg/50 rounded-xl p-4 space-y-2">
                <p className="text-sm text-gray-400">Reach next tier to earn higher commissions!</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Trades needed</span>
                  <span className="text-white font-medium">{nextTier.minTrades - (stats?.totalTrades || 0)} more</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Earnings needed</span>
                  <span className="text-white font-medium">${(nextTier.minEarned - Number(stats?.totalEarned || 0)).toFixed(2)} more</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Referral Code Section */}
      {referral && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-brand" />
              <h3 className="text-lg font-bold text-white">Your Referral Link</h3>
            </div>
            <button 
              onClick={copyCode} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                copied 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-brand/10 text-brand hover:bg-brand/20 border border-brand/30'
              }`}
            >
              <Copy className="w-4 h-4" /> 
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-3 overflow-x-auto">
              <p className="text-sm font-mono font-bold text-white truncate max-w-full">{referral.referralCode}</p>
            </div>
            <button 
              onClick={() => {
                if (!referral) return;
                const shareUrl = `${window.location.origin}/?ref=${referral.referralCode}`;
                navigator.clipboard.writeText(shareUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-dark rounded-xl text-sm font-bold text-white transition"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Referral History */}
      {stats && stats.referrals && stats.referrals.length > 0 && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand" />
            <h3 className="text-lg font-bold text-white">Recent Referrals</h3>
            <span className="bg-background px-2 py-0.5 rounded-full text-xs text-gray-500 border border-borderBg">
              {stats.referrals.length} referrals
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-borderBg">
                  <th className="py-3 text-gray-400 font-medium">Referred User</th>
                  <th className="py-3 text-gray-400 font-medium">Status</th>
                  <th className="py-3 text-gray-400 font-medium">Date</th>
                  <th className="py-3 text-gray-400 font-medium text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {stats.referrals.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-borderBg/50 hover:bg-hoverBg/30 transition">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {r.referredUser?.email?.[0].toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{r.referredUser?.email || 'Pending signup'}</p>
                          <p className="text-xs text-gray-500">ID: {r.referredUserId?.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        r.status === 'CONVERTED' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 text-right text-white font-bold">
                      ${Number(r.totalEarned).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-brand" />
          <h3 className="text-lg font-bold text-white">How It Works</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3 p-4 bg-hoverBg/30 rounded-xl border border-borderBg/50">
            <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-sm">1</div>
            <h4 className="text-white font-bold">Share Your Link</h4>
            <p className="text-xs text-gray-400">Share your unique referral link with friends and followers on social media, forums, and more.</p>
          </div>
          <div className="space-y-3 p-4 bg-hoverBg/30 rounded-xl border border-borderBg/50">
            <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-sm">2</div>
            <h4 className="text-white font-bold">They Sign Up</h4>
            <p className="text-xs text-gray-400">When someone signs up using your link, they become your referral and you start earning.</p>
          </div>
          <div className="space-y-3 p-4 bg-hoverBg/30 rounded-xl border border-borderBg/50">
            <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-sm">3</div>
            <h4 className="text-white font-bold">Earn Commissions</h4>
            <p className="text-xs text-gray-400">Earn 2-5% commission on every trade your referrals make. Higher tiers = higher rates!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
