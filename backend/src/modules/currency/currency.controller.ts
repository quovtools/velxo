import { Controller, Get, Req, Logger } from '@nestjs/common'
import { Request } from 'express'
import { CurrencyRatesService } from './currency-rates.service'

@Controller('currency')
export class CurrencyController {
  private readonly logger = new Logger(CurrencyController.name)

  constructor(private readonly currencyRatesService: CurrencyRatesService) {}

  /**
   * GET /currency/rates
   * Returns live exchange rates (USD base) for all supported currencies.
   * Rates are cached on the server for 6 hours. If the upstream API is
   * unreachable the last-known cached rates are returned so the client
   * always gets a valid response.
   */
  @Get('rates')
  async getRates() {
    const rates = await this.currencyRatesService.getLiveRates()
    return {
      success: true,
      data: { rates, base: 'USD', cachedAt: new Date().toISOString() },
    }
  }

  /**
   * GET /currency/detect
   * Detects the caller's country from their IP address and returns the
   * matching currency config (code, symbol, name, live rate).
   */
  @Get('detect')
  async detect(@Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '0.0.0.0'

    const result = await this.currencyRatesService.detectCurrencyFromIP(ip)
    return { success: true, data: result }
  }
}
