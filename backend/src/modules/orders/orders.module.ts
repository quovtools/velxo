import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { PrismaService } from '@/common/services/prisma.service'
import { RewardsModule } from '../rewards/rewards.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { AffiliateModule } from '../affiliate/affiliate.module'

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
  imports: [RewardsModule, NotificationsModule, AffiliateModule],
})
export class OrdersModule {}
