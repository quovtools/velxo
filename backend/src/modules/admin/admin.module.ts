import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationsModule } from '@/modules/notifications/notifications.module'
import { SellersModule } from '@/modules/sellers/sellers.module'

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
  imports: [NotificationsModule, SellersModule],
})
export class AdminModule {}
