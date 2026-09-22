'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, Gamepad2, Star, TrendingUp, Clock } from 'lucide-react';
import HorizontalScroll from '@/components/HorizontalScroll';
import GameIcon from '@/components/GameIcon';
import { useCurrency } from '@/lib/useCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getJson(endpoint: string): Promise<any | null> {
  try {
    const res = await fetch(`${API}${endpoint}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function RowSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-44 sm:w-48 flex-shrink-0 h-56 bg-cardBg border border-borderBg rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

/* ── Featured / Trending marketplace listings ─────────────────── */
interface FeaturedListing {
  id: string;
  title: string;
  price: string | number;
  gameName: string;
  images?: string[];
  rank?: string;
  level?: number;
  isSold?: boolean;
  isFeatured?: boolean;
  salesCount?: number;
  seller?: { storeName?: string; averageRating?: number | string; isVerified?: boolean };
}

export function FeaturedListingsRow() {
  const [items, setItems] = useState<FeaturedListing[] | null>(null);
  const [banners, setBanners] = useState<Record<string, string>>({});
  const { fmt } = useCurrency();

  useEffect(() => {
    getJson('/listings/featured?limit=10').then((d) => {
      setItems(((d && d.data) || []).slice(0, 10));
    });
    getJson('/game-banners').then((d) => {
      const map: Record<string, string> = {};
      ((d && d.data) || []).forEach((b: { gameName?: string; bannerUrl?: string }) => {
        if (b.gameName && b.bannerUrl) map[b.gameName] = b.bannerUrl;
      });
      setBanners(map);
    });
  }, []);

  if (items === null) return <RowSkeleton />;
  if (items.length === 0) return null;

  return (
    <HorizontalScroll>
      {items.map((l) => {
        const banner = banners[l.gameName];
        const img = l.images && l.images[0];
        return (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="w-44 sm:w-48 flex-shrink-0 bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden flex flex-col transition group"
          >
            <div className="h-28 bg-gradient-to-br from-brand/25 to-background flex items-center justify-center relative">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              ) : banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner} alt="" className="w-full h-full object-cover" />
              ) : (
                <GameIcon game={l.gameName} className="w-14 h-14" />
              )}
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-brand text-white px-1.5 py-0.5 rounded">
                <TrendingUp className="w-2.5 h-2.5" /> Featured
              </span>
              {l.isSold && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-xs font-black uppercase tracking-widest text-white">Sold</span>
                </div>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col gap-1.5">
              <p className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition">{l.title}</p>
              <p className="text-[11px] text-gray-500">
                {l.gameName}
                {l.rank ? ` · ${l.rank}` : l.level ? ` · Lv ${l.level}` : ''}
              </p>
              <div className="mt-auto pt-2 border-t border-borderBg flex items-center justify-between gap-2">
                <span className="text-sm font-black text-brand">{fmt(l.price)}</span>
                {l.seller?.storeName && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 truncate max-w-[90px]">
                    <Star className="w-3 h-3 fill-brand text-brand flex-shrink-0" />
                    <span className="truncate">{l.seller.storeName}</span>
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </HorizontalScroll>
  );
}

/* ── Top-up listings ──────────────────────────────────────────── */
interface TopupProduct {
  id: string;
  title: string;
  description?: string;
  price: string | number;
  gameName: string;
  imageUrl?: string;
  region?: string;
}

export function TopupsRow() {
  const [items, setItems] = useState<TopupProduct[] | null>(null);
  const { fmt } = useCurrency();

  useEffect(() => {
    getJson('/topups').then((d) => {
      setItems((((d && d.data) || []) as TopupProduct[]).filter((p) => p).slice(0, 12));
    });
  }, []);

  if (items === null) return <RowSkeleton />;
  if (items.length === 0) return null;

  return (
    <HorizontalScroll>
      {items.map((p) => (
        <Link
          key={p.id}
          href="/topups"
          className="w-40 sm:w-44 flex-shrink-0 bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl overflow-hidden flex flex-col transition group"
        >
          <div className="h-24 bg-gradient-to-br from-brand/30 to-background flex items-center justify-center relative">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            ) : (
              <GameIcon game={p.gameName} className="w-12 h-12" />
            )}
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-brand text-white px-1.5 py-0.5 rounded">
              <Zap className="w-2.5 h-2.5" /> Official
            </span>
            {p.region && (
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/60 text-white px-1.5 py-0.5 rounded">
                {p.region}
              </span>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col gap-1">
            <p className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition">{p.title}</p>
            <p className="text-[11px] text-gray-500">{p.gameName}</p>
            <div className="mt-auto pt-2 border-t border-borderBg flex items-center justify-between">
              <span className="text-sm font-black text-white">{fmt(p.price)}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Instant
              </span>
            </div>
          </div>
        </Link>
      ))}
    </HorizontalScroll>
  );
}

/* ── Gigs (boosting services) ─────────────────────────────────── */
interface Gig {
  id: string;
  title: string;
  description?: string;
  price: string | number;
  gameName: string;
  rankFrom?: string;
  rankTo?: string;
  accountType?: string;
  region?: string;
  deliveryTime?: number | string;
  imageUrl?: string;
  seller?: { storeName?: string };
}

export function GigsRow() {
  const [items, setItems] = useState<Gig[] | null>(null);
  const { fmt } = useCurrency();

  useEffect(() => {
    getJson('/gigs').then((d) => {
      setItems((((d && d.data) || []) as Gig[]).filter((g) => g).slice(0, 12));
    });
  }, []);

  if (items === null) return <RowSkeleton />;
  if (items.length === 0) return null;

  return (
    <HorizontalScroll>
      {items.map((g) => (
        <Link
          key={g.id}
          href="/boosting"
          className="w-44 sm:w-48 flex-shrink-0 bg-cardBg border border-borderBg hover:border-purple-500/40 rounded-2xl overflow-hidden flex flex-col transition group"
        >
          <div className="h-28 bg-gradient-to-br from-purple-500/25 to-background flex items-center justify-center relative">
            {g.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            ) : (
              <GameIcon game={g.gameName} className="w-14 h-14" />
            )}
            <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-purple-500 text-white px-1.5 py-0.5 rounded">
              {g.accountType || 'Boost'}
            </span>
            {g.region && (
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/60 text-white px-1.5 py-0.5 rounded">
                {g.region}
              </span>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col gap-1">
            <p className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition">{g.title}</p>
            <p className="text-[11px] text-gray-500">{g.gameName}</p>
            {(g.rankFrom || g.rankTo) && (
              <p className="text-[11px] text-purple-300 font-semibold">
                {g.rankFrom || '?'} → {g.rankTo || '?'}
              </p>
            )}
            <div className="mt-auto pt-2 border-t border-borderBg flex items-center justify-between gap-2">
              <span className="text-sm font-black text-white">{fmt(g.price)}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                {g.deliveryTime != null && (
                  <>
                    <Clock className="w-3 h-3" /> {g.deliveryTime}{typeof g.deliveryTime === 'number' ? 'h' : ''} ·
                  </>
                )} <Gamepad2 className="w-3 h-3" /> {g.seller?.storeName || 'Pro'}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </HorizontalScroll>
  );
}
