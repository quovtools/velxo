import { Module } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { MessagesController } from './messages.controller'
import { PrismaModule } from '../../common/services/prisma.module'
import { MessagesGateway } from '../gateways/messages.gateway'

@Module({
  imports: [PrismaModule, MessagesGateway],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
