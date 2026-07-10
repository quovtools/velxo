'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';
import { CurrencyConfig } from '@/lib/currency';

/**
 * A compact dropdown that lets visitors manually choose their display currency.
 * Drop this anywhere in the navigation bar.
 */
export default function CurrencySelector() {
  const { currency, setCurrency, allCurrencies, detecting } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? allCurrencies.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.symbol.toLowerCase().includes(search.toLowerCase()),
      )
    : allCurrencies;

  const handleSelect = (c: CurrencyConfig) => {
    setCurrency(c);
    setOpen(false);
    setSearch('');
  };

  if (detecting) {
    return (
      <div className="h-7 w-16 rounded-md bg-white/5 animate-pulse" aria-hidden />
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 transition select-none"
      >
        <span>{currency.symbol}</span>
        <span>{currency.code}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select currency"
          className="absolute right-0 top-full mt-1.5 w-60 max-h-72 overflow-y-auto bg-cardBg border border-borderBg rounded-xl shadow-2xl shadow-black/40 z-50 flex flex-col"
        >
          {/* Search */}
          <div className="sticky top-0 bg-cardBg border-b border-borderBg p-2">
            <input
              type="search"
              autoFocus
              placeholder="Search currency…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-borderBg rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-brand"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No results</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={c.code === currency.code}
                onClick={() => handleSelect(c)}
                className={`flex items-center gap-3 px-3 py-2.5 text-left text-xs hover:bg-white/5 transition ${
                  c.code === currency.code ? 'bg-brand/10 text-brand-light' : 'text-gray-300'
                }`}
              >
                <span className="w-8 font-mono font-bold text-center flex-shrink-0 text-white/80">
                  {c.symbol}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-semibold">{c.code}</span>
                  <span className="text-gray-500 ml-1 truncate">{c.name}</span>
                </span>
                {c.code === currency.code && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
