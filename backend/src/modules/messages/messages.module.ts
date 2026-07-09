import { Module } from '@nestjs/common'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { PrismaService } from '@/common/services/prisma.service'
import { GatewayModule } from '@/modules/gateways'
import { NotificationsModule } from '@/modules/notifications/notifications.module'

@Module({
  imports: [GatewayModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService],
  exports: [MessagesService],
})
export class MessagesModule {}
