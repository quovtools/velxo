import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException, ForbiddenException } from '@/common/exceptions/custom-exceptions'
import { MessageSenderType } from '@prisma/client'

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name)

  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(buyerId: string, sellerId: string, orderId?: string) {
    this.logger.log(`Getting or creating conversation between ${buyerId} and ${sellerId}`)

    let conversation = await this.prisma.conversations.findFirst({
      where: {
        OR: [
          { buyerId, sellerId },
          { buyerId: sellerId, sellerId: buyerId },
        ],
      },
    })

    if (!conversation) {
      conversation = await this.prisma.conversations.create({
        data: {
          buyerId,
          sellerId,
          orderId,
        },
      })
    }

    return conversation
  }

  async getConversations(userId: string, limit: number = 50) {
    return this.prisma.conversations.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        isBlocked: false,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
    })
  }

  async getConversationMessages(conversationId: string, userId?: string, limit: number = 50) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new NotFoundException('Conversation')
    }

    if (userId && conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this conversation')
    }

    return this.prisma.messages.findMany({
      where: { conversationId, isDeleted: false },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: string[],
  ) {
    this.logger.log(`Sending message in conversation ${conversationId}`)

    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new NotFoundException('Conversation')
    }

    // Verify sender is part of conversation
    if (
      senderId !== conversation.buyerId &&
      senderId !== conversation.sellerId
    ) {
      throw new ForbiddenException('You are not part of this conversation')
    }

    const message = await this.prisma.$transaction(async (tx) => {
      // Create message
      const newMessage = await tx.messages.create({
        data: {
          conversationId,
          senderId,
          senderType: senderId === conversation.buyerId ? 'BUYER' : 'SELLER',
          content,
          attachments: attachments || [],
        },
        include: { sender: true },
      })

      // Update conversation last message time
      await tx.conversations.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      })

      return newMessage
    })

    // TODO: Emit WebSocket event for real-time updates

    return message
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    this.logger.log(`Marking messages as read in conversation ${conversationId}`)

    return this.prisma.messages.updateMany({
      where: {
        conversationId,
        isRead: false,
        NOT: { senderId: userId },
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  async getUnreadCount(userId: string) {
    const unread = await this.prisma.messages.count({
      where: {
        conversation: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        isRead: false,
        NOT: { senderId: userId },
      },
    })

    return { unreadCount: unread }
  }

  async deleteMessage(messageId: string, userId: string) {
    this.logger.log(`Deleting message ${messageId}`)

    const message = await this.prisma.messages.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      throw new NotFoundException('Message')
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages')
    }

    return this.prisma.messages.update({
      where: { id: messageId },
      data: { isDeleted: true },
    })
  }

  async blockConversation(conversationId: string, userId: string) {
    this.logger.log(`Blocking conversation ${conversationId}`)

    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new NotFoundException('Conversation')
    }

    if (
      userId !== conversation.buyerId &&
      userId !== conversation.sellerId
    ) {
      throw new ForbiddenException('You are not part of this conversation')
    }

    return this.prisma.conversations.update({
      where: { id: conversationId },
      data: { isBlocked: true },
    })
  }
}
