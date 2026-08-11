import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationType } from '@prisma/client'
import { NotFoundException } from '@/common/exceptions/custom-exceptions'
import { NotificationsGateway } from '@/modules/gateways/notifications.gateway'
import { EmailService } from '@/shared/email.service'
import { PushService } from './push.service'
import { CurrencyRatesService } from '@/modules/currency/currency-rates.service'

const FRONTEND = process.env.FRONTEND_URL || 'https://app.piyrox.shop'

/**
 * Format a monetary amount from an order using its locked currency.
 * Uses the lockedCurrency field when present (set at payment time) so
 * all email references use the rate that was actually charged — never
 * a live or different rate.
 */
function orderAmount(order: any, field: 'totalAmount' | 'sellerPayout' | 'commissionAmount' = 'totalAmount'): string {
  const amount = Number(order?.[field] ?? 0)
  // Prefer the locked currency (set at payment time). If the migration hasn't
  // run yet the field won't exist — fall back to order.currency then USD.
  const currency: string = (
    order?.lockedCurrency ||
    order?.currency ||
    'USD'
  ).toUpperCase()
  try {
    const isZeroDecimal = ['UGX', 'RWF', 'XOF', 'XAF'].includes(currency)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

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
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${opts.title} — Piyrox</title></head>
<body style="margin:0;padding:0;font-family:Inter,sans-serif;background-color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr><td align="center" style="padding:40px 0;">
    <table role="presentation" width="100%" style="max-width:600px;background-color:#1e293b;border-radius:16px;overflow:hidden;" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="padding:0 0 0 0;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:800;">PIYROX</p>
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
        <p style="margin:0;color:#64748b;font-size:12px;">${opts.footer || 'You\'re receiving this because you have an active order on Piyrox. <a href="' + FRONTEND + '" style="color:#6366f1;">Visit Piyrox</a>'}</p>
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
    private push: PushService,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const prefs = await this.push.getUserPreferences(userId)
    if (prefs[type] === false && type !== NotificationType.SYSTEM) {
      return null
    }

    const notification = await this.prisma.notifications.create({
      data: { userId, type, title, body, data },
    })

    try {
      this.gateway?.emitToUser(userId, 'newNotification', notification)
    } catch (err) {
      this.logger.warn(`Failed to push real-time notification: ${err}`)
    }

    if (prefs[type] !== false) {
      await this.push.sendPushToUser(userId, { title, body, data }).catch(() => {})
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
          <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">Amount</td><td style="padding:6px 0;color:#e2e8f0;font-size:13px;text-align:right;font-weight:700;">${orderAmount(order)}</td></tr>
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
          <p>Your payment of <strong>${orderAmount(order)}</strong> for <strong>${product}</strong> has been received and is held securely in escrow.</p>
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
          <p>A buyer has paid <strong>${orderAmount(order)}</strong> for <strong>${product}</strong>. Funds are held securely in escrow and will be released once the buyer confirms receipt.</p>
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
    const deliveryMsg = order.deliveryData?.notes || order.deliveryData?.message || ''
    const creds = order.deliveryData?.credentials ?? {}

    // Build a safe credentials preview for the email (only show keys, not full values)
    const credPreviewRows = Object.entries(creds)
      .filter(([, v]) => v)
      .map(([k]) => `<tr><td style="padding:4px 0;color:#94a3b8;font-size:12px;text-transform:capitalize;">${k}</td><td style="padding:4px 0;color:#e2e8f0;font-size:12px;text-align:right;font-family:monospace;">••••••</td></tr>`)
      .join('')

    const credBlock = credPreviewRows
      ? `<div style="background:#0f172a;border-radius:10px;padding:16px;margin:16px 0;">
           <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Delivery Credentials (log in to view)</p>
           <table style="width:100%;" cellspacing="0" cellpadding="0">${credPreviewRows}</table>
         </div>`
      : ''

    const msgBlock = deliveryMsg
      ? `<div style="background:#0f172a;border-radius:10px;padding:16px;margin:12px 0;">
           <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Seller's Note</p>
           <p style="margin:8px 0 0;color:#e2e8f0;font-size:14px;white-space:pre-line;">${deliveryMsg}</p>
         </div>`
      : ''

    const html = orderEmailHtml({
      title: '📦 Your Order Has Been Delivered',
      subtitle: `Order #${order.orderNumber}`,
      body: `
        <p>The seller has marked <strong>${product}</strong> as delivered and your credentials are ready.</p>
        ${credBlock}
        ${msgBlock}
        <div style="background:#052e16;border-radius:10px;padding:16px;margin:16px 0;border-left:3px solid #10b981;">
          <p style="margin:0;color:#10b981;font-size:13px;font-weight:700;">⏱️ You have 1 hour to confirm receipt.</p>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Log in, test your credentials, then confirm receipt on the order page to release funds. If there's an issue, open a dispute <em>before</em> confirming.</p>
        </div>
      `,
      ctaText: 'Confirm Receipt & Release Funds →',
      ctaUrl: orderUrl,
    })
    this.email.sendEmail(buyerEmail, `✅ Delivery Ready — Confirm Receipt for Order #${order.orderNumber}`, html).catch(() => {})
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
        body: `<p>Your order for <strong>${product}</strong> is complete. Funds have been released to the seller.</p><p style="color:#94a3b8;font-size:14px;">Thank you for trading safely on Piyrox. Leave a review to help other buyers.</p>`,
        ctaText: 'View Order & Leave Review →',
        ctaUrl: orderUrl,
      })
      this.email.sendEmail(buyerEmail, `Order #${order.orderNumber} Completed`, html).catch(() => {})
    }

    // Seller
    const sellerEmail = await this.getUserEmail(order.seller?.userId)
    if (sellerEmail) {
      const payoutFormatted = orderAmount(order, 'sellerPayout')
      const html = orderEmailHtml({
        title: '💸 Funds Released to Your Wallet',
        subtitle: `Order #${order.orderNumber}`,
        body: `<p><strong>${payoutFormatted}</strong> has been credited to your piyrox wallet for completing order <strong>${order.orderNumber}</strong> (${product}).</p><p style="color:#94a3b8;font-size:14px;">You can withdraw your earnings from the Payouts section of your seller dashboard.</p>`,
        ctaText: 'View Wallet →',
        ctaUrl: `${FRONTEND}/wallet`,
      })
      this.email.sendEmail(sellerEmail, `${payoutFormatted} Credited — Order #${order.orderNumber}`, html).catch(() => {})
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
      body: `<p>Your order for <strong>${product}</strong> has been refunded${amount ? ` — <strong>${amount}</strong> will be returned to your original payment method` : ` — <strong>${orderAmount(order)}</strong> will be returned to your original payment method`}.</p><p style="color:#94a3b8;font-size:14px;">If you have questions please contact our support team.</p>`,
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
          <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;">Amount</td><td style="padding:5px 0;color:#10b981;font-size:13px;text-align:right;font-weight:700;">${orderAmount(order)}</td></tr>
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
      `Your order (${order.orderNumber}) for ${product} has been accepted. The seller has 1h 30m to deliver.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'ACCEPTED' },
    )
    // Send email to buyer
    const buyerEmail = await this.getUserEmail(buyerUserId)
    if (buyerEmail) {
      const html = orderEmailHtml({
        title: '⏱️ Order Accepted — Delivery Timer Started',
        subtitle: `Order #${order.orderNumber}`,
        body: `
          <p>The seller has accepted your order for <strong>${product}</strong> and the delivery timer has started.</p>
          <div style="background:#0f172a;border-radius:10px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Delivery Deadline</p>
            <p style="margin:6px 0 0;color:#f59e0b;font-size:22px;font-weight:800;">1 hour 30 minutes</p>
          </div>
          <p style="color:#94a3b8;font-size:14px;">If the seller misses the deadline, you can open a dispute directly from your order page. Your funds remain safely locked in escrow until you confirm receipt.</p>
        `,
        ctaText: 'Track Your Order →',
        ctaUrl: orderUrl,
      })
      this.email.sendEmail(buyerEmail, `Order Accepted — Delivery starts now #${order.orderNumber}`, html).catch(() => {})
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
      `The seller delivered order ${order.orderNumber}. Confirm receipt within 1 hour to release funds to the seller.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: 'IN_PROGRESS' },
    )
    // Email buyer with delivery details
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

  /**
   * Notifies the seller that they are now eligible to open a dispute because
   * the buyer has not confirmed receipt within the 1-hour window after delivery.
   */
  async notifySellerDisputeEligible(order: any): Promise<void> {
    try {
      const sellerUserId = order?.seller?.userId
      if (!sellerUserId) return

      const product = order?.orderItems?.[0]?.listing?.title || order?.metadata?.title || 'your item'
      const orderUrl = `${FRONTEND}/orders/${order.id}`

      await this.createNotification(
        sellerUserId,
        NotificationType.ORDER_STATUS,
        '⚠️ Buyer hasn\'t confirmed — open a dispute',
        `The buyer has not confirmed receipt for order ${order.orderNumber} (${product}). You can now open a dispute.`,
        { orderId: order.id, orderNumber: order.orderNumber, canDispute: true },
      )

      const sellerEmail = await this.getUserEmail(sellerUserId)
      if (sellerEmail) {
        const html = orderEmailHtml({
          title: '⚠️ Buyer Hasn\'t Confirmed Receipt',
          subtitle: `Order #${order.orderNumber}`,
          body: `
            <p>You marked <strong>${product}</strong> as delivered 1 hour ago, but the buyer has not confirmed receipt yet.</p>
            <div style="background:#1a1a2e;border-radius:10px;padding:16px;margin:16px 0;border-left:3px solid #f59e0b;">
              <p style="margin:0;color:#f59e0b;font-size:13px;font-weight:700;">You are now eligible to open a dispute.</p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">If you believe there is an issue, open a dispute from your order page. Our moderation team will review within 24–72 hours.</p>
            </div>
            <p style="color:#94a3b8;font-size:13px;">If the buyer is simply taking longer to test, you can wait — funds auto-release after the buyer confirmation window closes.</p>
          `,
          ctaText: 'View Order & Open Dispute →',
          ctaUrl: orderUrl,
        })
        this.email.sendEmail(sellerEmail, `Buyer hasn't confirmed — Order #${order.orderNumber}`, html).catch(() => {})
      }
    } catch (err) {
      this.logger.warn(`Failed to notify seller dispute eligible: ${err}`)
    }
  }

  /**
   * Notifies the buyer that they are now eligible to open a dispute because
   * the seller has not delivered within the 1h 30m window after accepting.
   */
  async notifyBuyerDisputeEligible(order: any): Promise<void> {
    try {
      if (!order?.buyerId) return

      const product = order?.orderItems?.[0]?.listing?.title || order?.metadata?.title || 'your item'
      const orderUrl = `${FRONTEND}/orders/${order.id}`

      await this.createNotification(
        order.buyerId,
        NotificationType.ORDER_STATUS,
        '⚠️ Seller missed delivery window — open a dispute',
        `The seller has not delivered order ${order.orderNumber} (${product}) within the deadline. You can now open a dispute.`,
        { orderId: order.id, orderNumber: order.orderNumber, canDispute: true },
      )

      const buyerEmail = await this.getUserEmail(order.buyerId)
      if (buyerEmail) {
        const html = orderEmailHtml({
          title: '⚠️ Seller Missed the Delivery Deadline',
          subtitle: `Order #${order.orderNumber}`,
          body: `
            <p>The seller accepted your order for <strong>${product}</strong> 1h 30m ago but has not delivered yet.</p>
            <div style="background:#1a1a2e;border-radius:10px;padding:16px;margin:16px 0;border-left:3px solid #ef4444;">
              <p style="margin:0;color:#ef4444;font-size:13px;font-weight:700;">You are now eligible to open a dispute.</p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Go to your order page and click "Open a Dispute". Our moderation team will review the case and arrange a refund if the seller cannot be reached.</p>
            </div>
            <p style="color:#94a3b8;font-size:13px;">Your funds remain safe in escrow until the dispute is resolved.</p>
          `,
          ctaText: 'View Order & Open Dispute →',
          ctaUrl: orderUrl,
        })
        this.email.sendEmail(buyerEmail, `Delivery deadline missed — Order #${order.orderNumber}`, html).catch(() => {})
      }
    } catch (err) {
      this.logger.warn(`Failed to notify buyer dispute eligible: ${err}`)
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
    try {
      if (userId) {
        const existing = await this.prisma.notifications.findUnique({ where: { id: notificationId } })
        if (!existing || existing.userId !== userId) throw new NotFoundException('Notification')
      }
      return await this.prisma.notifications.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      })
    } catch (e: any) {
      // Prisma P2023 = malformed ID format, P2025 = record not found
      if (e?.code === 'P2023' || e?.code === 'P2025') {
        throw new NotFoundException('Notification')
      }
      throw e
    }
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

  async notifyKycApproved(sellerId: string, storeName: string, tier?: string) {
    const msg = tier
      ? `Congratulations! Your ${tier} verification for ${storeName} has been approved.`
      : `Congratulations! Your seller identity for ${storeName} has been verified. You now have a verified badge.`
    await this.createNotification(sellerId, 'KYC_APPROVED', 'Identity Verified', msg, { storeName, tier })
  }

  async notifyKycRejected(sellerId: string, storeName: string, reason: string) {
    await this.createNotification(sellerId, 'KYC_REJECTED', 'Verification Rejected', `Your identity verification for ${storeName} was rejected: ${reason}`, { storeName, reason })
  }

  async subscribePush(userId: string, body: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) {
    await this.prisma.pushSubscriptions.upsert({
      where: { endpoint: body.endpoint },
      update: { userId, p256dh: body.keys.p256dh, auth: body.keys.auth, userAgent: body.userAgent || null, updatedAt: new Date() },
      create: { userId, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, userAgent: body.userAgent || null },
    })
  }

  async unsubscribePush(userId: string, endpoint: string) {
    await this.prisma.pushSubscriptions.deleteMany({ where: { userId, endpoint } })
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId }, select: { notificationPreferences: true } })
    const defaults: Record<string, boolean> = { ORDER_STATUS: true, MESSAGE: true, DISPUTE: true, WITHDRAWAL: true, LISTING_APPROVED: true, LISTING_REJECTED: true, KYC_APPROVED: true, KYC_REJECTED: true, FRAUD_ALERT: true, SYSTEM: false }
    return { ...defaults, ...(user?.notificationPreferences as Record<string, boolean> || {}) }
  }

  async updatePreferences(userId: string, prefs: Record<string, boolean>) {
    const current = await this.getPreferences(userId)
    const merged = { ...current, ...prefs }
    await this.prisma.users.update({ where: { id: userId }, data: { notificationPreferences: merged } })
    return merged
  }
}
