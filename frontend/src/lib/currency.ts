/**
 * Currency detection and formatting utilities.
 *
 * Architecture:
 * - DB stores prices in USD (base currency).
 * - On page load, we detect the visitor's country via IP geolocation,
 *   then pull LIVE exchange rates from the backend proxy (which calls ExchangeRate-API).
 * - Rates are cached in localStorage for 6 hours. If the live fetch fails,
 *   we fall back to the last-known cached rate. Hardcoded rates are used only
 *   as absolute last resort (when no cache exists AND the API is unreachable).
 * - The user's currency choice persists in localStorage across sessions.
 * - A manual override via the CurrencySelector updates localStorage and
 *   immediately reflects across every price on the page.
 */

export interface CurrencyConfig {
  code: string;     // ISO 4217 code, e.g. "NGN"
  symbol: string;   // Display symbol, e.g. "₦"
  name: string;     // Human-readable name, e.g. "Nigerian Naira"
  rate: number;     // How many units equal 1 USD (live, from API)
  locale: string;   // BCP 47 locale for Intl.NumberFormat
}

// ─── Supported currencies (country → currency) ──────────────────────────────
// Fallback rates are ONLY used when the API is unreachable AND localStorage
// has no prior cached rate. Update these periodically as a safety net.
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
  // West Africa
  NG: { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira',          rate: 1615,  locale: 'en-NG' },
  GH: { code: 'GHS', symbol: 'GH₵',  name: 'Ghanaian Cedi',           rate: 15.8,  locale: 'en-GH' },
  SN: { code: 'XOF', symbol: 'CFA',  name: 'West African CFA Franc',  rate: 615,   locale: 'fr-SN' },
  CI: { code: 'XOF', symbol: 'CFA',  name: 'West African CFA Franc',  rate: 615,   locale: 'fr-CI' },

  // East Africa
  KE: { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',         rate: 132,   locale: 'en-KE' },
  TZ: { code: 'TZS', symbol: 'TSh',  name: 'Tanzanian Shilling',      rate: 2720,  locale: 'sw-TZ' },
  UG: { code: 'UGX', symbol: 'USh',  name: 'Ugandan Shilling',        rate: 3820,  locale: 'en-UG' },
  ET: { code: 'ETB', symbol: 'Br',   name: 'Ethiopian Birr',          rate: 57,    locale: 'am-ET' },
  RW: { code: 'RWF', symbol: 'FRw',  name: 'Rwandan Franc',           rate: 1350,  locale: 'rw-RW' },

  // Southern Africa
  ZA: { code: 'ZAR', symbol: 'R',    name: 'South African Rand',      rate: 18.9,  locale: 'en-ZA' },
  ZM: { code: 'ZMW', symbol: 'ZK',   name: 'Zambian Kwacha',          rate: 28.5,  locale: 'en-ZM' },

  // Central Africa
  CM: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA',     rate: 615,   locale: 'fr-CM' },

  // North Africa
  EG: { code: 'EGP', symbol: 'E£',   name: 'Egyptian Pound',          rate: 50.2,  locale: 'ar-EG' },
  MA: { code: 'MAD', symbol: 'MAD',  name: 'Moroccan Dirham',         rate: 10.2,  locale: 'ar-MA' },
  TN: { code: 'TND', symbol: 'DT',   name: 'Tunisian Dinar',          rate: 3.2,   locale: 'ar-TN' },

  // Diaspora / global markets
  US: { code: 'USD', symbol: '$',    name: 'US Dollar',               rate: 1,     locale: 'en-US' },
  GB: { code: 'GBP', symbol: '£',    name: 'British Pound',           rate: 0.79,  locale: 'en-GB' },
  DE: { code: 'EUR', symbol: '€',    name: 'Euro',                    rate: 0.92,  locale: 'de-DE' },
  FR: { code: 'EUR', symbol: '€',    name: 'Euro',                    rate: 0.92,  locale: 'fr-FR' },
  CA: { code: 'CAD', symbol: 'CA$',  name: 'Canadian Dollar',         rate: 1.36,  locale: 'en-CA' },
  AU: { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar',       rate: 1.55,  locale: 'en-AU' },
};

// Additional diaspora currencies available in the manual selector
// (not tied to a specific country code, but shown in the dropdown)
export const EXTRA_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',        rate: 1,    locale: 'en-US' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',    rate: 0.79, locale: 'en-GB' },
  { code: 'EUR', symbol: '€',   name: 'Euro',             rate: 0.92, locale: 'de-DE' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar',  rate: 1.36, locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',rate: 1.55, locale: 'en-AU' },
];

