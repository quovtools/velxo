import { Module } from '@nestjs/common'
import { DisputesController } from './disputes.controller'
import { DisputesService } from './disputes.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [DisputesController],
  providers: [DisputesService, PrismaService],
  exports: [DisputesService],
})
export class DisputesModule {}
