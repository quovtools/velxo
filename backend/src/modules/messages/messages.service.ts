import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException, ForbiddenException, BadRequestException } from '@/common/exceptions/custom-exceptions'
import { MessageSenderType } from '@prisma/client'
import { MessagesGateway } from '@/modules/gateways/messages.gateway'
import { NotificationsService } from '@/modules/notifications/notifications.service'
import { CreateConversationDto } from './dto/create-conversation.dto'

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name)

  constructor(
    private prisma: PrismaService,
    private gateway: MessagesGateway,
    private notifications: NotificationsService,
  ) {}

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

  /**
   * Resolve the real buyer/seller pair for a new conversation so the
   * Conversation row is always role-correct, regardless of who initiates the
   * chat (buyer or seller). Preference order:
   *   1. explicit buyerId + sellerId on the DTO
   *   2. an orderId (read buyerId/sellerId from the order)
   *   3. a recipientId, inferring roles from seller profiles
   */
  async resolveParticipants(userId: string, dto: CreateConversationDto): Promise<{ buyerId: string; sellerId: string; orderId?: string }> {
    if (dto.buyerId && dto.sellerId) {
      return { buyerId: dto.buyerId, sellerId: dto.sellerId, orderId: dto.orderId }
    }

    if (dto.orderId) {
      const order = await this.prisma.orders.findUnique({
        where: { id: dto.orderId },
        include: { seller: true },
      })
      if (!order) throw new NotFoundException('Order')
      if (order.buyerId !== userId && order.seller?.userId !== userId) {
        throw new ForbiddenException('You are not part of this order')
      }
      return { buyerId: order.buyerId, sellerId: order.seller?.userId ?? '', orderId: dto.orderId }
    }

    if (dto.recipientId) {
      const [meSeller, themSeller] = await Promise.all([
        this.prisma.sellers.findUnique({ where: { userId } }),
        this.prisma.sellers.findUnique({ where: { userId: dto.recipientId } }),
      ])
      if (meSeller && !themSeller) return { buyerId: dto.recipientId, sellerId: userId }
      if (themSeller && !meSeller) return { buyerId: userId, sellerId: dto.recipientId }
      // Ambiguous (both or neither are sellers): default recipient as seller.
      return { buyerId: userId, sellerId: dto.recipientId }
    }

    throw new BadRequestException('Provide buyerId & sellerId, an orderId, or a recipientId')
  }

  async getConversations(userId: string, limit: number = 50) {
    const conversations = await this.prisma.conversations.findMany({
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
      take: Math.max(1, Math.floor(Number(limit))) || 50,
    })

    return Promise.all(
      conversations.map(async (c) => {
        const [buyerUser, sellerProfile] = await Promise.all([
          this.prisma.users.findUnique({
            where: { id: c.buyerId },
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          }),
          this.prisma.sellers.findUnique({
            where: { userId: c.sellerId },
            select: { storeName: true },
          }),
        ])

        const unreadCount = await this.prisma.messages.count({
          where: {
            conversationId: c.id,
            isRead: false,
            NOT: { senderId: userId },
          },
        })

        return {
          ...c,
          buyer: buyerUser,
          sellerStoreName: sellerProfile?.storeName ?? null,
          unreadCount,
          lastMessage: c.messages[0] ?? null,
        }
      }),
    )
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
      take: Math.max(1, Math.floor(Number(limit))) || 50,
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

    // Emit the new message over the real-time gateway (best effort).
    try {
      this.gateway?.emitToConversation(conversationId, 'newMessage', message)
    } catch (err) {
      this.logger.warn(`Failed to emit real-time message: ${err}`)
    }

    // Notify the recipient (the other participant) of the new message.
    try {
      const recipientId =
        senderId === conversation.buyerId ? conversation.sellerId : conversation.buyerId
      if (recipientId && recipientId !== senderId) {
        const senderName =
          [message.sender?.firstName, message.sender?.lastName]
            .filter(Boolean)
            .join(' ') || 'Someone'
        const preview = content.length > 80 ? `${content.slice(0, 77)}...` : content
        await this.notifications.notifyNewMessage(
          recipientId,
          senderName,
          preview,
          conversationId,
          conversation.orderId || undefined,
        )
      }
    } catch (err) {
      this.logger.warn(`Failed to notify message recipient: ${err}`)
    }

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
