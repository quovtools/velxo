'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  Award, Check, Copy, Share2, ExternalLink, Loader2, Lock, Sparkles,
  Store as StoreIcon, Zap, ShieldCheck, Crown, CheckCircle,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationMonths: number;
  storeEnabled: boolean;
  featuredAllowed: boolean;
  commissionRate: number;
  features: string[];
}
interface MySub {
  sellerId: string;
  tier: string;
  planName: string;
  isPro: boolean;
  commissionRate: number;
  storeEnabled: boolean;
  featuredAllowed: boolean;
  features: string[];
  storeSlug: string | null;
  storeUrl: string | null;
  liveStore: boolean;
  isVerified: boolean;
  kycStatus: string;
  subscriptionEndsAt: string | null;
  subscription: { id: string; plan: string; status: string; endsAt: string } | null;
}

function SellerProPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [mine, setMine] = useState<MySub | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const flash = (text: string, ok = true) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3200);
  };

  const loadPlans = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Plan[] }>('/sellers/subscription/plans');
      if (res.success) setPlans(res.data);
    } catch {}
  }, []);

  const loadMine = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: MySub }>('/sellers/subscription/me');
      if (res.success) setMine(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/seller/pro');
      return;
    }
    (async () => {
      setLoading(true);
      await Promise.all([loadPlans(), loadMine()]);
      setLoading(false);
    })();
  }, [authLoading, user, router, loadPlans, loadMine]);

  // When returning from the payment gateway, poll the subscription status
  // until it flips to ACTIVE (the IPN may arrive a few seconds later).
  const checkoutId = searchParams.get('checkout');
  useEffect(() => {
    if (!checkoutId || !user) return;
    let attempts = 0;
    const iv = setInterval(async () => {
      attempts += 1;
      const before = mine?.subscription?.status;
      await loadMine();
      const after = (await api.get<{ success: boolean; data: MySub }>('/sellers/subscription/me')).data?.subscription?.status;
      if (after === 'ACTIVE' || after === 'EXPIRED' || attempts >= 20) {
        clearInterval(iv);
        if (after === 'ACTIVE') flash('Seller Pro activated! Your store is now live.', true);
        router.replace('/seller/pro');
      }
    }, 3000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutId, user]);

  const subscribe = async (planId: string) => {
    setBusyPlan(planId);
    try {
      const res = await api.post<{ success: boolean; data: { subscriptionId: string; paymentUrl: string | null; configured: boolean; sandbox: boolean } }>(
        '/sellers/subscription/checkout',
        { plan: planId, provider: 'PAYMENT_IO' },
      );
      if (res.success) {
        if (res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
          return;
        }
        // Sandbox / no-gateway mode: subscription already activated.
        flash(res.data.sandbox ? 'Seller Pro activated (sandbox mode).' : 'Subscription created.', true);
        await loadMine();
      }
    } catch (e: any) {
      flash(e?.message || 'Could not start subscription', false);
    } finally {
      setBusyPlan(null);
    }
  };

  const copyLink = async () => {
    if (!mine?.storeUrl) return;
    try {
      await navigator.clipboard.writeText(mine.storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const shareLink = async () => {
    if (!mine?.storeUrl) return;
    try {
      if (navigator.share) await navigator.share({ title: 'My Velxo store', url: mine.storeUrl });
      else await copyLink();
    } catch {}
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  const isPro = mine?.isPro;
  const storePath = mine?.storeSlug ? `/store/${mine.storeSlug}` : mine?.sellerId ? `/store/${mine.sellerId}` : null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-white">
          <Crown className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Seller Pro</h1>
          <p className="text-gray-400 text-sm">Launch a public, shareable store and pay less per sale.</p>
        </div>
      </div>

      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${toast.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {toast.text}
        </div>
      )}

      {/* Current status */}
      <div className={`rounded-3xl border p-6 ${isPro ? 'border-purple-500/40 bg-purple-500/10' : 'border-borderBg bg-cardBg'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${isPro ? 'bg-gradient-to-br from-brand to-purple-600' : 'bg-white/10'}`}>
            {isPro ? <Award className="w-7 h-7" /> : <StoreIcon className="w-7 h-7 text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white">{mine?.planName || 'Free'}</h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isPro ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                {isPro ? 'Active' : 'Free tier'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              {isPro
                ? `Commission: ${(mine!.commissionRate * 100).toFixed(0)}% · Renews ${mine?.subscriptionEndsAt ? new Date(mine.subscriptionEndsAt).toLocaleDateString() : '—'}`
                : `Commission: ${(mine?.commissionRate ?? 0.1) * 100}% · No public store`}
            </p>
          </div>
        </div>

        {/* Store link */}
        <div className="mt-5 rounded-2xl bg-background border border-borderBg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-brand" /> Shareable store link
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isPro && mine?.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
              {isPro && mine?.isVerified ? 'Live' : 'Locked'}
            </span>
          </div>
          {isPro && mine?.isVerified ? (
            <>
              <div className="flex items-center gap-2 bg-cardBg border border-borderBg rounded-xl px-3 py-2.5">
                <span className="text-xs text-gray-300 truncate flex-1">{mine.storeUrl || `${origin}${storePath}`}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-xl text-sm font-bold text-white transition">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy link'}
                </button>
                <button onClick={shareLink} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                {storePath && (
                  <Link href={storePath} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition">
                    <ExternalLink className="w-4 h-4" /> Preview
                  </Link>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Share this link anywhere — buyers can browse and buy from your live store without logging in.</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              {!mine?.isVerified
                ? 'Verify your identity first, then subscribe to Seller Pro to unlock your public store link.'
                : 'Subscribe to Seller Pro below to turn this link on.'}{' '}
              {!mine?.isVerified && (
                <Link href="/seller/kyc" className="text-brand hover:underline">Start verification</Link>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Verification gate */}
      {!mine?.isVerified && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-bold text-sm">Identity verification required</p>
            <p className="text-gray-300 text-xs mt-1">Only verified sellers can subscribe to Seller Pro and run a public store. Complete KYC to continue.</p>
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand" /> Choose your plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const current = mine?.tier === plan.id;
            const featured = plan.id === 'PRO';
            return (
              <div key={plan.id} className={`relative rounded-3xl border p-6 flex flex-col ${featured ? 'border-brand/50 bg-gradient-to-b from-brand/10 to-cardBg' : 'border-borderBg bg-cardBg'}`}>
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full bg-brand text-white">Most Popular</span>
                )}
                <div className="flex items-center gap-2">
                  {plan.id === 'PREMIUM' ? <Crown className="w-5 h-5 text-yellow-400" /> : plan.id === 'PRO' ? <Award className="w-5 h-5 text-purple-400" /> : <StoreIcon className="w-5 h-5 text-gray-400" />}
                  <h3 className="text-lg font-black text-white">{plan.name}</h3>
                </div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-black text-white">${plan.price}</span>
                  <span className="text-gray-400 text-sm mb-1">/{plan.durationMonths > 0 ? 'mo' : 'forever'}</span>
                </div>
                <p className="text-brand text-xs font-bold mt-1">{(plan.commissionRate * 100).toFixed(0)}% escrow commission</p>

                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={current || busyPlan === plan.id || !mine?.isVerified}
                  onClick={() => subscribe(plan.id)}
                  className={`mt-5 w-full py-3 rounded-xl text-sm font-bold transition ${
                    current
                      ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                      : featured
                      ? 'bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {busyPlan === plan.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : current ? 'Current plan' : plan.id === 'FREE' ? 'Free by default' : 'Subscribe'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FeatureCard icon={<StoreIcon className="w-6 h-6 text-brand" />} title="Public store link" desc="A live storefront you can share anywhere — no login required for buyers." />
        <FeatureCard icon={<Zap className="w-6 h-6 text-brand" />} title="Lower fees" desc="Seller Pro cuts your escrow commission from 10% down to 5% (3% on Premium)." />
        <FeatureCard icon={<ShieldCheck className="w-6 h-6 text-brand" />} title="Verified badge" desc="A trusted 'Seller Pro' badge and priority placement in search." />
      </div>

      <p className="text-center text-xs text-gray-600">
        Subscriptions are billed via crypto (Paymento) and auto-expire at the end of the period. You can cancel anytime from your dashboard.
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-cardBg border border-borderBg rounded-2xl p-5">
      <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-3">{icon}</div>
      <p className="font-bold text-white text-sm">{title}</p>
      <p className="text-gray-400 text-xs mt-1">{desc}</p>
    </div>
  );
}

export default function Page() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 text-brand animate-spin" /></div>}>
      <SellerProPage />
    </React.Suspense>
  );
}