export const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1615, locale: 'en-NG',
};

// ─── Storage keys ─────────────────────────────────────────────────────────────
const CURRENCY_KEY     = 'piyrox_currency';        // persisted user choice
const RATES_KEY        = 'piyrox_exchange_rates';  // cached rates { rates: {...}, cachedAt: number }
const RATES_TTL_MS     = 6 * 60 * 60 * 1000;      // 6 hours

// ─── Exchange rate fetching ───────────────────────────────────────────────────

interface RatesCache {
  rates: Record<string, number>; // e.g. { NGN: 1615, GHS: 15.8, ... }
  cachedAt: number;
}

/** Read cached rates from localStorage. Returns null if missing or expired. */
function readRatesCache(): RatesCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (!raw) return null;
    const parsed: RatesCache = JSON.parse(raw);
    if (!parsed?.rates || !parsed?.cachedAt) return null;
    const age = Date.now() - parsed.cachedAt;
    if (age > RATES_TTL_MS) return null; // expired — must re-fetch
    return parsed;
  } catch {
    return null;
  }
}

/** Write rates to localStorage with a timestamp. */
function writeRatesCache(rates: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RATES_KEY, JSON.stringify({ rates, cachedAt: Date.now() }));
  } catch { /* storage full — ignore */ }
}

/** Read the last-known rates from localStorage, regardless of TTL (fallback). */
function readLastKnownRates(): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (!raw) return null;
    const parsed: RatesCache = JSON.parse(raw);
    return parsed?.rates ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch live exchange rates from the backend proxy endpoint.
 * The backend calls ExchangeRate-API and returns { rates: { NGN: 1615, ... } }.
 * Falls back to last-known cached rates, then to hardcoded fallback rates.
 */
