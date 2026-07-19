import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateSellerDto, UpdateSellerDto, UploadVerificationDocumentsDto } from './dto/create-seller.dto'
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@/common/exceptions/custom-exceptions'
import { NotificationsService } from '@/modules/notifications/notifications.service'
import { PaymentIoService } from '@/modules/payments/paymentio.service'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Seller Level thresholds (P2P marketplace standard).
 * Levels are BRONZE → SILVER → GOLD → ELITE based on completed sales + average rating.
 */
export function computeSellerLevel(totalSales: number, averageRating: number, deliverySuccessRate: number): string {
  if (totalSales >= 200 && averageRating >= 4.8 && deliverySuccessRate >= 98) return 'ELITE'
  if (totalSales >= 50 && averageRating >= 4.5 && deliverySuccessRate >= 95) return 'GOLD'
  if (totalSales >= 10 && averageRating >= 4.0 && deliverySuccessRate >= 90) return 'SILVER'
  return 'BRONZE'
}

/**
 * Subscription plan definitions. The default `FREE` tier is what every new
 * seller starts on. `PRO` ("Seller Pro") and `PREMIUM` are the paid tiers that
 * unlock a public, shareable live storefront plus a lower escrow commission.
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    price: 0,
    currency: 'USD',
    durationMonths: 0,
    commissionRate: 0.1,
    storeEnabled: false,
    featuredAllowed: false,
    highlightColor: '#64748b',
    features: [
      'Standard 10% escrow commission',
      'Unlimited listings',
      'Escrow-backed payments',
      'Seller dashboard & analytics',
      'Wallet & withdrawals',
    ],
  },
  PRO: {
    id: 'PRO',
    name: 'Seller Pro',
    price: 19.99,
    currency: 'USD',
    durationMonths: 1,
    commissionRate: 0.05,
    storeEnabled: true,
    featuredAllowed: true,
    highlightColor: '#8b5cf6',
    features: [
      'Public, shareable live store link',
      'Half-price 5% escrow commission',
      'Verified "Seller Pro" badge',
      'Up to 3 featured listings',
      'Priority search placement',
      'Advanced store analytics',
      'Priority support',
    ],
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Seller Pro Premium',
    price: 49.99,
    currency: 'USD',
    durationMonths: 1,
    commissionRate: 0.03,
    storeEnabled: true,
    featuredAllowed: true,
    highlightColor: '#f59e0b',
    features: [
      'Everything in Seller Pro',
      'Lowest 3% escrow commission',
      'Up to 10 featured listings',
      'Premium store theme & branding',
      'Top-of-search "Verified Pro" boost',
      'Dedicated account manager',
    ],
  },
} as const

export type PlanId = keyof typeof SUBSCRIPTION_PLANS

/** Tiers that are allowed to operate a public, shareable storefront. */
export const STORE_ENABLED_TIERS = ['PRO', 'PREMIUM'] as const

