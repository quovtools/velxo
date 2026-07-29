import { Module } from '@nestjs/common'
import { GameBannersController } from './game-banners.controller'
import { GameBannersService } from './game-banners.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [GameBannersController],
  providers: [GameBannersService, PrismaService],
  exports: [GameBannersService],
})
export class GameBannersModule {}
