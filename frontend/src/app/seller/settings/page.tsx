'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Store, FileText, Shield, CreditCard, Bell, Image, X, Check, Loader2, Lock, Users, TrendingUp } from 'lucide-react';

interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeDescription: string;
  isVerified: boolean;
  reputationScore: number;
  totalSales: number;
  totalRevenue: string;
  averageRating: number;
  responseRate: number;
  responseTime: number;
  subscriptionTier: string;
  verifiedAt?: string;
}

export default function SellerSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Store form
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [responseTime, setResponseTime] = useState(24);

  // Tier options
  const tiers = [
    { name: 'Free', price: 0, features: ['5 active listings', 'Standard support', 'Basic analytics'] },
    { name: 'Basic', price: 9.99, features: ['20 active listings', 'Priority support', 'Advanced analytics', 'Featured listings'] },
    { name: 'Pro', price: 29.99, features: ['50 active listings', '24/7 support', 'Full analytics', 'Featured listings', 'Custom branding'] },
    { name: 'Premium', price: 99.99, features: ['Unlimited listings', 'Dedicated support', 'Complete analytics', 'Featured listings', 'Custom branding', 'API access'] },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: SellerProfile }>('/sellers/me');
        if (res.success) {
          setSeller(res.data);
          setStoreName(res.data.storeName);
          setStoreDescription(res.data.storeDescription || '');
          setResponseTime(res.data.responseTime || 24);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, router]);

  const saveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/sellers/settings', {
        storeName,
        storeDescription,
        responseTime,
      });
      // Refresh seller data
      const res = await api.get<{ success: boolean; data: SellerProfile }>('/sellers/me');
      if (res.success) setSeller(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Seller Settings</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            seller?.subscriptionTier === 'FREE' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
            seller?.subscriptionTier === 'BASIC' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            seller?.subscriptionTier === 'PRO' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          }`}>
            {seller?.subscriptionTier} Tier
          </span>
          {seller?.isVerified && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-cardBg border border-borderBg rounded-xl p-1">
        {[
          { id: 'store', icon: Store, label: 'Store Info' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
          { id: 'payment', icon: CreditCard, label: 'Payment' },
          { id: 'security', icon: Lock, label: 'Security' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-hoverBg/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Store Info Tab */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          {/* Store Profile */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-brand" />
              Store Profile
            </h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-brand to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl font-black text-white">
                {storeName[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-gray-400">Store Name</p>
                <p className="text-lg font-bold text-white">{storeName}</p>
              </div>
            </div>

            <form onSubmit={saveStoreSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Store Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Store Description
                </label>
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                  placeholder="Describe your store, what you sell, and your service quality..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Average Response Time (hours)
                </label>
                <select
                  value={responseTime}
                  onChange={(e) => setResponseTime(Number(e.target.value))}
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={8}>8 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Buyers prefer sellers with faster response times. Higher response rates improve visibility.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-6 py-3 rounded-xl text-sm font-bold transition text-white shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
              </button>
            </form>
          </div>

          {/* Verification Status */}
          {seller && !seller.isVerified && (
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl flex-shrink-0">
                  <Shield className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Unlock Verified Seller Status</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Verified sellers get higher trust, better visibility, and access to premium features. Complete KYC verification today.
                  </p>
                  <ul className="space-y-2 mb-4 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> Higher listing limits
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> Verified badge on your store
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> Priority customer support
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> Better search ranking
                    </li>
                  </ul>
                  <button className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-6 py-2.5 rounded-xl text-sm font-bold transition text-white shadow-lg shadow-yellow-500/20">
                    <Shield className="w-4 h-4" /> Start Verification
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Options */}
          <div className="bg-cardBg border border-borderBg rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand" />
              Upgrade Your Plan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl border ${
                    seller?.subscriptionTier === tier.name
                      ? 'border-brand bg-brand/5'
                      : 'border-borderBg hover:border-brand/30'
                  } p-5 transition-all`}
                >
                  {seller?.subscriptionTier === tier.name && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full">
                      Current
                    </div>
                  )}
                  <h3 className="text-xl font-black text-white mb-1">{tier.name}</h3>
                  <p className="text-2xl font-black text-brand mb-2">${tier.price}<span className="text-xs text-gray-500 font-normal">/mo</span></p>
                  
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-400" /> {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${
                      seller?.subscriptionTier === tier.name
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-brand hover:bg-brand-dark text-white'
                    }`}
                    disabled={seller?.subscriptionTier === tier.name}
                  >
                    {seller?.subscriptionTier === tier.name ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand" />
            Notification Preferences
          </h2>

          <div className="space-y-4">
            {[
              { label: 'Order Status Updates', desc: 'Get notified when orders change status' },
              { label: 'New Messages', desc: 'Receive alerts when you get new messages' },
              { label: 'Listing Approvals', desc: 'Be informed when your listings are reviewed' },
              { label: 'Payment Notifications', desc: 'Alerts about payments and withdrawals' },
              { label: 'Weekly Reports', desc: 'Summary of your store performance' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-hoverBg/30 rounded-xl">
                <div className="w-5 h-5 rounded-lg bg-brand/20 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand" />
            Payment Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-hoverBg/30 rounded-xl border border-borderBg/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Bank Account</p>
                  <p className="text-xs text-gray-400">**** **** **** 1234</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">Primary payout method</p>
              <button className="text-xs text-brand hover:text-brand-light font-medium">Edit</button>
            </div>

            <div className="p-5 bg-hoverBg/30 rounded-xl border border-borderBg/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">KYC Verified</p>
                  <p className="text-xs text-gray-400">Identity confirmed</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">Highest withdrawal limits</p>
              <button className="text-xs text-brand hover:text-brand-light font-medium">View</button>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-xs text-yellow-400">
              <span className="font-bold">Note:</span> To enable withdrawals, you must complete KYC verification with a valid government-issued ID.
            </p>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand" />
            Security Settings
          </h2>

          <div className="space-y-4">
            {[
              { label: 'Change Password', desc: 'Update your account password' },
              { label: 'Two-Factor Authentication', desc: 'Add extra security to your account' },
              { label: 'Active Sessions', desc: 'Manage devices signed into your account' },
              { label: 'API Keys', desc: 'Manage your application keys' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-hoverBg/30 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-borderBg/50">
            <button className="text-sm text-red-400 hover:text-red-300 font-medium">
              Deactivate Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
