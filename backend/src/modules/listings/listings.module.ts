import { Module } from '@nestjs/common'
import { ListingsController } from './listings.controller'
import { ListingsService } from './listings.service'
import { FeaturedRotationService } from './featured-rotation.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, FeaturedRotationService, PrismaService],
  exports: [ListingsService, FeaturedRotationService],
})
export class ListingsModule {}
