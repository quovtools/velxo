import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateOrderDto } from './dto/create-order.dto'
import {
  NotFoundException,
  ForbiddenException,
  InsufficientFundsException,
  InvalidEscrowStateException,
} from '@/common/exceptions/custom-exceptions'
import { OrderStatus, EscrowStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { RewardsService } from '../rewards/rewards.service'

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)
  private readonly COMMISSION_RATE = 0.1 // 10%

  constructor(private prisma: PrismaService, private rewardsService: RewardsService) {}

  async createOrder(buyerId: string, dto: CreateOrderDto) {
    this.logger.log(`Creating order for buyer ${buyerId}`)

    // Validate listing
    const listing = await this.prisma.listings.findUnique({
      where: { id: dto.listingId },
      include: { seller: true },
    })

    if (!listing) {
      throw new NotFoundException('Listing')
    }

    if (listing.sellerId === buyerId) {
      throw new ForbiddenException('Cannot purchase your own listing')
    }

    // Calculate amounts
    const subtotal = new Decimal(listing.price).times(dto.quantity)
    const commissionAmount = subtotal.times(this.COMMISSION_RATE)
    const sellerPayout = subtotal.minus(commissionAmount)

    // Create order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          buyerId,
          sellerId: listing.sellerId,
          subtotal,
          totalAmount: subtotal,
          commissionRate: new Decimal(this.COMMISSION_RATE),
          commissionAmount,
          sellerPayout,
          currency: listing.currency,
          buyerNote: dto.buyerNote,
          status: OrderStatus.PENDING,
          orderItems: {
            create: {
              listingId: dto.listingId,
              quantity: dto.quantity,
              unitPrice: listing.price,
              totalPrice: subtotal,
            },
          },
          escrow: {
            create: {
              amount: subtotal,
              currency: listing.currency,
              status: EscrowStatus.HELD,
            },
          },
        },
        include: {
          orderItems: { include: { listing: true } },
          escrow: true,
          buyer: true,
          seller: true,
        },
      })

      // Create commission record
      await tx.commissions.create({
        data: {
          orderId: newOrder.id,
          sellerId: listing.sellerId,
          rate: new Decimal(this.COMMISSION_RATE),
          amount: commissionAmount,
          currency: listing.currency,
        },
      })

      // Increment listing sales count
      await tx.listings.update({
        where: { id: dto.listingId },
        data: { salesCount: { increment: 1 } },
      })

      return newOrder
    })

    return order
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        seller: true,
        orderItems: { include: { listing: true } },
        escrow: true,
        payments: true,
        disputes: true,
      },
    })

    if (!order) {
      throw new NotFoundException('Order')
    }

    // Authorize access
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('You do not have access to this order')
    }

    return order
  }

  async confirmDelivery(orderId: string, buyerId: string) {
    this.logger.log(`Confirming delivery for order ${orderId}`)

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { escrow: true },
    })

    if (!order) {
      throw new NotFoundException('Order')
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can confirm delivery')
    }

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new InvalidEscrowStateException('Order is not in progress')
    }

    // Release escrow and complete order
    return await this.prisma.$transaction(async (tx) => {
      // Update escrow
      await tx.escrowTransactions.update({
        where: { id: order.escrow.id },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      })

      // Update order
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
          paidAt: new Date(),
        },
        include: {
          buyer: true,
          seller: true,
          orderItems: { include: { listing: true } },
        },
      })

      // Credit seller wallet
      const seller = await tx.sellers.findUnique({
        where: { userId: order.sellerId },
        include: { user: true },
      })

      if (seller) {
        await tx.walletTransactions.create({
          data: {
            walletId: seller.user.id, // FIXME: Link properly
            type: 'CREDIT',
            amount: order.sellerPayout,
            currency: order.currency,
            balanceAfter: new Decimal(0), // TODO: Calculate from wallet balance
            description: `Payment for order ${order.orderNumber}`,
            relatedId: orderId,
          },
        })
      }

      // Record commission
      await tx.commissions.updateMany({
        where: {
          orderId,
          sellerId: order.sellerId,
        },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })

      // Award Velxo Coins to buyer and seller
      const buyerCoinAmount = Math.floor(Number(order.totalAmount))
      const sellerCoinAmount = Math.floor(Number(order.sellerPayout)) * 2

      await this.rewardsService.creditCoins(
        order.buyerId,
        buyerCoinAmount,
        'PURCHASE',
        `Earned ${buyerCoinAmount} coins from order ${order.orderNumber}`,
        orderId,
      )

      await this.rewardsService.creditCoins(
        order.sellerId,
        sellerCoinAmount,
        'SALE',
        `Earned ${sellerCoinAmount} coins from order ${order.orderNumber}`,
        orderId,
      )

      // Credit affiliate commission if applicable
      const referral = await tx.affiliateReferrals.findFirst({
        where: { referredUserId: order.buyerId },
      })

      if (referral) {
        const affiliateCommission = Number(order.totalAmount) * Number(referral.commissionRate)
        await tx.affiliateReferrals.update({
          where: { id: referral.id },
          data: {
            totalEarned: { increment: affiliateCommission },
            tradeCount: { increment: 1 },
          },
        })

        // Also award coins to referrer
        const referrerCoins = Math.floor(affiliateCommission * 10)
        await this.rewardsService.creditCoins(
          referral.referrerId,
          referrerCoins,
          'REFERRAL',
          `Earned ${referrerCoins} coins from referral trade ${order.orderNumber}`,
          orderId,
        )
      }

      return updatedOrder
    })
  }

  async getBuyerOrders(buyerId: string) {
    return this.prisma.orders.findMany({
      where: { buyerId },
      include: {
        seller: true,
        orderItems: { include: { listing: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getSellerOrders(sellerId: string) {
    return this.prisma.orders.findMany({
      where: { sellerId },
      include: {
        buyer: true,
        orderItems: { include: { listing: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
