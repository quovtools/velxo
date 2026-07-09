import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateDisputeDto } from './dto/create-dispute.dto'
import { ResolveDisputeDto } from './dto/resolve-dispute.dto'
import {
  NotFoundException,
  ForbiddenException,
  InvalidEscrowStateException,
} from '@/common/exceptions/custom-exceptions'
import { DisputeStatus, EscrowStatus, OrderStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createDispute(initiatorId: string, dto: CreateDisputeDto) {
    this.logger.log(`Creating dispute for order ${dto.orderId}`)

    const order = await this.prisma.orders.findUnique({
      where: { id: dto.orderId },
      include: { seller: true },
    })

    if (!order) {
      throw new NotFoundException('Order')
    }

    if (order.buyerId !== initiatorId && order.seller?.userId !== initiatorId) {
      throw new ForbiddenException('Only order participants can create disputes')
    }

    // Check if dispute already exists
    const existingDispute = await this.prisma.disputes.findFirst({
      where: { orderId: dto.orderId, status: { not: DisputeStatus.CLOSED } },
    })

    if (existingDispute) {
      throw new InvalidEscrowStateException('An active dispute already exists for this order')
    }

    const dispute = await this.prisma.disputes.create({
      data: {
        orderId: dto.orderId,
        initiatedById: initiatorId,
        reason: dto.reason,
        evidence: dto.evidence ? { evidence: dto.evidence } : undefined,
        status: DisputeStatus.OPEN,
      },
      include: {
        order: { include: { buyer: true, seller: true } },
        initiator: true,
      },
    })

    // Update order status
    await this.prisma.orders.update({
      where: { id: dto.orderId },
      data: { status: OrderStatus.DISPUTED },
    })

    // Notify the other participant (not the initiator) of the dispute.
    const counterpartyId =
      initiatorId === order.buyerId ? order.seller?.userId : order.buyerId
    if (counterpartyId) {
      await this.notifications
        .notifyDispute(dispute.id, counterpartyId)
        .catch(() => {})
    }

    return dispute
  }

  async getDisputeById(disputeId: string) {
    const dispute = await this.prisma.disputes.findUnique({
      where: { id: disputeId },
      include: {
        order: { include: { buyer: true, seller: true, orderItems: { include: { listing: true } } } },
        initiator: true,
        resolver: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!dispute) {
      throw new NotFoundException('Dispute')
    }

    return dispute
  }

  async getOpenDisputes(limit: number = 50) {
    return this.prisma.disputes.findMany({
      where: { status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] } },
      include: {
        order: { include: { buyer: true, seller: true } },
        initiator: true,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  async resolveDispute(disputeId: string, resolverId: string, dto: ResolveDisputeDto) {
    this.logger.log(`Resolving dispute ${disputeId}`)

    const dispute = await this.prisma.disputes.findUnique({
      where: { id: disputeId },
      include: { order: true },
    })

    if (!dispute) {
      throw new NotFoundException('Dispute')
    }

    if (dispute.status === DisputeStatus.CLOSED) {
      throw new InvalidEscrowStateException('Dispute is already closed')
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update dispute
      const updatedDispute = await tx.disputes.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED_BUYER,
          resolvedBy: resolverId,
          resolvedAt: new Date(),
          resolutionType: dto.resolutionType,
          resolutionNotes: dto.resolutionNotes,
          refundAmount: dto.refundAmount ? new Decimal(dto.refundAmount) : undefined,
        },
        include: {
          order: { include: { seller: true } },
        },
      })

      const order = updatedDispute.order

      // Resolve escrow + move money + set the correct order status.
      if (dto.resolutionType === 'REFUND_BUYER') {
        const escrow = await tx.escrowTransactions.findUnique({
          where: { orderId: order.id },
        })

        if (escrow && escrow.status !== EscrowStatus.REFUNDED) {
          await tx.escrowTransactions.update({
            where: { id: escrow.id },
            data: {
              status: EscrowStatus.REFUNDED,
              refundedAt: new Date(),
            },
          })
        }

        // Credit the buyer up to the order total (never more than was held).
        const requested = dto.refundAmount ? new Decimal(dto.refundAmount) : order.totalAmount
        const refundAmount = requested.lessThan(order.totalAmount)
          ? requested
          : order.totalAmount
        const buyerWallet = await tx.wallet.findUnique({
          where: { userId: order.buyerId },
        })
        if (buyerWallet) {
          const newBalance = buyerWallet.balance.plus(refundAmount)
          await tx.wallet.update({
            where: { id: buyerWallet.id },
            data: { balance: newBalance },
          })
          await tx.walletTransactions.create({
            data: {
              walletId: buyerWallet.id,
              type: 'REFUND',
              amount: refundAmount,
              currency: order.currency,
              balanceAfter: newBalance,
              description: `Dispute refund for order ${order.orderNumber}`,
              relatedId: order.id,
            },
          })
        }

        await tx.orders.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUNDED, refundedAt: new Date() },
        })
      } else {
        // RELEASE_TO_SELLER, SPLIT, OTHER → pay out the seller and complete.
        const escrow = await tx.escrowTransactions.findUnique({
          where: { orderId: order.id },
        })

        if (escrow && escrow.status === EscrowStatus.HELD) {
          await tx.escrowTransactions.update({
            where: { id: escrow.id },
            data: {
              status: EscrowStatus.RELEASED,
              releasedAt: new Date(),
            },
          })
        }

        const sellerWallet = await tx.wallet.findUnique({
          where: { userId: order.seller?.userId ?? '' },
        })
        if (sellerWallet) {
          const newBalance = sellerWallet.balance.plus(order.sellerPayout)
          await tx.wallet.update({
            where: { id: sellerWallet.id },
            data: {
              balance: newBalance,
              totalEarnings: sellerWallet.totalEarnings.plus(order.sellerPayout),
            },
          })
          await tx.walletTransactions.create({
            data: {
              walletId: sellerWallet.id,
              type: 'CREDIT',
              amount: order.sellerPayout,
              currency: order.currency,
              balanceAfter: newBalance,
              description: `Dispute payout for order ${order.orderNumber}`,
              relatedId: order.id,
            },
          })
        }

        await tx.orders.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.COMPLETED,
            completedAt: new Date(),
            paidAt: new Date(),
          },
        })
      }

      return updatedDispute
    })
  }

  async addDisputeMessage(disputeId: string, senderId: string, content: string, attachments?: string[]) {
    const dispute = await this.prisma.disputes.findUnique({
      where: { id: disputeId },
      include: { order: { include: { seller: true } } },
    })

    if (!dispute) {
      throw new NotFoundException('Dispute')
    }

    if (
      senderId !== dispute.initiatedById &&
      senderId !== dispute.order?.buyerId &&
      senderId !== dispute.order?.seller?.userId
    ) {
      throw new ForbiddenException('You are not a participant in this dispute')
    }

    return this.prisma.disputeMessages.create({
      data: {
        disputeId,
        senderId,
        content,
        attachments: attachments || [],
      },
    })
  }
}
