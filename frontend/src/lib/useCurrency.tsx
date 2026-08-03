'use client';

/**
 * useCurrency — React context + hook for site-wide currency awareness.
 *
 * Usage:
 *   const { fmt, currency, currencyCode } = useCurrency();
 *   <span>{fmt(item.price)}</span>
 *
 *   // For Flutterwave passthrough — send this to the checkout endpoint:
 *   const { currencyCode, currentRate } = useCurrency();
 *
 * The context is provided by <CurrencyProvider> which is wired into
 * the root <Providers> component.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  CurrencyConfig,
  DEFAULT_CURRENCY,
  detectCurrency,
  fetchLiveRates,
  formatPrice,
  applyLiveRate,
  getAllCurrencies,
  saveCurrencyPreference,
  clearCurrencyCache,
} from './currency';

interface CurrencyContextType {
  /** The currently active currency config (with live rate applied). */
  currency: CurrencyConfig;
  /** ISO 4217 currency code — convenience shorthand for Flutterwave passthrough. */
  currencyCode: string;
  /** The current live exchange rate (units per 1 USD). Useful for snapshotting. */
  currentRate: number;
  /** Format a USD price for display in the current currency. */
  fmt: (usdAmount: number | string | null | undefined) => string;
  /** All available currency configs for the manual selector UI (with live rates). */
  allCurrencies: CurrencyConfig[];
  /** Manually override the detected currency. Persists to localStorage. */
  setCurrency: (config: CurrencyConfig) => void;
  /** Whether we are still detecting the user's location / loading rates. */
  detecting: boolean;
  /** Force a refresh of exchange rates (bypasses cache). */
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_CURRENCY,
  currencyCode: DEFAULT_CURRENCY.code,
  currentRate: DEFAULT_CURRENCY.rate,
  fmt: (v) => formatPrice(v, DEFAULT_CURRENCY),
  allCurrencies: [],
  setCurrency: () => {},
  detecting: true,
  refreshRates: async () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyConfig>(DEFAULT_CURRENCY);
  const [allCurrencies, setAllCurrencies] = useState<CurrencyConfig[]>(getAllCurrencies());
  const [detecting, setDetecting] = useState(true);

  const initCurrency = useCallback(async () => {
    try {
      // 1. Fetch live rates first (cached for 6 hours in localStorage).
      const rates = await fetchLiveRates();

      // 2. Detect user's currency (respects localStorage override).
      const detected = await detectCurrency(rates);

      // 3. Apply live rates to all currencies for the selector.
      const updated = getAllCurrencies().map((c) => applyLiveRate(c, rates));
      setAllCurrencies(updated);

      setCurrencyState(detected);
    } catch (err) {
      console.error('[CurrencyProvider] Init failed:', err);
      // Fall back to default — already set in useState
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    initCurrency();
  }, [initCurrency]);

  const refreshRates = useCallback(async () => {
    try {
      // Clear the cache key so fetchLiveRates goes to the network
      if (typeof window !== 'undefined') {
        localStorage.removeItem('piyrox_exchange_rates');
      }
      const rates = await fetchLiveRates();
      const updated = getAllCurrencies().map((c) => applyLiveRate(c, rates));
      setAllCurrencies(updated);
      // Re-apply rate to current currency selection
      setCurrencyState((prev) => applyLiveRate(prev, rates));
    } catch (err) {
      console.error('[CurrencyProvider] Rate refresh failed:', err);
    }
  }, []);

  const setCurrency = useCallback((config: CurrencyConfig) => {
    // Persist the manual choice to localStorage so it survives across sessions
    saveCurrencyPreference(config);
    setCurrencyState(config);
  }, []);

  const fmt = useCallback(
    (usdAmount: number | string | null | undefined) => formatPrice(usdAmount, currency),
    [currency],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyCode: currency.code,
        currentRate: currency.rate,
        fmt,
        allCurrencies,
        setCurrency,
        detecting,
        refreshRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
