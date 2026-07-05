import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './common/services/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { SellersModule } from './modules/sellers/sellers.module'
import { ListingsModule } from './modules/listings/listings.module'
import { OrdersModule } from './modules/orders/orders.module'
import { EscrowModule } from './modules/escrow/escrow.module'
import { WalletModule } from './modules/wallet/wallet.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { MessagesModule } from './modules/messages/messages.module'
import { ReviewsModule } from './modules/reviews/reviews.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { DisputesModule } from './modules/disputes/disputes.module'
import { SupportModule } from './modules/support/support.module'
import { AdminModule } from './modules/admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SellersModule,
    ListingsModule,
    OrdersModule,
    EscrowModule,
    WalletModule,
    PaymentsModule,
    MessagesModule,
    ReviewsModule,
    NotificationsModule,
    DisputesModule,
    SupportModule,
    AdminModule,
  ],
})
export class AppModule {}
