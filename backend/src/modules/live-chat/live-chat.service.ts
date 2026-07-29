import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class LiveChatService {
  constructor(private prisma: PrismaService) {}

  /** Visitor: get or create a chat session */
  async getOrCreateSession(visitorId: string, opts?: {
    visitorName?: string
    visitorEmail?: string
    subject?: string
  }) {
    let chat = await this.prisma.liveChats.findFirst({
      where: { visitorId, status: { in: ['OPEN', 'ASSIGNED'] } },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!chat) {
      chat = await this.prisma.liveChats.create({
        data: {
          visitorId,
          visitorName: opts?.visitorName,
          visitorEmail: opts?.visitorEmail,
          subject: opts?.subject ?? 'General enquiry',
          status: 'OPEN',
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    }
    return chat
  }

  /** Visitor: send a message */
  async visitorSend(visitorId: string, content: string) {
    const chat = await this.prisma.liveChats.findFirst({
      where: { visitorId, status: { in: ['OPEN', 'ASSIGNED'] } },
    })
    if (!chat) throw new NotFoundException('No active chat session. Start a new chat first.')
    const msg = await this.prisma.liveChatMessages.create({
      data: { chatId: chat.id, senderType: 'visitor', content },
    })
    await this.prisma.liveChats.update({ where: { id: chat.id }, data: { updatedAt: new Date() } })
    return msg
  }

  /** Visitor: poll for new messages since a timestamp */
  async visitorPoll(visitorId: string, since?: string) {
    const chat = await this.prisma.liveChats.findFirst({
      where: { visitorId, status: { in: ['OPEN', 'ASSIGNED', 'RESOLVED'] } },
    })
    if (!chat) return { messages: [], chatStatus: 'NONE' }

    const where: any = { chatId: chat.id }
    if (since) where.createdAt = { gt: new Date(since) }

    const messages = await this.prisma.liveChatMessages.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    // Mark admin messages as read
    await this.prisma.liveChatMessages.updateMany({
      where: { chatId: chat.id, senderType: 'admin', isRead: false },
      data: { isRead: true },
    })

    return { messages, chatStatus: chat.status, chatId: chat.id }
  }

  /** Admin: get all chats with optional status filter */
  async adminGetChats(status?: string, limit = 50) {
    const where: any = {}
    if (status) where.status = status
    return this.prisma.liveChats.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    })
  }

  /** Admin: get full chat thread */
  async adminGetThread(chatId: string) {
    const chat = await this.prisma.liveChats.findUnique({
      where: { id: chatId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!chat) throw new NotFoundException('Chat not found')
    // Mark visitor messages as read
    await this.prisma.liveChatMessages.updateMany({
      where: { chatId, senderType: 'visitor', isRead: false },
      data: { isRead: true },
    })
    return chat
  }

  /** Admin: send a reply */
  async adminSend(chatId: string, content: string) {
    const chat = await this.prisma.liveChats.findUnique({ where: { id: chatId } })
    if (!chat) throw new NotFoundException('Chat not found')
    const msg = await this.prisma.liveChatMessages.create({
      data: { chatId, senderType: 'admin', content },
    })
    await this.prisma.liveChats.update({
      where: { id: chatId },
      data: { status: 'ASSIGNED', updatedAt: new Date() },
    })
    return msg
  }

  /** Admin: update chat status */
  async adminSetStatus(chatId: string, status: string) {
    const chat = await this.prisma.liveChats.findUnique({ where: { id: chatId } })
    if (!chat) throw new NotFoundException('Chat not found')
    return this.prisma.liveChats.update({
      where: { id: chatId },
      data: {
        status: status as any,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
        closedAt: status === 'CLOSED' ? new Date() : undefined,
      },
    })
  }

  /** Admin: unread count for badge */
  async adminUnreadCount() {
    const count = await this.prisma.liveChatMessages.count({
      where: { senderType: 'visitor', isRead: false },
    })
    return count
  }
}