/** Map a subscription tier to its escrow commission rate. */
export function commissionRateForTier(tier?: string | null): number {
  const plan = (tier as PlanId) || 'FREE'
  return SUBSCRIPTION_PLANS[plan]?.commissionRate ?? SUBSCRIPTION_PLANS.FREE.commissionRate
}

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private paymentIo: PaymentIoService,
  ) {}

  async createSeller(userId: string, dto: CreateSellerDto) {
    this.logger.log(`Creating seller account for user ${userId}`)

    // Check if seller already exists
    const existing = await this.prisma.sellers.findUnique({
      where: { userId },
    })

    if (existing) {
      throw new ConflictException('Seller account already exists for this user')
    }

    const seller = await this.prisma.$transaction(async (tx) => {
      const newSeller = await tx.sellers.create({
        data: {
          userId,
          storeName: dto.storeName,
          storeDescription: dto.storeDescription,
          reputationScore: 5.0,
        },
      })

      // Update user role to SELLER
      await tx.users.update({
        where: { id: userId },
        data: { role: 'SELLER' },
      })

      // Create wallet for seller
      await tx.wallet.upsert({
        where: { userId },
        create: { userId, balance: new Decimal(0) },
        update: {},
      })

      return newSeller
    })

    return seller
  }

  async getSellerProfile(sellerId: string) {
    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, lastSeenAt: true } as any,
        },
      },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const [totalListings, activeListings, recentListings] = await Promise.all([
      this.prisma.listings.count({ where: { sellerId: seller.id } }),
      this.prisma.listings.count({ where: { sellerId: seller.id, status: 'ACTIVE' } }),
      this.prisma.listings.findMany({
        where: { sellerId: seller.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          price: true,
          gameName: true,
          platform: true,
          region: true,
          images: true,
          status: true,
          salesCount: true,
          createdAt: true,
        },
      }),
    ])

    return {
      id: seller.id,
      storeName: seller.storeName,
      storeDescription: seller.storeDescription,
      isVerified: seller.isVerified,
      verifiedAt: seller.verifiedAt,
      averageRating: seller.averageRating,
      totalSales: seller.totalSales,
      totalRevenue: Number(seller.totalRevenue || 0),
      responseTime: seller.responseTime,
      responseRate: seller.responseRate,
      reputationScore: seller.reputationScore,
      subscriptionTier: seller.subscriptionTier,
      sellerLevel: (seller as any).sellerLevel || 'BRONZE',
      avgResponseTimeHours: (seller as any).avgResponseTimeHours || 0,
      deliverySuccessRate: (seller as any).deliverySuccessRate || 100,
      isOnline: (seller.user as any)?.lastSeenAt
        ? (Date.now() - new Date((seller.user as any).lastSeenAt).getTime()) < 5 * 60 * 1000
        : false,
      lastSeenAt: (seller.user as any)?.lastSeenAt || null,
      isSuspended: seller.isSuspended,
      createdAt: seller.createdAt,
      user: seller.user,
      stats: {
        totalListings,
        activeListings,
        totalSales: seller.totalSales,
        averageRating: seller.averageRating,
        responseTime: seller.responseTime,
        responseRate: seller.responseRate,
        memberSince: seller.createdAt,
        sellerLevel: (seller as any).sellerLevel || 'BRONZE',
        avgResponseTimeHours: (seller as any).avgResponseTimeHours || 0,
        deliverySuccessRate: (seller as any).deliverySuccessRate || 100,
      },
      listings: recentListings.map((l) => ({
        id: l.id,
        title: l.title,
        price: Number(l.price),
        gameName: l.gameName,
        platform: l.platform,
        region: l.region,
        images: l.images,
        status: l.status,
        salesCount: l.salesCount,
        createdAt: l.createdAt,
      })),
    }
  }

  async reportSeller(
    sellerId: string,
    reporterUserId: string,
    reason: string,
    details?: string,
  ) {
    this.logger.log(`Report submitted for seller ${sellerId} by user ${reporterUserId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      select: { id: true, storeName: true, userId: true },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const ticket = await this.prisma.supportTickets.create({
      data: {
        userId: reporterUserId,
        subject: `Seller report: ${seller.storeName}`,
        category: 'OTHER',
        priority: 'MEDIUM',
        metadata: {
          type: 'SELLER_REPORT',
          reportedSellerId: seller.id,
          reportedSellerUserId: seller.userId,
          reportedStoreName: seller.storeName,
          reason,
          details: details || null,
        },
      },
    })

    return { id: ticket.id, message: 'Report submitted successfully' }
  }

  async getSellerByUserId(userId: string) {
    const seller = await this.prisma.sellers.findUnique({
      where: { userId },
      include: { user: true },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    return seller
  }

  async updateSeller(sellerId: string, dto: UpdateSellerDto) {
    this.logger.log(`Updating seller ${sellerId}`)

    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        storeName: dto.storeName,
        storeDescription: dto.storeDescription,
        responseTime: dto.responseTime,
      },
      include: { user: true },
    })

    return seller
  }

  async uploadVerificationDocuments(
    sellerId: string,
    documents: UploadVerificationDocumentsDto[],
  ) {
    this.logger.log(`Uploading verification documents for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const updatedDocs = {
      ...(seller.verificationDocuments as any),
      ...documents.reduce((acc, doc) => {
        acc[doc.documentType] = doc.documentUrl
        return acc
      }, {}),
    }

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        verificationDocuments: updatedDocs,
      },
    })

    return updated
  }

  async submitKyc(
    sellerId: string,
    dto: {
      idType: string
      fullName: string
      documentNumber?: string
      idImageUrl: string
      selfieImageUrl: string
    },
  ) {
    this.logger.log(`Submitting KYC for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    if (seller.isVerified) {
      throw new ConflictException('Seller is already verified')
    }

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        kycStatus: 'SUBMITTED',
        kycIdType: dto.idType,
        kycFullName: dto.fullName,
        kycDocumentNumber: dto.documentNumber || null,
        kycIdImageUrl: dto.idImageUrl,
        kycSelfieImageUrl: dto.selfieImageUrl,
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
      },
    })

    return updated
  }

  async getPendingKyc(limit: number = 50) {
    return this.prisma.sellers.findMany({
      where: { kycStatus: 'SUBMITTED' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
      orderBy: { kycSubmittedAt: 'asc' },
      take: limit,
    })
  }

  async approveKyc(sellerId: string, moderatorId: string) {
    this.logger.log(`Approving KYC for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { user: true },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        kycStatus: 'APPROVED',
        isVerified: true,
        verifiedAt: new Date(),
        kycReviewedAt: new Date(),
        kycRejectionReason: null,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'VERIFICATION_CHANGE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { kycStatus: 'APPROVED', isVerified: true },
      },
    })

    if (seller.userId) {
      await this.notifications
        .notifyKycApproved(seller.userId, seller.storeName)
        .catch(() => {})
    }

    return updated
  }

  async rejectKyc(sellerId: string, moderatorId: string, reason: string) {
    this.logger.log(`Rejecting KYC for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { user: true },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        kycStatus: 'REJECTED',
        isVerified: false,
        kycReviewedAt: new Date(),
        kycRejectionReason: reason,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'VERIFICATION_CHANGE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { kycStatus: 'REJECTED', reason },
      },
    })

    if (seller.userId) {
      await this.notifications
        .notifyKycRejected(seller.userId, seller.storeName, reason)
        .catch(() => {})
    }

    return updated
  }

  async verifySellerIdentity(sellerId: string, moderatorId: string) {
    this.logger.log(`Verifying seller ${sellerId}`)

    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    })

    // Log to audit trail
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'VERIFICATION_CHANGE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { isVerified: true },
      },
    })

    return seller
  }

  async getTopSellers(limit: number = 10) {
    return this.prisma.sellers.findMany({
      where: { isVerified: true, isSuspended: false },
      orderBy: { reputationScore: 'desc' },
      take: limit,
      include: {
        user: {
          select: { email: true, firstName: true, avatarUrl: true },
        },
      },
    })
  }

  async listSellers(params: { page?: number; limit?: number; search?: string; verified?: boolean }) {
    const { page = 1, limit = 20, search, verified } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (verified !== undefined) where.isVerified = verified
    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.sellers.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.sellers.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async suspendSeller(sellerId: string, reason: string, moderatorId: string) {
    this.logger.log(`Suspending seller ${sellerId}`)

    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        isSuspended: true,
        suspensionReason: reason,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'STATUS_CHANGE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { isSuspended: true, reason },
      },
    })

    return seller
  }

  async updateSellerStats(sellerId: string) {
    this.logger.log(`Updating stats for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    // Get completed orders
    const completedOrders = await this.prisma.orders.findMany({
      where: { sellerId: seller.id, status: 'COMPLETED' },
    })

    const totalSales = completedOrders.length
    const totalRevenue = completedOrders.reduce((sum, order) => sum.plus(order.totalAmount), new Decimal(0))

    // Calculate average rating
    const allReviews = await this.prisma.reviews.findMany({
      where: { sellerId: seller.id },
    })

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    // Calculate delivery success rate: orders that completed vs total accepted
    const acceptedOrders = await this.prisma.orders.count({
      where: { sellerId: seller.id, acceptedAt: { not: null } },
    })
    const deliverySuccessRate = acceptedOrders > 0 ? (totalSales / acceptedOrders) * 100 : 100

    // Average response hours from stored responseTime (minutes)
    const avgResponseHours = seller.responseTime ? seller.responseTime / 60 : 0

    // Reputation score: weighted avg + sales bonus
    const reputationScore = Math.min(5, (avgRating * 0.7) + ((totalSales / 100) * 0.3))

    // Compute seller level
    const sellerLevel = computeSellerLevel(totalSales, avgRating, deliverySuccessRate) as any

    return this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        totalSales,
        totalRevenue,
        averageRating: avgRating,
        reputationScore,
        deliverySuccessRate,
        avgResponseTimeHours: avgResponseHours,
        sellerLevel,
      },
    })
  }

  /**
   * Public storefront data for the shareable /store/:id (or /store/:slug) link.
   * Only returns a result when the seller is verified and on a store-enabled
   * subscription tier; otherwise it throws so the storefront page can show a
   * friendly "store unavailable" state instead of leaking unverified data.
   */
  async getPublicStore(identifier: string) {
    const seller = await this.prisma.sellers.findFirst({
      where: { OR: [{ id: identifier }, { storeSlug: identifier }] },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        listings: {
          where: { status: 'ACTIVE' },
          orderBy: { isFeatured: 'desc' },
          include: { category: true },
        },
      },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    if (!this.hasLiveStore(seller)) {
      throw new ForbiddenException('This seller does not have a public store')
    }

    const plan = SUBSCRIPTION_PLANS[(seller.subscriptionTier as PlanId) || 'FREE']
    return {
      ...seller,
      planName: plan.name,
      commissionRate: plan.commissionRate,
      storeUrl: `/store/${seller.storeSlug || seller.id}`,
    }
  }

  /**
   * Returns the current subscription state for the authenticated seller,
   * including plan benefits and the shareable store link. Also transparently
   * downgrades an expired subscription so the UI always reflects reality.
   */
  async getMySubscription(userId: string) {
    const seller = await this.prisma.sellers.findUnique({
      where: { userId },
      include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
    if (!seller) {
      throw new NotFoundException('Seller')
    }

    await this.enforceExpiry(seller)

    const refreshed = await this.prisma.sellers.findUnique({
      where: { userId },
      include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })

    const tier = (refreshed?.subscriptionTier as PlanId) || 'FREE'
    const plan = SUBSCRIPTION_PLANS[tier]
    const activeSub = refreshed?.subscriptions?.[0]

    return {
      sellerId: refreshed!.id,
      tier,
      planName: plan.name,
      isPro: STORE_ENABLED_TIERS.includes(tier as any),
      commissionRate: plan.commissionRate,
      storeEnabled: plan.storeEnabled,
      featuredAllowed: plan.featuredAllowed,
      features: plan.features,
      storeSlug: refreshed!.storeSlug,
      storeUrl: refreshed!.storeSlug
        ? `${process.env.FRONTEND_URL || ''}/store/${refreshed!.storeSlug}`.replace(/([^:])\/\//, '$1/')
        : null,
      liveStore: this.hasLiveStore(refreshed!),
      isVerified: refreshed!.isVerified,
      kycStatus: refreshed!.kycStatus,
      subscriptionEndsAt: refreshed!.subscriptionEndsAt,
      subscription: activeSub
        ? {
            id: activeSub.id,
            plan: activeSub.plan,
            status: activeSub.status,
            startsAt: activeSub.startsAt,
            endsAt: activeSub.endsAt,
            amount: Number(activeSub.amount),
            currency: activeSub.currency,
          }
        : null,
    }
  }

  /**
   * Lists the available subscription plans (public).
   */
  getPlans() {
    return Object.values(SUBSCRIPTION_PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      durationMonths: p.durationMonths,
      storeEnabled: p.storeEnabled,
      featuredAllowed: p.featuredAllowed,
      commissionRate: p.commissionRate,
      features: p.features,
    }))
  }

  /**
   * Creates a paid Seller Pro / Premium subscription and initiates the payment
   * with Paymento. On successful payment the Paymento IPN calls back into the
   * payments module which activates the subscription. When Paymento is not
   * configured (e.g. local/dev), the subscription is activated immediately in
   * sandbox mode so the feature remains end-to-end testable.
   */
  async createSubscription(
    userId: string,
    planId: string,
    provider: string,
    callbackUrl?: string,
  ) {
    const plan = SUBSCRIPTION_PLANS[planId as PlanId]
    if (!plan || plan.id === 'FREE') {
      throw new BadRequestException('Invalid subscription plan')
    }

    const seller = await this.prisma.sellers.findUnique({ where: { userId } })
    if (!seller) {
      throw new NotFoundException('Seller')
    }
    if (!seller.isVerified) {
      throw new ForbiddenException('You must complete identity verification before subscribing to Seller Pro')
    }

    const subscription = await this.prisma.sellerSubscriptions.create({
      data: {
        sellerId: seller.id,
        plan: plan.id,
        status: 'PENDING',
        amount: new Decimal(plan.price),
        currency: plan.currency,
        provider,
      },
    })

    const returnUrl =
      callbackUrl ||
      `${process.env.FRONTEND_URL || 'https://market.velxo.shop'}/seller/pro?checkout=${subscription.id}`

    const charge = await this.paymentIo.createCharge({
      reference: subscription.id,
      amount: plan.price,
      currency: plan.currency,
      callbackUrl: returnUrl,
    })

    // Sandbox fallback: if Paymento isn't configured we cannot take real money,
    // so activate the subscription immediately to keep the flow functional.
    if (!charge.configured) {
      await this.activateSubscription(subscription.id)
      return {
        subscriptionId: subscription.id,
        paymentUrl: null,
        configured: false,
        sandbox: true,
        message: 'Payment provider not configured — subscription activated in sandbox mode.',
      }
    }

    if (charge.chargeId) {
      await this.prisma.sellerSubscriptions.update({
        where: { id: subscription.id },
        data: { providerRef: charge.chargeId },
      })
    }

    return {
      subscriptionId: subscription.id,
      paymentUrl: charge.paymentUrl,
      configured: true,
      sandbox: false,
    }
  }

  /**
   * Activates a PENDING subscription: marks it ACTIVE, sets the validity window
   * and upgrades the seller's tier (which in turn enables their live store).
   * Safe to call from the payment IPN. Idempotent for already-active subs.
   */
  async activateSubscription(subscriptionId: string) {
    const sub = await this.prisma.sellerSubscriptions.findUnique({
      where: { id: subscriptionId },
      include: { seller: true },
    })
    if (!sub) {
      throw new NotFoundException('Subscription')
    }
    if (sub.status === 'ACTIVE') {
      return sub
    }

    const plan = SUBSCRIPTION_PLANS[sub.plan as PlanId]
    const now = new Date()
    const endsAt = new Date(now.getTime() + plan.durationMonths * 30 * 24 * 60 * 60 * 1000)

    const updated = await this.prisma.sellerSubscriptions.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        startsAt: now,
        endsAt,
      },
    })

    await this.prisma.sellers.update({
      where: { id: sub.sellerId },
      data: {
        subscriptionTier: sub.plan,
        subscriptionEndsAt: endsAt,
        // Ensure the seller has a stable, shareable store slug.
        storeSlug: sub.seller.storeSlug || this.generateStoreSlug(sub.seller.storeName, sub.seller.id),
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: sub.seller.userId,
        action: 'UPDATE',
        entityType: 'seller_subscription',
        entityId: subscriptionId,
        newValue: { plan: sub.plan, status: 'ACTIVE', endsAt },
      },
    })

    if (sub.seller.userId) {
      await this.notifications
        .notifySubscriptionActivated(sub.seller.userId, plan.name, endsAt)
        .catch(() => {})
    }

    return updated
  }

  /**
   * Downgrades a seller back to FREE when their paid subscription has expired.
   * Called whenever we read subscription state so the storefront and commission
   * rates always reflect the live entitlement without a hard cron dependency.
   */
  async enforceExpiry(seller: { id: string; subscriptionTier?: string | null; subscriptionEndsAt?: Date | null }) {
    if (
      seller.subscriptionTier &&
      seller.subscriptionTier !== 'FREE' &&
      seller.subscriptionEndsAt &&
      new Date(seller.subscriptionEndsAt).getTime() <= Date.now()
    ) {
      await this.prisma.sellers.update({
        where: { id: seller.id },
        data: { subscriptionTier: 'FREE', subscriptionEndsAt: null },
      })
      await this.prisma.sellerSubscriptions.updateMany({
        where: { sellerId: seller.id, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      })
      return true
    }
    return false
  }

  /**
   * Builds a URL-safe, unique store slug. Falls back to a short id suffix when
   * the desired slug is taken.
   */
  generateStoreSlug(storeName: string, sellerId: string): string {
    const base = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
    const suffix = sellerId.slice(-4)
    return `${base || 'store'}-${suffix}`
  }

  hasLiveStore(seller: { isVerified: boolean; subscriptionTier?: string | null; subscriptionEndsAt?: Date | null }): boolean {
    if (!seller.isVerified) return false
    if (!seller.subscriptionTier) return false
    if (!(STORE_ENABLED_TIERS as readonly string[]).includes(seller.subscriptionTier)) return false
    // A subscribed tier with no expiry window (legacy manual upgrade) → live.
    if (!seller.subscriptionEndsAt) return true
    return new Date(seller.subscriptionEndsAt).getTime() > Date.now()
  }

  /**
   * @deprecated Manual tier upgrade retained for admin tooling; real upgrades
   * happen through `createSubscription` + the payment IPN.
   */
  async subscribe(sellerId: string, plan: string, durationMonths = 1) {
    const allowed = ['PRO', 'PREMIUM']
    if (!allowed.includes(plan)) {
      throw new BadRequestException('Invalid subscription plan')
    }
    if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
      durationMonths = 1
    }

    const seller = await this.prisma.sellers.findUnique({ where: { id: sellerId } })
    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const subscriptionEndsAt = new Date(
      Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000,
    )

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        subscriptionTier: plan,
        subscriptionEndsAt,
        storeSlug: seller.storeSlug || this.generateStoreSlug(seller.storeName, seller.id),
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: seller.userId,
        action: 'UPDATE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { subscriptionTier: plan, subscriptionEndsAt },
      },
    })

    return updated
  }
}
