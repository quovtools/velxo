import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { PrismaService } from '@/common/services/prisma.service'
import { GatewayModule } from '@/modules/gateways'
import { EmailService } from '@/shared/email.service'

@Module({
  imports: [GatewayModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService, EmailService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
