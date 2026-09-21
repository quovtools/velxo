import { Module } from '@nestjs/common'
import { StatsController } from './stats.controller'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [StatsController],
  providers: [PrismaService],
})
export class StatsModule {}
