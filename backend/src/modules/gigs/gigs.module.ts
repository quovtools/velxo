import { Module } from '@nestjs/common'
import { GigsController } from './gigs.controller'
import { GigsService } from './gigs.service'
import { PrismaService } from '@/common/services/prisma.service'
import { OrdersModule } from '../orders/orders.module'

@Module({
  controllers: [GigsController],
  providers: [GigsService, PrismaService],
  exports: [GigsService],
  imports: [OrdersModule],
})
export class GigsModule {}
