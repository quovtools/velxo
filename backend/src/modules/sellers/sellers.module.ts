import { Module } from '@nestjs/common'
import { SellersController } from './sellers.controller'
import { SellersService } from './sellers.service'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationsModule } from '@/modules/notifications/notifications.module'

@Module({
  imports: [NotificationsModule],
  controllers: [SellersController],
  providers: [SellersService, PrismaService],
  exports: [SellersService],
})
export class SellersModule {}
