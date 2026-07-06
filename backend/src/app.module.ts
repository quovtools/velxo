import { Module, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { PrismaModule } from './common/services/prisma.module'
import { AppController } from './app.controller'
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
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

@Module({
  controllers: [AppController],
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
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}

