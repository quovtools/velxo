'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, Gamepad2, Flame, PlusCircle,
  ShieldCheck, X, Zap, Lock, Check, ArrowRight, Award, Clock,
  MessageSquarePlus, DollarSign, MapPin, ChevronDown, ChevronUp,
  TrendingUp, Star, Layers, Send, AlertTriangle, BadgeCheck,
  ChevronLeft, ChevronRight, Tag, Timer, Shield, Flag,
} from 'lucide-react';
import GameSlideshow from '@/components/GameSlideshow';
import GameIcon from '@/components/GameIcon';
import HorizontalScroll from '@/components/HorizontalScroll';
import { storeReferralCode, trackReferralClick } from '@/lib/referral';
import { GAME_LIST } from '@/lib/games';
import { useCurrency } from '@/lib/useCurrency';
import { useAuth } from '@/app/providers';

/* ─────────────────────────── Types ──────────────────────────────────── */
interface Listing {
  id: string;
  title: string;
  price: string;
  gameName: string;
  gameSlug?: string;
  platform: string;
  region: string;
  rank: string;
  isFeatured: boolean;
  isSold: boolean;
  status: string;
  images?: string[];
  seller: { storeName: string; averageRating: number; id?: string; isVerified?: boolean };
}

interface GameBanner {
  gameName: string;
  gameSlug: string;
  bannerUrl: string;
  color?: string;
}

interface BuyerRequest {
  id: string;
  gameName: string;
  title: string;
  description: string;
  budget?: string;
  currency?: string;
  region?: string;
  platform?: string;
  rank?: string;
  createdAt: string;
  buyer: { id: string; firstName: string; lastName: string; avatarUrl?: string };
}

const GAMES = GAME_LIST.map((g) => ({ name: g.name, slug: g.slug, color: g.color }));
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1');

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

/* ─────────────────────────── useBanners hook ────────────────────────── */
function useBanners() {
  const [banners, setBanners] = useState<Record<string, GameBanner>>({});
  useEffect(() => {
    fetch(`${API_BASE}/game-banners`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const map: Record<string, GameBanner> = {};
        (d.data || []).forEach((b: GameBanner) => { map[b.gameName] = b; });
        setBanners(map);
      })
      .catch(() => {});
  }, []);
  return banners;
}

/* ─────────────────────────── Skeleton card ─────────────────────────── */
function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`flex-shrink-0 ${wide ? 'w-64' : 'w-52'} bg-cardBg border border-borderBg rounded-2xl overflow-hidden animate-pulse`}>
      <div className="h-36 bg-gray-700/50" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-700 rounded w-4/5" />
        <div className="flex justify-between mt-2">
          <div className="h-5 bg-gray-700 rounded w-16" />
          <div className="h-7 bg-gray-700 rounded-lg w-20" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Listing Card ───────────────────────────── */
