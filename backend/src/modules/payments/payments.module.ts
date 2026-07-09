import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { PaymentIoService } from './paymentio.service'
import { FlutterwaveService } from './flutterwave.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentIoService, FlutterwaveService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
