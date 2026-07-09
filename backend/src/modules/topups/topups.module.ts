import { Module } from '@nestjs/common'
import { TopupsController } from './topups.controller'
import { TopupsService } from './topups.service'
import { PrismaService } from '@/common/services/prisma.service'
import { OrdersModule } from '../orders/orders.module'

@Module({
  controllers: [TopupsController],
  providers: [TopupsService, PrismaService],
  exports: [TopupsService],
  imports: [OrdersModule],
})
export class TopupsModule {}
