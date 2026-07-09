import { Module } from '@nestjs/common'
import { MessagesGateway } from './messages.gateway'
import { NotificationsGateway } from './notifications.gateway'

@Module({
  providers: [MessagesGateway, NotificationsGateway],
  exports: [MessagesGateway, NotificationsGateway],
})
export class GatewayModule {}
