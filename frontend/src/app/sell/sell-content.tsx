'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { GAME_NAMES, getGameConfig, REGIONS } from '@/lib/games';
import { useCurrency } from '@/lib/useCurrency';
import {
  Gamepad2, Package, ChevronRight, ChevronLeft,
  Check, AlertCircle, Loader2, Info,
  DollarSign, Tag, MapPin, Clock,
  Zap, ShieldCheck, Star, TrendingUp,
  Store, BadgeCheck, Layers, ArrowRight,
  MessageCircle, Image, Video, X, Upload, Play,
} from 'lucide-react';

/* ─────────────────────────── Constants ──────────────────────────────── */
const GAMES = [...GAME_NAMES, 'Other'];
const ALL_PLATFORMS = ['Android', 'iOS', 'PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Meta Quest'];

const CATEGORIES = [
  { label: 'Game Account', value: 'account', icon: Gamepad2, desc: 'Sell your full game account with all its contents' },
  { label: 'Boosting Service', value: 'boost', icon: Star, desc: 'Rank boosting, leveling, coaching and carry' },
];

const ACCOUNT_TYPES = [
  { value: 'STANDARD', label: 'Item Seller', icon: Store, desc: 'Sell game accounts and items' },
  { value: 'BOOSTER', label: 'Booster / Coach', icon: TrendingUp, desc: 'Offer rank boosting, leveling, and coaching gigs' },
  { value: 'BOTH', label: 'Both', icon: Layers, desc: 'Sell accounts and offer boosting services' },
];

/* ─────────────────────────── Wizard step labels ─────────────────────── */
// Phase A = store onboarding (steps 0-3 when new)
// Phase B = listing creation (steps 4-6)
const ONBOARDING_STEPS = ['Welcome', 'Store Info', 'Account Type', 'Ready'];
const LISTING_STEPS = ['Category', 'Details', 'Media', 'Pricing'];

