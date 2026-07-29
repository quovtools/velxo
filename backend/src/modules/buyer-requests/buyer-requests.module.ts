import { Module } from '@nestjs/common'
import { BuyerRequestsController } from './buyer-requests.controller'
import { BuyerRequestsService } from './buyer-requests.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [BuyerRequestsController],
  providers: [BuyerRequestsService, PrismaService],
  exports: [BuyerRequestsService],
})
export class BuyerRequestsModule {}
