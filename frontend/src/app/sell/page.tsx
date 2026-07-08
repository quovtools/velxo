'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import {
  Gamepad2, Package, ChevronRight, ChevronLeft,
  Check, AlertCircle, Loader2, Upload, Info,
  DollarSign, Tag, MapPin, Monitor, Star, Clock,
  Plus, Image
} from 'lucide-react';

const GAMES = [
  'Free Fire', 'PUBG Mobile', 'COD Mobile', 'Mobile Legends',
  'Blood Strike', 'Delta Force', 'Valorant', 'Roblox', 'eFootball', 'Other',
];
const PLATFORMS = ['Android', 'iOS', 'PC', 'PlayStation', 'Xbox', 'Nintendo Switch'];
const REGIONS = ['Africa', 'Europe', 'North America', 'Asia', 'Middle East', 'Global'];
const CATEGORIES = [
  { label: 'Game Account', value: 'account' },
  { label: 'In-Game Currency / Coins', value: 'coins' },
  { label: 'Top-Up Service', value: 'topup' },
  { label: 'Gift Card', value: 'giftcard' },
  { label: 'Boosting Service', value: 'boost' },
  { label: 'Skins / Items', value: 'skins' },
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-1.5 ${i < step ? 'text-brand' : i === step ? 'text-white' : 'text-gray-500'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i < step ? 'bg-brand border-brand text-white' :
              i === step ? 'border-brand text-white bg-brand/10' :
              'border-gray-600 text-gray-600'
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:block">
              {['Store Setup', 'Item Details', 'Pricing & Info', 'Review'][i]}
            </span>
          </div>
          {i < total - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-brand' : 'bg-gray-700'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function SellPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();

  const [isSeller, setIsSeller] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [step, setStep] = useState(0); // 0 = store setup, 1-3 = listing steps
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Store onboarding
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeNameError, setStoreNameError] = useState(false);

  // Listing fields
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
  const [imageUrls, setImageUrls] = useState<string[]>(['', '', '', '']);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/sell');
      return;
    }

    api.get<{ success: boolean; data: any }>('/sellers/me')
      .then(res => {
        if (res.success && res.data) {
          setIsSeller(true);
          setStep(1);
        } else {
          setIsSeller(false);
          setStep(0);
        }
      })
      .catch(() => {
        setIsSeller(false);
        setStep(0);
      })
      .finally(() => setCheckingStatus(false));
  }, [user, authLoading, router]);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setStoreNameError(true);
      return;
    }
    setStoreNameError(false);
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>('/sellers', {
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
      });
      if (res.success) {
        setIsSeller(true);
        // Update user role in session without page reload
        updateUser({ role: 'SELLER' });
        setStep(1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create store. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateListing = async () => {
    setError(null);
    setSubmitting(true);
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
        images: imageUrls.map(u => u.trim()).filter(Boolean),
      });
      if (res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6 fade-in">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Listing Submitted!</h2>
        <p className="text-gray-400 text-sm">
          Your listing has been submitted for review. It will go live within 24 hours after our team approves it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => { setSuccess(false); setStep(1); setTitle(''); setDescription(''); setPrice(''); setImageUrls(['', '', '', '']); }}
            className="px-6 py-3 bg-brand hover:bg-brand-dark rounded-xl font-bold text-white transition">
            Create Another Listing
          </button>
          <button onClick={() => router.push('/seller/dashboard')}
            className="px-6 py-3 bg-hoverBg/50 border border-borderBg hover:border-brand/30 rounded-xl font-bold text-white transition">
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Step 0: Store onboarding
  if (!isSeller || step === 0) {
    return (
      <div className="max-w-lg mx-auto py-10 fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-3xl font-black text-white">Start Selling on Velxo</h1>
          <p className="text-gray-400 mt-2 text-sm">Set up your store in seconds. It's free.</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleOnboard} className="space-y-5">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Store Name *</label>
              <input
                type="text"
                required
                maxLength={60}
                className={`w-full bg-background border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition ${storeNameError ? 'border-red-500/60' : 'border-borderBg'}`}
                placeholder="e.g. GamePro Store, Apex Coins"
                value={storeName}
                onChange={e => { setStoreName(e.target.value); if (storeNameError) setStoreNameError(false); }}
                onBlur={() => setStoreNameError(!storeName.trim())}
              />
              <p className="text-xs text-gray-500 mt-1">{storeName.length}/60 characters</p>
              {storeNameError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Store name is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Store Description</label>
              <textarea
                rows={3}
                maxLength={300}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition resize-none"
                placeholder="Tell buyers what you sell — game accounts, top-ups, boosting services..."
                value={storeDescription}
                onChange={e => setStoreDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-white">What you get as a seller:</p>
            {['Create unlimited listings', 'Sell to 10,000+ buyers', 'Get paid via escrow — safely', 'Build your reputation with reviews'].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <Check className="w-3.5 h-3.5 text-brand flex-shrink-0" /> {f}
              </div>
            ))}
          </div>

          <button type="submit" disabled={submitting || !storeName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold text-white transition disabled:opacity-50 shadow-lg shadow-brand/20">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Store...</> : <>Create My Store <ChevronRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    );
  }

  // Steps 1-3: Listing creation wizard
  return (
    <div className="max-w-2xl mx-auto py-6 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Create a Listing</h1>
        <p className="text-gray-400 text-sm mt-1">Fill in the details to list your item for sale</p>
      </div>

      <ProgressBar step={step - 1} total={3} />

      {error && (
        <div className="bg-red-900/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step 1: Category & Game */}
      {step === 1 && (
        <div className="space-y-5 fade-in">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-brand" /> What are you selling?</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat.value} type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-xl border text-sm font-semibold text-left transition ${
                      category === cat.value
                        ? 'bg-brand/10 border-brand text-white'
                        : 'border-borderBg text-gray-400 hover:border-brand/40 hover:text-white'
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Game *</label>
              <select
                value={gameName}
                onChange={e => setGameName(e.target.value)}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
              >
                {GAMES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(2)} disabled={!category || !gameName}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold text-white transition disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-5 fade-in">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-brand" /> Item Details</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Title *</label>
              <input
                type="text"
                required
                maxLength={150}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={`e.g. ${gameName} ${category === 'account' ? 'Level 70 Account' : category === 'coins' ? '5000 Coins'  : 'Service'}`}
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/150</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Description *</label>
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe exactly what the buyer gets — level, rank, skins, linked accounts, delivery method..."
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition resize-none"
              />
            </div>

            {/* Account-specific fields */}
            {category === 'account' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Rank (optional)</label>
                  <input type="text" value={rank} onChange={e => setRank(e.target.value)}
                    placeholder="e.g. Heroic, Diamond"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Level (optional)</label>
                  <input type="number" value={level} onChange={e => setLevel(e.target.value)}
                    placeholder="e.g. 70"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Login Method (optional)</label>
                  <input type="text" value={loginMethod} onChange={e => setLoginMethod(e.target.value)}
                    placeholder="e.g. Google, Facebook, Guest"
                    className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Screenshot URLs (optional)</label>
              <div className="space-y-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="url"
                      value={url}
                      onChange={e => {
                        const next = [...imageUrls];
                        next[i] = e.target.value;
                        setImageUrls(next);
                      }}
                      placeholder={`https://imgur.com/screenshot-${i + 1}.jpg`}
                      className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition"
                    />
                    {imageUrls.length > 1 && (
                      <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                        className="px-2 py-2 text-gray-500 hover:text-red-400 transition flex-shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {imageUrls.length < 4 && (
                <button type="button" onClick={() => setImageUrls([...imageUrls, ''])}
                  className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand/80 transition">
                  <Plus className="w-3.5 h-3.5" /> Add another image (up to 4)
                </button>
              )}
              <p className="text-xs text-gray-500 mt-2">Upload to Imgur, ImgBB, etc. and paste the links. First image is your main thumbnail.</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-2 px-6 py-3 border border-borderBg hover:border-brand/40 rounded-xl text-gray-300 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(3)} disabled={!title.trim() || !description.trim()}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold text-white transition disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Pricing & Review */}
      {step === 3 && (
        <div className="space-y-5 fade-in">
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-brand" /> Pricing & Delivery</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Platform *</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition">
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Region *</label>
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition">
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Price (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number" required min="0.50" step="0.01"
                    value={price} onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-background border border-borderBg rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Delivery Time</label>
                <select value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="180">3 hours</option>
                  <option value="720">12 hours</option>
                  <option value="1440">24 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* What buyers receive */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Package className="w-4 h-4 text-brand" /> What buyers receive</h3>
            <div className="text-sm text-gray-400 space-y-1.5">
              <div className="flex justify-between"><span>{title.trim() || 'Your item title'}</span><span className="text-white font-semibold">{gameName}</span></div>
              <div className="flex justify-between"><span>Platform / Region</span><span className="text-white font-semibold">{platform} · {region}</span></div>
              {category === 'account' && (rank || level || loginMethod) && (
                <div className="flex justify-between"><span>Account details</span><span className="text-white font-semibold">{[rank, level && `Lvl ${level}`, loginMethod].filter(Boolean).join(', ')}</span></div>
              )}
              <div className="flex justify-between"><span>Delivery time</span><span className="text-white font-semibold">{deliveryTime} min</span></div>
            </div>
          </div>

          {/* Order Summary */}
          {price && (
            <div className="bg-cardBg border border-borderBg rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Your price</span>
                  <span className="font-bold text-white">${parseFloat(price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform fee (10%)</span>
                  <span className="text-gray-400">-${(parseFloat(price) * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t border-borderBg pt-2 flex justify-between">
                  <span className="font-bold text-white">You receive</span>
                  <span className="font-black text-brand text-lg">${(parseFloat(price) * 0.9).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex gap-3 text-xs text-gray-400">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>Your listing goes to <span className="font-semibold text-white">Pending Review</span>. Our team approves it within 24 hours. You'll get an email when it's live.</p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 border border-borderBg hover:border-brand/40 rounded-xl text-gray-300 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleCreateListing}
              disabled={submitting || !title.trim() || !description.trim() || !category || !gameName || !price || parseFloat(price) < 0.5}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-8 py-3 rounded-xl font-bold text-white transition disabled:opacity-50 shadow-lg shadow-brand/20"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Check className="w-4 h-4" /> Submit Listing</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
