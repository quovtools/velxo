'use client';

/**
 * useCurrency — React context + hook for site-wide currency awareness.
 *
 * Usage:
 *   const { fmt } = useCurrency();
 *   <span>{fmt(item.price)}</span>
 *
 * The context is provided by <CurrencyProvider> which is already wired into
 * the root <Providers> component.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CurrencyConfig,
  DEFAULT_CURRENCY,
  detectCurrency,
  formatPrice,
  COUNTRY_CURRENCY_MAP,
  clearCurrencyCache,
} from './currency';

interface CurrencyContextType {
  currency: CurrencyConfig;
  /** Format a USD price for display in the current currency */
  fmt: (usdAmount: number | string | null | undefined) => string;
  /** All available currency configs for a manual selector UI */
  allCurrencies: CurrencyConfig[];
  /** Manually override the detected currency */
  setCurrency: (config: CurrencyConfig) => void;
  /** Whether we're still detecting the user's location */
  detecting: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_CURRENCY,
  fmt: (v) => formatPrice(v, DEFAULT_CURRENCY),
  allCurrencies: [],
  setCurrency: () => {},
  detecting: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyConfig>(DEFAULT_CURRENCY);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    console.log('[CurrencyProvider] Mounting, starting detection...');
    detectCurrency().then((detected) => {
      console.log('[CurrencyProvider] Detection complete:', detected.code, detected.name);
      setCurrencyState(detected);
      setDetecting(false);
    });
  }, []);

  const setCurrency = (config: CurrencyConfig) => {
    clearCurrencyCache();
    setCurrencyState(config);
    // Persist manual choice for the session so the user doesn't have to re-select
    try {
      sessionStorage.setItem('velxo_currency', JSON.stringify(config));
    } catch { /* ignore */ }
  };

  const fmt = (usdAmount: number | string | null | undefined) =>
    formatPrice(usdAmount, currency);

  const allCurrencies = Object.values(COUNTRY_CURRENCY_MAP).filter(
    (c, i, arr) => arr.findIndex((x) => x.code === c.code) === i,
  );

  return (
    <CurrencyContext.Provider value={{ currency, fmt, allCurrencies, setCurrency, detecting }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
