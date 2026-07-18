import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { PrismaService } from '@/common/services/prisma.service'
import { RewardsModule } from '../rewards/rewards.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { AffiliateModule } from '../affiliate/affiliate.module'
import { CurrencyService } from '@/common/services/currency.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, CurrencyService],
  exports: [OrdersService],
  imports: [RewardsModule, NotificationsModule, AffiliateModule, ConfigModule],
})
export class OrdersModule {}
