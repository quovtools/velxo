import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { ListingStatus } from '@prisma/client'
import { NotificationsService } from '@/modules/notifications/notifications.service'

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ============ LISTING BULK OPERATIONS ============

  /**
   * Bulk approve listings
   */
  async bulkApproveListings(listingIds: string[], adminId: string, reason?: string) {
    this.logger.log(`Bulk approving ${listingIds.length} listings by admin ${adminId}`)

    const listings = await this.prisma.listings.findMany({
      where: { id: { in: listingIds } },
      include: { seller: true },
    })

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.ACTIVE,
        moderatedAt: new Date(),
        moderatedBy: adminId,
      },
    })

    // Send notifications to sellers
    for (const listing of listings) {
      if (listing.seller?.userId) {
        await this.notifications
          .notifyListingApproved(listing.id, listing.seller.userId)
          .catch((err) => this.logger.error('Failed to notify seller', err))
      }
    }

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'STATUS_CHANGE',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: {
          count: listingIds.length,
          reason,
          listingIds: listingIds.slice(0, 10), // First 10 for reference
        },
      },
    })

    return {
      approved: result.count,
      failed: listingIds.length - result.count,
      total: listingIds.length,
    }
  }

  /**
   * Bulk reject listings
   */
  async bulkRejectListings(listingIds: string[], adminId: string, reason: string) {
    this.logger.log(`Bulk rejecting ${listingIds.length} listings`)

    const listings = await this.prisma.listings.findMany({
      where: { id: { in: listingIds } },
      include: { seller: true },
    })

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.REJECTED,
        moderationNotes: reason,
        moderatedAt: new Date(),
        moderatedBy: adminId,
      },
    })

    // Send notifications to sellers
    for (const listing of listings) {
      if (listing.seller?.userId) {
        await this.notifications
          .notifyListingRejected(listing.id, listing.seller.userId, reason)
          .catch((err) => this.logger.error('Failed to notify seller', err))
      }
    }

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'STATUS_CHANGE',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: {
          count: listingIds.length,
          reason,
        },
      },
    })

    return {
      rejected: result.count,
      failed: listingIds.length - result.count,
      total: listingIds.length,
    }
  }

  /**
   * Bulk suspend listings
   */
  async bulkSuspendListings(listingIds: string[], adminId: string, reason?: string) {
    this.logger.log(`Bulk suspending ${listingIds.length} listings`)

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.SUSPENDED,
      },
    })

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'STATUS_CHANGE',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: { count: listingIds.length, reason },
      },
    })

    return {
      suspended: result.count,
      failed: listingIds.length - result.count,
      total: listingIds.length,
    }
  }

  /**
   * Bulk unsuspend/reactivate listings
   */
  async bulkUnsuspendListings(listingIds: string[], adminId: string) {
    this.logger.log(`Bulk unsuspending ${listingIds.length} listings`)

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.ACTIVE,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'STATUS_CHANGE',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: { count: listingIds.length },
      },
    })

    return { unsuspended: result.count, total: listingIds.length }
  }

  /**
   * Bulk feature/unfeature listings
   */
  async bulkFeatureListings(listingIds: string[], adminId: string, isFeatured: boolean) {
    this.logger.log(`Bulk ${isFeatured ? 'featuring' : 'unfeaturing'} ${listingIds.length} listings`)

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: { isFeatured },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'UPDATE',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: { count: listingIds.length, isFeatured },
      },
    })

    return { updated: result.count, total: listingIds.length, isFeatured }
  }

  /**
   * Bulk sponsor listings
   */
  async bulkSponsorListings(listingIds: string[], adminId: string, isSponsored: boolean) {
    this.logger.log(`Bulk ${isSponsored ? 'sponsoring' : 'unsponsoring'} ${listingIds.length} listings`)

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: { isSponsored },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'UPDATE',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: { count: listingIds.length, isSponsored },
      },
    })

    return { updated: result.count, total: listingIds.length, isSponsored }
  }

  /**
   * Bulk delete listings
   */
  async bulkDeleteListings(listingIds: string[], adminId: string) {
    this.logger.log(`Bulk deleting ${listingIds.length} listings`)

    const result = await this.prisma.listings.deleteMany({
      where: { id: { in: listingIds } },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'DELETE',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: { count: listingIds.length },
      },
    })

    return { deleted: result.count, total: listingIds.length }
  }

  // ============ USER BULK OPERATIONS ============

  /**
   * Bulk ban users
   */
  async bulkBanUsers(userIds: string[], adminId: string, reason?: string) {
    this.logger.log(`Bulk banning ${userIds.length} users`)

    const result = await this.prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: {
        isBanned: true,
        banReason: reason,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'STATUS_CHANGE',
        entityType: 'USER',
        entityId: 'BULK',
        metadata: { count: userIds.length, reason },
      },
    })

    return { banned: result.count, total: userIds.length }
  }

  /**
   * Bulk unban users
   */
  async bulkUnbanUsers(userIds: string[], adminId: string) {
    this.logger.log(`Bulk unbanning ${userIds.length} users`)

    const result = await this.prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: {
        isBanned: false,
        banReason: null,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'STATUS_CHANGE',
        entityType: 'USER',
        entityId: 'BULK',
        metadata: { count: userIds.length },
      },
    })

    return { unbanned: result.count, total: userIds.length }
  }

  // ============ SELLER BULK OPERATIONS ============

  /**
   * Bulk verify sellers
   */
  async bulkVerifySellers(sellerIds: string[], adminId: string) {
    this.logger.log(`Bulk verifying ${sellerIds.length} sellers`)

    const result = await this.prisma.sellers.updateMany({
      where: { id: { in: sellerIds } },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'VERIFICATION_CHANGE',
        entityType: 'SELLER',
        entityId: 'BULK',
        metadata: { count: sellerIds.length },
      },
    })

    return { verified: result.count, total: sellerIds.length }
  }

  /**
   * Bulk suspend sellers
   */
  async bulkSuspendSellers(sellerIds: string[], adminId: string, reason?: string) {
    this.logger.log(`Bulk suspending ${sellerIds.length} sellers`)

    const result = await this.prisma.sellers.updateMany({
      where: { id: { in: sellerIds } },
      data: {
        isSuspended: true,
        suspensionReason: reason,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'STATUS_CHANGE',
        entityType: 'SELLER',
        entityId: 'BULK',
        metadata: { count: sellerIds.length, reason },
      },
    })

    return { suspended: result.count, total: sellerIds.length }
  }

  /**
   * Bulk unsuspend sellers
   */
  async bulkUnsuspendSellers(sellerIds: string[], adminId: string) {
    this.logger.log(`Bulk unsuspending ${sellerIds.length} sellers`)

    const result = await this.prisma.sellers.updateMany({
      where: { id: { in: sellerIds } },
      data: {
        isSuspended: false,
        suspensionReason: null,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'STATUS_CHANGE',
        entityType: 'SELLER',
        entityId: 'BULK',
        metadata: { count: sellerIds.length },
      },
    })

    return { unsuspended: result.count, total: sellerIds.length }
  }

  /**
   * Bulk feature sellers
   */
  async bulkFeatureSellers(sellerIds: string[], adminId: string, isFeatured: boolean) {
    this.logger.log(`Bulk ${isFeatured ? 'featuring' : 'unfeaturing'} ${sellerIds.length} sellers`)

    // featuredUntil: set 30 days from now when featuring, null when unfeaturing
    const featuredUntil = isFeatured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null

    const result = await this.prisma.sellers.updateMany({
      where: { id: { in: sellerIds } },
      data: { featuredUntil },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'UPDATE',
        entityType: 'SELLER',
        entityId: 'BULK',
        metadata: { count: sellerIds.length, isFeatured, featuredUntil },
      },
    })

    return { updated: result.count, total: sellerIds.length, isFeatured }
  }
}
