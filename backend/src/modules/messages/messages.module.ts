import { Module } from '@nestjs/common'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { PrismaService } from '@/common/services/prisma.service'
import { GatewayModule } from '@/modules/gateways'

@Module({
  imports: [GatewayModule],
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService],
  exports: [MessagesService],
})
export class MessagesModule {}