/* ─────────────────────────── Progress Bar ───────────────────────────── */
interface ProgressBarProps {
  currentStep: number;   // 0-indexed within the labels array
  labels: string[];
  color?: string;
}
function ProgressBar({ currentStep, labels, color = 'bg-brand border-brand' }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {labels.map((label, i) => (
        <React.Fragment key={label}>
          <div className={`flex items-center gap-1.5 ${i < currentStep ? 'text-brand' : i === currentStep ? 'text-white' : 'text-gray-600'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
              i < currentStep
                ? 'bg-brand border-brand text-white'
                : i === currentStep
                  ? 'border-brand text-white bg-brand/10'
                  : 'border-gray-700 text-gray-600'
            }`}>
              {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="text-[11px] font-semibold hidden sm:block whitespace-nowrap">{label}</span>
          </div>
          {i < labels.length - 1 && (
            <div className={`flex-1 h-0.5 transition-all duration-300 ${i < currentStep ? 'bg-brand' : 'bg-gray-800'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─────────────────────────── Step shell ─────────────────────────────── */
function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
      {children}
    </div>
  );
}

/* ─────────────────────────── Main component ─────────────────────────── */
export default function SellPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();
  const { fmt } = useCurrency();

  /* ── auth / seller check ── */
  const [isSeller, setIsSeller] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  /* ── global UI ── */
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* ── onboarding phase (0-3) ── */
  const [onboardStep, setOnboardStep] = useState(0);

  /* ── store fields ── */
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [accountType, setAccountType] = useState<'STANDARD' | 'BOOSTER' | 'BOTH'>('STANDARD');

  /* ── listing phase (1-3, matching LISTING_STEPS) ── */
  const [listStep, setListStep] = useState(1);

  /* ── listing fields ── */
  const [category, setCategory] = useState('account');
  const [gameName, setGameName] = useState('Free Fire');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [platform, setPlatform] = useState('Android');
  const [region, setRegion] = useState('Africa');
  const [rank, setRank] = useState('');
  const [level, setLevel] = useState('');
  const [loginMethod, setLoginMethod] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('60');

  /* ── media fields ── */
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo]   = useState<string | null>(null);
  const [mediaMode, setMediaMode]           = useState<'images' | 'video'>('images');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadError, setUploadError]       = useState<string | null>(null);

  const gameCfg = getGameConfig(gameName);
  const platformOptions = gameCfg?.platforms ?? ALL_PLATFORMS;
  const rankOptions = gameCfg?.ranks ?? [];
  const loginOptions = gameCfg?.loginMethods ?? [];
  const currencyName = gameCfg?.currency.plural;
  const supportsRank = !gameCfg || gameCfg.hasRanked;

  /* ── check seller status on mount ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login?redirect=/sell'); return; }
    api.get<{ success: boolean; data: any }>('/sellers/me')
      .then(res => {
        if ((res as any).success && (res as any).data) {
          setIsSeller(true);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, [user, authLoading, router]);

  /* ── onboarding submit ── */
  const handleOnboard = async () => {
    if (!storeName.trim()) return;
    setError(null); setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>('/sellers', {
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
        accountType,
      });
      if ((res as any).success) {
        setIsSeller(true);
        updateUser({ role: 'SELLER' });
        setOnboardStep(3); // go to "Ready" confirmation
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create store. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── media upload helpers ── */
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 8 - uploadedImages.length;
    if (remaining <= 0) { setUploadError('Maximum 8 images reached.'); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploadError(null); setUploadingMedia(true);
    try {
      const token = (user as any)?.accessToken || localStorage.getItem('sb-access-token') || '';
      const results: string[] = [];
      for (const file of toUpload) {
        if (!file.type.startsWith('image/')) { setUploadError(`${file.name} is not an image.`); continue; }
        if (file.size > 8 * 1024 * 1024) { setUploadError(`${file.name} exceeds 8 MB.`); continue; }
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${API_BASE}/upload?folder=listings`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Upload failed');
        results.push(json.data.url);
      }
      setUploadedImages(prev => [...prev, ...results]);
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleVideoUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) { setUploadError('Please select a video file (mp4, mov, webm).'); return; }
    if (file.size > 100 * 1024 * 1024) { setUploadError('Video must be under 100 MB.'); return; }
    setUploadError(null); setUploadingMedia(true);
    try {
      const token = (user as any)?.accessToken || localStorage.getItem('sb-access-token') || '';
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/upload/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Video upload failed');
      setUploadedVideo(json.data.url);
    } catch (err: any) {
      setUploadError(err.message || 'Video upload failed. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeImage = (idx: number) => setUploadedImages(prev => prev.filter((_, i) => i !== idx));
  const removeVideo = () => setUploadedVideo(null);

  /* ── listing submit ── */
  const handleCreateListing = async () => {
    setError(null); setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>('/listings', {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        gameName,
        platform,
        region,
        rank: rank || undefined,
        level: level ? parseInt(level) : undefined,
        loginMethod: loginMethod || undefined,
        deliveryTime: parseInt(deliveryTime),
        categoryId: 'auto',
        images: uploadedImages,
        videos: uploadedVideo ? [uploadedVideo] : [],
      });
      if ((res as any).success) setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── loading state ── */
  if (authLoading || checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  /* ── success screen ── */
  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce-in">
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Listing Submitted!</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          Your listing is under review. Our team will approve it within 24 hours and buyers will start seeing it.
        </p>
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 text-left space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Game</span><span className="font-bold text-white">{gameName}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Title</span><span className="font-bold text-white truncate max-w-[180px]">{title}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Price</span><span className="font-bold text-brand">{fmt(parseFloat(price) || 0)}</span></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setSuccess(false); setListStep(1); setTitle(''); setDescription(''); setPrice(''); setUploadedImages([]); setUploadedVideo(null); }}
            className="px-6 py-3 bg-brand hover:bg-brand-dark rounded-xl font-bold text-white transition">
            Create Another Listing
          </button>
          <button
            onClick={() => router.push('/seller/dashboard')}
            className="px-6 py-3 bg-hoverBg/50 border border-borderBg hover:border-brand/30 rounded-xl font-bold text-white transition">
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     PHASE A — SELLER ONBOARDING WIZARD (shown when !isSeller)
     Steps: 0 = Welcome  1 = Store Info  2 = Account Type  3 = Ready!
  ══════════════════════════════════════════════════════════════════════ */
  if (!isSeller) {
    return (
      <div className="max-w-xl mx-auto py-8">

        {/* Step 0 — Welcome */}
        {onboardStep === 0 && (
          <div className="space-y-8 text-center">
            <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center mx-auto">
              <Gamepad2 className="w-10 h-10 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Become a Seller on Piyrox</h1>
              <p className="text-gray-400 mt-2 text-sm max-w-sm mx-auto">
                Join thousands of sellers earning from game accounts, coins, boosting, and more. Setup takes 2 minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {[
                { icon: ShieldCheck, color: 'text-emerald-400', title: 'Escrow Protection', desc: 'Funds are held safely until delivery confirmed' },
                { icon: TrendingUp, color: 'text-brand', title: 'Grow Your Store', desc: 'Reputation system with buyer reviews and ratings' },
                { icon: Zap, color: 'text-orange-400', title: 'Fast Payouts', desc: 'Withdraw earnings to your wallet anytime' },
                { icon: MessageCircle, color: 'text-violet-400', title: 'Direct Messaging', desc: 'Chat with buyers directly in the platform' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="bg-cardBg border border-borderBg rounded-xl p-4 flex gap-3 items-start">
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} />
                  <div>
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setOnboardStep(1)}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-4 rounded-xl font-black text-white text-base transition shadow-xl shadow-brand/20">
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-gray-600">Free to join · No hidden fees · Earn from day one</p>
          </div>
        )}

        {/* Step 1 — Store Info */}
        {onboardStep === 1 && (
          <div className="space-y-6">
            <ProgressBar currentStep={0} labels={ONBOARDING_STEPS} />

            <div className="text-center">
              <h2 className="text-2xl font-black text-white">Name Your Store</h2>
              <p className="text-gray-400 text-sm mt-1">This is how buyers will find and recognise you.</p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <StepCard>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Store Name *</label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  autoFocus
                  className={`w-full bg-background border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition ${!storeName.trim() && error ? 'border-red-500/60' : 'border-borderBg'}`}
                  placeholder="e.g. GamePro Store, Apex Coins, DiamondDeals"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">{storeName.length}/60 characters · Choose something memorable</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Store Description <span className="text-gray-500 font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  maxLength={300}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition resize-none"
                  placeholder="Tell buyers what you specialise in — game accounts, Free Fire coins, boosting…"
                  value={storeDescription}
                  onChange={e => setStoreDescription(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">{storeDescription.length}/300</p>
              </div>
            </StepCard>

            <div className="flex gap-3">
              <button onClick={() => setOnboardStep(0)}
                className="flex items-center gap-2 px-5 py-3 border border-borderBg hover:border-brand/40 rounded-xl text-gray-300 hover:text-white transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => { if (!storeName.trim()) { setError('Store name is required.'); return; } setError(null); setOnboardStep(2); }}
                disabled={!storeName.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3 rounded-xl font-bold text-white transition disabled:opacity-50">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Account Type */}
        {onboardStep === 2 && (
          <div className="space-y-6">
            <ProgressBar currentStep={1} labels={ONBOARDING_STEPS} />

            <div className="text-center">
              <h2 className="text-2xl font-black text-white">What will you sell?</h2>
              <p className="text-gray-400 text-sm mt-1">This determines which listing types you can create. You can change this later.</p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-3">
              {ACCOUNT_TYPES.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAccountType(value as any)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                    accountType === value
                      ? 'bg-brand/10 border-brand shadow-lg shadow-brand/10'
                      : 'bg-cardBg border-borderBg hover:border-brand/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accountType === value ? 'bg-brand text-white' : 'bg-background text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${accountType === value ? 'text-white' : 'text-gray-300'}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  {accountType === value && <Check className="w-5 h-5 text-brand flex-shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setOnboardStep(1)}
                className="flex items-center gap-2 px-5 py-3 border border-borderBg hover:border-brand/40 rounded-xl text-gray-300 hover:text-white transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleOnboard}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3 rounded-xl font-bold text-white transition disabled:opacity-50">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <>Create My Store <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Ready! */}
        {onboardStep === 3 && (
          <div className="space-y-8 text-center">
            <ProgressBar currentStep={3} labels={ONBOARDING_STEPS} />

            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <BadgeCheck className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">"{storeName}" is live!</h2>
              <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
                Your store is ready. Now create your first listing and start selling.
              </p>
            </div>

            <div className="bg-cardBg border border-borderBg rounded-2xl p-5 text-left space-y-3">
              <p className="text-sm font-bold text-white">Your store summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Store name</span><span className="text-white font-semibold">{storeName}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Seller type</span><span className="text-white font-semibold">{ACCOUNT_TYPES.find(t => t.value === accountType)?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-emerald-400 font-bold">Active</span></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setIsSeller(true); setListStep(1); }}
                className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition shadow-lg shadow-brand/20">
                Create First Listing <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/seller/dashboard')}
                className="flex-1 py-3.5 rounded-xl font-bold text-white border border-borderBg hover:border-brand/30 transition">
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     PHASE B — LISTING CREATION WIZARD (shown when isSeller)
     Steps: 1 = Category & Game  2 = Details  3 = Pricing & Submit
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Create a Listing</h1>
          <p className="text-gray-400 text-sm mt-1">Fill in the details to list your item for sale</p>
        </div>
      </div>

      <ProgressBar currentStep={listStep - 1} labels={LISTING_STEPS} />

      {error && (
        <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-300/60 hover:text-red-300">✕</button>
        </div>
      )}

      {/* ── Step 1: Category & Game ── */}
      {listStep === 1 && (
        <div className="space-y-5">
          <StepCard>
            <h2 className="font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-brand" /> What are you selling?</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Category *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map(({ value, label, icon: Icon, desc }) => (
                  <button key={value} type="button" onClick={() => setCategory(value)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      category === value
                        ? 'bg-brand/10 border-brand text-white'
                        : 'border-borderBg text-gray-400 hover:border-brand/30 hover:text-white'
                    }`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${category === value ? 'text-brand' : 'text-gray-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-none">{label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Game *</label>
              <select
                value={gameName}
                onChange={e => setGameName(e.target.value)}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition"
              >
                {GAMES.map(g => <option key={g}>{g}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-brand" />
                The game's official banner (set by our team) will be shown on your listing — no image upload needed.
              </p>
            </div>
          </StepCard>

          <div className="flex justify-end">
            <button onClick={() => setListStep(2)} disabled={!category || !gameName}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold text-white transition disabled:opacity-50 shadow-lg shadow-brand/10">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Details ── */}
      {listStep === 2 && (
        <div className="space-y-5">
          <StepCard>
            <h2 className="font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-brand" /> Item Details</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Title *</label>
              <input
                type="text"
                required
                maxLength={150}
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={
                  category === 'account' ? `e.g. ${gameName} Diamond Rank Account — 500+ Skins` :
                  category === 'coins'   ? `e.g. 5000 ${currencyName || 'Diamonds'} — ${gameName}` :
                  category === 'boost'   ? `e.g. ${gameName} Bronze → Diamond Boost` :
                  `e.g. ${gameName} ${category}`
                }
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/150 characters · Make it descriptive</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Description *</label>
              <textarea
                required
                rows={5}
                maxLength={2000}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={
                  category === 'account'
                    ? 'Describe the account: rank, level, skins, linked login, region, and anything else a buyer would want to know…'
                    : category === 'boost'
                    ? 'Describe the service: which ranks you cover, estimated time, what you need from the buyer…'
                    : 'Describe exactly what the buyer receives — quantity, delivery method, any requirements…'
                }
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/2000 · Clear descriptions convert better</p>
            </div>

            {/* Currency hint for coins */}
            {category === 'coins' && currencyName && (
              <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 flex items-start gap-2 text-xs text-gray-400">
                <Zap className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                <p>Selling <span className="font-semibold text-white">{currencyName}</span> for {gameName}. Include the exact amount in your title (e.g. "5000 {currencyName}").</p>
              </div>
            )}

            {/* Account-specific fields */}
            {category === 'account' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {supportsRank && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Rank <span className="text-gray-600 font-normal normal-case">(optional)</span></label>
                    <input type="text" value={rank} onChange={e => setRank(e.target.value)} list="rank-options"
                      placeholder={rankOptions.length ? rankOptions[Math.floor(rankOptions.length / 2)] : 'e.g. Diamond'}
                      className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition" />
                    {rankOptions.length > 0 && <datalist id="rank-options">{rankOptions.map(o => <option key={o} value={o} />)}</datalist>}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Level <span className="text-gray-600 font-normal normal-case">(optional)</span></label>
                  <input type="number" value={level} onChange={e => setLevel(e.target.value)} placeholder="e.g. 70"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Login Method <span className="text-gray-600 font-normal normal-case">(optional)</span></label>
                  <input type="text" value={loginMethod} onChange={e => setLoginMethod(e.target.value)} list="login-options"
                    placeholder={loginOptions.length ? loginOptions.join(', ') : 'e.g. Google, Facebook'}
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition" />
                  {loginOptions.length > 0 && <datalist id="login-options">{loginOptions.map(o => <option key={o} value={o} />)}</datalist>}
                </div>
              </div>
            )}

          </StepCard>

          <div className="flex justify-between">
            <button onClick={() => setListStep(1)}
              className="flex items-center gap-2 px-6 py-3 border border-borderBg hover:border-brand/40 rounded-xl text-gray-300 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => { setError(null); setListStep(3); }} disabled={!title.trim() || !description.trim()}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold text-white transition disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Media ── */}
      {listStep === 3 && (
        <div className="space-y-5">
          <StepCard>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-brand" /> Photos &amp; Video
              <span className="ml-auto text-xs text-gray-500 font-normal">Optional</span>
            </h2>
            <p className="text-xs text-gray-400">
              Add up to <span className="text-white font-semibold">8 screenshots</span> or <span className="text-white font-semibold">1 short video (≤30 s)</span> to show buyers what they're getting. These appear only on the listing detail page.
            </p>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setMediaMode('images'); setUploadError(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  mediaMode === 'images' ? 'bg-brand/10 border-brand text-white' : 'border-borderBg text-gray-400 hover:border-brand/30'
                }`}
              >
                <Image className="w-3.5 h-3.5" /> Images ({uploadedImages.length}/8)
              </button>
              <button
                type="button"
                onClick={() => { setMediaMode('video'); setUploadError(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  mediaMode === 'video' ? 'bg-brand/10 border-brand text-white' : 'border-borderBg text-gray-400 hover:border-brand/30'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> Video {uploadedVideo ? '(1/1)' : '(0/1)'}
              </button>
            </div>

            {uploadError && (
              <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {uploadError}
                <button onClick={() => setUploadError(null)} className="ml-auto">✕</button>
              </div>
            )}

            {/* ── Images panel ── */}
            {mediaMode === 'images' && (
              <div className="space-y-3">
                {/* Grid of uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-background border border-borderBg group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] bg-brand/80 text-white px-1.5 py-0.5 rounded font-bold">Cover</span>
                        )}
                      </div>
                    ))}
                    {/* Add more slot */}
                    {uploadedImages.length < 8 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-borderBg hover:border-brand/50 flex flex-col items-center justify-center cursor-pointer transition bg-background/50 group">
                        <Upload className="w-4 h-4 text-gray-600 group-hover:text-brand transition" />
                        <span className="text-[10px] text-gray-600 group-hover:text-brand mt-1 transition">Add</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          className="sr-only"
                          onChange={e => handleImageUpload(e.target.files)}
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* Drop zone (shown when no images yet) */}
                {uploadedImages.length === 0 && (
                  <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition ${
                    uploadingMedia ? 'border-brand/40 bg-brand/5' : 'border-borderBg hover:border-brand/50 bg-background/30'
                  }`}>
                    {uploadingMedia ? (
                      <Loader2 className="w-8 h-8 text-brand animate-spin" />
                    ) : (
                      <Image className="w-8 h-8 text-gray-600" />
                    )}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{uploadingMedia ? 'Uploading…' : 'Upload screenshots'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WebP · max 8 MB each · up to 8 files</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      disabled={uploadingMedia}
                      className="sr-only"
                      onChange={e => handleImageUpload(e.target.files)}
                    />
                  </label>
                )}

                {uploadingMedia && uploadedImages.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-brand">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                  </div>
                )}
              </div>
            )}

            {/* ── Video panel ── */}
            {mediaMode === 'video' && (
              <div className="space-y-3">
                {!uploadedVideo ? (
                  <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition ${
                    uploadingMedia ? 'border-brand/40 bg-brand/5' : 'border-borderBg hover:border-brand/50 bg-background/30'
                  }`}>
                    {uploadingMedia ? (
                      <Loader2 className="w-8 h-8 text-brand animate-spin" />
                    ) : (
                      <Video className="w-8 h-8 text-gray-600" />
                    )}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{uploadingMedia ? 'Uploading…' : 'Upload a short video'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">MP4, MOV, WebM · max 100 MB · max 30 seconds</p>
                    </div>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      disabled={uploadingMedia}
                      className="sr-only"
                      onChange={e => handleVideoUpload(e.target.files?.[0] ?? null)}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-borderBg">
                    <video src={uploadedVideo} controls className="w-full max-h-64 object-contain" />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </StepCard>

          <div className="flex justify-between">
            <button onClick={() => setListStep(2)}
              className="flex items-center gap-2 px-6 py-3 border border-borderBg hover:border-brand/40 rounded-xl text-gray-300 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => { setUploadError(null); setListStep(4); }}
              disabled={uploadingMedia}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold text-white transition disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Pricing & Submit ── */}
      {listStep === 4 && (
        <div className="space-y-5">
          <StepCard>
            <h2 className="font-bold text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-brand" /> Pricing & Delivery</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Platform *</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition">
                  {platformOptions.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Region *</label>
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition">
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Your Price *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                  <input type="number" required min="0.50" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
                    className="w-full bg-background border border-borderBg rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Delivery Time</label>
                <select value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="180">3 hours</option>
                  <option value="720">12 hours</option>
                  <option value="1440">24 hours</option>
                </select>
              </div>
            </div>
          </StepCard>

          {/* Listing preview summary */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Package className="w-4 h-4 text-brand" /> Listing Preview</h3>
            <div className="text-sm space-y-2 divide-y divide-borderBg">
              {[
                { label: 'Game', value: gameName },
                { label: 'Category', value: CATEGORIES.find(c => c.value === category)?.label },
                { label: 'Title', value: title || '—' },
                { label: 'Platform / Region', value: `${platform} · ${region}` },
                ...(category === 'account' && (rank || level || loginMethod)
                  ? [{ label: 'Account', value: [rank, level && `Lvl ${level}`, loginMethod].filter(Boolean).join(', ') }]
                  : []),
                { label: 'Delivery', value: `${deliveryTime} min` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between pt-2 first:pt-0">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-semibold truncate max-w-[180px] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings breakdown */}
          {price && parseFloat(price) > 0 && (
            <div className="bg-cardBg border border-brand/20 rounded-2xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-white">Your Earnings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Listing price</span>
                  <span className="font-bold text-white">{fmt(parseFloat(price))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform fee (10%)</span>
                  <span className="text-gray-500">−{fmt(parseFloat(price) * 0.1)}</span>
                </div>
                <div className="flex justify-between border-t border-borderBg pt-2">
                  <span className="font-bold text-white">You receive</span>
                  <span className="font-black text-brand text-xl">{fmt(parseFloat(price) * 0.9)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-violet-900/15 border border-violet-500/20 rounded-xl p-4 flex gap-3 text-xs text-gray-400">
            <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <p>Your listing goes to <span className="font-semibold text-white">Pending Review</span>. Our team approves it within 24 hours. You'll get a notification when it's live.</p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setListStep(3)}
              className="flex items-center gap-2 px-6 py-3 border border-borderBg hover:border-brand/40 rounded-xl text-gray-300 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleCreateListing}
              disabled={submitting || !title.trim() || !description.trim() || !price || parseFloat(price) < 0.5}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-8 py-3 rounded-xl font-bold text-white transition disabled:opacity-50 shadow-lg shadow-brand/20"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : <><Check className="w-4 h-4" /> Submit Listing</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
