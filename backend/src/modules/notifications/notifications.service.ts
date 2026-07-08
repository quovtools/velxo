import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationType } from '@prisma/client'
import { NotFoundException } from '@/common/exceptions/custom-exceptions'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    return this.prisma.notifications.create({
      data: {
        userId,
        type,
        title,
        body,
        data,
      },
    })
  }

  async getNotifications(userId: string, limit: number = 50) {
    return this.prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getUnreadNotifications(userId: string) {
    return this.prisma.notifications.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    })
  }

  async markAsRead(notificationId: string, userId?: string) {
    if (userId) {
      const existing = await this.prisma.notifications.findUnique({
        where: { id: notificationId },
      })
      if (!existing || existing.userId !== userId) {
        throw new NotFoundException('Notification')
      }
    }
    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    })
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
  }

  async deleteNotification(notificationId: string, userId?: string) {
    if (userId) {
      const existing = await this.prisma.notifications.findUnique({
        where: { id: notificationId },
      })
      if (!existing || existing.userId !== userId) {
        throw new NotFoundException('Notification')
      }
    }
    return this.prisma.notifications.delete({
      where: { id: notificationId },
    })
  }

  async notifyOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
    })

    if (!order) return

    await this.createNotification(
      order.buyerId,
      'ORDER_STATUS',
      'Order Status Updated',
      `Your order ${order.orderNumber} status changed to ${status}`,
      { orderId, status },
    )
  }

  async notifyDispute(disputeId: string, userId: string) {
    await this.createNotification(
      userId,
      'DISPUTE',
      'Dispute Opened',
      'A dispute has been opened for one of your orders',
      { disputeId },
    )
  }

  async notifyListingApproved(listingId: string, sellerId: string) {
    await this.createNotification(
      sellerId,
      'LISTING_APPROVED',
      'Listing Approved',
      'Your listing has been approved and is now live',
      { listingId },
    )
  }

  async notifyListingRejected(listingId: string, sellerId: string, reason: string) {
    await this.createNotification(
      sellerId,
      'LISTING_REJECTED',
      'Listing Rejected',
      `Your listing was rejected: ${reason}`,
      { listingId, reason },
    )
  }
}
