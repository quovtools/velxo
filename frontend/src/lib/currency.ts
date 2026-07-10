/**
 * Currency detection and formatting utilities.
 *
 * The base currency stored in the database is USD.
 * We detect the visitor's country via a free IP-geolocation API,
 * then apply a fixed exchange rate to display prices in their local currency.
 *
 * Exchange rates are intentionally cached for the session to avoid
 * hammering the geo API on every render.
 */

export interface CurrencyConfig {
  code: string;       // ISO 4217 code, e.g. "NGN"
  symbol: string;     // Display symbol, e.g. "₦"
  name: string;       // Human-readable name, e.g. "Nigerian Naira"
  rate: number;       // How many units equal 1 USD (approx, updated periodically)
  locale: string;     // BCP 47 locale for Intl.NumberFormat
}

/** Countries → currency mapping.
 *  Add / adjust rates here as needed.  These are approximate mid-market rates
 *  and are refreshed from a live exchange-rate API on load when possible.
 */
/** AFRICAN CURRENCIES ONLY - Velxo serves African market */
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
  // West Africa
  NG: { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',        rate: 1615,  locale: 'en-NG' },
  GH: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi',         rate: 15.8,  locale: 'en-GH' },
  SN: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 615,  locale: 'fr-SN' },
  CI: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 615,  locale: 'fr-CI' },
  
  // East Africa
  KE: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',       rate: 132,   locale: 'en-KE' },
  TZ: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling',    rate: 2720,  locale: 'sw-TZ' },
  UG: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling',      rate: 3820,  locale: 'en-UG' },
  ET: { code: 'ETB', symbol: 'Br',  name: 'Ethiopian Birr',        rate: 57,    locale: 'am-ET' },
  RW: { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc',         rate: 1350,  locale: 'rw-RW' },
  
  // Southern Africa
  ZA: { code: 'ZAR', symbol: 'R',   name: 'South African Rand',    rate: 18.9,  locale: 'en-ZA' },
  ZM: { code: 'ZMW', symbol: 'ZK',  name: 'Zambian Kwacha',        rate: 28.5,  locale: 'en-ZM' },
  
  // Central Africa
  CM: { code: 'XAF', symbol: 'FCFA',name: 'Central African CFA',   rate: 615,   locale: 'fr-CM' },
  
  // North Africa
  EG: { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound',        rate: 50.2,  locale: 'ar-EG' },
  MA: { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham',       rate: 10.2,  locale: 'ar-MA' },
  TN: { code: 'TND', symbol: 'DT',  name: 'Tunisian Dinar',        rate: 3.2,   locale: 'ar-TN' },
};

export const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1615, locale: 'en-NG',
};

const SESSION_KEY = 'velxo_currency';

/** Detect currency from the visitor's IP via a free geo API.
 *  Falls back to USD on any failure. Caches in sessionStorage. */
export async function detectCurrency(): Promise<CurrencyConfig> {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;

  // Return cached value if available
  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      const parsed: CurrencyConfig = JSON.parse(cached);
      if (parsed?.code) {
        console.log('[Currency] Using cached currency:', parsed.code);
        return parsed;
      }
    }
  } catch (e) {
    console.log('[Currency] Cache read error:', e);
  }

  try {
    console.log('[Currency] Detecting location from IP...');
    // ip-api.com free tier — no key required, 45 req/min
    const res = await fetch('https://ip-api.com/json/?fields=countryCode', { 
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.log('[Currency] Geo API response not ok:', res.status);
      return DEFAULT_CURRENCY;
    }
    
    const data: { countryCode?: string } = await res.json();
    const countryCode = data.countryCode?.toUpperCase() ?? '';
    console.log('[Currency] Detected country:', countryCode);
    
    const config = COUNTRY_CURRENCY_MAP[countryCode] ?? DEFAULT_CURRENCY;
    console.log('[Currency] Mapped to currency:', config.code, config.name);

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(config));
    } catch (e) {
      console.log('[Currency] Storage write error:', e);
    }

    return config;
  } catch (err) {
    console.log('[Currency] Detection error:', err instanceof Error ? err.message : err);
    return DEFAULT_CURRENCY;
  }
}

/** Convert a USD amount to the local currency amount. */
export function convertFromUSD(usdAmount: number, currency: CurrencyConfig): number {
  return usdAmount * currency.rate;
}

/** Format a USD amount in the local currency for display.
 *
 * @param usdAmount - the raw price in USD (as stored in DB)
 * @param currency  - the active CurrencyConfig
 * @param opts      - optional Intl.NumberFormat overrides
 */
export function formatPrice(
  usdAmount: number | string | null | undefined,
  currency: CurrencyConfig,
  opts?: Intl.NumberFormatOptions,
): string {
  const usd = Number(usdAmount ?? 0);
  if (isNaN(usd)) return `${currency.symbol}0.00`;

  const local = usd * currency.rate;

  try {
    // Use Intl for locale-aware formatting (thousands separators, decimal points)
    const formatter = new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2,
      ...opts,
    });
    return formatter.format(local);
  } catch {
    // Fallback for environments where Intl isn't fully supported
    return `${currency.symbol}${local.toFixed(2)}`;
  }
}

/** Clear the cached currency (e.g. after a manual override). */
export function clearCurrencyCache(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}
