import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationType } from '@prisma/client'
import { NotFoundException } from '@/common/exceptions/custom-exceptions'
import { NotificationsGateway } from '@/modules/gateways/notifications.gateway'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const notification = await this.prisma.notifications.create({
      data: {
        userId,
        type,
        title,
        body,
        data,
      },
    })

    // Push the notification to the recipient in real time (best effort).
    try {
      this.gateway?.emitToUser(userId, 'newNotification', notification)
    } catch (err) {
      this.logger.warn(`Failed to push real-time notification: ${err}`)
    }

    return notification
  }

  async notifySubscriptionActivated(
    userId: string,
    planName: string,
    endsAt: Date,
  ) {
    if (!userId) return
    const expiry = endsAt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    return this.createNotification(
      userId,
      'SYSTEM',
      `${planName} activated 🎉`,
      `Your ${planName} subscription is live until ${expiry}. Your public store link is now active and your commission rate has been reduced.`,
      { planName, endsAt },
    )
  }

  async notifyNewMessage(
    recipientId: string,
    senderName: string,
    preview: string,
    conversationId: string,
    orderId?: string,
  ) {
    if (!recipientId) return
    return this.createNotification(
      recipientId,
      'MESSAGE',
      `New message from ${senderName}`,
      preview,
      { conversationId, orderId },
    )
  }

  async notifyNewOrder(order: any) {
    const sellerUserId = order?.seller?.userId
    if (!sellerUserId) return
    const product =
      order?.orderItems?.[0]?.listing?.title || order?.metadata?.title || 'your listing'
    return this.createNotification(
      sellerUserId,
      'ORDER_STATUS',
      'New Order Received',
      `You have a new order (${order.orderNumber}) for ${product}`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'PENDING' },
    )
  }

  async notifyPaymentConfirmed(order: any) {
    if (!order) return
    await this.createNotification(
      order.buyerId,
      'ORDER_STATUS',
      'Payment Confirmed',
      `Your payment for order ${order.orderNumber} was received. The seller will begin fulfilment.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'PAID' },
    )
    const sellerUserId = order?.seller?.userId
    if (sellerUserId) {
      await this.createNotification(
        sellerUserId,
        'ORDER_STATUS',
        'Payment Received',
        `Payment for order ${order.orderNumber} has been received. Please begin fulfilment.`,
        { orderId: order.id, orderNumber: order.orderNumber, status: 'PAID' },
      )
    }
  }

  async notifyDelivered(order: any) {
    if (!order) return
    return this.createNotification(
      order.buyerId,
      'ORDER_STATUS',
      'Order Delivered',
      `The seller marked order ${order.orderNumber} as delivered. Please confirm receipt.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'IN_PROGRESS' },
    )
  }

  async notifyCompleted(order: any) {
    if (!order) return
    await this.createNotification(
      order.buyerId,
      'ORDER_STATUS',
      'Order Completed',
      `Order ${order.orderNumber} is complete. Funds have been released to the seller.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'COMPLETED' },
    )
    const sellerUserId = order?.seller?.userId
    if (sellerUserId) {
      await this.createNotification(
        sellerUserId,
        'ORDER_STATUS',
        'Payment Released',
        `Funds for order ${order.orderNumber} have been released to your wallet.`,
        { orderId: order.id, orderNumber: order.orderNumber, status: 'COMPLETED' },
      )
    }
  }

  async notifyRefunded(order: any, amount?: string) {
    if (!order) return
    const amt = amount ? ` (${amount} ${order.currency})` : ''
    return this.createNotification(
      order.buyerId,
      'ORDER_STATUS',
      'Order Refunded',
      `Order ${order.orderNumber} has been refunded${amt}.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'REFUNDED' },
    )
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

  async notifyKycApproved(sellerId: string, storeName: string) {
    await this.createNotification(
      sellerId,
      'KYC_APPROVED',
      'Identity Verified',
      `Congratulations! Your seller identity for ${storeName} has been verified. You now have a verified badge.`,
      { storeName },
    )
  }

  async notifyKycRejected(sellerId: string, storeName: string, reason: string) {
    await this.createNotification(
      sellerId,
      'KYC_REJECTED',
      'Verification Rejected',
      `Your identity verification for ${storeName} was rejected: ${reason}`,
      { storeName, reason },
    )
  }
}
