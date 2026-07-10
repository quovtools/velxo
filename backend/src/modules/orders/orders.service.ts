import { Injectable, Logger, Inject, Optional } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { Request } from 'express'
import { PrismaService } from '@/common/services/prisma.service'
import { CurrencyService } from '@/common/services/currency.service'
import { CreateOrderDto } from './dto/create-order.dto'
import {
  NotFoundException,
  ForbiddenException,
  InsufficientFundsException,
  InvalidEscrowStateException,
  BadRequestException,
} from '@/common/exceptions/custom-exceptions'
import { OrderStatus, EscrowStatus, PaymentStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Escrow timing windows (milliseconds).
// SELLER_WINDOW: after the seller accepts, they have this long to deliver.
// BUYER_WINDOW: after delivery, the buyer has this long to confirm receipt.
export const ESCROW_SELLER_WINDOW_MS = 60 * 60 * 1000
export const ESCROW_BUYER_WINDOW_MS = 60 * 60 * 1000
import { RewardsService } from '../rewards/rewards.service'
import { NotificationsService } from '../notifications/notifications.service'

/** Escrow commission rate by seller subscription tier (Seller Pro = lower). */
function commissionRateForTier(tier?: string | null): number {
  switch (tier) {
    case 'PRO':
      return 0.05
    case 'PREMIUM':
      return 0.03
    default:
      return 0.1
  }
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)

  constructor(
    private prisma: PrismaService,
    private rewardsService: RewardsService,
    private notifications: NotificationsService,
    private currencyService: CurrencyService,
    @Optional() @Inject(REQUEST) private request?: Request,
  ) {}

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

    // Calculate amounts — Seller Pro / Premium sellers pay a reduced commission.
    const commissionRate = commissionRateForTier(listing.seller?.subscriptionTier)
    const subtotal = new Decimal(listing.price).times(dto.quantity)
    const commissionAmount = subtotal.times(commissionRate)
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
          commissionRate: new Decimal(commissionRate),
          commissionAmount,
          sellerPayout,
          currency: listing.currency,
          buyerNote: dto.buyerNote,
          status: OrderStatus.PENDING,
          metadata: dto.paymentMethodId ? { paymentMethod: dto.paymentMethodId } : undefined,
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
          rate: new Decimal(commissionRate),
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
      // this single-unit account. We only flag isSold (which blocks re-purchase
      // via the availability re-check below) but keep the listing ACTIVE until
      // the payment is actually confirmed — it is only marked SOLD in
      // PaymentsService.updatePaymentStatus once the payment completes. This
      // prevents a product from showing as "sold/completed" before it is paid.
      await tx.listings.update({
        where: { id: dto.listingId },
        data: { isSold: true },
      })

      return newOrder
    })

    // Notify the seller that a new order was placed.
    await this.notifications.notifyNewOrder(order).catch(() => {})
    // Email confirmation to buyer immediately after order creation.
    await this.notifications.sendOrderPlacedEmail(order).catch(() => {})

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

    const commissionRate = commissionRateForTier(seller.subscriptionTier)
    const subtotal = new Decimal(dto.price).times(quantity)
    const commissionAmount = subtotal.times(commissionRate)
    const sellerPayout = subtotal.minus(commissionAmount)

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          buyerId,
          sellerId: dto.sellerId,
          subtotal,
          totalAmount: subtotal,
          commissionRate: new Decimal(commissionRate),
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
              listingId: null,
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
          rate: new Decimal(commissionRate),
          amount: commissionAmount,
          currency,
        },
      })

      return newOrder
    })

    // Notify the seller that a new order was placed.
    await this.notifications.notifyNewOrder(order).catch(() => {})

    return order
  }

  async acceptOrder(orderId: string, sellerId: string) {
    this.logger.log(`Seller accepting order ${orderId}`)

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { seller: true, buyer: true },
    })

    if (!order) {
      throw new NotFoundException('Order')
    }

    if (order.seller?.userId !== sellerId) {
      throw new ForbiddenException('Only the seller can accept this order')
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be paid before it can be accepted')
    }

    if (order.acceptedAt) {
      throw new BadRequestException('Order has already been accepted')
    }

    // Persist an explicit delivery deadline so the frontend can rely on the
    // server clock instead of computing acceptedAt + window itself.
    const acceptedAt = new Date()
    const updated = await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        acceptedAt,
        sellerDeliverDeadline: new Date(acceptedAt.getTime() + ESCROW_SELLER_WINDOW_MS),
      },
      include: { buyer: true, seller: true, orderItems: { include: { listing: true } } },
    })

    await this.notifications.notifyOrderAccepted?.(updated).catch(() => {})

    return updated
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
    if (order.buyerId !== userId && order.seller?.userId !== userId) {
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

    // Defense-in-depth: never release funds / mark an order completed unless a
    // payment was actually captured and verified. The escrow row is created in
    // HELD state at order time, so the escrow check alone is not sufficient to
    // prove the buyer paid.
    const completedPayment = await this.prisma.payments.findFirst({
      where: { orderId, status: PaymentStatus.COMPLETED },
    })
    this.logger.log(
      `confirmDelivery ${orderId} | orderStatus=${order.status} escrowStatus=${order.escrow.status} ` +
        `completedPayment=${completedPayment ? completedPayment.id : 'NONE'}`,
    )
    if (!completedPayment) {
      throw new InvalidEscrowStateException('Cannot release funds — no completed payment exists for this order')
    }

    // Release escrow and complete order
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
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

      const sellerUserId = order.seller?.userId
      if (sellerUserId) {
        await this.rewardsService.creditCoins(
          sellerUserId,
          sellerCoinAmount,
          'SALE',
          `Earned ${sellerCoinAmount} coins from order ${order.orderNumber}`,
          orderId,
        )
      }

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

    // Notify both parties that the order is complete and funds were released.
    await this.notifications.notifyCompleted(updatedOrder).catch(() => {})

    return updatedOrder
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

  /**
   * Resolves the seller record for a userId then returns that seller's orders.
   * The orders table stores sellers.id (not users.id) in the sellerId column.
   */
  async getSellerOrdersByUserId(userId: string) {
    const seller = await this.prisma.sellers.findUnique({ where: { userId } })
    if (!seller) return []
    return this.getSellerOrders(seller.id)
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

    if (order.seller?.userId !== sellerId) {
      throw new ForbiddenException('Only the seller can mark this order as delivered')
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be paid before it can be marked delivered')
    }

    const updated = await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.IN_PROGRESS,
        deliveryData: deliveryData ?? order.deliveryData,
        deliveredAt: new Date(),
        buyerConfirmDeadline: new Date(Date.now() + ESCROW_BUYER_WINDOW_MS),
      },
      include: {
        buyer: true,
        seller: true,
        orderItems: { include: { listing: true } },
      },
    })

    // Notify the buyer that the seller has delivered.
    await this.notifications.notifyDelivered(updated).catch(() => {})

    return updated
  }
}
