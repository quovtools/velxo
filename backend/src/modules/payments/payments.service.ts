import { Injectable, Logger } from '@nestjs/common'
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
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    private prisma: PrismaService,
    private paymentIo: PaymentIoService,
    private flutterwave: FlutterwaveService,
    private notifications: NotificationsService,
  ) {}

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
          data: { methodId: charge.chargeId },
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

    // TODO: Map Flutterwave event -> payment status and call updatePaymentStatus.
    return true
  }

  async handlePaymentIoWebhook(event: any) {
    this.logger.log(`Processing Payment.io webhook`)

    // Payment.io sends the charge reference / status in the payload. Adjust
    // field names to match their real IPN format.
    const reference = event?.reference || event?.chargeId || event?.data?.reference
    const status = event?.status || event?.data?.status

    if (!reference) {
      this.logger.warn('Payment.io webhook missing reference')
      return false
    }

    const payment = await this.prisma.payments.findFirst({ where: { methodId: reference } })
    if (!payment) {
      this.logger.warn(`Payment.io webhook: no payment for reference ${reference}`)
      return false
    }

    const completed = status === 'completed' || status === 'successful' || status === 'paid' || status === 'confirmed'
    await this.updatePaymentStatus(
      payment.id,
      completed ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
      reference,
    )

    return true
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