export async function fetchLiveRates(): Promise<Record<string, number>> {
  // 1. Return fresh cache if available
  const cache = readRatesCache();
  if (cache) {
    console.log('[Currency] Using cached exchange rates (age < 6h)');
    return cache.rates;
  }

  // 2. Try live API
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiBase}/currency/rates`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const rates: Record<string, number> = data?.data?.rates || data?.rates || {};
      if (Object.keys(rates).length > 0) {
        writeRatesCache(rates);
        console.log('[Currency] Live rates fetched and cached');
        return rates;
      }
    }
  } catch (err) {
    console.warn('[Currency] Live rate fetch failed:', err instanceof Error ? err.message : err);
  }

  // 3. Fall back to last-known cached rates (stale but better than nothing)
  const lastKnown = readLastKnownRates();
  if (lastKnown && Object.keys(lastKnown).length > 0) {
    console.warn('[Currency] Using stale cached rates (API unreachable)');
    return lastKnown;
  }

  // 4. Absolute last resort: hardcoded fallback rates from COUNTRY_CURRENCY_MAP
  console.warn('[Currency] No cached rates — using hardcoded fallback rates');
  const fallback: Record<string, number> = {};
  for (const config of Object.values(COUNTRY_CURRENCY_MAP)) {
    fallback[config.code] = config.rate;
  }
  for (const config of EXTRA_CURRENCIES) {
    fallback[config.code] = config.rate;
  }
  return fallback;
}

/**
 * Apply live rates to a CurrencyConfig, returning an updated copy.
 * If no rate is available for the currency code, the existing rate is kept.
 */
export function applyLiveRate(config: CurrencyConfig, rates: Record<string, number>): CurrencyConfig {
  const liveRate = rates[config.code];
  if (liveRate && liveRate > 0) {
    return { ...config, rate: liveRate };
  }
  return config;
}

// ─── Geo-detection ────────────────────────────────────────────────────────────

/**
 * Detect currency from the visitor's IP via a geo API.
 * 1. Returns the manually-persisted override from localStorage (highest priority).
 * 2. Detects country code from IP, maps to currency.
 * 3. Falls back to browser geolocation (lat/lng → country via reverse-geo).
 * 4. Falls back to DEFAULT_CURRENCY (NGN).
 *
 * After detection, applies live rates.
 * The resolved config is NOT written to localStorage here — that is handled
 * by CurrencyProvider so it can merge with live rates.
 */
export async function detectCurrency(rates?: Record<string, number>): Promise<CurrencyConfig> {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;

  // 1. Honor an existing manual choice persisted in localStorage
  try {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved) {
      const parsed: CurrencyConfig = JSON.parse(saved);
      if (parsed?.code && parsed?.symbol) {
        const liveRate = rates?.[parsed.code];
        const updated = liveRate ? { ...parsed, rate: liveRate } : parsed;
        console.log('[Currency] Restored manual override:', updated.code);
        return updated;
      }
    }
  } catch { /* ignore */ }

  // 2. IP-based detection
  try {
    const res = await fetch('https://ip-api.com/json/?fields=countryCode', {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (res.ok) {
      const data: { countryCode?: string } = await res.json();
      const cc = data.countryCode?.toUpperCase() ?? '';
      if (cc && COUNTRY_CURRENCY_MAP[cc]) {
        const config = applyLiveRate(COUNTRY_CURRENCY_MAP[cc], rates ?? {});
        console.log('[Currency] IP detected:', cc, '->', config.code);
        return config;
      }
    }
  } catch (err) {
    console.warn('[Currency] IP detection failed:', err instanceof Error ? err.message : err);
  }

  // 3. Browser geolocation fallback (lat/lng → country via open API)
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
    );
    const { latitude, longitude } = pos.coords;
    const geoRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (geoRes.ok) {
      const geoData: { countryCode?: string } = await geoRes.json();
      const cc = geoData.countryCode?.toUpperCase() ?? '';
      if (cc && COUNTRY_CURRENCY_MAP[cc]) {
        const config = applyLiveRate(COUNTRY_CURRENCY_MAP[cc], rates ?? {});
        console.log('[Currency] Geo-location detected:', cc, '->', config.code);
        return config;
      }
    }
  } catch { /* geolocation not available or denied — silent */ }

  // 4. Default
  const def = applyLiveRate(DEFAULT_CURRENCY, rates ?? {});
  console.log('[Currency] Using default currency:', def.code);
  return def;
}

// ─── Conversion & formatting ──────────────────────────────────────────────────

/** Convert a USD amount to the local currency amount. */
export function convertFromUSD(usdAmount: number, currency: CurrencyConfig): number {
  return usdAmount * currency.rate;
}

/** Convert a local currency amount back to USD. */
export function convertToUSD(localAmount: number, currency: CurrencyConfig): number {
  if (!currency.rate || currency.rate === 0) return 0;
  return localAmount / currency.rate;
}

/**
 * Format a USD amount in the local currency for display.
 *
 * @param usdAmount - raw price in USD (as stored in DB)
 * @param currency  - the active CurrencyConfig
 * @param opts      - optional Intl.NumberFormat overrides
 */
export function formatPrice(
  usdAmount: number | string | null | undefined,
  currency: CurrencyConfig,
  opts?: Intl.NumberFormatOptions,
): string {
  const usd = Number(usdAmount ?? 0);
  if (isNaN(usd)) return `${currency.symbol}0`;

  const local = usd * currency.rate;

  // Zero-decimal currencies
  const isZeroDecimal = ['JPY', 'KRW', 'UGX', 'RWF', 'XOF', 'XAF'].includes(currency.code);

  try {
    const formatter = new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
      ...opts,
    });
    return formatter.format(local);
  } catch {
    return `${currency.symbol}${isZeroDecimal ? Math.round(local) : local.toFixed(2)}`;
  }
}

/**
 * Format an amount that is already in the given currency (not USD).
 * Used for wallet balances and locked-rate order amounts stored in their
 * native currency in the database.
 */
export function formatNativeAmount(
  amount: number | string | null | undefined,
  currencyCode: string,
  locale?: string,
): string {
  const v = Number(amount ?? 0);
  if (isNaN(v)) return `${currencyCode} 0`;
  const isZeroDecimal = ['JPY', 'KRW', 'UGX', 'RWF', 'XOF', 'XAF'].includes(currencyCode);
  try {
    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(v);
  } catch {
    return `${currencyCode} ${isZeroDecimal ? Math.round(v) : v.toFixed(2)}`;
  }
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Persist the user's currency choice to localStorage so it survives sessions. */
export function saveCurrencyPreference(config: CurrencyConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENCY_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

/** Clear the persisted currency (revert to auto-detection on next visit). */
export function clearCurrencyCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CURRENCY_KEY);
  } catch { /* ignore */ }
}

/** Get all available selectable currencies (deduplicated). */
export function getAllCurrencies(): CurrencyConfig[] {
  const map = new Map<string, CurrencyConfig>();
  for (const cfg of Object.values(COUNTRY_CURRENCY_MAP)) {
    if (!map.has(cfg.code)) map.set(cfg.code, cfg);
  }
  for (const cfg of EXTRA_CURRENCIES) {
    if (!map.has(cfg.code)) map.set(cfg.code, cfg);
  }
  return Array.from(map.values());
}
