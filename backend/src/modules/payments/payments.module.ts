import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { PaymentIoService } from './paymentio.service'
import { FlutterwaveService } from './flutterwave.service'
import { CheckoutController } from './checkout.controller'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationsModule } from '@/modules/notifications/notifications.module'
import { OrdersModule } from '@/modules/orders/orders.module'
import { WalletModule } from '@/modules/wallet/wallet.module'

@Module({
  controllers: [PaymentsController, CheckoutController],
  providers: [PaymentsService, PaymentIoService, FlutterwaveService, PrismaService],
  exports: [PaymentsService, PaymentIoService],
  imports: [NotificationsModule, OrdersModule, WalletModule],
})
export class PaymentsModule {}
