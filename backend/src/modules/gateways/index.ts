import { Module } from '@nestjs/common'
import { MessagesGateway } from './messages.gateway'
import { NotificationsGateway } from './notifications.gateway'
import { PrismaModule } from '@/common/services/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [MessagesGateway, NotificationsGateway],
  exports: [MessagesGateway, NotificationsGateway],
})
export class GatewayModule {}
