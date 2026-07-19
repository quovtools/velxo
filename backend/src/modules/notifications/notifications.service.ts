import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationType } from '@prisma/client'
import { NotFoundException } from '@/common/exceptions/custom-exceptions'
import { NotificationsGateway } from '@/modules/gateways/notifications.gateway'
import { EmailService } from '@/shared/email.service'

const FRONTEND = process.env.FRONTEND_URL || 'https://market.velxo.shop'

/** Shared branded email wrapper used by every order email below. */
function orderEmailHtml(opts: {
  title: string
  subtitle?: string
  body: string
  ctaText?: string
  ctaUrl?: string
  footer?: string
}): string {
  const cta = opts.ctaText && opts.ctaUrl
    ? `<a href="${opts.ctaUrl}" style="display:inline-block;margin-top:28px;background-color:#6366f1;color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;">${opts.ctaText}</a>`
    : ''
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${opts.title} — Velxo</title></head>
<body style="margin:0;padding:0;font-family:Inter,sans-serif;background-color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr><td align="center" style="padding:40px 0;">
    <table role="presentation" width="100%" style="max-width:600px;background-color:#1e293b;border-radius:16px;overflow:hidden;" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="padding:0 0 0 0;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:800;">VELXO</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Africa's trusted gaming marketplace</p>
        </div>
      </td></tr>
      <tr><td style="padding:36px 32px;">
        <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">${opts.title}</h1>
        ${opts.subtitle ? `<p style="margin:0 0 20px;color:#94a3b8;font-size:14px;">${opts.subtitle}</p>` : ''}
        <div style="color:#e2e8f0;font-size:15px;line-height:1.7;">${opts.body}</div>
        ${cta}
      </td></tr>
      <tr><td style="padding:24px 32px;background-color:#0f172a;border-top:1px solid #334155;text-align:center;">
        <p style="margin:0;color:#64748b;font-size:12px;">${opts.footer || 'You\'re receiving this because you have an active order on Velxo. <a href="' + FRONTEND + '" style="color:#6366f1;">Visit Velxo</a>'}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private email: EmailService,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const notification = await this.prisma.notifications.create({
      data: { userId, type, title, body, data },
    })

    try {
      this.gateway?.emitToUser(userId, 'newNotification', notification)
    } catch (err) {
      this.logger.warn(`Failed to push real-time notification: ${err}`)
    }

    return notification
  }

  // ─── Order email helpers ────────────────────────────────────────────────

  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const u = await this.prisma.users.findUnique({ where: { id: userId }, select: { email: true } })
      return u?.email ?? null
    } catch {
      return null
    }
  }

  /** Sends the buyer their order-placed confirmation email. */
  async sendOrderPlacedEmail(order: any) {
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (!buyerEmail) return
    const product = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const sellerName = order.seller?.storeName || 'the seller'
    const orderUrl = `${FRONTEND}/orders/${order.id}`
    const html = orderEmailHtml({
      title: 'Order Placed — Complete Payment',
      subtitle: `Order #${order.orderNumber}`,
      body: `
        <p>Hi there! Your order for <strong>${product}</strong> from <strong>${sellerName}</strong> has been placed.</p>
        <table style="width:100%;border-radius:10px;background:#0f172a;padding:20px;" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">Order number</td><td style="padding:6px 0;color:#e2e8f0;font-size:13px;text-align:right;font-weight:700;">${order.orderNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">Item</td><td style="padding:6px 0;color:#e2e8f0;font-size:13px;text-align:right;">${product}</td></tr>
          <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">Amount</td><td style="padding:6px 0;color:#e2e8f0;font-size:13px;text-align:right;font-weight:700;">$${Number(order.totalAmount).toFixed(2)}</td></tr>
        </table>
        <p style="margin-top:16px;font-size:14px;color:#94a3b8;">Your order is reserved. Complete payment on the order page to lock funds in escrow — once paid the seller will begin fulfillment.</p>
      `,
      ctaText: 'Complete Payment →',
      ctaUrl: orderUrl,
    })
    this.email.sendEmail(buyerEmail, `Order #${order.orderNumber} Placed — Complete Payment`, html).catch(() => {})
  }

  /** Sends both buyer + seller an email when payment is confirmed. */
  async sendPaymentConfirmedEmail(order: any) {
    const orderUrl = `${FRONTEND}/orders/${order.id}`
    const product = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'

    // Buyer email
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (buyerEmail) {
      const html = orderEmailHtml({
        title: '✅ Payment Confirmed',
        subtitle: `Order #${order.orderNumber}`,
        body: `
          <p>Your payment of <strong>$${Number(order.totalAmount).toFixed(2)}</strong> for <strong>${product}</strong> has been received and is held securely in escrow.</p>
          <p style="color:#94a3b8;font-size:14px;">The seller has been notified and will begin fulfillment. You'll receive another email once your item is delivered.</p>
        `,
        ctaText: 'Track Your Order →',
        ctaUrl: orderUrl,
      })
      this.email.sendEmail(buyerEmail, `Payment Confirmed — Order #${order.orderNumber}`, html).catch(() => {})
    }

    // Seller email
    const sellerEmail = await this.getUserEmail(order.seller?.userId)
    if (sellerEmail) {
      const html = orderEmailHtml({
        title: '💰 Payment Received — Action Required',
        subtitle: `Order #${order.orderNumber}`,
        body: `
          <p>A buyer has paid <strong>$${Number(order.totalAmount).toFixed(2)}</strong> for <strong>${product}</strong>. Funds are held securely in escrow and will be released once the buyer confirms receipt.</p>
          <p style="color:#f59e0b;font-size:14px;font-weight:600;">⚠️ You have <strong>1 hour</strong> after accepting to deliver. Accept the order now to start the timer.</p>
        `,
        ctaText: 'Accept & Deliver →',
        ctaUrl: orderUrl,
      })
      this.email.sendEmail(sellerEmail, `Payment Received — Order #${order.orderNumber}`, html).catch(() => {})
    }
  }

  /** Sends the buyer an email when the seller marks the order as delivered. */
  async sendDeliveredEmail(order: any) {
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (!buyerEmail) return
    const product = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const orderUrl = `${FRONTEND}/orders/${order.id}`
    const deliveryMsg = order.deliveryData?.message || 'The seller has marked your order as delivered. Check your order page for the delivery details.'
    const html = orderEmailHtml({
      title: '📦 Your Order Has Been Delivered',
      subtitle: `Order #${order.orderNumber}`,
      body: `
        <p>The seller has marked <strong>${product}</strong> as delivered.</p>
        <div style="background:#0f172a;border-radius:10px;padding:16px;margin:16px 0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Delivery Message</p>
          <p style="margin:8px 0 0;color:#e2e8f0;font-size:14px;white-space:pre-line;">${deliveryMsg}</p>
        </div>
        <p style="color:#10b981;font-size:14px;font-weight:600;">✅ You have <strong>1 hour</strong> to confirm receipt. After that the seller may file a complaint.</p>
        <p style="color:#94a3b8;font-size:13px;">Once you confirm, funds are released to the seller and the order is complete. If there's an issue, open a dispute before confirming.</p>
      `,
      ctaText: 'Confirm Receipt & Release Funds →',
      ctaUrl: orderUrl,
    })
    this.email.sendEmail(buyerEmail, `Delivery Confirmed — Please Review Order #${order.orderNumber}`, html).catch(() => {})
  }

  /** Sends both parties an email when the order completes. */
  async sendCompletedEmail(order: any) {
    const product = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const orderUrl = `${FRONTEND}/orders/${order.id}`

    // Buyer
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (buyerEmail) {
      const html = orderEmailHtml({
        title: '🎉 Order Complete!',
        subtitle: `Order #${order.orderNumber}`,
        body: `<p>Your order for <strong>${product}</strong> is complete. Funds have been released to the seller.</p><p style="color:#94a3b8;font-size:14px;">Thank you for trading safely on Velxo. Leave a review to help other buyers.</p>`,
        ctaText: 'View Order & Leave Review →',
        ctaUrl: orderUrl,
      })
      this.email.sendEmail(buyerEmail, `Order #${order.orderNumber} Completed`, html).catch(() => {})
    }

    // Seller
    const sellerEmail = await this.getUserEmail(order.seller?.userId)
    if (sellerEmail) {
      const payout = Number(order.sellerPayout || 0).toFixed(2)
      const html = orderEmailHtml({
        title: '💸 Funds Released to Your Wallet',
        subtitle: `Order #${order.orderNumber}`,
        body: `<p><strong>$${payout}</strong> has been credited to your Velxo wallet for completing order <strong>${order.orderNumber}</strong> (${product}).</p><p style="color:#94a3b8;font-size:14px;">You can withdraw your earnings from the Payouts section of your seller dashboard.</p>`,
        ctaText: 'View Wallet →',
        ctaUrl: `${FRONTEND}/wallet`,
      })
      this.email.sendEmail(sellerEmail, `$${payout} Credited — Order #${order.orderNumber}`, html).catch(() => {})
    }
  }

  /** Sends buyer an email when their order is refunded. */
  async sendRefundedEmail(order: any, amount?: string) {
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (!buyerEmail) return
    const product = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const html = orderEmailHtml({
      title: '↩️ Order Refunded',
      subtitle: `Order #${order.orderNumber}`,
      body: `<p>Your order for <strong>${product}</strong> has been refunded${amount ? ` — <strong>${amount}</strong> will be returned to your original payment method` : ''}.</p><p style="color:#94a3b8;font-size:14px;">If you have questions please contact our support team.</p>`,
      ctaText: 'Browse Again →',
      ctaUrl: `${FRONTEND}/search`,
    })
    this.email.sendEmail(buyerEmail, `Refund Processed — Order #${order.orderNumber}`, html).catch(() => {})
  }

  /** Sends seller an email when a new order arrives while they may be offline. */
  async sendNewOrderEmail(order: any) {
    const sellerEmail = await this.getUserEmail(order.seller?.userId)
    if (!sellerEmail) return
    const product = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'your listing'
    const orderUrl = `${FRONTEND}/orders/${order.id}`
    const html = orderEmailHtml({
      title: '🛒 New Order Received!',
      subtitle: `Order #${order.orderNumber}`,
      body: `
        <p>You have a new order for <strong>${product}</strong>.</p>
        <table style="width:100%;background:#0f172a;border-radius:10px;padding:16px;" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;">Order</td><td style="padding:5px 0;color:#e2e8f0;font-size:13px;text-align:right;font-weight:700;">#${order.orderNumber}</td></tr>
          <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;">Amount</td><td style="padding:5px 0;color:#10b981;font-size:13px;text-align:right;font-weight:700;">$${Number(order.totalAmount).toFixed(2)}</td></tr>
        </table>
        <p style="color:#f59e0b;font-size:14px;margin-top:16px;">The buyer will pay into escrow. Once paid you'll receive another email — you then have <strong>1 hour</strong> to accept and deliver.</p>
      `,
      ctaText: 'View Order →',
      ctaUrl: orderUrl,
    })
    this.email.sendEmail(sellerEmail, `New Order — #${order.orderNumber}`, html).catch(() => {})
  }

  // ─── Notification helpers (in-app + email) ──────────────────────────────

  async notifySubscriptionActivated(userId: string, planName: string, endsAt: Date) {
    if (!userId) return
    const expiry = endsAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    return this.createNotification(
      userId,
      'SYSTEM',
      `${planName} activated 🎉`,
      `Your ${planName} subscription is live until ${expiry}. Your public store link is now active and your commission rate has been reduced.`,
      { planName, endsAt },
    )
  }

  async notifyNewMessage(recipientId: string, senderName: string, preview: string, conversationId: string, orderId?: string) {
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
    const product = order?.orderItems?.[0]?.listing?.title || order?.metadata?.title || 'your listing'
    await this.createNotification(
      sellerUserId,
      'ORDER_STATUS',
      'New Order Received',
      `You have a new order (${order.orderNumber}) for ${product}`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'PENDING' },
    )
    // Email seller even if they're offline
    await this.sendNewOrderEmail(order).catch(() => {})
  }

  async notifyOrderAccepted(order: any) {
    const buyerUserId = order?.buyer?.id
    if (!buyerUserId) return
    const product = order?.orderItems?.[0]?.listing?.title || order?.metadata?.title || 'your order'
    const orderUrl = `${FRONTEND}/orders/${order.id}`
    await this.createNotification(
      buyerUserId,
      'ORDER_STATUS',
      'Order Accepted',
      `Your order (${order.orderNumber}) for ${product} has been accepted. The seller has 1 hour to deliver.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'ACCEPTED' },
    )
    // Send email to buyer
    const buyerEmail = await this.getUserEmail(buyerUserId)
    if (buyerEmail) {
      const html = orderEmailHtml({
        title: '⏱️ Order Accepted — Delivery Timer Started',
        subtitle: `Order #${order.orderNumber}`,
        body: `<p>The seller has accepted your order for <strong>${product}</strong> and the 1-hour delivery timer has started.</p><p style="color:#94a3b8;font-size:14px;">If the seller misses the deadline you can open a dispute from your order page.</p>`,
        ctaText: 'Track Your Order →',
        ctaUrl: orderUrl,
      })
      this.email.sendEmail(buyerEmail, `Order Accepted — #${order.orderNumber}`, html).catch(() => {})
    }
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
        'Payment Received — Accept Order',
        `Payment for order ${order.orderNumber} has been received. Accept the order to start the delivery timer.`,
        { orderId: order.id, orderNumber: order.orderNumber, status: 'PAID' },
      )
    }
    // Send emails
    await this.sendPaymentConfirmedEmail(order).catch(() => {})
  }

  async notifyDelivered(order: any) {
    if (!order) return
    await this.createNotification(
      order.buyerId,
      'ORDER_STATUS',
      '📦 Order Delivered — Confirm Receipt',
      `The seller delivered order ${order.orderNumber}. Confirm receipt within 1 hour to release funds.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'IN_PROGRESS' },
    )
    // Email buyer
    await this.sendDeliveredEmail(order).catch(() => {})
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
    await this.sendCompletedEmail(order).catch(() => {})
  }

  async notifyRefunded(order: any, amount?: string) {
    if (!order) return
    const amt = amount ? ` (${amount} ${order.currency})` : ''
    await this.createNotification(
      order.buyerId,
      'ORDER_STATUS',
      'Order Refunded',
      `Order ${order.orderNumber} has been refunded${amt}.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'REFUNDED' },
    )
    await this.sendRefundedEmail(order, amount).catch(() => {})
  }

  /** Notify the buyer when a seller sends their first message in a new order conversation. */
  async notifySellerFirstResponse(order: any): Promise<void> {
    try {
      if (!order?.buyerId) return
      await this.prisma.notifications.create({
        data: {
          userId: order.buyerId,
          type: NotificationType.MESSAGE,
          title: 'Seller responded',
          body: `${order.seller?.storeName || 'The seller'} has replied to your order. View the conversation to continue.`,
          data: { orderId: order.id, conversation: true },
        },
      })
    } catch (err) {
      this.logger.warn(`Failed to notify seller first response: ${err}`)
    }
  }

  /** Notify the buyer that their escrow confirmation window is about to close. */
  async notifyBuyerNearDeadline(order: any): Promise<void> {
    try {
      if (!order?.buyerId) return
      await this.prisma.notifications.create({
        data: {
          userId: order.buyerId,
          type: NotificationType.ORDER_STATUS,
          title: 'Confirm receipt soon',
          body: 'Your escrow confirmation window is about to close — confirm receipt to release funds to the seller.',
          data: { orderId: order.id },
        },
      })
    } catch (err) {
      this.logger.warn(`Failed to notify buyer near deadline: ${err}`)
    }
  }

  // ─── Standard CRUD helpers ──────────────────────────────────────────────

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
      const existing = await this.prisma.notifications.findUnique({ where: { id: notificationId } })
      if (!existing || existing.userId !== userId) throw new NotFoundException('Notification')
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
      const existing = await this.prisma.notifications.findUnique({ where: { id: notificationId } })
      if (!existing || existing.userId !== userId) throw new NotFoundException('Notification')
    }
    return this.prisma.notifications.delete({ where: { id: notificationId } })
  }

  async notifyOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.orders.findUnique({ where: { id: orderId } })
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
    await this.createNotification(userId, 'DISPUTE', 'Dispute Opened', 'A dispute has been opened for one of your orders', { disputeId })
  }

  async notifyListingApproved(listingId: string, sellerId: string) {
    await this.createNotification(sellerId, 'LISTING_APPROVED', 'Listing Approved', 'Your listing has been approved and is now live', { listingId })
  }

  async notifyListingRejected(listingId: string, sellerId: string, reason: string) {
    await this.createNotification(sellerId, 'LISTING_REJECTED', 'Listing Rejected', `Your listing was rejected: ${reason}`, { listingId, reason })
  }

  async notifyKycApproved(sellerId: string, storeName: string) {
    await this.createNotification(sellerId, 'KYC_APPROVED', 'Identity Verified', `Congratulations! Your seller identity for ${storeName} has been verified. You now have a verified badge.`, { storeName })
  }

  async notifyKycRejected(sellerId: string, storeName: string, reason: string) {
    await this.createNotification(sellerId, 'KYC_REJECTED', 'Verification Rejected', `Your identity verification for ${storeName} was rejected: ${reason}`, { storeName, reason })
  }
}
