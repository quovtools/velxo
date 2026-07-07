import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { PrismaService } from '@/common/services/prisma.service'
import { RewardsModule } from '../rewards/rewards.module'

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
  imports: [RewardsModule],
})
export class OrdersModule {}
