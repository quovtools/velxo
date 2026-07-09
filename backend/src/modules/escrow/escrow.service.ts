import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException, InvalidEscrowStateException } from '@/common/exceptions/custom-exceptions'
import { EscrowStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name)

  constructor(private prisma: PrismaService) {}

  async getEscrowStatus(orderId: string) {
    const escrow = await this.prisma.escrowTransactions.findUnique({
      where: { orderId },
    })

    if (!escrow) {
      throw new NotFoundException('Escrow')
    }

    return escrow
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

    return await this.prisma.$transaction(async (tx) => {
      // Update escrow status
      const updated = await tx.escrowTransactions.update({
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

      return updated
    })
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

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.escrowTransactions.update({
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

      return updated
    })
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
