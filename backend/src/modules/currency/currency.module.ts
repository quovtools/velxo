import { Module, Global } from '@nestjs/common'
import { CurrencyController } from './currency.controller'
import { CurrencyRatesService } from './currency-rates.service'

/**
 * Global CurrencyModule — provides CurrencyRatesService to all modules.
 * No imports needed in other modules; just inject CurrencyRatesService.
 */
@Global()
@Module({
  controllers: [CurrencyController],
  providers: [CurrencyRatesService],
  exports: [CurrencyRatesService],
})
export class CurrencyModule {}
