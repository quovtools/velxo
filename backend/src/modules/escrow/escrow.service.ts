import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException, InvalidEscrowStateException, ForbiddenException } from '@/common/exceptions/custom-exceptions'
import { EscrowStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { NotificationsService } from '../notifications/notifications.service'
import { PaymentsService } from '../payments/payments.service'

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private payments: PaymentsService,
  ) {}

  async getEscrowStatus(orderId: string) {
    const escrow = await this.prisma.escrowTransactions.findUnique({
      where: { orderId },
    })

    if (!escrow) {
      throw new NotFoundException('Escrow')
    }

    return escrow
  }

  /**
   * Returns an escrow record together with a hosted payment link and an order
   * summary. This is the contract the frontend escrow page consumes:
   *   GET /escrow/order/:orderId -> { id, status, amount, currency, paymentLink, order }
   *
   * The payment link is read from the order/payment metadata; if absent it is
   * generated lazily via the payment provider (and persisted for reuse).
   */
  async getEscrowForOrder(orderId: string, userId?: string) {
    const escrow = await this.prisma.escrowTransactions.findUnique({
      where: { orderId },
    })
    if (!escrow) {
      throw new NotFoundException('Escrow')
    }

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, email: true, firstName: true, lastName: true } },
        seller: { include: { user: { select: { id: true, email: true } } } },
        orderItems: { include: { listing: { select: { id: true, title: true, price: true } } } },
      },
    })
    if (!order) {
      throw new NotFoundException('Order')
    }

    // Lightweight authorization: only the buyer, the seller, or an admin may
    // view the escrow of an order.
    if (userId) {
      const isBuyer = order.buyerId === userId
      const isSeller = order.seller?.userId === userId
      const isAdmin = false // role check performed by guards/controllers if required
      if (!isBuyer && !isSeller && !isAdmin) {
        throw new ForbiddenException('You do not have access to this escrow')
      }
    }

    // Resolve a payment link: read the stored link only. Generating a hosted
    // charge is a deliberate, idempotent action performed via generatePaymentLink
    // (triggered when the buyer clicks "Pay Now") — never as a side effect of a
    // GET, so viewing the order can never create a charge or settle a payment.
    let paymentLink: string | null =
      (order.metadata as Record<string, any>)?.paymentLink ?? null

    if (!paymentLink) {
      const payment = await this.prisma.payments.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      })
      paymentLink = (payment?.metadata as Record<string, any>)?.paymentLink ?? null
    }

    const chosenProvider = (order.metadata as Record<string, any>)?.paymentMethod as
      | 'FLUTTERWAVE'
      | 'PAYMENT_IO'
      | undefined

    return {
      id: escrow.id,
      status: escrow.status,
      amount: escrow.amount,
      currency: escrow.currency,
      paymentLink,
      paymentMethod: chosenProvider ?? null,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        buyer: order.buyer,
        seller: order.seller,
        items: order.orderItems,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    }
  }

  /**
   * Explicitly creates (or reuses) the hosted payment link for an order. This is
   * the only place that calls out to the payment provider to mint a charge, and
   * it is invoked deliberately when the buyer clicks "Pay Now" — never as a
   * side effect of merely viewing the order.
   *
   * It is idempotent: if a PENDING payment with a link already exists for this
   * order it is reused, so repeated clicks (or polling) never create duplicate
   * charges that could auto-settle and falsely confirm the payment.
   */
  async generatePaymentLink(orderId: string, userId?: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { buyer: true, seller: true },
    })
    if (!order) {
      throw new NotFoundException('Order')
    }

    // Only the buyer (or an admin) may generate a payment link for the order.
    if (userId && order.buyerId !== userId) {
      const isAdmin = false
      if (!isAdmin) {
        throw new ForbiddenException('Only the buyer can generate a payment link')
      }
    }

    if (
      order.status === 'PAID' ||
      order.status === 'COMPLETED' ||
      order.status === 'IN_PROGRESS' ||
      order.status === 'DELIVERED'
    ) {
      throw new InvalidEscrowStateException('This order has already been paid')
    }

    const chosenProvider = (order.metadata as Record<string, any>)?.paymentMethod as
      | 'FLUTTERWAVE'
      | 'PAYMENT_IO'
      | undefined

    // Reuse an existing PENDING payment that already holds a link.
    const existing = await this.prisma.payments.findFirst({
      where: { orderId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    })
    const existingLink = (existing?.metadata as Record<string, any>)?.paymentLink as
      | string
      | null
      | undefined

    if (existing && existingLink) {
      return { url: existingLink, provider: existing.provider, configured: true }
    }

    const link = await this.payments.createPaymentLink(orderId, chosenProvider)
    return { url: link.url, provider: link.provider, configured: link.configured }
  }

  async holdFunds(orderId: string, amount: Decimal, currency: string) {
    this.logger.log(`Holding ${amount} ${currency} in escrow for order ${orderId}`)

    const escrow = await this.prisma.escrowTransactions.create({
      data: {
        orderId,
        amount,
        currency,
        status: EscrowStatus.HELD,
      },
    })

    return escrow
  }

  async releaseFunds(orderId: string) {
    this.logger.log(`Releasing funds from escrow for order ${orderId}`)

    const escrow = await this.prisma.escrowTransactions.findUnique({
      where: { orderId },
    })

    if (!escrow) {
      throw new NotFoundException('Escrow')
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new InvalidEscrowStateException(
        `Cannot release funds. Current status: ${escrow.status}`,
      )
    }

    // Defense-in-depth: only release funds that were actually captured. The
    // escrow row is created in HELD state at order creation, so the escrow
    // status alone does not prove the buyer paid. Require a verified, completed
    // payment before crediting the seller.
    const completedPayment = await this.prisma.payments.findFirst({
      where: { orderId, status: 'COMPLETED' },
    })
    if (!completedPayment) {
      throw new InvalidEscrowStateException(
        'Cannot release funds — no completed payment exists for this order',
      )
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update escrow status
      const updatedEscrow = await tx.escrowTransactions.update({
        where: { id: escrow.id },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      })

      // Get order details
      const order = await tx.orders.findUnique({
        where: { id: orderId },
        include: { seller: true },
      })

      if (order) {
        // Credit seller wallet
        const wallet = await tx.wallet.findUnique({
          where: { userId: order.seller?.userId ?? '' },
        })

        if (wallet) {
            const newBalance = wallet.balance.plus(order.sellerPayout)

            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: newBalance,
                totalEarnings: wallet.totalEarnings.plus(order.sellerPayout),
              },
            })

            // Create transaction record
            await tx.walletTransactions.create({
              data: {
                walletId: wallet.id,
                type: 'CREDIT',
                amount: order.sellerPayout,
                currency: order.currency,
                balanceAfter: newBalance,
                description: `Escrow release for order ${order.orderNumber}`,
                relatedId: orderId,
              },
            })
          }
        }

      return updatedEscrow
    })

    // Notify both parties that the escrow was released.
    const releasedOrder = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { seller: true, buyer: true },
    })
    if (releasedOrder) {
      await this.notifications.notifyCompleted(releasedOrder).catch(() => {})
    }

    return updated
  }

  async refundFunds(orderId: string, reason: string) {
    this.logger.log(`Refunding funds for order ${orderId}. Reason: ${reason}`)

    const escrow = await this.prisma.escrowTransactions.findUnique({
      where: { orderId },
    })

    if (!escrow) {
      throw new NotFoundException('Escrow')
    }

    if (escrow.status === EscrowStatus.REFUNDED) {
      throw new InvalidEscrowStateException('Escrow already refunded')
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedEscrow = await tx.escrowTransactions.update({
        where: { id: escrow.id },
        data: {
          status: EscrowStatus.REFUNDED,
          refundedAt: new Date(),
        },
      })

      // Get order and create refund transaction
      const order = await tx.orders.findUnique({
        where: { id: orderId },
        include: { buyer: true },
      })

      if (order && order.buyer) {
        // TODO: Process refund to buyer's payment method or wallet
        // For now, just record the transaction
        const buyerWallet = await tx.wallet.findUnique({
          where: { userId: order.buyer.id },
        })

        if (buyerWallet) {
          await tx.walletTransactions.create({
            data: {
              walletId: buyerWallet.id,
              type: 'REFUND',
              amount: order.totalAmount,
              currency: order.currency,
              balanceAfter: buyerWallet.balance,
              description: `Refund for order ${order.orderNumber}. Reason: ${reason}`,
              relatedId: orderId,
            },
          })
        }
      }

      return updatedEscrow
    })

    // Notify the buyer that the escrow was refunded.
    const refundedOrder = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { seller: true, buyer: true },
    })
    if (refundedOrder) {
      await this.notifications
        .notifyRefunded(refundedOrder, `${refundedOrder.totalAmount} ${refundedOrder.currency}`)
        .catch(() => {})
    }

    return updated
  }

  async getEscrowHistory(limit: number = 50) {
    return this.prisma.escrowTransactions.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: {
          include: {
            buyer: { select: { id: true, email: true } },
            seller: { select: { id: true } },
          },
        },
      },
    })
  }

  async getSellerEscrowBalance(sellerId: string) {
    const escrows = await this.prisma.escrowTransactions.findMany({
      where: {
        order: { sellerId },
        status: EscrowStatus.HELD,
      },
    })

    const totalHeld = escrows.reduce((sum, e) => sum.plus(e.amount), new Decimal(0))

    return {
      totalHeld,
      escrowCount: escrows.length,
    }
  }
}
