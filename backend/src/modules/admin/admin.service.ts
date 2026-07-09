import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { ListingStatus, OrderStatus, AuditAction } from '@prisma/client'
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
      totalOrders,
      completedOrders,
      totalRevenue,
      pendingDisputes,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.sellers.count(),
      this.prisma.listings.count(),
      this.prisma.listings.count({ where: { status: ListingStatus.ACTIVE } }),
      this.prisma.orders.count(),
      this.prisma.orders.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.orders.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
      this.prisma.disputes.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    ])

    const avgOrderValue =
      completedOrders > 0 ? Number(totalRevenue._sum.totalAmount || 0) / completedOrders : 0

    return {
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      listingApprovalRate: totalListings > 0 ? (activeListings / totalListings) * 100 : 0,
      totalOrders,
      completedOrders,
      orderCompletionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      avgOrderValue,
      gmv: totalRevenue._sum.totalAmount || 0,
      pendingDisputes,
      disputeRate: totalOrders > 0 ? (pendingDisputes / totalOrders) * 100 : 0,
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
    return this.prisma.adminAuditLogs.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
      },
    })
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
}
