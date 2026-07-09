import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { PrismaService } from '@/common/services/prisma.service'
import { GatewayModule } from '@/modules/gateways'

@Module({
  imports: [GatewayModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
