import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateOrderDto } from './dto/create-order.dto'
import {
  NotFoundException,
  ForbiddenException,
  InsufficientFundsException,
  InvalidEscrowStateException,
  BadRequestException,
} from '@/common/exceptions/custom-exceptions'
import { OrderStatus, EscrowStatus, ListingStatus } from '@prisma/client'
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

    if (listing.status !== 'ACTIVE' || listing.isSold) {
      throw new BadRequestException('This listing is not available for purchase')
    }

    if (listing.seller.userId === buyerId) {
      throw new ForbiddenException('Cannot purchase your own listing')
    }

    // Resolve the seller id for the order. Prefer the resolved seller relation
    // (guaranteed to be a valid sellers.id); fall back to a userId lookup to
    // support legacy listings whose sellerId still stores a user id.
    let sellerId = listing.seller?.id
    if (!sellerId) {
      const sellerByUser = await this.prisma.sellers.findUnique({
        where: { userId: listing.sellerId },
      })
      sellerId = sellerByUser?.id
    }
    if (!sellerId) {
      throw new BadRequestException('This listing is not linked to a valid seller')
    }

    // Calculate amounts
    const subtotal = new Decimal(listing.price).times(dto.quantity)
    const commissionAmount = subtotal.times(this.COMMISSION_RATE)
    const sellerPayout = subtotal.minus(commissionAmount)

    // Create order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Re-check availability atomically (guards against two buyers ordering
      // the same single-unit account at the same time).
      const liveListing = await tx.listings.findUnique({ where: { id: dto.listingId } })
      if (!liveListing || liveListing.status !== 'ACTIVE' || liveListing.isSold) {
        throw new BadRequestException('This listing is no longer available for purchase')
      }

      const newOrder = await tx.orders.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          buyerId,
          sellerId,
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
          sellerId,
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

      // Reserve the listing immediately so a second buyer cannot also purchase
      // this single-unit account. It is reverted to ACTIVE if the payment fails
      // (see PaymentsService.updatePaymentStatus) or if the order is cancelled.
      await tx.listings.update({
        where: { id: dto.listingId },
        data: { isSold: true, status: ListingStatus.SOLD },
      })

      return newOrder
    })

    return order
  }

  /**
   * Creates an escrow-backed order for non-listing purchases (official top-ups
   * and seller-posted rank-boosting gigs). Unlike createOrder, this does not
   * require a `listings` row — the order item references the source product/gig
   * via `metadata` and a human-readable title instead of listingId.
   */
  async createServiceOrder(
    buyerId: string,
    dto: {
      sellerId: string
      title: string
      price: number
      currency?: string
      quantity?: number
      buyerNote?: string
      sourceType: 'TOPUP' | 'GIG'
      sourceId: string
    },
  ) {
    this.logger.log(`Creating ${dto.sourceType} service order for buyer ${buyerId}`)

    const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1
    const currency = dto.currency || 'USD'

    const seller = await this.prisma.sellers.findUnique({
      where: { id: dto.sellerId },
    })
    if (!seller) {
      throw new NotFoundException('Seller')
    }
    if (seller.userId === buyerId) {
      throw new ForbiddenException('Cannot purchase your own service')
    }

    const subtotal = new Decimal(dto.price).times(quantity)
    const commissionAmount = subtotal.times(this.COMMISSION_RATE)
    const sellerPayout = subtotal.minus(commissionAmount)

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          buyerId,
          sellerId: dto.sellerId,
          subtotal,
          totalAmount: subtotal,
          commissionRate: new Decimal(this.COMMISSION_RATE),
          commissionAmount,
          sellerPayout,
          currency,
          buyerNote: dto.buyerNote,
          status: OrderStatus.PENDING,
          metadata: {
            sourceType: dto.sourceType,
            sourceId: dto.sourceId,
            title: dto.title,
          },
          orderItems: {
            create: {
              quantity,
              unitPrice: new Decimal(dto.price),
              totalPrice: subtotal,
            },
          },
          escrow: {
            create: {
              amount: subtotal,
              currency,
              status: EscrowStatus.HELD,
            },
          },
        },
        include: {
          orderItems: true,
          escrow: true,
          buyer: true,
          seller: true,
        },
      })

      await tx.commissions.create({
        data: {
          orderId: newOrder.id,
          sellerId: dto.sellerId,
          rate: new Decimal(this.COMMISSION_RATE),
          amount: commissionAmount,
          currency,
        },
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
    if (order.buyerId !== userId && order.seller.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order')
    }

    return order
  }

  async confirmDelivery(orderId: string, buyerId: string) {
    this.logger.log(`Confirming delivery for order ${orderId}`)

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { escrow: true, seller: true },
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

    if (!order.escrow) {
      throw new InvalidEscrowStateException('No escrow record for this order')
    }

    if (order.escrow.status !== EscrowStatus.HELD) {
      throw new InvalidEscrowStateException('Escrow is not held')
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

      // Credit seller wallet (balance + transaction) atomically
      const wallet = await tx.wallet.findUnique({
        where: { userId: order.seller.userId },
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
        await tx.walletTransactions.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: order.sellerPayout,
            currency: order.currency,
            balanceAfter: newBalance,
            description: `Payment for order ${order.orderNumber}`,
            relatedId: orderId,
          },
        })
      }

      // Record commission
      await tx.commissions.updateMany({
        where: {
          orderId,
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
        order.seller.userId,
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

  async markDelivered(orderId: string, sellerId: string, deliveryData?: any) {
    this.logger.log(`Seller marking order ${orderId} as delivered`)

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { seller: true },
    })

    if (!order) {
      throw new NotFoundException('Order')
    }

    if (order.seller.userId !== sellerId) {
      throw new ForbiddenException('Only the seller can mark this order as delivered')
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be paid before it can be marked delivered')
    }

    return this.prisma.orders.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.IN_PROGRESS,
        deliveryData: deliveryData ?? order.deliveryData,
        deliveredAt: new Date(),
      },
      include: {
        buyer: true,
        seller: true,
        orderItems: { include: { listing: true } },
      },
    })
  }
}
