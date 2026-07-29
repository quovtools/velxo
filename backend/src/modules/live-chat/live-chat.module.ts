import { Module } from '@nestjs/common'
import { LiveChatController } from './live-chat.controller'
import { LiveChatService } from './live-chat.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [LiveChatController],
  providers: [LiveChatService, PrismaService],
  exports: [LiveChatService],
})
export class LiveChatModule {}
