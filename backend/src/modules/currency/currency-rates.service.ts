import { Injectable, Logger } from '@nestjs/common'

export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
  rate: number
  locale: string
}

// ─── Fallback rates (used only when API is unreachable AND cache is empty) ───
// These mirror the frontend's COUNTRY_CURRENCY_MAP fallback values.
// Update periodically as a safety net — never used if live rates are available.
const FALLBACK_RATES: Record<string, number> = {
  NGN: 1615, GHS: 15.8, KES: 132, TZS: 2720, UGX: 3820, ZAR: 18.9,
  ZMW: 28.5, RWF: 1350, ETB: 57, XOF: 615, XAF: 615, EGP: 50.2,
  MAD: 10.2, TND: 3.2, USD: 1, GBP: 0.79, EUR: 0.92, CAD: 1.36,
  AUD: 1.55, AED: 3.67, SAR: 3.75, INR: 83.5, PHP: 57, IDR: 15700,
  MYR: 4.7, SGD: 1.34, THB: 35.5, PKR: 278, BDT: 110, JPY: 150,
  CNY: 7.24, KRW: 1330, BRL: 4.97, MXN: 17.2,
}

// Country → currency mapping (superset of frontend map for backend email use)
const COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
  NG: { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira',          rate: 1615,  locale: 'en-NG' },
  GH: { code: 'GHS', symbol: 'GH₵',  name: 'Ghanaian Cedi',           rate: 15.8,  locale: 'en-GH' },
  KE: { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',         rate: 132,   locale: 'en-KE' },
  TZ: { code: 'TZS', symbol: 'TSh',  name: 'Tanzanian Shilling',      rate: 2720,  locale: 'sw-TZ' },
  UG: { code: 'UGX', symbol: 'USh',  name: 'Ugandan Shilling',        rate: 3820,  locale: 'en-UG' },
  ZA: { code: 'ZAR', symbol: 'R',    name: 'South African Rand',      rate: 18.9,  locale: 'en-ZA' },
  ZM: { code: 'ZMW', symbol: 'ZK',   name: 'Zambian Kwacha',          rate: 28.5,  locale: 'en-ZM' },
  RW: { code: 'RWF', symbol: 'FRw',  name: 'Rwandan Franc',           rate: 1350,  locale: 'rw-RW' },
  ET: { code: 'ETB', symbol: 'Br',   name: 'Ethiopian Birr',          rate: 57,    locale: 'am-ET' },
  SN: { code: 'XOF', symbol: 'CFA',  name: 'West African CFA Franc',  rate: 615,   locale: 'fr-SN' },
  CI: { code: 'XOF', symbol: 'CFA',  name: 'West African CFA Franc',  rate: 615,   locale: 'fr-CI' },
  CM: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA',     rate: 615,   locale: 'fr-CM' },
  EG: { code: 'EGP', symbol: 'E£',   name: 'Egyptian Pound',          rate: 50.2,  locale: 'ar-EG' },
  MA: { code: 'MAD', symbol: 'MAD',  name: 'Moroccan Dirham',         rate: 10.2,  locale: 'ar-MA' },
  TN: { code: 'TND', symbol: 'DT',   name: 'Tunisian Dinar',          rate: 3.2,   locale: 'ar-TN' },
  US: { code: 'USD', symbol: '$',    name: 'US Dollar',               rate: 1,     locale: 'en-US' },
  GB: { code: 'GBP', symbol: '£',    name: 'British Pound',           rate: 0.79,  locale: 'en-GB' },
  DE: { code: 'EUR', symbol: '€',    name: 'Euro',                    rate: 0.92,  locale: 'de-DE' },
  FR: { code: 'EUR', symbol: '€',    name: 'Euro',                    rate: 0.92,  locale: 'fr-FR' },
  CA: { code: 'CAD', symbol: 'CA$',  name: 'Canadian Dollar',         rate: 1.36,  locale: 'en-CA' },
  AU: { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar',       rate: 1.55,  locale: 'en-AU' },
  AE: { code: 'AED', symbol: 'AED',  name: 'UAE Dirham',              rate: 3.67,  locale: 'ar-AE' },
  SA: { code: 'SAR', symbol: 'SR',   name: 'Saudi Riyal',             rate: 3.75,  locale: 'ar-SA' },
  IN: { code: 'INR', symbol: '₹',    name: 'Indian Rupee',            rate: 83.5,  locale: 'en-IN' },
  PH: { code: 'PHP', symbol: '₱',    name: 'Philippine Peso',         rate: 57,    locale: 'fil-PH' },
  JP: { code: 'JPY', symbol: '¥',    name: 'Japanese Yen',            rate: 150,   locale: 'ja-JP' },
}

const DEFAULT_CURRENCY: CurrencyConfig = COUNTRY_CURRENCY_MAP['NG']

const RATES_TTL_MS = 6 * 60 * 60 * 1000  // 6 hours

@Injectable()
export class CurrencyRatesService {
  private readonly logger = new Logger(CurrencyRatesService.name)

  /** In-memory rate cache { rates, cachedAt } */
  private ratesCache: { rates: Record<string, number>; cachedAt: number } | null = null

  /**
   * Fetch live exchange rates (USD base).
   * Priority: in-memory cache (< 6h) → ExchangeRate-API → last stale cache → hardcoded fallback.
   */
  async getLiveRates(): Promise<Record<string, number>> {
    // 1. Return fresh in-memory cache
    if (this.ratesCache && Date.now() - this.ratesCache.cachedAt < RATES_TTL_MS) {
      return this.ratesCache.rates
    }

    // 2. Try ExchangeRate-API (free tier, no key required for open endpoint;
    //    or use key from EXCHANGE_RATE_API_KEY env var for higher limits)
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    const apiUrl = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      : 'https://open.er-api.com/v6/latest/USD'

    try {
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const data = await res.json()
        // Both ExchangeRate-API and open.er-api return { rates: {...} }
        const rates: Record<string, number> = data?.rates || data?.conversion_rates || {}
        if (Object.keys(rates).length > 0) {
          this.ratesCache = { rates, cachedAt: Date.now() }
          this.logger.log(`Exchange rates refreshed from live API (${Object.keys(rates).length} currencies)`)
          return rates
        }
      }
    } catch (err: any) {
      this.logger.warn(`Live rate fetch failed: ${err?.message || err}`)
    }

    // 3. Return stale in-memory cache (any age) — better than fallback
    if (this.ratesCache) {
      this.logger.warn('Using stale cached rates (API unreachable)')
      return this.ratesCache.rates
    }

    // 4. Absolute last resort: hardcoded fallback
    this.logger.warn('No cached rates — using hardcoded fallback rates')
    return FALLBACK_RATES
  }

  /**
   * Get a CurrencyConfig for a given currency code with the live rate applied.
   */
  async getCurrencyByCode(code: string): Promise<CurrencyConfig> {
    const rates = await this.getLiveRates()
    const upperCode = code?.toUpperCase() || 'USD'

    // Find a matching config from the map
    const config = Object.values(COUNTRY_CURRENCY_MAP).find((c) => c.code === upperCode)
    if (config) {
      const liveRate = rates[upperCode]
      return liveRate ? { ...config, rate: liveRate } : config
    }

    // Fallback: synthesize a minimal config using just the code
    const liveRate = rates[upperCode] || 1
    return { code: upperCode, symbol: upperCode, name: upperCode, rate: liveRate, locale: 'en-US' }
  }

  /**
   * Detect the user's currency from their IP address.
   * Returns a CurrencyConfig with the live rate applied.
   */
  async detectCurrencyFromIP(ip: string): Promise<CurrencyConfig & { countryCode: string }> {
    try {
      // Skip private/loopback IPs
      if (!ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('::1') || ip === 'localhost') {
        const config = await this.getCurrencyByCode(DEFAULT_CURRENCY.code)
        return { ...config, countryCode: 'NG' }
      }

      const res = await fetch(
        `https://ip-api.com/json/${ip}?fields=countryCode`,
        { signal: AbortSignal.timeout(4000) },
      )
      if (res.ok) {
        const data: { countryCode?: string } = await res.json()
        const cc = data.countryCode?.toUpperCase() || ''
        const mapEntry = COUNTRY_CURRENCY_MAP[cc]
        if (mapEntry) {
          const config = await this.getCurrencyByCode(mapEntry.code)
          return { ...config, countryCode: cc }
        }
      }
    } catch (err: any) {
      this.logger.warn(`IP geo-detection failed for ${ip}: ${err?.message || err}`)
    }

    const config = await this.getCurrencyByCode(DEFAULT_CURRENCY.code)
    return { ...config, countryCode: 'NG' }
  }

  /**
   * Convert a USD amount to the target currency using live rates.
   */
  async convertFromUSD(usdAmount: number, targetCurrencyCode: string): Promise<number> {
    const rates = await this.getLiveRates()
    const rate = rates[targetCurrencyCode?.toUpperCase()] || 1
    return usdAmount * rate
  }

  /**
   * Convert a local currency amount to USD using live rates.
   */
  async convertToUSD(localAmount: number, fromCurrencyCode: string): Promise<number> {
    const rates = await this.getLiveRates()
    const rate = rates[fromCurrencyCode?.toUpperCase()] || 1
    return localAmount / rate
  }

  /**
   * Format a monetary amount for display in emails (server-side, no browser Intl).
   * Returns a string like "₦1,615.00" or "$10.00".
   */
  formatAmount(amount: number, currencyCode: string, locale?: string): string {
    try {
      const config = Object.values(COUNTRY_CURRENCY_MAP).find((c) => c.code === currencyCode?.toUpperCase())
      const useLocale = locale || config?.locale || 'en-US'
      const isZeroDecimal = ['JPY', 'KRW', 'UGX', 'RWF', 'XOF', 'XAF'].includes(currencyCode?.toUpperCase())
      return new Intl.NumberFormat(useLocale, {
        style: 'currency',
        currency: currencyCode?.toUpperCase() || 'USD',
        minimumFractionDigits: isZeroDecimal ? 0 : 2,
        maximumFractionDigits: isZeroDecimal ? 0 : 2,
      }).format(amount)
    } catch {
      return `${currencyCode} ${Number(amount).toFixed(2)}`
    }
  }
}
