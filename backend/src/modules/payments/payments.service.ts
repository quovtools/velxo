import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { PaymentProvider, PaymentStatus, OrderStatus, ListingStatus } from '@prisma/client'
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@/common/exceptions/custom-exceptions'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentIoService } from './paymentio.service'
import { FlutterwaveService } from './flutterwave.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    private prisma: PrismaService,
    private paymentIo: PaymentIoService,
    private flutterwave: FlutterwaveService,
    private notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.logger.log(`Payment provider config: ${JSON.stringify(this.getProviderConfig())}`)
  }

  /**
   * Reports which payment providers are configured from environment variables.
   * Exposes only booleans (and non-secret URLs) so it is safe to call/log.
   */
  getProviderConfig() {
    return {
      paymentIo: {
        configured: this.paymentIo.isConfigured,
        hasApiUrl: Boolean(process.env.PAYMENT_IO_API_URL),
        hasApiKey: Boolean(process.env.PAYMENT_IO_API_KEY),
        hasSecretKey: Boolean(process.env.PAYMENT_IO_SECRET_KEY),
        apiUrl: process.env.PAYMENT_IO_API_URL || null,
      },
      flutterwave: {
        configured: this.flutterwave.isConfigured,
        hasApiUrl: Boolean(process.env.FLUTTERWAVE_API_URL),
        hasSecretKey: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
      },
    }
  }


  async createPayment(
    orderId: string,
    amount: Decimal,
    provider: PaymentProvider,
    methodId?: string,
  ) {
    this.logger.log(`Creating payment for order ${orderId} via ${provider}`)

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new NotFoundException('Order')
    }

    const payment = await this.prisma.payments.create({
      data: {
        orderId,
        amount,
        provider,
        methodId,
        status: PaymentStatus.PENDING,
        currency: order.currency,
      },
    })

    return payment
  }

  /**
   * Creates the payment record and, for crypto (Payment.io), initiates the
   * charge and returns the hosted payment URL to redirect the buyer to.
   */
  async initiatePayment(
    orderId: string,
    amount: Decimal,
    provider: PaymentProvider,
    callbackUrl: string,
    buyerId: string,
  ): Promise<{ payment: any; paymentUrl: string | null; configured: boolean }> {
    // Validate ownership and amount before creating any payment record.
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    })
    if (!order) {
      throw new NotFoundException('Order')
    }
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only pay for your own orders')
    }
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAID) {
      throw new BadRequestException('This order cannot be paid')
    }
    // The client-supplied amount must exactly match the order total.
    if (new Decimal(amount).toString() !== new Decimal(order.totalAmount.toString()).toString()) {
      throw new BadRequestException('Payment amount does not match the order total')
    }

    const listingId = order.orderItems?.[0]?.listingId

    // If a provider cannot actually take payment we must NOT mark the order as
    // paid and we must release the reservation placed on the listing when the
    // order was created, so the item returns to the marketplace.
    const revertReservation = async () => {
      if (listingId) {
        await this.prisma.listings.update({
          where: { id: listingId },
          data: { isSold: false, status: ListingStatus.ACTIVE },
        })
      }
    }

    const handleCharge = async (charge: { chargeId: string | null; paymentUrl: string | null; configured: boolean }) => {
      if (!charge.configured) {
        await revertReservation()
        throw new BadRequestException(
          `The selected payment method (${provider}) is currently unavailable. Please choose a different payment method.`,
        )
      }

      const payment = await this.createPayment(orderId, amount, provider)

      if (charge.chargeId) {
        await this.prisma.payments.update({
          where: { id: payment.id },
          data: { providerTransactionId: charge.chargeId },
        })
      }

      return { payment, paymentUrl: charge.paymentUrl, configured: true }
    }

    if (provider === 'PAYMENT_IO') {
      const charge = await this.paymentIo.createCharge({
        reference: orderId,
        amount: Number(amount),
        currency: order.currency,
        callbackUrl,
      })
      return handleCharge(charge)
    }

    if (provider === 'FLUTTERWAVE') {
      const fullOrder = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: { buyer: true },
      })
      const charge = await this.flutterwave.createCharge({
        reference: orderId,
        amount: Number(amount),
        currency: order.currency,
        email: fullOrder?.buyer?.email || 'buyer@velxo.shop',
        callbackUrl,
      })
      return handleCharge(charge)
    }

    await revertReservation()
    throw new BadRequestException('Unsupported payment provider')
  }

  /**
   * Builds the ordered list of providers to try when minting a payment link.
   * Order: explicit PAYMENT_PROVIDER env override → the provider the buyer
   * chose at checkout (order metadata) → any other configured provider.
   *
   * Crucially we do NOT hard-default to an *unconfigured* provider. If the
   * buyer picked Flutterwave but only Payment.io is configured (or vice
   * versa), we fall through to the configured provider instead of failing the
   * link generation outright.
   */
  private buildProviderCandidates(order?: { metadata?: any }): PaymentProvider[] {
    const candidates: PaymentProvider[] = []
    const push = (p?: PaymentProvider) => {
      if (p && !candidates.includes(p)) candidates.push(p)
    }

    const override = process.env.PAYMENT_PROVIDER?.toUpperCase()
    if (override === 'FLUTTERWAVE' || override === 'PAYMENT_IO' || override === 'CRYPTO') {
      push(override === 'CRYPTO' ? PaymentProvider.PAYMENT_IO : (override as PaymentProvider))
    }

    const chosen = (order?.metadata as Record<string, any> | undefined)?.paymentMethod as
      | PaymentProvider
      | undefined
    push(chosen)

    if (this.flutterwave.isConfigured) push(PaymentProvider.FLUTTERWAVE)
    if (this.paymentIo.isConfigured) push(PaymentProvider.PAYMENT_IO)

    return candidates
  }

  /**
   * Ask a specific provider to create a hosted charge. Returns null when the
   * provider is not configured or cannot produce a link, so callers can try
   * the next candidate instead of failing.
   */
  private async createProviderCharge(
    provider: PaymentProvider,
    order: { id: string; totalAmount: any; currency: string; buyer?: { email?: string } | null },
    callbackUrl: string,
  ): Promise<{ chargeId: string | null; paymentUrl: string | null; configured: boolean } | null> {
    try {
      if (provider === PaymentProvider.PAYMENT_IO) {
        return await this.paymentIo.createCharge({
          reference: order.id,
          amount: Number(order.totalAmount),
          currency: order.currency,
          callbackUrl,
        })
      }
      if (provider === PaymentProvider.FLUTTERWAVE) {
        return await this.flutterwave.createCharge({
          reference: order.id,
          amount: Number(order.totalAmount),
          currency: order.currency,
          email: order.buyer?.email || 'buyer@velxo.shop',
          callbackUrl,
        })
      }
      return null
    } catch (err: any) {
      this.logger.error(`Provider ${provider} charge failed for order ${order.id}:`, err?.message || err)
      return null
    }
  }

  /**
   * Generates a hosted payment link URL for an order and persists it.
   *
   * - Resolves the active payment provider.
   * - Asks the provider for a hosted redirect URL (charge).
   * - Stores the link on the order's `metadata.paymentLink` and on the
   *   matching `payments` record's `metadata.paymentLink` (reusing an existing
   *   PENDING payment for this provider when present).
   * - Returns `{ url, provider, configured }`. `url` is null when the provider
   *   is not configured or the order is already paid.
   */
  async createPaymentLink(
    orderId: string,
    provider?: PaymentProvider,
  ): Promise<{ url: string | null; provider: PaymentProvider | null; configured: boolean }> {
    this.logger.log(`Generating payment link for order ${orderId}${provider ? ` (provider: ${provider})` : ''}`)

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { buyer: true, orderItems: true },
    })
    if (!order) {
      throw new NotFoundException('Order')
    }

    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.REFUNDED
    ) {
      this.logger.log(`Order ${orderId} already paid — no payment link generated`)
      return { url: null, provider: null, configured: true }
    }

    const callbackUrl = `${process.env.FRONTEND_URL || 'https://market.velxo.shop'}/orders/${orderId}`

    this.logger.log(
      `createPaymentLink ${orderId} | orderStatus=${order.status} ` +
        `Flutterwave.isConfigured=${this.flutterwave.isConfigured} ` +
        `Payment.io.isConfigured=${this.paymentIo.isConfigured} ` +
        `PAYMENT_PROVIDER=${process.env.PAYMENT_PROVIDER || 'unset'} ` +
        `chosenProvider=${(order.metadata as Record<string, any>)?.paymentMethod ?? 'none'}`,
    )

    // Resolve the providers to try. An explicit `provider` argument pins the
    // first attempt (e.g. the buyer's choice), but we still fall back to any
    // other configured provider so a link is always produced when at least one
    // provider is usable.
    const candidates = this.buildProviderCandidates(order)
    if (provider && !candidates.includes(provider)) candidates.unshift(provider)

    let charge: { chargeId: string | null; paymentUrl: string | null; configured: boolean } | null = null
    let activeProvider: PaymentProvider | null = null

    for (const candidate of candidates) {
      const result = await this.createProviderCharge(candidate, order, callbackUrl)
      if (result && result.configured && result.paymentUrl) {
        charge = result
        activeProvider = candidate
        break
      }
      this.logger.warn(`Payment provider (${candidate}) not available for order ${orderId} — trying next.`)
    }

    if (!charge || !charge.configured || !charge.paymentUrl) {
      this.logger.warn(
        `No configured payment provider could produce a link for order ${orderId}. ` +
          `Configured: Flutterwave=${this.flutterwave.isConfigured}, Payment.io=${this.paymentIo.isConfigured}`,
      )
      return { url: null, provider: candidates[0] ?? null, configured: false }
    }

    const paymentUrl = charge.paymentUrl
    const usedProvider = activeProvider as PaymentProvider

    // Reuse an existing PENDING payment for this order+provider when present so
    // we don't accumulate duplicate payment rows across calls.
    const existing = await this.prisma.payments.findFirst({
      where: { orderId, provider: usedProvider, status: PaymentStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    })

    if (existing) {
      await this.prisma.payments.update({
        where: { id: existing.id },
        data: {
          providerTransactionId: charge.chargeId ?? existing.providerTransactionId,
          metadata: { ...((existing.metadata as Record<string, any>) || {}), paymentLink: paymentUrl },
        },
      })
    } else {
      await this.prisma.payments.create({
        data: {
          orderId,
          provider: usedProvider,
          amount: order.totalAmount,
          currency: order.currency,
          status: PaymentStatus.PENDING,
          providerTransactionId: charge.chargeId ?? undefined,
          metadata: { paymentLink: paymentUrl },
        },
      })
    }

    // Also surface the link on the order metadata for convenience.
    const currentMeta = (order.metadata as Record<string, any>) || {}
    if (currentMeta.paymentLink !== paymentUrl) {
      await this.prisma.orders.update({
        where: { id: orderId },
        data: { metadata: { ...currentMeta, paymentLink: paymentUrl } },
      })
    }

    return { url: paymentUrl, provider: activeProvider, configured: true }
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus, transactionId?: string) {
    this.logger.log(`Updating payment ${paymentId} to ${status}`)

    const payment = await this.prisma.payments.update({
      where: { id: paymentId },
      data: {
        status,
        providerTransactionId: transactionId,
        paidAt: status === PaymentStatus.COMPLETED ? new Date() : undefined,
        refundedAt: status === PaymentStatus.REFUNDED ? new Date() : undefined,
      },
      include: { order: { include: { orderItems: true } } },
    })

    // Update order status if payment completed
    if (status === PaymentStatus.COMPLETED && payment.order.status === 'PENDING') {
      const listingId = payment.order.orderItems?.[0]?.listingId
      await this.prisma.orders.update({
        where: { id: payment.orderId },
        data: { status: 'PAID', paidAt: new Date() },
      })
      if (listingId) {
        await this.prisma.listings.update({
          where: { id: listingId },
          data: { isSold: true, status: ListingStatus.SOLD },
        })
      }

      // Notify both parties that the payment went through (transaction progress).
      const fullOrder = await this.prisma.orders.findUnique({
        where: { id: payment.orderId },
        include: {
          seller: true,
          buyer: true,
          orderItems: { include: { listing: true } },
        },
      })
      if (fullOrder) {
        await this.notifications.notifyPaymentConfirmed(fullOrder).catch(() => {})
      }
    }

    // A failed payment must release the reservation placed on the listing at
    // order creation so the item returns to the marketplace.
    if (status === PaymentStatus.FAILED) {
      const listingId = payment.order.orderItems?.[0]?.listingId
      if (listingId) {
        await this.prisma.listings.update({
          where: { id: listingId },
          data: { isSold: false, status: ListingStatus.ACTIVE },
        })
      }
    }

    return payment
  }

  verifyPaymentIoIpn(rawBody: string, signature?: string): boolean {
    return this.paymentIo.verifyIpn(rawBody, signature)
  }

  async handleFlutterwaveWebhook(event: any) {
    this.logger.log(`Processing Flutterwave webhook`)

    // Flutterwave sends the order reference in `data.tx_ref` (we set it to the
    // order id) and the transaction id in `data.id`. Resolve the payment by the
    // order reference, then confirm server-side with Flutterwave's Verify API so
    // a spurious/early callback can't mark the order paid without a real
    // transaction.
    const data = event?.data || event || {}
    const txRef: string | undefined = data.tx_ref || data.txRef
    const transactionId: string | number | undefined = data.id || data.transaction_id

    if (!txRef) {
      this.logger.warn('Flutterwave webhook missing tx_ref')
      return false
    }

    const payment = await this.prisma.payments.findFirst({
      where: { orderId: txRef, provider: PaymentProvider.FLUTTERWAVE },
      orderBy: { createdAt: 'desc' },
    })

    if (!payment) {
      this.logger.warn(`Flutterwave webhook: no payment for order ${txRef}`)
      return false
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return true
    }

    const verified =
      transactionId != null
        ? await this.flutterwave.verifyTransaction(transactionId)
        : false

    if (!verified) {
      this.logger.warn(`Flutterwave webhook: transaction for order ${txRef} not verified — leaving pending`)
      return false
    }

    await this.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED, String(transactionId))
    return true
  }

  async handlePaymentIoWebhook(event: any) {
    this.logger.log(`Processing Payment.io webhook`)

    // Payment.io sends the charge reference / status in the payload. Adjust
    // field names to match their real IPN format.
    const reference =
      event?.body ||
      event?.token ||
      event?.reference ||
      event?.chargeId ||
      event?.data?.body ||
      event?.data?.token ||
      event?.data?.reference

    if (!reference) {
      this.logger.warn('Payment.io webhook missing reference')
      return false
    }

    const payment = await this.prisma.payments.findFirst({ where: { providerTransactionId: reference } })
    if (!payment) {
      // Not an order payment — check whether this is a Seller Pro subscription
      // charge (referenced by its subscription id / token).
      const handled = await this.handleSubscriptionWebhook(reference)
      return handled
    }

    // Never trust the IPN body alone — confirm with Paymento's Verify API so a
    // spurious/early callback can't mark the order paid without a real payment.
    const verified = await this.paymentIo.verifyPayment(reference).catch(() => false)
    if (!verified) {
      this.logger.warn(`Payment.io webhook: token ${reference} not verified by Verify API — leaving order pending`)
      return false
    }

    await this.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED, reference)

    return true
  }

  /**
   * Handles a Paymento IPN for a Seller Pro subscription charge. The `reference`
   * is the subscription id (or the Paymento token stored as providerRef). We
   * confirm the payment server-side with Paymento's Verify API, then activate
   * the subscription and upgrade the seller's tier — which in turn switches on
   * their public, shareable storefront.
   */
  private async handleSubscriptionWebhook(reference: string): Promise<boolean> {
    const sub = await this.prisma.sellerSubscriptions.findFirst({
      where: { OR: [{ id: reference }, { providerRef: reference }], status: 'PENDING' },
      include: { seller: true },
    })
    if (!sub) {
      this.logger.warn(`Payment.io webhook: no pending subscription for reference ${reference}`)
      return false
    }

    const verified = await this.paymentIo.verifyPayment(reference).catch(() => false)
    if (!verified) {
      this.logger.warn(`Payment.io webhook: subscription ${sub.id} token not verified — leaving pending`)
      return false
    }

    const durationMonths = sub.plan === 'PREMIUM' ? 1 : 1
    const now = new Date()
    const endsAt = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)

    await this.prisma.sellerSubscriptions.update({
      where: { id: sub.id },
      data: { status: 'ACTIVE', startsAt: now, endsAt },
    })

    await this.prisma.sellers.update({
      where: { id: sub.sellerId },
      data: {
        subscriptionTier: sub.plan,
        subscriptionEndsAt: endsAt,
        storeSlug: sub.seller.storeSlug || this.makeStoreSlug(sub.seller.storeName, sub.seller.id),
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: sub.seller.userId,
        action: 'UPDATE',
        entityType: 'seller_subscription',
        entityId: sub.id,
        newValue: { plan: sub.plan, status: 'ACTIVE', endsAt },
      },
    })

    await this.notifications
      .notifySubscriptionActivated(sub.seller.userId, sub.plan === 'PREMIUM' ? 'Seller Pro Premium' : 'Seller Pro', endsAt)
      .catch(() => {})

    this.logger.log(`Seller Pro subscription ${sub.id} activated for seller ${sub.sellerId}`)
    return true
  }

  private makeStoreSlug(storeName: string, sellerId: string): string {
    const base = (storeName || 'store')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
    return `${base || 'store'}-${sellerId.slice(-4)}`
  }

  async processRefund(paymentId: string, reason: string) {
    this.logger.log(`Processing refund for payment ${paymentId}`)

    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: { order: true },
    })

    if (!payment) {
      throw new NotFoundException('Payment')
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Can only refund completed payments')
    }

    // TODO: Call payment provider's refund endpoint
    // For now, just update status
    return this.updatePaymentStatus(paymentId, PaymentStatus.REFUNDED)
  }
}
