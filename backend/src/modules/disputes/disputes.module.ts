import { Module } from '@nestjs/common'
import { DisputesController } from './disputes.controller'
import { DisputesService } from './disputes.service'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationsModule } from '@/modules/notifications/notifications.module'

@Module({
  controllers: [DisputesController],
  providers: [DisputesService, PrismaService],
  exports: [DisputesService],
  imports: [NotificationsModule],
})
export class DisputesModule {}
