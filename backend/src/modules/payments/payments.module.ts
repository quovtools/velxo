import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { PaymentIoService } from './paymentio.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentIoService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
