import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { ListingStatus, OrderStatus, AuditAction, Role } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { NotificationsService } from '@/modules/notifications/notifications.service'
import { SellersService } from '@/modules/sellers/sellers.service'

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private sellersService: SellersService,
  ) {}

  async getDashboardStats() {
    this.logger.log('Fetching dashboard statistics')

    const [
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      pendingListings,
      totalOrders,
      completedOrders,
      totalRevenue,
      pendingDisputes,
      flaggedUsers,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.sellers.count(),
      this.prisma.listings.count(),
      this.prisma.listings.count({ where: { status: ListingStatus.ACTIVE } }),
      this.prisma.listings.count({ where: { status: ListingStatus.PENDING_APPROVAL } }),
      this.prisma.orders.count(),
      this.prisma.orders.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.orders.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
      this.prisma.disputes.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.users.count({ where: { isBanned: true } }),
    ])

    const avgOrderValue =
      completedOrders > 0 ? Number(totalRevenue._sum.totalAmount || 0) / completedOrders : 0

    return {
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      pendingListings,
      listingApprovalRate: totalListings > 0 ? (activeListings / totalListings) * 100 : 0,
      totalOrders,
      completedOrders,
      orderCompletionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      avgOrderValue,
      gmv: totalRevenue._sum.totalAmount || 0,
      pendingDisputes,
      disputeRate: totalOrders > 0 ? (pendingDisputes / totalOrders) * 100 : 0,
      flaggedUsers,
    }
  }

  async getPendingListings(limit?: number | string) {
    const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit
    const take = Number.isFinite(parsed) && parsed! > 0 ? parsed! : 50
    return this.prisma.listings.findMany({
      where: { status: ListingStatus.PENDING_APPROVAL },
      include: {
        seller: { include: { user: true } },
        category: true,
      },
      orderBy: { createdAt: 'asc' },
      take,
    })
  }

  async approveListing(listingId: string, moderatorId: string) {
    this.logger.log(`Approving listing ${listingId} by moderator ${moderatorId}`)

    const listing = await this.prisma.listings.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.ACTIVE,
        moderatedAt: new Date(),
        moderatedBy: moderatorId,
      },
      include: { seller: true },
    })

    // TODO: Send notification to seller
    if (listing.seller?.userId) {
      await this.notifications
        .notifyListingApproved(listing.id, listing.seller.userId)
        .catch(() => {})
    }
    return listing
  }

  async rejectListing(listingId: string, moderatorId: string, reason: string) {
    this.logger.log(`Rejecting listing ${listingId}`)

    const listing = await this.prisma.listings.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.REJECTED,
        moderationNotes: reason,
        moderatedAt: new Date(),
        moderatedBy: moderatorId,
      },
      include: { seller: true },
    })

    // TODO: Send notification to seller with rejection reason
    if (listing.seller?.userId) {
      await this.notifications
        .notifyListingRejected(listing.id, listing.seller.userId, reason)
        .catch(() => {})
    }
    return listing
  }

  async getFlaggedListings(limit: number = 50) {
    const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit
    const take = Number.isFinite(parsed) && parsed! > 0 ? parsed! : 50
    return this.prisma.fraudFlags.findMany({
      where: { listingId: { not: null } },
      include: {
        listing: {
          include: { seller: { include: { user: true } } },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
    })
  }

  async getSuspiciousUsers(limit: number = 50) {
    const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit
    const take = Number.isFinite(parsed) && parsed! > 0 ? parsed! : 50
    return this.prisma.fraudFlags.findMany({
      where: { listingId: null, orderId: null },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take,
    })
  }

  async getRevenueAnalytics(startDate: Date, endDate: Date) {
    const orders = await this.prisma.orders.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { commissions: true },
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0)
    const totalCommissions = orders.reduce(
      (sum, order) => sum + order.commissions.reduce((s, c) => s + c.amount.toNumber(), 0),
      0,
    )

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalCommissions,
      netRevenue: totalRevenue - totalCommissions,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    }
  }

  async getSellerMetrics(sellerId: string) {
    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { user: true },
    })

    if (!seller) return null

    const [orders, reviews, disputes] = await Promise.all([
      this.prisma.orders.findMany({ where: { sellerId: seller.id } }),
      this.prisma.reviews.findMany({ where: { sellerId: seller.id } }),
      this.prisma.disputes.findMany({
        where: {
          order: { sellerId: seller.id },
        },
      }),
    ])

    return {
      seller,
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.status === OrderStatus.COMPLETED).length,
      totalReviews: reviews.length,
      avgRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      disputes: disputes.length,
      totalEarnings: seller.totalRevenue,
    }
  }

  async createAuditLog(actorId: string, action: AuditAction, entityType: string, entityId: string, oldValue?: any, newValue?: any) {
    // Audit logging must never break the primary admin operation. We also
    // guard the actorId foreign key: admin-console actions (password-gated) or
    // deleted users would otherwise violate admin_audit_logs_actorId_fkey.
    try {
      let resolvedActorId = actorId
      let syntheticActor: string | undefined

      const actorExists = actorId
        ? await this.prisma.users.findUnique({ where: { id: actorId }, select: { id: true } })
        : null

      if (!actorExists) {
        syntheticActor = actorId || 'unknown'
        // Fall back to the system admin-console user (seeded on startup).
        const system = await this.prisma.users.upsert({
          where: { id: 'admin-console' },
          update: {},
          create: {
            id: 'admin-console',
            email: 'admin-console@system.velxo',
            firstName: 'Admin',
            lastName: 'Console',
            role: 'ADMIN',
            emailVerified: true,
            isActive: true,
          },
          select: { id: true },
        })
        resolvedActorId = system.id
      }

      return await this.prisma.adminAuditLogs.create({
        data: {
          actorId: resolvedActorId,
          action,
          entityType,
          entityId,
          oldValue,
          newValue,
          metadata: syntheticActor ? { syntheticActor } : undefined,
        },
      })
    } catch (err) {
      this.logger.error(`Failed to write audit log (${action} ${entityType} ${entityId}) — continuing`, err as any)
      return null
    }
  }

  async getPendingKyc(limit?: number | string) {
    const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit
    const take = Number.isFinite(parsed) && parsed! > 0 ? parsed! : 50
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
      take,
    })
  }

  async approveKyc(sellerId: string, moderatorId: string) {
    this.logger.log(`Admin approving KYC for seller ${sellerId}`)
    return this.sellersService.approveKyc(sellerId, moderatorId)
  }

  async rejectKyc(sellerId: string, moderatorId: string, reason: string) {
    this.logger.log(`Admin rejecting KYC for seller ${sellerId}`)
    return this.sellersService.rejectKyc(sellerId, moderatorId, reason)
  }

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------
  async listUsers(filters: {
    search?: string
    role?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(100, Math.max(1, filters.limit || 25))
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.role) where.role = filters.role
    if (filters.status === 'banned') where.isBanned = true
    if (filters.status === 'inactive') where.isActive = false
    if (filters.status === 'active') where.isActive = true
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        include: { sellers: { select: { id: true, storeName: true, isVerified: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.users.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getUser(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        sellers: { include: { user: true } },
        wallet: true,
        velxoCoins: true,
      },
    })
    if (!user) return null
    const [orders, disputes, tickets] = await Promise.all([
      this.prisma.orders.count({ where: { buyerId: userId } }),
      this.prisma.disputes.count({ where: { initiatedById: userId } }),
      this.prisma.supportTickets.count({ where: { userId } }),
    ])
    return { ...user, stats: { orders, disputes, tickets } }
  }

  async setUserBan(userId: string, banned: boolean, reason?: string, moderatorId?: string) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { isBanned: banned, banReason: banned ? reason || null : null },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'STATUS_CHANGE',
      'user',
      userId,
      { isBanned: !banned },
      { isBanned: banned, reason },
    )
    if (user.email) {
      await this.notifications
        .createNotification(
          userId,
          'SYSTEM',
          banned ? 'Account Suspended' : 'Account Restored',
          banned
            ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : ''}`
            : 'Your account access has been restored.',
        )
        .catch(() => {})
    }
    return user
  }

  async setUserActive(userId: string, active: boolean, moderatorId?: string) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { isActive: active },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'STATUS_CHANGE',
      'user',
      userId,
      { isActive: !active },
      { isActive: active },
    )
    return user
  }

  async changeUserRole(userId: string, role: Role, moderatorId?: string) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { role },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'ROLE_CHANGE',
      'user',
      userId,
      { role: user.role },
      { role },
    )
    return user
  }

  async verifyUserEmail(userId: string, moderatorId?: string) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { emailVerified: true },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'VERIFICATION_CHANGE',
      'user',
      userId,
      {},
      { emailVerified: true },
    )
    return user
  }

  // ---------------------------------------------------------------------------
  // SELLERS
  // ---------------------------------------------------------------------------
  async listSellers(filters: {
    search?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(100, Math.max(1, filters.limit || 25))
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.status === 'verified') where.isVerified = true
    if (filters.status === 'unverified') where.isVerified = false
    if (filters.status === 'suspended') where.isSuspended = true
    if (filters.search) {
      where.OR = [
        { storeName: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.sellers.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sellers.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getSellerAdmin(sellerId: string) {
    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        listings: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!seller) return null
    const [orders, disputes, reviews] = await Promise.all([
      this.prisma.orders.count({ where: { sellerId: seller.id } }),
      this.prisma.disputes.count({ where: { order: { sellerId: seller.id } } }),
      this.prisma.reviews.count({ where: { sellerId: seller.id } }),
    ])
    return { ...seller, stats: { orders, disputes, reviews } }
  }

  async setSellerVerified(sellerId: string, verified: boolean, moderatorId?: string) {
    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: { isVerified: verified, verifiedAt: verified ? new Date() : null },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'VERIFICATION_CHANGE',
      'seller',
      sellerId,
      { isVerified: !verified },
      { isVerified: verified },
    )
    if (seller.userId) {
      await this.notifications
        .createNotification(
          seller.userId,
          'KYC_APPROVED',
          verified ? 'Store Verified' : 'Verification Removed',
          verified
            ? 'Your seller store has been verified by an administrator.'
            : 'Your seller verification has been removed by an administrator.',
        )
        .catch(() => {})
    }
    return seller
  }

  async setSellerSuspended(sellerId: string, suspended: boolean, reason: string, moderatorId?: string) {
    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: { isSuspended: suspended, suspensionReason: suspended ? reason || null : null },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'STATUS_CHANGE',
      'seller',
      sellerId,
      { isSuspended: !suspended },
      { isSuspended: suspended, reason },
    )
    if (seller.userId) {
      await this.notifications
        .createNotification(
          seller.userId,
          'SYSTEM',
          suspended ? 'Store Suspended' : 'Store Reinstated',
          suspended
            ? `Your store has been suspended. ${reason ? `Reason: ${reason}` : ''}`
            : 'Your store has been reinstated.',
        )
        .catch(() => {})
    }
    return seller
  }

  async setSellerFeatured(sellerId: string, featured: boolean, moderatorId?: string) {
    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: { featuredUntil: featured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'UPDATE',
      'seller',
      sellerId,
      { featured: !featured },
      { featured },
    )
    return seller
  }

  // ---------------------------------------------------------------------------
  // LISTINGS
  // ---------------------------------------------------------------------------
  async listListings(filters: {
    search?: string
    status?: string
    game?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(100, Math.max(1, filters.limit || 25))
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.game) where.gameName = filters.game
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { gameName: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.listings.findMany({
        where,
        include: { seller: { include: { user: { select: { email: true } } } }, category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.listings.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getListingAdmin(listingId: string) {
    return this.prisma.listings.findUnique({
      where: { id: listingId },
      include: {
        seller: { include: { user: true } },
        category: true,
        subcategory: true,
        orderItems: { include: { order: true } },
      },
    })
  }

  async setListingFeatured(listingId: string, featured: boolean, moderatorId?: string) {
    const listing = await this.prisma.listings.update({
      where: { id: listingId },
      data: { isFeatured: featured },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'UPDATE',
      'listing',
      listingId,
      { isFeatured: !featured },
      { isFeatured: featured },
    )
    return listing
  }

  async suspendListing(listingId: string, reason: string, moderatorId?: string) {
    const listing = await this.prisma.listings.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.SUSPENDED,
        moderationNotes: reason,
        moderatedAt: new Date(),
        moderatedBy: moderatorId || 'admin-console',
      },
      include: { seller: true },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'STATUS_CHANGE',
      'listing',
      listingId,
      { status: listing.status },
      { status: ListingStatus.SUSPENDED, reason },
    )
    if (listing.seller?.userId) {
      await this.notifications
        .createNotification(
          listing.seller.userId,
          'SYSTEM',
          'Listing Suspended',
          `Your listing "${listing.title}" was suspended. ${reason ? `Reason: ${reason}` : ''}`,
        )
        .catch(() => {})
    }
    return listing
  }

  async forceApproveListing(listingId: string, moderatorId?: string) {
    const listing = await this.prisma.listings.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.ACTIVE,
        moderatedAt: new Date(),
        moderatedBy: moderatorId || 'admin-console',
      },
      include: { seller: true },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'STATUS_CHANGE',
      'listing',
      listingId,
      { status: listing.status },
      { status: ListingStatus.ACTIVE },
    )
    if (listing.seller?.userId) {
      await this.notifications.notifyListingApproved(listing.id, listing.seller.userId).catch(() => {})
    }
    return listing
  }

  async deleteListing(listingId: string, moderatorId?: string) {
    const listing = await this.prisma.listings.delete({ where: { id: listingId } })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'DELETE',
      'listing',
      listingId,
      { title: listing.title },
      {},
    )
    return { deleted: true, id: listingId }
  }

  // ---------------------------------------------------------------------------
  // ORDERS
  // ---------------------------------------------------------------------------
  async listOrders(filters: {
    status?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(100, Math.max(1, filters.limit || 25))
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.status) where.status = filters.status

    const [items, total] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        include: {
          buyer: { select: { email: true, firstName: true, lastName: true } },
          seller: { select: { storeName: true } },
          orderItems: { include: { listing: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.orders.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getOrderAdmin(orderId: string) {
    return this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { email: true, firstName: true, lastName: true } },
        seller: { include: { user: { select: { email: true } } } },
        orderItems: { include: { listing: true } },
        escrow: true,
        payments: true,
        disputes: true,
      },
    })
  }

  async cancelOrder(orderId: string, reason: string, moderatorId?: string) {
    const order = await this.prisma.orders.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'STATUS_CHANGE',
      'order',
      orderId,
      { status: order.status },
      { status: OrderStatus.CANCELLED, reason },
    )
    await this.notifications.notifyOrderStatus(orderId, 'CANCELLED').catch(() => {})
    return order
  }

  async refundOrder(orderId: string, amount: number, reason: string, moderatorId?: string) {
    const order = await this.prisma.orders.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED, refundedAt: new Date() },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'REFUND',
      'order',
      orderId,
      { status: order.status },
      { status: OrderStatus.REFUNDED, amount, reason },
    )
    await this.notifications.notifyRefunded(order, `$${amount}`).catch(() => {})
    return order
  }

  /**
   * Manually mark a PENDING order as PAID. Creates a synthetic MANUAL payment
   * record so the rest of the escrow flow (seller accepts → delivers → buyer
   * confirms) works exactly the same way as a real payment.
   */
  async markOrderPaid(orderId: string, note: string, moderatorId?: string) {
    this.logger.log(`Admin manually marking order ${orderId} as paid`)

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    })
    if (!order) throw new Error('Order not found')
    if (order.status !== OrderStatus.PENDING) {
      throw new Error(`Order is already in status ${order.status} and cannot be manually marked paid`)
    }

    const listingId = order.orderItems?.[0]?.listingId

    const updated = await this.prisma.$transaction(async (tx) => {
      // Create a synthetic payment record so payment history is accurate.
      // We store the provider as a raw string in providerTransactionId so we
      // don't need to add MANUAL to the PaymentProvider enum (which would
      // require a DB migration). The metadata field carries the admin note.
      await tx.payments.create({
        data: {
          orderId,
          amount: order.totalAmount,
          currency: order.currency,
          // Use PAYMENT_IO as the nearest neutral enum value for admin-created
          // payments. The real source is identified by providerTransactionId
          // starting with "ADMIN-MANUAL-" and the metadata adminNote.
          provider: 'PAYMENT_IO' as any,
          status: 'COMPLETED' as any,
          paidAt: new Date(),
          providerTransactionId: `ADMIN-MANUAL-${Date.now()}`,
          metadata: { adminNote: note || 'Manually confirmed by admin', moderatorId, source: 'MANUAL' },
        },
      })

      // Update the order to PAID
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
        include: {
          buyer: { select: { email: true, firstName: true, lastName: true } },
          seller: { select: { storeName: true } },
          orderItems: { include: { listing: { select: { title: true } } } },
        },
      })

      // Mark listing as sold
      if (listingId) {
        await tx.listings.update({
          where: { id: listingId },
          data: { isSold: true, status: 'SOLD' as any },
        })
      }

      return updatedOrder
    })

    await this.createAuditLog(
      moderatorId || 'admin-console',
      'STATUS_CHANGE',
      'order',
      orderId,
      { status: OrderStatus.PENDING },
      { status: OrderStatus.PAID, note, manualPayment: true },
    )

    // Notify buyer & seller
    await this.notifications.notifyPaymentConfirmed(updated).catch(() => {})

    return updated
  }

  // ---------------------------------------------------------------------------
  // WITHDRAWALS / PAYOUTS
  // ---------------------------------------------------------------------------
  async listWithdrawals(filters: {
    status?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(100, Math.max(1, filters.limit || 25))
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.status) where.status = filters.status

    const [items, total] = await Promise.all([
      this.prisma.withdrawalRequests.findMany({
        where,
        include: { seller: { include: { user: { select: { email: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.withdrawalRequests.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getWithdrawal(id: string) {
    return this.prisma.withdrawalRequests.findUnique({
      where: { id },
      include: { seller: { include: { user: true } } },
    })
  }

  async approveWithdrawal(id: string, moderatorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalRequests.findUnique({
        where: { id },
        include: { seller: true },
      })
      if (!withdrawal) throw new Error('Withdrawal not found')
      if (withdrawal.status !== 'PENDING') throw new Error('Withdrawal already processed')

      await tx.withdrawalRequests.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          processedBy: moderatorId || 'admin-console',
          completedAt: new Date(),
        },
      })

      const wallet = await tx.wallet.findUnique({ where: { userId: withdrawal.seller.userId } })
      if (wallet) {
        const newBalance = wallet.balance.minus(withdrawal.amount)
        await tx.wallet.update({
          where: { userId: withdrawal.seller.userId },
          data: { balance: newBalance, totalWithdrawn: wallet.totalWithdrawn.plus(withdrawal.amount) },
        })
        await tx.walletTransactions.create({
          data: {
            walletId: wallet.id,
            type: 'DEBIT',
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            balanceAfter: newBalance,
            description: `Withdrawal approved #${withdrawal.id}`,
            relatedId: withdrawal.id,
          },
        })
      }

      await this.prisma.adminAuditLogs.create({
        data: {
          actorId: moderatorId || 'admin-console',
          action: 'WITHDRAWAL',
          entityType: 'withdrawal',
          entityId: id,
          newValue: { status: 'COMPLETED' },
        },
      })

      if (withdrawal.seller.userId) {
        await this.notifications
          .createNotification(
            withdrawal.seller.userId,
            'WITHDRAWAL',
            'Withdrawal Approved',
            `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been approved and processed.`,
          )
          .catch(() => {})
      }

      return withdrawal
    })
  }

  async rejectWithdrawal(id: string, reason: string, moderatorId?: string) {
    const withdrawal = await this.prisma.withdrawalRequests.update({
      where: { id },
      data: {
        status: 'REJECTED',
        processedBy: moderatorId || 'admin-console',
        notes: reason,
      },
      include: { seller: { include: { user: true } } },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'WITHDRAWAL',
      'withdrawal',
      id,
      {},
      { status: 'REJECTED', reason },
    )
    if (withdrawal.seller.userId) {
      await this.notifications
        .createNotification(
          withdrawal.seller.userId,
          'WITHDRAWAL',
          'Withdrawal Rejected',
          `Your withdrawal request was rejected. ${reason ? `Reason: ${reason}` : ''}`,
        )
        .catch(() => {})
    }
    return withdrawal
  }

  // ---------------------------------------------------------------------------
  // SUPPORT TICKETS
  // ---------------------------------------------------------------------------
  async listTickets(filters: {
    status?: string
    category?: string
    priority?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(100, Math.max(1, filters.limit || 25))
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.category) where.category = filters.category
    if (filters.priority) where.priority = filters.priority

    const [items, total] = await Promise.all([
      this.prisma.supportTickets.findMany({
        where,
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTickets.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getTicket(id: string) {
    return this.prisma.supportTickets.findUnique({
      where: { id },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    })
  }

  async updateTicketStatus(id: string, status: string, moderatorId?: string) {
    const data: any = { status }
    if (status === 'CLOSED' || status === 'RESOLVED') data.closedAt = new Date()
    const ticket = await this.prisma.supportTickets.update({ where: { id }, data })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'STATUS_CHANGE',
      'ticket',
      id,
      { status },
      { status },
    )
    return ticket
  }

  async updateTicketPriority(id: string, priority: string, moderatorId?: string) {
    const ticket = await this.prisma.supportTickets.update({
      where: { id },
      data: { priority },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'UPDATE',
      'ticket',
      id,
      {},
      { priority },
    )
    return ticket
  }

  async assignTicket(id: string, assigneeId: string, moderatorId?: string) {
    const ticket = await this.prisma.supportTickets.update({
      where: { id },
      data: { assigneeId },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'UPDATE',
      'ticket',
      id,
      {},
      { assigneeId },
    )
    return ticket
  }

  // ---------------------------------------------------------------------------
  // CATEGORIES & SUBCATEGORIES
  // ---------------------------------------------------------------------------
  async listCategories() {
    return this.prisma.categories.findMany({
      include: {
        subcategories: true,
        _count: { select: { listings: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async createCategory(dto: {
    name: string
    slug: string
    description?: string
    icon?: string
    imageUrl?: string
    sortOrder?: number
    isActive?: boolean
  }) {
    return this.prisma.categories.create({ data: { ...dto, isActive: dto.isActive ?? true } })
  }

  async updateCategory(
    id: string,
    dto: Partial<{
      name: string
      slug: string
      description: string
      icon: string
      imageUrl: string
      sortOrder: number
      isActive: boolean
    }>,
    moderatorId?: string,
  ) {
    const category = await this.prisma.categories.update({ where: { id }, data: dto })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'UPDATE',
      'category',
      id,
      {},
      dto,
    )
    return category
  }

  async deleteCategory(id: string, moderatorId?: string) {
    const category = await this.prisma.categories.delete({ where: { id } })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'DELETE',
      'category',
      id,
      { name: category.name },
      {},
    )
    return { deleted: true, id }
  }

  async createSubcategory(
    categoryId: string,
    dto: { name: string; slug: string; description?: string; icon?: string; sortOrder?: number; isActive?: boolean },
    moderatorId?: string,
  ) {
    const sub = await this.prisma.subcategories.create({
      data: { categoryId, ...dto, isActive: dto.isActive ?? true },
    })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'CREATE',
      'subcategory',
      sub.id,
      {},
      { categoryId, name: dto.name },
    )
    return sub
  }

  async updateSubcategory(
    id: string,
    dto: Partial<{ name: string; slug: string; description: string; icon: string; sortOrder: number; isActive: boolean }>,
    moderatorId?: string,
  ) {
    const sub = await this.prisma.subcategories.update({ where: { id }, data: dto })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'UPDATE',
      'subcategory',
      id,
      {},
      dto,
    )
    return sub
  }

  async deleteSubcategory(id: string, moderatorId?: string) {
    const sub = await this.prisma.subcategories.delete({ where: { id } })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'DELETE',
      'subcategory',
      id,
      { name: sub.name },
      {},
    )
    return { deleted: true, id }
  }

  // ---------------------------------------------------------------------------
  // TOPUP PRODUCTS
  // ---------------------------------------------------------------------------
  async listTopups() {
    return this.prisma.topupProducts.findMany({ orderBy: { sortOrder: 'asc' } })
  }

  async createTopup(dto: {
    gameName: string
    gameSlug?: string
    title: string
    description?: string
    price: number
    currency?: string
    imageUrl?: string
    region?: string
    deliveryInfo?: string
    stock?: number
    sortOrder?: number
    isActive?: boolean
  }) {
    return this.prisma.topupProducts.create({
      data: {
        ...dto,
        currency: dto.currency ?? 'USD',
        region: dto.region ?? 'Global',
        isActive: dto.isActive ?? true,
      },
    })
  }

  async updateTopup(
    id: string,
    dto: Partial<{
      gameName: string
      gameSlug: string
      title: string
      description: string
      price: number
      currency: string
      imageUrl: string
      region: string
      deliveryInfo: string
      stock: number
      sortOrder: number
      isActive: boolean
    }>,
    moderatorId?: string,
  ) {
    const product = await this.prisma.topupProducts.update({ where: { id }, data: dto })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'UPDATE',
      'topup',
      id,
      {},
      dto,
    )
    return product
  }

  async deleteTopup(id: string, moderatorId?: string) {
    const product = await this.prisma.topupProducts.delete({ where: { id } })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'DELETE',
      'topup',
      id,
      { title: product.title },
      {},
    )
    return { deleted: true, id }
  }

  // ---------------------------------------------------------------------------
  // BLOG
  // ---------------------------------------------------------------------------
  async listBlogPosts() {
    return this.prisma.blogPosts.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async createBlogPost(dto: {
    title: string
    slug: string
    excerpt: string
    content: string
    category?: string
    author?: string
    coverImage?: string
    isFeatured?: boolean
    isPublished?: boolean
    readTime?: string
  }) {
    return this.prisma.blogPosts.create({
      data: {
        ...dto,
        category: dto.category ?? 'Platform',
        author: dto.author ?? 'Velxo Team',
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
      },
    })
  }

  async updateBlogPost(
    id: string,
    dto: Partial<{
      title: string
      slug: string
      excerpt: string
      content: string
      category: string
      author: string
      coverImage: string
      isFeatured: boolean
      isPublished: boolean
      readTime: string
    }>,
    moderatorId?: string,
  ) {
    const data: any = { ...dto }
    if (typeof dto.isPublished === 'boolean') {
      data.publishedAt = dto.isPublished ? new Date() : null
    }
    const post = await this.prisma.blogPosts.update({ where: { id }, data })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'UPDATE',
      'blog',
      id,
      {},
      dto,
    )
    return post
  }

  async deleteBlogPost(id: string, moderatorId?: string) {
    const post = await this.prisma.blogPosts.delete({ where: { id } })
    await this.createAuditLog(
      moderatorId || 'admin-console',
      'DELETE',
      'blog',
      id,
      { title: post.title },
      {},
    )
    return { deleted: true, id }
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------
  // ============ BULK OPERATIONS ============

  /**
   * Bulk approve multiple listings
   */
  async bulkApproveListing(listingIds: string[], moderatorId: string) {
    this.logger.log(`Bulk approving ${listingIds.length} listings`)

    const results = await Promise.allSettled(
      listingIds.map(id => this.approveListing(id, moderatorId)),
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { successful, failed, total: listingIds.length }
  }

  /**
   * Bulk reject multiple listings
   */
  async bulkRejectListing(listingIds: string[], moderatorId: string, reason: string) {
    this.logger.log(`Bulk rejecting ${listingIds.length} listings`)

    const results = await Promise.allSettled(
      listingIds.map(id => this.rejectListing(id, moderatorId, reason)),
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { successful, failed, total: listingIds.length }
  }

  /**
   * Bulk delete multiple listings
   */
  async bulkDeleteListing(listingIds: string[], moderatorId: string) {
    this.logger.log(`Bulk deleting ${listingIds.length} listings`)

    const results = await this.prisma.listings.deleteMany({
      where: { id: { in: listingIds } },
    })

    await Promise.all(
      listingIds.map(id =>
        this.createAuditLog(moderatorId, 'DELETE', 'Listing', id, { action: 'bulk_delete' }),
      ),
    )

    return { deleted: results.count, total: listingIds.length }
  }

  /**
   * Bulk update listing images
   */
  async bulkUpdateListingImages(listingIds: string[], imageUrls: string[], moderatorId: string) {
    this.logger.log(`Bulk updating images for ${listingIds.length} listings`)

    const results = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: { images: imageUrls },
    })

    await Promise.all(
      listingIds.map(id =>
        this.createAuditLog(moderatorId, 'UPDATE', 'Listing', id, { images: 'bulk_updated' }),
      ),
    )

    return { updated: results.count, total: listingIds.length }
  }

  /**
   * Bulk update listing status
   */
  async bulkUpdateListingStatus(
    listingIds: string[],
    status: ListingStatus,
    moderatorId: string,
  ) {
    this.logger.log(`Bulk updating status to ${status} for ${listingIds.length} listings`)

    const results = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: { status },
    })

    await Promise.all(
      listingIds.map(id =>
        this.createAuditLog(moderatorId, 'UPDATE', 'Listing', id, { status }),
      ),
    )

    return { updated: results.count, total: listingIds.length, newStatus: status }
  }

  /**
   * Bulk feature/unfeature listings
   */
  async bulkSetListingFeatured(listingIds: string[], featured: boolean, moderatorId: string) {
    this.logger.log(`Bulk ${featured ? 'featuring' : 'unfeaturing'} ${listingIds.length} listings`)

    const results = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: { isFeatured: featured },
    })

    await Promise.all(
      listingIds.map(id =>
        this.createAuditLog(moderatorId, 'UPDATE', 'Listing', id, { isFeatured: featured }),
      ),
    )

    return { updated: results.count, total: listingIds.length, featured }
  }

  /**
   * Bulk ban/unban users
   */
  async bulkSetUserBan(userIds: string[], banned: boolean, reason: string, moderatorId: string) {
    this.logger.log(`Bulk ${banned ? 'banning' : 'unbanning'} ${userIds.length} users`)

    const results = await this.prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: { isBanned: banned, banReason: reason },
    })

    await Promise.all(
      userIds.map(id =>
        this.createAuditLog(moderatorId, banned ? 'STATUS_CHANGE' : 'STATUS_CHANGE', 'User', id, { reason, action: banned ? 'BAN' : 'UNBAN' }),
      ),
    )

    return { updated: results.count, total: userIds.length, banned }
  }

  /**
   * Bulk verify user emails
   */
  async bulkVerifyUserEmails(userIds: string[], moderatorId: string) {
    this.logger.log(`Bulk verifying emails for ${userIds.length} users`)

    const results = await this.prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: { emailVerified: true },
    })

    await Promise.all(
      userIds.map(id =>
        this.createAuditLog(moderatorId, 'UPDATE', 'User', id, { emailVerified: true }),
      ),
    )

    return { updated: results.count, total: userIds.length }
  }

  /**
   * Bulk suspend sellers
   */
  async bulkSuspendSellers(sellerIds: string[], suspend: boolean, reason: string, moderatorId: string) {
    this.logger.log(`Bulk ${suspend ? 'suspending' : 'unsuspending'} ${sellerIds.length} sellers`)

    const results = await this.prisma.sellers.updateMany({
      where: { id: { in: sellerIds } },
      data: {
        isSuspended: suspend,
        suspensionReason: reason,
      },
    })

    await Promise.all(
      sellerIds.map(id =>
        this.createAuditLog(moderatorId, suspend ? 'STATUS_CHANGE' : 'STATUS_CHANGE', 'Seller', id, {
          reason,
          action: suspend ? 'SUSPEND' : 'UNSUSPEND'
        }),
      ),
    )

    return { updated: results.count, total: sellerIds.length, suspended: suspend }
  }

  /**
   * Get listings for bulk operations (with filters)
   */
  async getBulkListingsForEdit(filters: {
    gameId?: string
    gameName?: string
    categoryId?: string
    status?: string
    sellerId?: string
    isFeatured?: boolean
    limit?: number
  }) {
    const where: any = {}

    if (filters.gameId) where.gameId = filters.gameId
    if (filters.gameName) where.gameName = { contains: filters.gameName, mode: 'insensitive' }
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.status) where.status = filters.status
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured

    const listings = await this.prisma.listings.findMany({
      where,
      take: filters.limit || 100,
      select: {
        id: true,
        title: true,
        gameName: true,
        status: true,
        isFeatured: true,
        images: true,
        createdAt: true,
        seller: { select: { id: true, user: { select: { email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return listings
  }

  async listAuditLogs(filters: {
    action?: string
    entityType?: string
    actorId?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(100, Math.max(1, filters.limit || 50))
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.action) where.action = filters.action
    if (filters.entityType) where.entityType = filters.entityType
    if (filters.actorId) where.actorId = filters.actorId

    const [items, total] = await Promise.all([
      this.prisma.adminAuditLogs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminAuditLogs.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
