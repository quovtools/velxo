import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './prisma.service'
import { CurrencyService } from './currency.service'

// FIX #12: CurrencyService was never registered in any shared module.
// By exporting it from PrismaModule (the common shared module imported
// everywhere), any module that imports PrismaModule gets CurrencyService too.
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [PrismaService, CurrencyService],
  exports: [PrismaService, CurrencyService],
})
export class PrismaModule {}
