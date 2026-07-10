import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  locale: string;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  private readonly COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
    // Africa
    NG: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1600, locale: 'en-NG' },
    GH: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 15.5, locale: 'en-GH' },
    ZA: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.5, locale: 'en-ZA' },
    KE: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 129, locale: 'en-KE' },
    TZ: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', rate: 2650, locale: 'sw-TZ' },
    UG: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', rate: 3740, locale: 'sw-UG' },
    ET: { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', rate: 56, locale: 'am-ET' },
    SN: { code: 'XOF', symbol: 'CFA', name: 'West African CFA', rate: 609, locale: 'fr-SN' },
    CI: { code: 'XOF', symbol: 'CFA', name: 'West African CFA', rate: 609, locale: 'fr-CI' },
    CM: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA', rate: 609, locale: 'fr-CM' },
    EG: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', rate: 49, locale: 'ar-EG' },
    MA: { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', rate: 10, locale: 'ar-MA' },
    TN: { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar', rate: 3.1, locale: 'ar-TN' },
    ZM: { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', rate: 27, locale: 'en-ZM' },
    RW: { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', rate: 1320, locale: 'rw-RW' },
    
    // Middle East
    AE: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 3.67, locale: 'ar-AE' },
    SA: { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal', rate: 3.75, locale: 'ar-SA' },
    QA: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', rate: 3.64, locale: 'ar-QA' },
    KW: { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', rate: 0.307, locale: 'ar-KW' },
    
    // Europe
    GB: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, locale: 'en-GB' },
    DE: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, locale: 'de-DE' },
    FR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, locale: 'fr-FR' },
    IT: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, locale: 'it-IT' },
    ES: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, locale: 'es-ES' },
    NL: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, locale: 'nl-NL' },
    
    // Americas
    US: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, locale: 'en-US' },
    CA: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.36, locale: 'en-CA' },
    BR: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 4.97, locale: 'pt-BR' },
    MX: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', rate: 17.2, locale: 'es-MX' },
    
    // Asia-Pacific
    IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.5, locale: 'en-IN' },
    PH: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 57, locale: 'fil-PH' },
    ID: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15700, locale: 'id-ID' },
    MY: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.7, locale: 'ms-MY' },
    SG: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.34, locale: 'en-SG' },
    TH: { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 35.5, locale: 'th-TH' },
    PK: { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', rate: 278, locale: 'ur-PK' },
    BD: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 110, locale: 'bn-BD' },
    AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.55, locale: 'en-AU' },
    JP: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 150, locale: 'ja-JP' },
    CN: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24, locale: 'zh-CN' },
    KR: { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1330, locale: 'ko-KR' },
  };

  private readonly DEFAULT_CURRENCY: CurrencyConfig = {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 1,
    locale: 'en-US',
  };

  constructor(private configService: ConfigService) {}

  /**
   * Get currency config by country code
   */
  getCurrencyByCountry(countryCode: string): CurrencyConfig {
    const code = countryCode?.toUpperCase();
    return this.COUNTRY_CURRENCY_MAP[code] || this.DEFAULT_CURRENCY;
  }

  /**
   * Get currency config by code
   */
  getCurrencyByCode(currencyCode: string): CurrencyConfig {
    const code = currencyCode?.toUpperCase();
    for (const config of Object.values(this.COUNTRY_CURRENCY_MAP)) {
      if (config.code === code) return config;
    }
    return this.DEFAULT_CURRENCY;
  }

  /**
   * Convert USD amount to local currency
   */
  convertFromUSD(usdAmount: number, currency: CurrencyConfig): number {
    return usdAmount * currency.rate;
  }

  /**
   * Convert local currency amount to USD
   */
  convertToUSD(localAmount: number, currency: CurrencyConfig): number {
    if (currency.rate === 0) return 0;
    return localAmount / currency.rate;
  }

  /**
   * Format price for display
   */
  formatPrice(usdAmount: number, currency: CurrencyConfig): string {
    const localAmount = this.convertFromUSD(usdAmount, currency);
    try {
      const formatter = new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2,
        maximumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2,
      });
      return formatter.format(localAmount);
    } catch {
      return `${currency.symbol}${localAmount.toFixed(2)}`;
    }
  }

  /**
   * Get all supported currencies
   */
  getAllCurrencies(): CurrencyConfig[] {
    return Object.values(this.COUNTRY_CURRENCY_MAP).filter(
      (c, i, arr) => arr.findIndex((x) => x.code === c.code) === i,
    );
  }

  /**
   * Detect country from IP geolocation
   */
  async detectCountryFromIP(ipAddress: string): Promise<string> {
    try {
      // Use the same IP geolocation API as frontend
      const response = await fetch(
        `https://ip-api.com/json/${ipAddress}?fields=countryCode`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!response.ok) {
        this.logger.warn(`Geolocation API returned status ${response.status}`);
        return 'US';
      }

      const data = await response.json() as { countryCode?: string };
      const countryCode = data.countryCode?.toUpperCase() || 'US';
      this.logger.debug(`Detected country ${countryCode} for IP ${ipAddress}`);
      return countryCode;
    } catch (error) {
      this.logger.warn(`Failed to detect country from IP ${ipAddress}:`, error);
      return 'US'; // Fallback to US
    }
  }
}
