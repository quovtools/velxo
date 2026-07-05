import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findConversation(conversationId: string) {
    const messages = await this.prisma.messages.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } })
    return { success: true, data: messages }
  }

  async send(senderId: string, dto: any) {
    const message = await this.prisma.messages.create({ data: { conversationId: dto.conversationId, senderId, content: dto.content, attachments: dto.attachments || [] } })
    return { success: true, data: message }
  }
}
