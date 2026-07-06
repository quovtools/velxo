import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { PaymentProvider, PaymentStatus } from '@prisma/client'
import { NotFoundException } from '@/common/exceptions/custom-exceptions'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(private prisma: PrismaService) {}

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
      include: { order: true },
    })

    // Update order status if payment completed
    if (status === PaymentStatus.COMPLETED && payment.order.status === 'PENDING') {
      await this.prisma.orders.update({
        where: { id: payment.orderId },
        data: { status: 'PAID', paidAt: new Date() },
      })
    }

    return payment
  }

  async handleStripeWebhook(event: any) {
    this.logger.log(`Processing Stripe webhook: ${event.type}`)

    // TODO: Implement Stripe webhook handling
    return true
  }

  async handleFlutterwaveWebhook(event: any) {
    this.logger.log(`Processing Flutterwave webhook`)

    // TODO: Implement Flutterwave webhook handling
    return true
  }

  async handlePayPalWebhook(event: any) {
    this.logger.log(`Processing PayPal webhook`)

    // TODO: Implement PayPal webhook handling
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