// Uses the admin-uploaded game banner as the card image.
// Falls back to game-colored gradient if no banner is set.
function ListingCardH({ item, banner }: { item: Listing; banner?: GameBanner }) {
  const { fmt } = useCurrency();
  const sold = item.isSold || item.status === 'SOLD';
  const accentColor = banner?.color ?? '#6366f1';

  return (
    <Link
      href={`/listings/${item.id}`}
      className="flex-shrink-0 w-52 bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-0.5 group"
    >
      {/* Banner image (game-level, not per-listing) */}
      <div
        className="h-32 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accentColor}33, var(--color-background))` }}
      >
        {banner?.bannerUrl ? (
          <Image
            src={banner.bannerUrl}
            alt={item.gameName}
            fill
            sizes="208px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GameIcon game={item.gameSlug ?? item.gameName.toLowerCase().replace(/\s+/g, '-')} className="w-10 h-10 opacity-60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        {item.isFeatured && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-1.5 py-0.5 rounded-full">
            <Flame className="w-2.5 h-2.5" /> Hot
          </span>
        )}
        {sold && (
          <span className="absolute top-2 left-2 bg-black/60 text-gray-200 text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">Sold</span>
        )}
        {item.rank && (
          <span className="absolute bottom-2 left-2 text-[9px] font-semibold text-white/90 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {item.rank}
          </span>
        )}
        {item.platform && (
          <span className="absolute bottom-2 right-2 text-[9px] font-semibold text-white/80 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {item.platform}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <span
            className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide truncate max-w-full mb-1"
            style={{ color: accentColor, background: `${accentColor}1a`, borderColor: `${accentColor}33` }}
          >
            {item.gameName}
          </span>
          <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition">
            {item.title}
          </h3>
          {item.seller?.isVerified && (
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 mt-0.5">
              <ShieldCheck className="w-2.5 h-2.5" /> Verified Seller
            </span>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-borderBg pt-2">
          <span className="text-base font-black text-white">{fmt(item.price)}</span>
          <span className="bg-gradient-to-r from-brand to-brand-dark px-2.5 py-1 rounded-lg text-[10px] font-bold text-white">Buy</span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────── Game Banner Cards ─────────────────────────────── */
// Large clickable banner cards for each game — shown below the slideshow.
function GameBannerCards({ onSelectGame, banners }: {
  onSelectGame: (name: string) => void;
  banners: Record<string, GameBanner>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand" /> Browse by Game
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {GAMES.map(game => {
          const banner = banners[game.name];
          const color = banner?.color ?? game.color ?? '#6366f1';
          return (
            <button
              key={game.slug}
              onClick={() => onSelectGame(game.name)}
              className="relative rounded-2xl overflow-hidden border border-borderBg hover:border-brand/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group aspect-video flex items-end"
              style={{ background: `linear-gradient(135deg, ${color}44, var(--color-background))` }}
            >
              {banner?.bannerUrl ? (
                <Image
                  src={banner.bannerUrl}
                  alt={game.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <GameIcon game={game.slug} className="w-12 h-12 opacity-70" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="relative z-10 w-full text-left px-3 pb-2.5 text-xs font-extrabold text-white leading-tight group-hover:text-brand transition">
                {game.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────── Anti-External Contact Banner ──────────────────── */
function ExternalContactWarningBanner() {
  return (
    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-300 leading-relaxed">
        <span className="font-bold">All transactions must be completed through PIYROX.</span>{' '}
        External deals are not protected and may result in account suspension.
        Sharing phone numbers, emails, Discord, Telegram handles, or URLs is strictly prohibited.
      </p>
    </div>
  );
}

/* ─────────────────── Client-side content filter ─────────────────────── */
const EXTERNAL_PATTERNS = [
  { label: 'phone number',        re: /(\+?\d[\d\s\-().]{6,}\d)/g },
  { label: 'email address',       re: /[a-zA-Z0-9._%+\-]+\s*@\s*[a-zA-Z0-9.\-]+\s*\.\s*[a-zA-Z]{2,}/g },
  { label: 'Discord tag',         re: /\b\w{2,32}#\d{4}\b|discord\.gg\/\S+/gi },
  { label: 'Telegram handle',     re: /@[a-zA-Z0-9_]{4,}|t\.me\/\S+|telegram\.me\/\S+/gi },
  { label: 'WhatsApp contact',    re: /whatsapp|wa\.me\/\S+/gi },
  { label: 'external URL',        re: /https?:\/\/[^\s]+|www\.[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}/gi },
  { label: 'social media handle', re: /\b(instagram|insta|ig|facebook|fb|twitter|snapchat|snap|tiktok)\s*[:/]?\s*@?\s*\w{3,}/gi },
];
function detectViolations(text: string): string[] {
  return EXTERNAL_PATTERNS.filter(({ re }) => { re.lastIndex = 0; return re.test(text); })
    .map(({ label }) => label);
}

/* ─────────────────── Item type / delivery / verification constants ──── */
const ITEM_TYPES = [
  { value: 'ACCOUNT',  label: 'Game Account',     icon: Gamepad2 },
  { value: 'CURRENCY', label: 'In-Game Currency',  icon: DollarSign },
  { value: 'BOOSTING', label: 'Boosting / Rank',   icon: TrendingUp },
  { value: 'ITEM',     label: 'Item / Skin',        icon: Tag },
  { value: 'OTHER',    label: 'Other',              icon: Layers },
];
const DELIVERY_OPTIONS = [
  { value: 'WITHIN_1_HOUR',   label: 'Within 1 hour' },
  { value: 'WITHIN_24_HOURS', label: 'Within 24 hours' },
  { value: 'WITHIN_3_DAYS',   label: 'Within 3 days' },
  { value: 'WITHIN_7_DAYS',   label: 'Within 7 days' },
  { value: 'FLEXIBLE',        label: 'Flexible' },
];
const VERIFICATION_LEVELS = [
  { value: 'NONE',           label: 'Any seller' },
  { value: 'PHONE',          label: 'Phone verified' },
  { value: 'ID',             label: 'ID verified' },
  { value: 'FULLY_VERIFIED', label: 'Fully verified' },
];

/* ─────────────────── Buyer Request Post Form ────────────────────────── */
function PostRequestModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('piyrox_token') : null;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    gameName: GAME_LIST[0]?.name ?? '',
    itemType: 'ACCOUNT',
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    currency: 'NGN',
    region: '',
    platform: '',
    rank: '',
    deliveryTimeframe: 'FLEXIBLE',
    requiredVerificationLevel: 'NONE',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    setViolations(detectViolations(`${form.title} ${form.description}`));
  }, [form.title, form.description]);

  const descLen = form.description.trim().length;
  const descValid = descLen >= 50 && descLen <= 500;
  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!descValid) { setError('Description must be 50–500 characters.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/buyer-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          gameName: form.gameName,
          gameSlug: GAME_LIST.find(g => g.name === form.gameName)?.slug,
          title: form.title, description: form.description,
          itemType: form.itemType,
          budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : undefined,
          currency: form.currency, region: form.region || undefined,
          platform: form.platform || undefined, rank: form.rank || undefined,
          deliveryTimeframe: form.deliveryTimeframe,
          requiredVerificationLevel: form.requiredVerificationLevel,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to post request');
      onSuccess();
    } catch (e: any) { setError(e.message || 'Failed to post request'); }
    finally { setSubmitting(false); }
  };

  const STEP_LABELS = ['Type & Game', 'Details & Budget', 'Review'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-cardBg border border-borderBg rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-borderBg">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-brand" /> Post a Buying Request
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        {/* Step tabs */}
        <div className="flex border-b border-borderBg">
          {STEP_LABELS.map((label, i) => (
            <button key={label} onClick={() => i + 1 < step && setStep(i + 1)}
              className={`flex-1 py-2.5 text-[11px] font-semibold transition border-b-2 ${step === i + 1 ? 'border-brand text-brand' : step > i + 1 ? 'border-emerald-500/50 text-emerald-400 cursor-pointer' : 'border-transparent text-gray-600 cursor-default'}`}>
              <span className="mr-1">{i + 1}.</span>{label}
            </button>
          ))}
        </div>
        <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
          <ExternalContactWarningBanner />
          {error && (
            <div className="bg-red-900/30 border border-red-500/40 text-red-300 text-xs px-3 py-2 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {violations.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-xs px-3 py-2 rounded-xl flex items-start gap-2">
              <Flag className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              External contact detected ({violations.join(', ')}). Remove it or your request will be flagged and you may be suspended.
            </div>
          )}
          {/* Step 1: Type + Game */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">What are you looking for? *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ITEM_TYPES.map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => set('itemType', value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-semibold transition ${form.itemType === value ? 'bg-brand/10 border-brand text-white' : 'bg-background border-borderBg text-gray-400 hover:border-brand/30 hover:text-white'}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${form.itemType === value ? 'text-brand' : 'text-gray-500'}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Game *</label>
                <select value={form.gameName} onChange={e => set('gameName', e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                  {GAME_LIST.map(g => <option key={g.slug} value={g.name}>{g.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Platform</label>
                  <select value={form.platform} onChange={e => set('platform', e.target.value)}
                    className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                    <option value="">Any</option>
                    {['Android','iOS','PC','PlayStation','Xbox'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Region</label>
                  <select value={form.region} onChange={e => set('region', e.target.value)}
                    className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                    <option value="">Any</option>
                    {['Africa','Europe','North America','Asia','Middle East','Global'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          {/* Step 2: Details + Budget */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Title *</label>
                <input maxLength={120} placeholder="e.g. Looking for Diamond rank Free Fire account"
                  value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition" />
                <p className="text-[10px] text-gray-600 mt-1">{form.title.length}/120</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Description * <span className="text-gray-600 normal-case">(50–500 chars)</span>
                </label>
                <textarea rows={4} maxLength={500}
                  placeholder="Describe what you need. Do NOT include phone numbers, emails, Discord, Telegram, or any external links."
                  value={form.description} onChange={e => set('description', e.target.value)}
                  className={`w-full bg-background border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition resize-none ${form.description && !descValid ? 'border-red-500/60 focus:border-red-500' : 'border-borderBg focus:border-brand'}`} />
                <p className={`text-[10px] mt-1 ${descLen < 50 ? 'text-amber-400' : descLen > 500 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {descLen}/500{descLen < 50 ? ` (${50 - descLen} more needed)` : ''}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Budget Range</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="number" min="0" placeholder="Min" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)}
                      className="w-full bg-background border border-borderBg rounded-xl pl-8 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition" />
                  </div>
                  <span className="text-gray-600 text-xs">to</span>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="number" min="0" placeholder="Max" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)}
                      className="w-full bg-background border border-borderBg rounded-xl pl-8 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition" />
                  </div>
                  <select value={form.currency} onChange={e => set('currency', e.target.value)}
                    className="bg-background border border-borderBg rounded-xl px-2 py-2.5 text-sm text-white focus:outline-none focus:border-brand w-20">
                    {['NGN','USD','GHS','KES','ZAR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1"><Timer className="w-3 h-3" /> Delivery Timeframe</label>
                  <select value={form.deliveryTimeframe} onChange={e => set('deliveryTimeframe', e.target.value)}
                    className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                    {DELIVERY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3" /> Seller Verification</label>
                  <select value={form.requiredVerificationLevel} onChange={e => set('requiredVerificationLevel', e.target.value)}
                    className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition">
                    {VERIFICATION_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              {form.itemType === 'BOOSTING' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Target Rank (optional)</label>
                  <input placeholder="e.g. Diamond, Heroic" value={form.rank} onChange={e => set('rank', e.target.value)}
                    className="w-full bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition" />
                </div>
              )}
            </div>
          )}
          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Review your request before posting. Matching sellers will be notified.</p>
              <div className="bg-background border border-borderBg rounded-xl p-4 space-y-2">
                {([['Game', form.gameName], ['Type', ITEM_TYPES.find(t => t.value === form.itemType)?.label],
                  ['Title', form.title], ['Budget', form.budgetMin || form.budgetMax ? `${form.budgetMin || '0'} – ${form.budgetMax || '∞'} ${form.currency}` : 'Not specified'],
                  ['Delivery', DELIVERY_OPTIONS.find(o => o.value === form.deliveryTimeframe)?.label],
                  ['Verification', VERIFICATION_LEVELS.find(v => v.value === form.requiredVerificationLevel)?.label],
                  ...(form.region ? [['Region', form.region]] : []),
                  ...(form.platform ? [['Platform', form.platform]] : []),
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-gray-500 text-xs">{label}</span>
                    <span className="text-white text-xs font-medium text-right">{val}</span>
                  </div>
                ))}
              </div>
              <div className="bg-background border border-borderBg rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Description</p>
                <p className="text-xs text-gray-300 leading-relaxed">{form.description}</p>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-borderBg">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-400 hover:text-white border border-borderBg hover:border-brand/30 rounded-xl transition">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < 3 && (
            <button type="button" className="flex-1 flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold py-2.5 rounded-xl transition"
              onClick={() => {
                if (step === 2 && (!form.title.trim() || !descValid)) { setError(!form.title.trim() ? 'Title is required.' : 'Description must be 50–500 characters.'); return; }
                setError(''); setStep(s => s + 1);
              }}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === 3 && (
            <button type="button" disabled={submitting || !descValid} onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-50">
              <Send className="w-4 h-4" />{submitting ? 'Posting…' : 'Post Request'}
            </button>
          )}
          {step === 1 && (
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition">Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Buyer Requests Section ─────────────────────────── */
function BuyerRequestsSection({ onPostClick }: { onPostClick: () => void }) {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { fmt } = useCurrency();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/buyer-requests?limit=10`);
      const d = await res.json();
      setRequests(d.data?.items || []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const visible = expanded ? requests : requests.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-violet-400" /> Buyer Requests
          <span className="text-xs text-gray-500 bg-background px-2 py-0.5 rounded-full border border-borderBg">
            {loading ? '…' : requests.length}
          </span>
        </h2>
        <button onClick={onPostClick}
          className="flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-light transition">
          <PlusCircle className="w-3.5 h-3.5" /> Post Request
        </button>
      </div>

      {/* Platform protection notice */}
      <ExternalContactWarningBanner />

      {loading ? (
        <div className="space-y-2">
          {[0,1,2].map(i => <div key={i} className="h-20 bg-cardBg border border-borderBg rounded-xl animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-cardBg border border-borderBg border-dashed rounded-xl p-8 text-center space-y-2">
          <MessageSquarePlus className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-gray-400 text-sm">No buyer requests yet.</p>
          <p className="text-gray-500 text-xs">Post what you're looking for — sellers will reach out.</p>
          <button onClick={onPostClick} className="mt-2 text-xs font-bold text-brand hover:text-brand-light transition">
            Post the first request →
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map(req => {
              const name = [req.buyer?.firstName, req.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer';
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <div key={req.id} className="bg-cardBg border border-borderBg hover:border-violet-500/30 rounded-xl p-4 flex items-start gap-3 transition group">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-xs font-extrabold text-white group-hover:text-violet-300 transition truncate">{req.title}</span>
                      <span className="text-[9px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">{req.gameName}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">{req.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                      {req.budget && <span className="flex items-center gap-0.5 text-emerald-400 font-bold"><DollarSign className="w-3 h-3" />{fmt(req.budget)}</span>}
                      {req.region && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{req.region}</span>}
                      {req.platform && <span>{req.platform}</span>}
                      {req.rank && <span className="text-yellow-400">{req.rank}</span>}
                      <span className="ml-auto">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {requests.length > 3 && (
            <button onClick={() => setExpanded(e => !e)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition py-2 border border-dashed border-borderBg rounded-xl hover:border-brand/30">
              {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> View all {requests.length} requests</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────── Featured Listings Section ──────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-2.5 h-2.5 ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
      ))}
      <span className="text-[9px] text-gray-400 ml-0.5">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
    </span>
  );
}

function FeaturedListingCard({ item, banner }: { item: Listing; banner?: GameBanner }) {
  const { fmt } = useCurrency();
  const accentColor = banner?.color ?? '#8b5cf6';
  const isVerified = item.seller?.isVerified;
  const sellerLevel = (item.seller as any)?.sellerLevel as string | undefined;
  const levelColors: Record<string, string> = { BRONZE: 'text-amber-600', SILVER: 'text-gray-300', GOLD: 'text-yellow-400', ELITE: 'text-purple-400' };

  return (
    <Link href={`/listings/${item.id}`}
      className="group bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-40 overflow-hidden" style={{ background: `linear-gradient(135deg, ${accentColor}33, var(--color-background))` }}>
        {banner?.bannerUrl ? (
          <Image src={banner.bannerUrl} alt={item.gameName} fill sizes="(max-width:640px) 100vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <GameIcon game={item.gameSlug ?? item.gameName.toLowerCase().replace(/\s+/g,'-')} className="w-14 h-14 opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        {/* Featured badge */}
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-0.5 rounded-full shadow">
          <Flame className="w-3 h-3" /> Featured
        </span>
        {item.rank && (
          <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold text-white/90 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {item.rank}
          </span>
        )}
        {item.platform && (
          <span className="absolute bottom-2.5 right-2.5 text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {item.platform}
          </span>
        )}
      </div>
      {/* Body */}
      <div className="p-3.5 flex-1 flex flex-col gap-2">
        {/* Game tag + item type */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide"
            style={{ color: accentColor, background: `${accentColor}1a`, borderColor: `${accentColor}33` }}>
            {item.gameName}
          </span>
        </div>
        {/* Title */}
        <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition">
          {item.title}
        </h3>
        {/* Seller info */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
              {isVerified && <BadgeCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
              <span className="truncate">{item.seller?.storeName || 'Seller'}</span>
              {sellerLevel && <span className={`text-[9px] font-bold ml-1 ${levelColors[sellerLevel] ?? ''}`}>{sellerLevel}</span>}
            </p>
            <StarRating rating={item.seller?.averageRating ?? 0} />
          </div>
        </div>
        {/* Price row */}
        <div className="flex items-center justify-between border-t border-borderBg pt-2.5 mt-1">
          <span className="text-lg font-black text-white">{fmt(item.price)}</span>
          <span className="flex items-center gap-1 bg-gradient-to-r from-brand to-brand-dark px-3 py-1.5 rounded-xl text-[11px] font-bold text-white shadow-sm shadow-brand/20">
            View Details <ArrowRight className="w-3 h-3" />
          </span>
        </div>
        {/* Trust badge */}
        {isVerified && (
          <div className="flex items-center gap-1.5 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[10px] text-emerald-400 font-semibold">Verified Seller · Buyer Protected</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function FeaturedListingCardSkeleton() {
  return (
    <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-800/50" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3 bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-700 rounded w-4/5" />
        <div className="h-4 bg-gray-700 rounded w-3/5" />
        <div className="h-8 bg-gray-700 rounded-xl mt-3" />
      </div>
    </div>
  );
}

function FeaturedListingsSection({ banners }: { banners: Record<string, GameBanner> }) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/listings/featured?limit=8`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  // Mobile carousel helpers
  const mobileItems = items.slice(carouselIdx, carouselIdx + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" /> Featured Listings
        </h2>
        <div className="flex items-center gap-2">
          {/* Mobile carousel controls */}
          {items.length > 1 && (
            <div className="flex items-center gap-1 sm:hidden">
              <button onClick={() => setCarouselIdx(i => Math.max(0, i - 1))} disabled={carouselIdx === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-cardBg border border-borderBg text-gray-400 hover:text-white disabled:opacity-30 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-gray-500">{carouselIdx + 1}/{items.length}</span>
              <button onClick={() => setCarouselIdx(i => Math.min(items.length - 1, i + 1))} disabled={carouselIdx >= items.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-cardBg border border-borderBg text-gray-400 hover:text-white disabled:opacity-30 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <Link href="/?featured=true" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Mobile: horizontal scroll carousel */}
      <div className="sm:hidden">
        {loading ? (
          <FeaturedListingCardSkeleton />
        ) : (
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-3" style={{ width: `${items.length * 280}px` }}>
              {items.map(item => (
                <div key={item.id} style={{ width: 268 }} className="flex-shrink-0">
                  <FeaturedListingCard item={item} banner={banners[item.gameName]} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tablet: 2-column grid */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <FeaturedListingCardSkeleton key={i} />)
          : items.slice(0, 4).map(item => (
            <FeaturedListingCard key={item.id} item={item} banner={banners[item.gameName]} />
          ))}
      </div>

      {/* Desktop: 4-column grid */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <FeaturedListingCardSkeleton key={i} />)
          : items.slice(0, 8).map(item => (
            <FeaturedListingCard key={item.id} item={item} banner={banners[item.gameName]} />
          ))}
      </div>
    </div>
  );
}

/* ─────────────────── All/Filtered Listings Section ──────────────────── */
function ListingsScrollSection({ listings, loading, title, total, icon, banners }: {
  listings: Listing[]; loading: boolean; title: string; total: number;
  icon?: React.ReactNode; banners: Record<string, GameBanner>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-base font-bold text-white">{title}</span>
          <span className="text-xs text-gray-500 bg-background px-2 py-0.5 rounded-full border border-borderBg">
            {loading ? '…' : total}
          </span>
        </div>
        <Link href="/listings" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <HorizontalScroll>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : listings.length === 0
            ? (
              <div className="flex-1 text-center py-10 text-gray-500 text-sm">
                No listings found. Be the first to{' '}
                <Link href="/sell" className="text-brand font-bold hover:underline">list one</Link>.
              </div>
            )
            : listings.map(item => <ListingCardH key={item.id} item={item} banner={banners[item.gameName]} />)
        }
      </HorizontalScroll>
    </div>
  );
}

/* ─────────────────── GIG Services Section ──────────────────────────── */
function GigServicesSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { fmt } = useCurrency();

  useEffect(() => {
    fetch(`${API_BASE}/gigs`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" /> GIG Services
        </h2>
        <Link href="/boosting" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <HorizontalScroll>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} wide />)
          : items.slice(0, 16).map(g => (
            <Link key={g.id} href="/boosting"
              className="flex-shrink-0 w-60 bg-cardBg border border-borderBg hover:border-purple-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5 group">
              <div className="h-32 bg-gradient-to-br from-purple-600/30 to-background relative overflow-hidden flex items-center justify-center">
                {g.imageUrl ? (
                  <Image src={g.imageUrl} alt={g.title} fill sizes="240px" className="object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" unoptimized />
                ) : (
                  <Gamepad2 className="w-8 h-8 text-purple-400/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-purple-500 text-white px-1.5 py-0.5 rounded">{g.accountType || 'Boost'}</span>
                {g.deliveryTime && (
                  <span className="absolute bottom-2 right-2 flex items-center gap-0.5 text-[9px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    <Clock className="w-2.5 h-2.5" /> {g.deliveryTime}h
                  </span>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <span className="text-[9px] text-purple-300 font-bold uppercase">{g.gameName}</span>
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition mt-0.5">{g.title}</h3>
                  {(g.rankFrom || g.rankTo) && <p className="text-[10px] text-purple-400 font-semibold mt-1">{g.rankFrom || '?'} → {g.rankTo || '?'}</p>}
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />{g.seller?.storeName || 'piyrox seller'}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-borderBg pt-2">
                  <span className="text-base font-black text-white">{fmt(g.price)}</span>
                  <span className="bg-gradient-to-r from-purple-600 to-brand px-2.5 py-1 rounded-lg text-[10px] font-bold text-white">Hire</span>
                </div>
              </div>
            </Link>
          ))}
      </HorizontalScroll>
    </div>
  );
}

/* ─────────────────── Top Up Deals Section ───────────────────────────── */
function TopUpDealsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { fmt } = useCurrency();

  useEffect(() => {
    fetch(`${API_BASE}/topups`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand" /> Top Up Deals
        </h2>
        <Link href="/topups" className="text-xs font-medium text-brand hover:text-brand-light flex items-center gap-1 transition">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <HorizontalScroll>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.slice(0, 16).map(t => (
            <Link key={t.id} href="/topups"
              className="flex-shrink-0 w-48 bg-cardBg border border-borderBg hover:border-brand/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-0.5 group">
              <div className="h-28 bg-gradient-to-br from-brand/30 to-background relative overflow-hidden flex items-center justify-center">
                {t.imageUrl ? (
                  <Image src={t.imageUrl} alt={t.title} fill sizes="192px" className="object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" unoptimized />
                ) : (
                  <Zap className="w-8 h-8 text-brand/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-brand text-white px-1.5 py-0.5 rounded">Official</span>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <span className="text-[9px] text-brand font-bold uppercase">{t.gameName}</span>
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition mt-0.5">{t.title}</h3>
                  {t.deliveryInfo && (
                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> {t.deliveryInfo}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-borderBg pt-2">
                  <span className="text-base font-black text-brand-light">{fmt(t.price)}</span>
                  <span className="bg-gradient-to-r from-brand to-purple-600 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white">Buy</span>
                </div>
              </div>
            </Link>
          ))}
      </HorizontalScroll>
    </div>
  );
}

/* ─────────────────── Trust Badges ───────────────────────────────────── */
function TrustBadges() {
  const badges = [
    { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, label: 'Buyer Protection' },
    { icon: <Lock className="w-4 h-4 text-violet-400" />, label: 'Escrow Protected' },
    { icon: <Check className="w-4 h-4 text-purple-400" />, label: 'Verified Sellers' },
    { icon: <Zap className="w-4 h-4 text-orange-400" />, label: 'Fast Delivery' },
    { icon: <Star className="w-4 h-4 text-yellow-400" />, label: 'Rated Marketplace' },
    { icon: <TrendingUp className="w-4 h-4 text-brand" />, label: 'AI Dispute Resolution' },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
      {badges.map(({ icon, label }) => (
        <div key={label} className="flex items-center gap-2 bg-hoverBg/30 px-3 py-1.5 rounded-xl border border-borderBg/50 text-xs text-gray-400">
          {icon} <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────── Game Tab Bar ───────────────────────────────────── */
function GameTabBar({ activeGame, onSelect, banners }: {
  activeGame: string;
  onSelect: (name: string) => void;
  banners: Record<string, GameBanner>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      <button
        onClick={() => onSelect('')}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition ${activeGame === '' ? 'bg-brand border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white hover:border-brand/30'}`}
      >
        <Gamepad2 className="w-3.5 h-3.5" /> All Games
      </button>
      {GAMES.map(g => {
        const color = banners[g.name]?.color ?? g.color ?? '#6366f1';
        const isActive = activeGame === g.name;
        return (
          <button
            key={g.slug}
            onClick={() => onSelect(isActive ? '' : g.name)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${isActive ? 'border-brand text-white' : 'bg-cardBg border-borderBg text-gray-400 hover:text-white hover:border-brand/30'}`}
            style={isActive ? { background: `${color}33`, borderColor: color } : undefined}
          >
            <GameIcon game={g.slug} className="w-5 h-5 rounded-md" />
            {g.name}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────── Main Marketplace Content ───────────────────────── */
function MarketplaceContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const banners = useBanners();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestKey, setRequestKey] = useState(0); // bump to re-fetch requests

  const [search, setSearch] = useState(searchParams.get('query') || '');
  const [activeGame, setActiveGame] = useState(searchParams.get('game') || '');
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');

  // Capture affiliate referral code
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) { storeReferralCode(ref); trackReferralClick(ref); }
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (activeGame) params.append('gameName', activeGame);
      if (platform) params.append('platform', platform);
      if (region) params.append('region', region);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort === 'price_asc') params.append('sortBy', 'price_low');
      else if (sort === 'price_desc') params.append('sortBy', 'price_high');
      else if (sort === 'rating') params.append('sortBy', 'rating');
      params.append('limit', '40');
      const res = await fetch(`${API_BASE}/listings?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setListings(result.data?.listings || []);
        setTotal(result.data?.total || result.data?.listings?.length || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, activeGame, platform, region, category, minPrice, maxPrice, sort]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  function clearFilters() {
    setSearch(''); setActiveGame(''); setPlatform('');
    setRegion(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setSort('newest');
  }

  const hasFilters = !!(search || activeGame || platform || region || category || minPrice || maxPrice);

  const handlePostRequest = () => {
    if (!user) { window.location.href = '/auth/login?redirect=/'; return; }
    setShowRequestModal(true);
  };

  return (
    <div className="space-y-8">

      {/* ── Hero Slideshow ── */}
      <GameSlideshow />

      {/* ── Trust Badges ── */}
      <TrustBadges />

      {/* ── Search + Filters row ── */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts, coins, gift cards, skins…"
            className="w-full bg-cardBg border border-borderBg rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchListings()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition ${showFilters || hasFilters ? 'bg-brand/10 border-brand/40 text-brand-light' : 'bg-cardBg border-borderBg text-gray-300 hover:border-brand/30'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
        </button>
        <Link href="/sell"
          className="flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-4 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-brand/20 whitespace-nowrap">
          <PlusCircle className="w-4 h-4" /><span className="hidden sm:inline">Sell</span>
        </Link>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Platform', value: platform, set: setPlatform, opts: ['PC','Android','iOS','PlayStation','Xbox','Nintendo'] },
            { label: 'Region', value: region, set: setRegion, opts: ['Africa','Europe','North America','Asia','Middle East'] },
          ].map(({ label, value, set, opts }) => (
            <select key={label} className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={value} onChange={e => set(e.target.value)}>
              <option value="">All {label}s</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="accounts">Game Accounts</option>
            <option value="topups">Top-Ups</option>
            <option value="giftcards">Gift Cards</option>
            <option value="boosting">Boosting</option>
          </select>
          <input type="number" placeholder="Min $" className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          <input type="number" placeholder="Max $" className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          <select className="bg-background border border-borderBg rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="col-span-2 sm:col-span-3 lg:col-span-6 flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition py-1">
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Featured Listings — above fold, below hero ── */}
      {!hasFilters && !activeGame && <FeaturedListingsSection banners={banners} />}

      {/* ── Game tab bar ── */}
      <GameTabBar activeGame={activeGame} onSelect={setActiveGame} banners={banners} />

      {/* ── Game Banner Cards (homepage only, no active game filter) ── */}
      {!hasFilters && !activeGame && (
        <GameBannerCards onSelectGame={setActiveGame} banners={banners} />
      )}

      {/* ── Main listings horizontal scroll ── */}
      <ListingsScrollSection
        listings={listings}
        loading={loading}
        total={total || listings.length}
        title={activeGame ? `${activeGame} Listings` : 'All Listings'}
        icon={<Flame className="w-4 h-4 text-orange-400" />}
        banners={banners}
      />

      {/* ── Buyer Requests ── */}
      {!hasFilters && <BuyerRequestsSection key={requestKey} onPostClick={handlePostRequest} />}

      {/* ── GIG Services ── */}
      <GigServicesSection />

      {/* ── Top Up Deals ── */}
      <TopUpDealsSection />

      {/* ── Bottom sell CTA ── */}
      {!hasFilters && (
        <div className="bg-gradient-to-r from-brand/10 via-purple-500/10 to-brand/10 border border-brand/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-white font-bold text-base">Have something to sell?</p>
            <p className="text-gray-400 text-sm mt-0.5">List your account, coins, or boosting service in minutes.</p>
          </div>
          <Link href="/sell"
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-brand/20">
            <PlusCircle className="w-4 h-4" /> Start Selling
          </Link>
        </div>
      )}

      {/* ── Post Request Modal ── */}
      {showRequestModal && (
        <PostRequestModal
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => { setShowRequestModal(false); setRequestSuccess(true); setRequestKey(k => k + 1); setTimeout(() => setRequestSuccess(false), 4000); }}
        />
      )}

      {/* ── Request success toast ── */}
      {requestSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce-in">
          <Check className="w-4 h-4" /> Request posted! Sellers will reach out via messages.
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Page export with Suspense ──────────────────────── */
export default function MarketplaceClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <div className="h-64 bg-cardBg border border-borderBg rounded-3xl animate-pulse" />
          <div className="h-12 bg-cardBg border border-borderBg rounded-xl animate-pulse" />
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-52 h-52 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
