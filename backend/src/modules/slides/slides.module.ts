import { Module } from '@nestjs/common'
import { SlidesController } from './slides.controller'
import { SlidesService } from './slides.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [SlidesController],
  providers: [SlidesService, PrismaService],
  exports: [SlidesService],
})
export class SlidesModule {}
