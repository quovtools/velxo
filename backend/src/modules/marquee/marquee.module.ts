import { Module } from '@nestjs/common'
import { MarqueeController } from './marquee.controller'
import { MarqueeService } from './marquee.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [MarqueeController],
  providers: [MarqueeService, PrismaService],
  exports: [MarqueeService],
})
export class MarqueeModule {}
