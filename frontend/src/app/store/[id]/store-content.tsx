'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, ShieldCheck, Loader2, Package, ShoppingBag, Copy, Check, Share2,
  Store as StoreIcon, Lock, ExternalLink, MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';
import VerifiedBadge from '@/components/VerifiedBadge';

interface StoreListing {
  id: string;
  title: string;
  price: number | string;
  currency?: string;
  gameName?: string;
  images?: string[];
  salesCount?: number;
  category?: { name: string } | null;
}
interface PublicStore {
  id: string;
  storeName: string;
  storeDescription: string | null;
  isVerified: boolean;
  averageRating: number;
  totalSales: number;
  subscriptionTier: string;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  listings: StoreListing[];
}

function money(n: number | string, currency = 'USD') {
  const v = typeof n === 'string' ? Number(n) : n;
  return `${currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function initials(name?: string | null) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

export default function PublicStorePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [store, setStore] = useState<PublicStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: PublicStore }>(`/sellers/${id}/store`);
        if (active) {
          if (res.success) setStore(res.data);
          else setError('This store is not available.');
        }
      } catch (e: any) {
        if (active) setError(e?.message || 'This store is not available.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const copyLink = async () => {
    const url = `${window.location.origin}/store/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gray-500" />
        </div>
        <h1 className="text-2xl font-black text-white">Store not available</h1>
        <p className="text-gray-400 mt-2 text-sm">
          {error || 'This seller has not enabled a public store yet.'}
        </p>
        <Link href="/" className="inline-flex items-center gap-2 mt-6 bg-brand hover:bg-brand-dark px-5 py-3 rounded-xl text-white font-semibold text-sm">
          Go to Velxo
        </Link>
      </div>
    );
  }

  const fullName = [store.user?.firstName, store.user?.lastName].filter(Boolean).join(' ') || store.storeName;

  return (
    <div className="min-h-screen bg-background">
      {/* banner */}
      <div className="h-28 sm:h-36 bg-gradient-to-r from-brand via-purple-600 to-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,white,transparent_40%)]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-14 sm:-mt-16">
        {/* store header card */}
        <div className="bg-cardBg border border-borderBg rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-lg -mt-12 sm:mt-0 border-4 border-cardBg">
              {initials(store.storeName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white truncate">{store.storeName}</h1>
                {store.isVerified && <VerifiedBadge size="md" />}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/30">Seller Pro</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{store.storeDescription || 'Welcome to my Velxo store.'}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {(store.averageRating || 0).toFixed(1)}</span>
                <span>{store.totalSales} sales</span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={copyLink} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-xl text-sm font-bold text-white transition">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Share'}
              </button>
              <Link href={`/auth/login?redirect=/store/${id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition">
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
            </div>
          </div>
        </div>

        {/* listings */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand" /> Listings ({store.listings.length})
            </h2>
          </div>

          {store.listings.length === 0 ? (
            <div className="text-center py-16 bg-cardBg border border-borderBg rounded-2xl">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-bold">No active listings right now</p>
              <p className="text-gray-400 text-sm mt-1">Check back soon for new offers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {store.listings.map(l => (
                <Link key={l.id} href={`/listings/${l.id}`} className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden hover:border-brand/40 hover:-translate-y-1 transition group">
                  <div className="aspect-[4/3] bg-hoverBg/40 relative">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><StoreIcon className="w-8 h-8 text-gray-600" /></div>
                    )}
                    {l.category?.name && (
                      <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full">{l.category.name}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-white text-sm truncate">{l.title}</p>
                    <p className="text-xs text-gray-500 truncate">{l.gameName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-brand font-black text-sm">{money(l.price, l.currency)}</span>
                      <span className="text-[10px] text-gray-500">{l.salesCount || 0} sold</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-10 mb-8">
          Powered by <span className="text-brand font-semibold">Velxo</span> · Secure escrow marketplace
        </p>
      </div>
    </div>
  );
}
