'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import {
  Share2, Copy, Users, TrendingUp, DollarSign, Loader2,
  Trophy, Star, Crown, CheckCircle, ChevronRight,
  AlertCircle, Youtube, Twitter, Instagram, Twitch, Globe,
  ArrowRight, Sparkles, Award,
  MousePointerClick, Activity, Target, Gamepad2, Flame,
} from 'lucide-react';

interface AffiliateStats {
  totalClicks: number;
  totalSignups: number;
  totalTrades: number;
  totalEarned: number;
  totalSignupRewards: number;
  tierInfo: TierInfo;
  isCreator: boolean;
  referrals: any[];
  recentSignupRewards: any[];
}

interface TierInfo {
  current: string;
  rewardPerSignup: number;
  nextTier: string | null;
  signupsToNext: number | null;
  nextReward: number | null;
}

interface CreatorProfile {
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
}

interface ReferralRecord {
  id: string;
  referralCode: string;
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: Flame },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter },
  { value: 'twitch', label: 'Twitch', icon: Twitch },
  { value: 'other', label: 'Other', icon: Globe },
];

const TIER_COLORS: Record<string, string> = {
  STARTER: 'text-gray-400',
  RISING: 'text-blue-400',
  ELITE: 'text-yellow-400',
  BASIC: 'text-gray-400',
  ACTIVE: 'text-cyan-400',
  POWER: 'text-purple-400',
};

