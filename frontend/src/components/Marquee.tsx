'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Megaphone, Zap, Gift, Info, ArrowRight } from 'lucide-react';

interface MarqueeItem {
  id: string;
  text: string;
  linkHref?: string;
  linkText?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  megaphone: Megaphone,
  zap: Zap,
  gift: Gift,
  info: Info,
};

const COLOR_MAP: Record<string, string> = {
  brand: 'text-brand-light',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  purple: 'text-purple-400',
  rose: 'text-rose-400',
  sky: 'text-sky-400',
};

export default function Marquee() {
  const [items, setItems] = useState<MarqueeItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const res = await fetch(`${apiBase}/marquee`);
        if (res.ok) {
          const data = await res.json();
          setItems((data.data || []).filter((i: MarqueeItem) => i.isActive !== false));
        }
      } catch {
        // Marquee is non-critical; ignore network errors.
      }
    }
    load();
  }, []);

  const renderItem = (item: MarqueeItem, key: string) => {
    const Icon = item.icon ? ICON_MAP[item.icon] : null;
    const colorClass = COLOR_MAP[item.color || 'brand'] || COLOR_MAP.brand;
    const content = (
      <span className="inline-flex items-center gap-2 px-6 text-sm font-medium text-gray-300">
        {Icon && <Icon className={`w-3.5 h-3.5 ${colorClass}`} />}
        <span className={colorClass}>●</span>
        {item.text}
        {item.linkHref && (
          <span className="inline-flex items-center gap-1 text-brand-light font-semibold">
            {item.linkText || 'Learn more'} <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </span>
    );

    if (item.linkHref) {
      return (
        <Link key={key} href={item.linkHref} className="inline-flex items-center">
          {content}
        </Link>
      );
    }
    return <span key={key}>{content}</span>;
  };

  return (
    <div className="marquee-wrap bg-gradient-to-r from-brand/10 via-cardBg to-brand/10 border-b border-borderBg overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 bg-cardBg/90 px-4 border-r border-borderBg">
        <Megaphone className="w-4 h-4 text-brand" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-light hidden sm:inline">News</span>
      </div>
      <div className="marquee-track py-2 pl-24 sm:pl-28">
        {items.length > 0 ? (
          <>
            {items.map((item) => renderItem(item, `a-${item.id}`))}
            {items.map((item) => renderItem(item, `b-${item.id}`))}
          </>
        ) : (
          <span className="inline-flex items-center gap-2 px-6 text-sm text-gray-400">
            <span className="text-brand">●</span> Welcome to Velxo — Africa's escrow-protected gaming marketplace. Buy & sell accounts, top-ups and boosting safely.
          </span>
        )}
      </div>
    </div>
  );
}
