import { Module } from '@nestjs/common'
import { WalletController } from './wallet.controller'
import { WalletService } from './wallet.service'
import { PrismaService } from '@/common/services/prisma.service'
import { FlutterwaveService } from '@/modules/payments/flutterwave.service'
import { PaymentIoService } from '@/modules/payments/paymentio.service'

@Module({
  controllers: [WalletController],
  providers: [WalletService, PrismaService, FlutterwaveService, PaymentIoService],
  exports: [WalletService],
})
export class WalletModule {}
