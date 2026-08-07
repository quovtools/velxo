import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Resend } from 'resend'

/**
 * Transactional email service — powered by Resend.
 *
 * Required env vars:
 *   RESEND_API_KEY   — API key from resend.com dashboard
 *
 * Optional overrides (defaults shown):
 *   EMAIL_FROM          — notify@piyrox.shop
 *   EMAIL_SENDER_NAME   — Piyrox
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name)
  private resend: Resend | null = null

  private readonly senderName: string
  private readonly fromAddress: string
  private readonly from: string   // "Piyrox <notify@piyrox.shop>"

  constructor() {
    this.senderName  = process.env.EMAIL_SENDER_NAME  || 'Piyrox'
    this.fromAddress = process.env.EMAIL_FROM         || 'notify@piyrox.shop'
    this.from        = `${this.senderName} <${this.fromAddress}>`
  }

  onModuleInit() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set — transactional emails are disabled. ' +
        'Add RESEND_API_KEY to your environment variables to enable email sending.',
      )
      return
    }
    this.resend = new Resend(apiKey)
    this.logger.log(`✅ Resend configured — sending from: ${this.from}`)
  }

  isConfigured(): boolean {
    return this.resend !== null
  }

  /**
   * Core send method. All higher-level helpers delegate here.
   * Returns { success, messageId } on success; { success: false, error } on failure.
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; messageId?: string; provider?: string; error?: string }> {
    if (!this.resend) {
      this.logger.error(`[EMAIL NOT SENT] Resend not configured. Would have sent "${subject}" to ${to}`)
      return { success: false, error: 'RESEND_API_KEY is not set — email sending is disabled.' }
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [to],
        subject,
        html,
      })

      if (error) {
        this.logger.error(`[Resend] Failed "${subject}" to ${to}: ${error.message}`)
        return { success: false, provider: 'resend', error: error.message }
      }

      this.logger.log(`[Resend] Sent "${subject}" to ${to} (ID: ${data?.id})`)
      return { success: true, messageId: data?.id, provider: 'resend' }
    } catch (err: any) {
      this.logger.error(`[Resend] Exception sending "${subject}" to ${to}: ${err?.message}`)
      return { success: false, provider: 'resend', error: err?.message || 'Unknown error' }
    }
  }

  // ─── Shared HTML wrapper ─────────────────────────────────────────────────

  private wrap(opts: {
    title: string
    subtitle?: string
    body: string
    ctaText?: string
    ctaUrl?: string
    footerNote?: string
  }): string {
    const FRONTEND = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const cta = opts.ctaText && opts.ctaUrl
      ? `<div style="text-align:center;margin-top:28px;">
           <a href="${opts.ctaUrl}"
              style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;">
             ${opts.ctaText}
           </a>
         </div>`
      : ''
    const footer = opts.footerNote
      ?? `You're receiving this because you have an active account on <a href="${FRONTEND}" style="color:#6366f1;">Piyrox</a>.`

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.title} — Piyrox</title>
</head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;" cellspacing="0" cellpadding="0" border="0">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-.5px;">PIYROX</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:12px;">Africa's trusted gaming marketplace</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 32px;">
          <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">${opts.title}</h1>
          ${opts.subtitle ? `<p style="margin:0 0 20px;color:#94a3b8;font-size:14px;">${opts.subtitle}</p>` : ''}
          <div style="color:#e2e8f0;font-size:15px;line-height:1.7;">${opts.body}</div>
          ${cta}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#0f172a;border-top:1px solid #334155;text-align:center;">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  // ─── Auth emails ─────────────────────────────────────────────────────────

  async sendVerificationEmail(email: string, verificationToken: string): Promise<{ success: boolean; error?: string }> {
    const FRONTEND = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const url = `${FRONTEND}/verify-email?token=${verificationToken}`

    const html = this.wrap({
      title: 'Verify your email address',
      body: `
        <p>Welcome to Piyrox! Please verify your email address to activate your account.</p>
        <p style="margin-top:20px;word-break:break-all;">
          Or paste this link into your browser:<br>
          <a href="${url}" style="color:#6366f1;">${url}</a>
        </p>
        <p style="color:#64748b;font-size:13px;margin-top:16px;">This link expires in 72 hours.</p>
      `,
      ctaText: 'Verify Email Address',
      ctaUrl: url,
      footerNote: "If you didn't create a Piyrox account you can safely ignore this email.",
    })

    const r = await this.sendEmail(email, 'Verify your Piyrox account', html)
    return { success: r.success, error: r.error }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<{ success: boolean; error?: string }> {
    const FRONTEND = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const url = `${FRONTEND}/auth/reset-password?token=${resetToken}`

    const html = this.wrap({
      title: 'Reset your password',
      body: `
        <p>We received a request to reset the password for your Piyrox account.</p>
        <p style="color:#64748b;font-size:13px;margin-top:16px;">
          This link expires in 24 hours. If you didn't request a reset, you can safely ignore this email.
        </p>
      `,
      ctaText: 'Reset Password',
      ctaUrl: url,
      footerNote: "If you didn't request a password reset, no action is needed.",
    })

    const r = await this.sendEmail(email, 'Reset your Piyrox password', html)
    return { success: r.success, error: r.error }
  }

  // ─── Order lifecycle emails ───────────────────────────────────────────────

  async sendOrderPlacedEmail(order: any) {
    const FRONTEND = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (!buyerEmail) return

    const product    = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const sellerName = order.seller?.storeName || 'the seller'
    const orderUrl   = `${FRONTEND}/orders/${order.id}`
    const amount     = this.fmtAmount(order)

    const html = this.wrap({
      title: 'Order placed — complete payment',
      subtitle: `Order #${order.orderNumber}`,
      body: `
        <p>Your order for <strong>${product}</strong> from <strong>${sellerName}</strong> has been placed.</p>
        ${this.infoTable([
          ['Order', `#${order.orderNumber}`],
          ['Item', product],
          ['Amount', amount],
        ])}
        <p style="margin-top:16px;color:#94a3b8;font-size:14px;">
          Complete payment on the order page to lock funds in escrow — the seller will begin
          fulfilment once payment is confirmed.
        </p>
      `,
      ctaText: 'Complete Payment →',
      ctaUrl: orderUrl,
    })

    await this.sendEmail(buyerEmail, `Order #${order.orderNumber} placed — complete payment`, html).catch(() => {})
  }

  async sendPaymentConfirmedEmail(order: any) {
    const FRONTEND = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const product  = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const orderUrl = `${FRONTEND}/orders/${order.id}`
    const amount   = this.fmtAmount(order)

    // Buyer
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (buyerEmail) {
      await this.sendEmail(
        buyerEmail,
        `Payment confirmed — Order #${order.orderNumber}`,
        this.wrap({
          title: '✅ Payment confirmed',
          subtitle: `Order #${order.orderNumber}`,
          body: `
            <p>Your payment of <strong>${amount}</strong> for <strong>${product}</strong> is held securely in escrow.</p>
            <p style="color:#94a3b8;font-size:14px;">The seller has been notified and will begin fulfilment shortly.</p>
          `,
          ctaText: 'Track Your Order →',
          ctaUrl: orderUrl,
        }),
      ).catch(() => {})
    }

    // Seller
    const sellerEmail = await this.getUserEmail(order.seller?.userId)
    if (sellerEmail) {
      await this.sendEmail(
        sellerEmail,
        `Payment received — Order #${order.orderNumber}`,
        this.wrap({
          title: '💰 Payment received — action required',
          subtitle: `Order #${order.orderNumber}`,
          body: `
            <p>A buyer has paid <strong>${amount}</strong> for <strong>${product}</strong>.
            Funds are held in escrow and released once the buyer confirms receipt.</p>
            <p style="color:#f59e0b;font-size:14px;font-weight:600;">
              ⚠️ You have <strong>1 hour</strong> after accepting to deliver. Accept the order now.
            </p>
          `,
          ctaText: 'Accept & Deliver →',
          ctaUrl: orderUrl,
        }),
      ).catch(() => {})
    }
  }

  async sendDeliveredEmail(order: any) {
    const FRONTEND = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (!buyerEmail) return

    const product    = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const orderUrl   = `${FRONTEND}/orders/${order.id}`
    const msg        = order.deliveryData?.message || 'The seller has marked your order as delivered. Check your order page for delivery details.'

    await this.sendEmail(
      buyerEmail,
      `Your order has been delivered — #${order.orderNumber}`,
      this.wrap({
        title: '📦 Your order has been delivered',
        subtitle: `Order #${order.orderNumber}`,
        body: `
          <p>The seller has marked <strong>${product}</strong> as delivered.</p>
          <div style="background:#0f172a;border-radius:10px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Delivery message</p>
            <p style="margin:8px 0 0;color:#e2e8f0;font-size:14px;white-space:pre-line;">${msg}</p>
          </div>
          <p style="color:#10b981;font-size:14px;font-weight:600;">
            ✅ You have <strong>1 hour</strong> to confirm receipt and release funds to the seller.
          </p>
          <p style="color:#94a3b8;font-size:13px;">If there's an issue, open a dispute before confirming.</p>
        `,
        ctaText: 'Confirm Receipt & Release Funds →',
        ctaUrl: orderUrl,
      }),
    ).catch(() => {})
  }

  async sendCompletedEmail(order: any) {
    const FRONTEND = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const product   = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const orderUrl  = `${FRONTEND}/orders/${order.id}`

    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (buyerEmail) {
      await this.sendEmail(
        buyerEmail,
        `Order #${order.orderNumber} completed`,
        this.wrap({
          title: '🎉 Order complete!',
          subtitle: `Order #${order.orderNumber}`,
          body: `<p>Your order for <strong>${product}</strong> is complete. Funds have been released to the seller.</p>
                 <p style="color:#94a3b8;font-size:14px;">Thank you for trading safely on Piyrox. Leave a review to help other buyers.</p>`,
          ctaText: 'View Order & Leave Review →',
          ctaUrl: orderUrl,
        }),
      ).catch(() => {})
    }

    const sellerEmail = await this.getUserEmail(order.seller?.userId)
    if (sellerEmail) {
      await this.sendEmail(
        sellerEmail,
        `Funds released — Order #${order.orderNumber}`,
        this.wrap({
          title: '💸 Funds released to your wallet',
          subtitle: `Order #${order.orderNumber}`,
          body: `<p><strong>${this.fmtAmount(order, 'sellerPayout')}</strong> has been credited to your Piyrox wallet for completing order <strong>#${order.orderNumber}</strong> (${product}).</p>
                 <p style="color:#94a3b8;font-size:14px;">Withdraw your earnings from the Payouts section of your seller dashboard.</p>`,
          ctaText: 'View Wallet →',
          ctaUrl: `${FRONTEND}/wallet`,
        }),
      ).catch(() => {})
    }
  }

  async sendRefundedEmail(order: any, amount?: string) {
    const buyerEmail = await this.getUserEmail(order.buyerId)
    if (!buyerEmail) return

    const product  = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'Gaming Assets'
    const refundAmt = amount ?? this.fmtAmount(order)

    await this.sendEmail(
      buyerEmail,
      `Refund processed — Order #${order.orderNumber}`,
      this.wrap({
        title: '↩️ Order refunded',
        subtitle: `Order #${order.orderNumber}`,
        body: `<p>Your order for <strong>${product}</strong> has been refunded — <strong>${refundAmt}</strong> will be returned to your original payment method.</p>
               <p style="color:#94a3b8;font-size:14px;">If you have questions please contact our support team.</p>`,
        ctaText: 'Browse Again →',
        ctaUrl: `${process.env.FRONTEND_URL || 'https://app.piyrox.shop'}/search`,
      }),
    ).catch(() => {})
  }

  async sendNewOrderEmail(order: any) {
    const FRONTEND    = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const sellerEmail = await this.getUserEmail(order.seller?.userId)
    if (!sellerEmail) return

    const product  = order.orderItems?.[0]?.listing?.title || order.metadata?.title || 'your listing'
    const orderUrl = `${FRONTEND}/orders/${order.id}`

    await this.sendEmail(
      sellerEmail,
      `New order — #${order.orderNumber}`,
      this.wrap({
        title: '🛒 New order received!',
        subtitle: `Order #${order.orderNumber}`,
        body: `
          <p>You have a new order for <strong>${product}</strong>.</p>
          ${this.infoTable([
            ['Order', `#${order.orderNumber}`],
            ['Amount', this.fmtAmount(order)],
          ])}
          <p style="color:#f59e0b;font-size:14px;margin-top:16px;">
            The buyer will pay into escrow. Once paid you'll receive another email — you then have
            <strong>1 hour</strong> to accept and deliver.
          </p>
        `,
        ctaText: 'View Order →',
        ctaUrl: orderUrl,
      }),
    ).catch(() => {})
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async getUserEmail(userId: string): Promise<string | null> {
    if (!userId) return null
    try {
      // Lazy-import PrismaService to avoid circular DI — email.service is shared.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require('@prisma/client')
      // Re-use the singleton if already instantiated by NestJS.
      const prisma = (global as any).__piyroxPrisma ?? new PrismaClient()
      ;(global as any).__piyroxPrisma = prisma
      const u = await prisma.users.findUnique({ where: { id: userId }, select: { email: true } })
      return u?.email ?? null
    } catch {
      return null
    }
  }

  /** Format a monetary amount from an order record using its stored currency. */
  private fmtAmount(order: any, field: 'totalAmount' | 'sellerPayout' | 'commissionAmount' = 'totalAmount'): string {
    const amount = Number(order?.[field] ?? 0)
    const currency = (order?.lockedCurrency || order?.currency || 'USD').toUpperCase()
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

  /** Render a simple two-column table for order detail rows. */
  private infoTable(rows: [string, string][]): string {
    const trs = rows.map(([label, value]) => `
      <tr>
        <td style="padding:6px 0;color:#94a3b8;font-size:13px;">${label}</td>
        <td style="padding:6px 0;color:#e2e8f0;font-size:13px;text-align:right;font-weight:700;">${value}</td>
      </tr>`).join('')
    return `<table style="width:100%;background:#0f172a;border-radius:10px;padding:16px;" cellspacing="0" cellpadding="0" border="0">${trs}</table>`
  }

  // ─── Legacy method aliases (used by NotificationsService) ────────────────
  // Keep the same signatures so no other file needs to change.

  async sendOrderConfirmationEmail(
    email: string,
    orderNumber: string,
    sellerName: string,
    totalAmount: number,
    items: Array<{ title: string; quantity: number; price: number }>,
  ): Promise<{ success: boolean }> {
    const itemRows = items.map(i => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #334155;color:#e2e8f0;font-size:14px;">${i.title} × ${i.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #334155;color:#e2e8f0;font-size:14px;text-align:right;font-weight:600;">$${(i.quantity * i.price).toFixed(2)}</td>
      </tr>`).join('')

    const html = this.wrap({
      title: '✅ Order confirmed!',
      body: `
        <p>Thank you for your purchase!</p>
        ${this.infoTable([['Order', orderNumber], ['Seller', sellerName]])}
        <table style="width:100%;margin:16px 0;" cellspacing="0" cellpadding="0" border="0">${itemRows}</table>
        <div style="text-align:right;padding:12px 0;">
          <span style="color:#94a3b8;font-size:14px;">Total: </span>
          <span style="color:#fff;font-size:18px;font-weight:800;">$${totalAmount.toFixed(2)}</span>
        </div>
      `,
    })
    const r = await this.sendEmail(email, `Order ${orderNumber} confirmed — Piyrox`, html)
    return { success: r.success }
  }

  async sendWalletTransactionEmail(
    email: string,
    transactionType: string,
    amount: number,
    balanceAfter: number,
    description: string,
  ): Promise<{ success: boolean }> {
    const isCredit = ['CREDIT', 'REFUND', 'RELEASE'].includes(transactionType)
    const html = this.wrap({
      title: isCredit ? '💰 Funds received' : '💳 Funds sent',
      body: `
        <p>${description}</p>
        <div style="text-align:center;padding:24px 0;">
          <p style="margin:0;color:${isCredit ? '#10b981' : '#f59e0b'};font-size:32px;font-weight:800;">
            ${isCredit ? '+' : '-'}$${amount.toFixed(2)}
          </p>
          <p style="margin:8px 0 0;color:#64748b;font-size:13px;">Balance after: <strong style="color:#e2e8f0;">$${balanceAfter.toFixed(2)}</strong></p>
        </div>
      `,
    })
    const r = await this.sendEmail(email, 'Wallet transaction — Piyrox', html)
    return { success: r.success }
  }

  async sendNotificationEmail(email: string, title: string, body: string): Promise<{ success: boolean }> {
    const html = this.wrap({ title, body: `<p>${body}</p>` })
    const r = await this.sendEmail(email, title, html)
    return { success: r.success }
  }
}