const TIER_BG: Record<string, string> = {
  STARTER: 'bg-gray-500/10 border-gray-500/20',
  RISING: 'bg-blue-500/10 border-blue-500/20',
  ELITE: 'bg-yellow-500/10 border-yellow-500/20',
  BASIC: 'bg-gray-500/10 border-gray-500/20',
  ACTIVE: 'bg-cyan-500/10 border-cyan-500/20',
  POWER: 'bg-purple-500/10 border-purple-500/20',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  SUSPENDED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

// ─── Creator Registration Modal ──────────────────────────────────────────────
function CreatorRegisterModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (profile: CreatorProfile) => void;
}) {
  const [platform, setPlatform] = useState('');
  const [handle, setHandle] = useState('');
  const [followerCount, setFollowerCount] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!platform) { setError('Please select your platform'); return; }
    const fc = parseInt(followerCount, 10);
    if (isNaN(fc) || fc < 10000) {
      setError('You need at least 10,000 followers to apply as a creator');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post<{ data: CreatorProfile }>('/affiliate/creator/register', {
        platform, handle: handle || undefined, followerCount: fc, bio: bio || undefined,
      });
      onSuccess(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-cardBg border border-borderBg rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand/10 rounded-xl"><Crown className="w-6 h-6 text-brand" /></div>
          <div>
            <h2 className="text-xl font-black text-white">Become a Creator</h2>
            <p className="text-xs text-gray-400">No new account needed — register with your existing one</p>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Main Platform *</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <button key={p.value} type="button" onClick={() => setPlatform(p.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition ${
                      platform === p.value ? 'bg-brand/20 border-brand text-white' : 'border-borderBg text-gray-400 hover:border-brand/40 hover:text-white'
                    }`}>
                    <Icon className="w-5 h-5" />{p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Your Handle / Channel Name</label>
            <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@yourchannel"
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Follower / Subscriber Count *</label>
            <input type="number" value={followerCount} onChange={e => setFollowerCount(e.target.value)}
              placeholder="e.g. 15000" min={0}
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
            <p className="text-xs text-gray-500 mt-1">Minimum 10,000 followers required</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Short Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about your content..."
              rows={3}
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-borderBg text-gray-300 hover:bg-hoverBg rounded-xl text-sm font-bold transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Crown className="w-4 h-4" /> Apply Now</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AffiliateDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referral, setReferral] = useState<ReferralRecord | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'user' | 'creator'>('user');
  const [showCreatorModal, setShowCreatorModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.get<{ data: ReferralRecord }>('/affiliate/me').catch(() => ({ data: null })),
      api.get<{ data: AffiliateStats }>('/affiliate/me/stats').catch(() => ({ data: null })),
      api.get<{ data: CreatorProfile | null }>('/affiliate/creator/me').catch(() => ({ data: null })),
    ]).then(([meRes, statsRes, creatorRes]) => {
      setReferral((meRes as any).data);
      setStats((statsRes as any).data);
      setCreatorProfile((creatorRes as any).data);
      if ((statsRes as any).data?.isCreator) setTab('creator');
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  function copyLink() {
    if (!referral) return;
    const url = `${window.location.origin}/?ref=${referral.referralCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!user) return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
          <Share2 className="w-10 h-10 text-brand" />
        </div>
        <h1 className="text-3xl font-black text-white">Velxo Affiliate Program</h1>
        <p className="text-gray-400 text-sm">Earn rewards for every signup and trade. Creators earn even more — 20% of Velxo's profit, free Premium, and tournament slots.</p>
        <a href="/auth/login" className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl text-white font-bold transition shadow-lg shadow-brand/20">
          Sign In to Start Earning
        </a>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-10 h-10 text-brand animate-spin" />
    </div>
  );

  const tierInfo = stats?.tierInfo;
  const signupsToNext = tierInfo?.signupsToNext ?? 0;
  const nextTier = tierInfo?.nextTier;
  const maxSignups = nextTier && tierInfo ? (tierInfo.signupsToNext ?? 0) + (stats?.totalSignups ?? 0) : stats?.totalSignups ?? 0;
  const progressPct = maxSignups > 0 && nextTier ? Math.min(100, ((stats?.totalSignups ?? 0) / maxSignups) * 100) : 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6 my-4 pb-4">
      {showCreatorModal && (
        <CreatorRegisterModal
          onClose={() => setShowCreatorModal(false)}
          onSuccess={(profile) => {
            setCreatorProfile(profile);
            setShowCreatorModal(false);
          }}
        />
      )}

      {/* ── Header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-black text-white">Affiliate</h1>
          {stats?.isCreator && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full text-xs font-bold text-yellow-400">
              <Crown className="w-3.5 h-3.5" /> Creator
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm">Earn rewards for every referral. Creators unlock bigger perks.</p>
      </div>

      {/* ── Referral Link Card ── */}
      {referral && (
        <div className="bg-gradient-to-r from-brand/15 to-purple-900/15 border border-brand/25 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-brand" />
              <h3 className="text-base font-bold text-white">Your Referral Link</h3>
            </div>
            <button onClick={copyLink}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-brand/10 text-brand hover:bg-brand/20 border border-brand/20'
              }`}>
              <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <div className="bg-background border border-borderBg rounded-xl px-4 py-3 overflow-hidden">
            <p className="text-sm font-mono font-bold text-white truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referral.referralCode}` : `velxo.shop/?ref=${referral.referralCode}`}
            </p>
          </div>
          <p className="text-xs text-gray-500">Share this link. Anyone who signs up through it becomes your referral.</p>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-cardBg border border-borderBg rounded-2xl p-4 space-y-1">
          <MousePointerClick className="w-4 h-4 text-cyan-400 mb-1" />
          <p className="text-2xl font-black text-white">{stats?.totalClicks ?? 0}</p>
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Clicks</p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-4 space-y-1">
          <Users className="w-4 h-4 text-violet-400 mb-1" />
          <p className="text-2xl font-black text-white">{stats?.totalSignups ?? 0}</p>
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Signups</p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-4 space-y-1">
          <TrendingUp className="w-4 h-4 text-emerald-400 mb-1" />
          <p className="text-2xl font-black text-white">{stats?.totalTrades ?? 0}</p>
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Trades</p>
        </div>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-4 space-y-1">
          <DollarSign className="w-4 h-4 text-amber-400 mb-1" />
          <p className="text-2xl font-black text-white">₦{(stats?.totalSignupRewards ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Signup Rewards</p>
        </div>
      </div>

      {/* ── Tab Switch: User / Creator ── */}
      <div className="flex gap-2 p-1 bg-cardBg border border-borderBg rounded-xl">
        <button onClick={() => setTab('user')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
            tab === 'user' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'
          }`}>
          <Users className="w-4 h-4" /> User Rewards
        </button>
        <button onClick={() => setTab('creator')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
            tab === 'creator' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black' : 'text-gray-400 hover:text-white'
          }`}>
          <Crown className="w-4 h-4" /> Creator Program
          {stats?.isCreator && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        </button>
      </div>

      {/* ════════════════════════════════ USER TAB ════════════════════════════ */}
      {tab === 'user' && (
        <div className="space-y-5">
          {/* Tier Card */}
          {tierInfo && !stats?.isCreator && (
            <div className={`rounded-2xl border p-5 space-y-4 ${TIER_BG[tierInfo.current] || 'bg-cardBg border-borderBg'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className={`w-6 h-6 ${TIER_COLORS[tierInfo.current] || 'text-gray-400'}`} />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Current Tier</p>
                    <h3 className={`text-xl font-black ${TIER_COLORS[tierInfo.current] || 'text-white'}`}>{tierInfo.current}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Per Signup</p>
                  <p className="text-2xl font-black text-white">₦{tierInfo.rewardPerSignup}</p>
                </div>
              </div>
              {nextTier && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Progress to {nextTier}</span>
                    <span>{stats?.totalSignups ?? 0} / {(stats?.totalSignups ?? 0) + signupsToNext} signups</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">{signupsToNext} more signups → ₦{tierInfo.nextReward} per signup</p>
                </div>
              )}
            </div>
          )}

          {/* Tiers Info */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2"><Target className="w-4 h-4 text-brand" /> User Tier Rewards</h3>
            <div className="space-y-2">
              {[
                { tier: 'BASIC', label: '0 – 99 signups', reward: '₦10 / signup', color: 'text-gray-400' },
                { tier: 'ACTIVE', label: '100 – 999 signups', reward: '₦15 / signup', color: 'text-cyan-400' },
                { tier: 'POWER', label: '1,000+ signups', reward: '₦30 / signup', color: 'text-purple-400' },
              ].map(t => (
                <div key={t.tier} className={`flex items-center justify-between p-3 rounded-xl border ${
                  tierInfo?.current === t.tier && !stats?.isCreator ? 'bg-brand/10 border-brand/30' : 'bg-hoverBg/20 border-borderBg/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <Trophy className={`w-4 h-4 ${t.color}`} />
                    <div>
                      <p className={`text-sm font-bold ${t.color}`}>{t.tier}</p>
                      <p className="text-xs text-gray-500">{t.label}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-white">{t.reward}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Rewards are paid in NGN directly to your Velxo wallet on each successful signup.</p>
          </div>

          {/* Want More? Creator CTA */}
          {!stats?.isCreator && !creatorProfile && (
            <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Crown className="w-10 h-10 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-base font-bold text-white">Want to earn 5× more?</p>
                <p className="text-xs text-gray-400">Creators with 10k+ followers get ₦10–₦50 per signup, 20% commission on trades, free Seller Premium, and tournament slots.</p>
              </div>
              <button onClick={() => setTab('creator')}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl text-sm transition hover:opacity-90">
                Become a Creator <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════ CREATOR TAB ════════════════════════ */}
      {tab === 'creator' && (
        <div className="space-y-5">
          {/* Creator Status Card */}
          {creatorProfile ? (
            <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-500/10 rounded-xl"><Crown className="w-7 h-7 text-yellow-400" /></div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Creator Account</p>
                    <h3 className="text-xl font-black text-white">{creatorProfile.handle || user.firstName}</h3>
                    <p className="text-xs text-gray-400 capitalize">{creatorProfile.platform} · {creatorProfile.followerCount.toLocaleString()} followers</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[creatorProfile.status] || ''}`}>
                  {creatorProfile.status}
                </span>
              </div>

              {creatorProfile.status === 'PENDING' && (
                <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Application Under Review</p>
                    <p className="text-xs text-gray-400 mt-0.5">Our team will review your application within 2–3 business days. You'll be notified when it's approved.</p>
                  </div>
                </div>
              )}
              {creatorProfile.status === 'REJECTED' && (
                <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Application Rejected</p>
                    {creatorProfile.rejectionReason && <p className="text-xs text-gray-400 mt-0.5">{creatorProfile.rejectionReason}</p>}
                    <p className="text-xs text-gray-500 mt-1">You can update your details and reapply.</p>
                  </div>
                </div>
              )}
              {creatorProfile.status === 'APPROVED' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${creatorProfile.hasFreePremium ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                    <Star className={`w-5 h-5 ${creatorProfile.hasFreePremium ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <div>
                      <p className="text-xs font-bold text-white">Seller Premium</p>
                      <p className={`text-xs ${creatorProfile.hasFreePremium ? 'text-emerald-400' : 'text-gray-500'}`}>{creatorProfile.hasFreePremium ? 'Active (Free)' : 'Not granted'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${creatorProfile.hasTournamentSlot ? 'bg-purple-500/10 border-purple-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                    <Gamepad2 className={`w-5 h-5 ${creatorProfile.hasTournamentSlot ? 'text-purple-400' : 'text-gray-500'}`} />
                    <div>
                      <p className="text-xs font-bold text-white">Tournament Slot</p>
                      <p className={`text-xs ${creatorProfile.hasTournamentSlot ? 'text-purple-400' : 'text-gray-500'}`}>{creatorProfile.hasTournamentSlot ? 'Top Slot Active' : 'Not granted'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-brand/10 border-brand/20">
                    <Sparkles className="w-5 h-5 text-brand" />
                    <div>
                      <p className="text-xs font-bold text-white">Creator Badge</p>
                      <p className="text-xs text-brand">Visible on profile</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* No creator profile yet — show the benefits and apply CTA */
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-yellow-900/20 via-amber-900/15 to-brand/10 border border-yellow-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h3 className="text-xl font-black text-white">Creator Program</h3>
                    <p className="text-xs text-gray-400">For content creators with 10k+ followers</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Star, color: 'text-yellow-400 bg-yellow-500/10', title: 'Free Seller Premium', desc: 'Get free access to Seller Premium once approved' },
                    { icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10', title: '20% Commission', desc: '20% of Velxo\'s profit on every trade from your referrals' },
                    { icon: Users, color: 'text-cyan-400 bg-cyan-500/10', title: '₦10–₦50 Per Signup', desc: 'Higher per-signup rewards than regular users' },
                    { icon: Gamepad2, color: 'text-purple-400 bg-purple-500/10', title: 'Tournament Priority', desc: 'Top slot at Velxo Weekly (BloodStrike & Free Fire)' },
                    { icon: Crown, color: 'text-brand bg-brand/10', title: 'Creator Badge', desc: 'Verified Creator badge visible on your profile' },
                    { icon: TrendingUp, color: 'text-pink-400 bg-pink-500/10', title: 'Tier Bonuses', desc: '₦25/signup at Rising, ₦50/signup at Elite tier' },
                  ].map((b, i) => {
                    const Icon = b.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-hoverBg/30 rounded-xl border border-borderBg/50">
                        <div className={`p-2 rounded-lg ${b.color}`}><Icon className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-bold text-white">{b.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{b.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setShowCreatorModal(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:opacity-90 text-black font-black rounded-xl text-sm transition flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5" /> Apply to Creator Program
                </button>
                <p className="text-center text-xs text-gray-500">Requires 10,000+ followers. No new account needed.</p>
              </div>
            </div>
          )}

          {/* Creator Tiers */}
          {(creatorProfile?.status === 'APPROVED' || !creatorProfile) && (
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Creator Tiers</h3>
              <div className="space-y-2">
                {[
                  { tier: 'STARTER', label: '0 – 99 referral signups', reward: '₦10 / signup', commission: '20% of Velxo profit', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
                  { tier: 'RISING', label: '100 – 999 referral signups', reward: '₦25 / signup', commission: '20% of Velxo profit', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  { tier: 'ELITE', label: '1,000+ referral signups', reward: '₦50 / signup', commission: '20% of Velxo profit', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                ].map(t => {
                  const isCurrent = stats?.isCreator && tierInfo?.current === t.tier;
                  return (
                    <div key={t.tier} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border ${isCurrent ? 'bg-brand/10 border-brand/30' : `${t.bg}`}`}>
                      <div className="flex items-center gap-3">
                        <Crown className={`w-4 h-4 ${t.color}`} />
                        <div>
                          <p className={`text-sm font-bold ${t.color}`}>{t.tier}</p>
                          <p className="text-xs text-gray-500">{t.label}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-right sm:text-left">
                        <div>
                          <p className="text-[11px] text-gray-500">Per Signup</p>
                          <p className="text-sm font-black text-white">{t.reward}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">Trade Commission</p>
                          <p className="text-sm font-black text-emerald-400">{t.commission}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Referral History ── */}
      {stats && stats.referrals && stats.referrals.filter((r: any) => r.referredUserId).length > 0 && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand" />
            <h3 className="text-base font-bold text-white">Recent Referrals</h3>
            <span className="bg-background px-2 py-0.5 rounded-full text-xs text-gray-500 border border-borderBg">
              {stats.referrals.filter((r: any) => r.referredUserId).length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-borderBg">
                  <th className="py-2.5 text-xs text-gray-400 font-medium">Referred</th>
                  <th className="py-2.5 text-xs text-gray-400 font-medium">Status</th>
                  <th className="py-2.5 text-xs text-gray-400 font-medium">Joined</th>
                  <th className="py-2.5 text-xs text-gray-400 font-medium text-right">Commission</th>
                </tr>
              </thead>
              <tbody>
                {stats.referrals.filter((r: any) => r.referredUserId).slice(0, 15).map((r: any) => (
                  <tr key={r.id} className="border-b border-borderBg/50 hover:bg-hoverBg/20">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-brand to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          {r.referredUser?.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-xs text-gray-300 truncate max-w-[120px]">{r.referredUser?.email || '—'}</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        r.status === 'CONVERTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>{r.status}</span>
                    </td>
                    <td className="py-2.5 text-xs text-gray-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2.5 text-right text-xs font-bold text-white">₦{Number(r.totalEarned).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tournament Banner ── */}
      <div className="bg-gradient-to-r from-purple-900/30 to-red-900/20 border border-purple-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="p-3 bg-purple-500/10 rounded-xl flex-shrink-0">
          <Gamepad2 className="w-7 h-7 text-purple-400" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-base font-bold text-white">Velxo Weekly Tournament</h3>
          <p className="text-xs text-gray-400">Approved creators get a top slot in our weekly BloodStrike & Free Fire tournaments. Regular users can also participate — more details coming soon.</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] font-bold text-red-400">Free Fire</span>
            <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] font-bold text-blue-400">BloodStrike</span>
          </div>
        </div>
        {stats?.isCreator && creatorProfile?.hasTournamentSlot ? (
          <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400 flex-shrink-0 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Slot Active
          </span>
        ) : !creatorProfile ? (
          <button onClick={() => setTab('creator')}
            className="flex-shrink-0 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-400 transition flex items-center gap-1.5">
            Apply as Creator <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* ── How It Works ── */}
      <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2"><Target className="w-4 h-4 text-brand" /> How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share Your Link', desc: 'Copy your unique referral link and share it on social media, forums, WhatsApp — anywhere.' },
            { step: '2', title: 'They Sign Up', desc: 'When someone joins Velxo through your link, they become your referral instantly.' },
            { step: '3', title: 'Earn Rewards', desc: 'Get ₦10–₦50 per signup (wallet credited immediately) plus commission on every trade.' },
          ].map(s => (
            <div key={s.step} className="space-y-3 p-4 bg-hoverBg/20 rounded-xl border border-borderBg/50">
              <div className="w-9 h-9 bg-brand/10 rounded-full flex items-center justify-center text-brand font-black text-sm">{s.step}</div>
              <p className="text-sm font-bold text-white">{s.title}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
