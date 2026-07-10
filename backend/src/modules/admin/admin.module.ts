import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { BulkOperationsService } from './bulk-operations.service'
import { ImageBulkOperationsService } from './image-bulk-operations.service'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationsModule } from '@/modules/notifications/notifications.module'
import { SellersModule } from '@/modules/sellers/sellers.module'

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    BulkOperationsService,
    ImageBulkOperationsService,
    PrismaService,
  ],
  exports: [AdminService, BulkOperationsService, ImageBulkOperationsService],
  imports: [NotificationsModule, SellersModule],
})
export class AdminModule {}
