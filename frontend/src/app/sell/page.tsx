'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Gamepad2, Plus, Info } from 'lucide-react';

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [isSeller, setIsSeller] = useState(false);
  const [loadingSellerCheck, setLoadingSellerCheck] = useState(true);

  // Seller onboarding form states
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  // Listing wizard states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [gameName, setGameName] = useState('Free Fire');
  const [platform, setPlatform] = useState('Android');
  const [region, setRegion] = useState('Africa');
  const [rank, setRank] = useState('');
  const [level, setLevel] = useState('');
  const [loginMethod, setLoginMethod] = useState('Google Play');
  const [deliveryTime, setDeliveryTime] = useState('60');
  const [imageUrl, setImageUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function checkSellerStatus() {
      try {
        const response = await api.get<{ success: boolean; data: any }>('/sellers/me');
        if (response.success && response.data) {
          setIsSeller(true);
        }
      } catch {
        setIsSeller(false);
      } finally {
        setLoadingSellerCheck(false);
      }
    }
    checkSellerStatus();
  }, [user, router]);

  // Onboard as seller
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<{ success: boolean; data: any }>('/sellers', {
        storeName,
        storeDescription,
      });

      if (response.success) {
        setIsSeller(true);
        // Force session refresh to load Role.SELLER context
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to onboard as seller');
    } finally {
      setLoading(false);
    }
  };

  // Create Listing
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<{ success: boolean; data: any }>('/listings', {
        title,
        description,
        price: parseFloat(price),
        gameName,
        platform,
        region,
        rank,
        level: level ? parseInt(level) : undefined,
        loginMethod,
        deliveryTime: parseInt(deliveryTime),
        categoryId: 'cuid-placeholder-category', // Normally resolved from backend
        images: imageUrl ? [imageUrl] : [],
      });

      if (response.success) {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSellerCheck) {
    return <div className="text-center py-20 text-gray-400">Verifying authorization profile...</div>;
  }

  // 1. Onboarding Form
  if (!isSeller) {
    return (
      <div className="max-w-md mx-auto my-12 bg-cardBg border border-borderBg rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <Gamepad2 className="w-12 h-12 text-brand mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-white">Become a Seller</h1>
          <p className="text-gray-400 mt-2">Open your store on Velxo in seconds</p>
        </div>

        {error && <div className="bg-red-900/30 border border-red-500 text-red-200 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

        <form onSubmit={handleOnboard} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Store Name</label>
            <input
              type="text"
              required
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              placeholder="e.g. Apex Coins Store"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Store Description</label>
            <textarea
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand h-28 resize-none"
              placeholder="Tell buyers about your digital services or products..."
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition disabled:opacity-50 text-white"
          >
            {loading ? 'Onboarding...' : 'Onboard Now'}
          </button>
        </form>
      </div>
    );
  }

  // 2. Listing Creation Wizard
  return (
    <div className="max-w-3xl mx-auto bg-cardBg border border-borderBg rounded-3xl p-8 shadow-xl my-6">
      <div className="flex items-center gap-3 border-b border-borderBg pb-6 mb-8">
        <Plus className="w-8 h-8 text-brand" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">Create New Offer</h1>
          <p className="text-gray-400 text-sm mt-0.5">Fill in details for your gaming product or service</p>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-500 text-red-200 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

      <form onSubmit={handleCreateListing} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Offer Title</label>
            <input
              type="text"
              required
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              placeholder="e.g. Free Fire Level 70 Account with rare items"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Game Title</label>
            <select
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            >
              <option value="Free Fire">Free Fire</option>
              <option value="PUBG Mobile">PUBG Mobile</option>
              <option value="COD Mobile">COD Mobile</option>
              <option value="Fortnite">Fortnite</option>
              <option value="Valorant">Valorant</option>
              <option value="Roblox">Roblox</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Platform</label>
            <select
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="PC">PC</option>
              <option value="Android">Android</option>
              <option value="iOS">iOS</option>
              <option value="PlayStation">PlayStation</option>
              <option value="Xbox">Xbox</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Region</label>
            <select
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="Africa">Africa</option>
              <option value="Europe">Europe</option>
              <option value="North America">North America</option>
              <option value="Asia">Asia</option>
              <option value="Middle East">Middle East</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Price (USD)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Rank (Optional)</label>
            <input
              type="text"
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              placeholder="e.g. Heroic, Diamond"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Level (Optional)</label>
            <input
              type="number"
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              placeholder="e.g. 50"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Login Method</label>
            <input
              type="text"
              className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
              placeholder="e.g. Google, Facebook"
              value={loginMethod}
              onChange={(e) => setLoginMethod(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Screenshot URL</label>
          <input
            type="url"
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
            placeholder="https://image-hosting.com/my-avatar.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Listing Description</label>
          <textarea
            required
            className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand h-36 resize-none"
            placeholder="Provide complete item specs, list of weapon skins, characters unlocked, linked details, etc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-3 items-start text-xs text-gray-400">
          <Info className="w-5 h-5 text-brand flex-shrink-0" />
          <p>
            Your listing will go live after a standard security audit checks parameters for fraudulent details. Ensure you provide accurate linked accounts information to avoid disputes.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition disabled:opacity-50 text-white"
        >
          {loading ? 'Creating Offer...' : 'Create Offer'}
        </button>
      </form>
    </div>
  );
}
