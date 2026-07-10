import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { ListingStatus, AuditAction } from '@prisma/client'
import { NotificationsService } from '@/modules/notifications/notifications.service'

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Bulk approve listings
  async bulkApproveListings(listingIds: string[], adminId: string, reason?: string) {
    this.logger.log(`Bulk approving ${listingIds.length} listings`)

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
        await this.notifications.notifyListingApproved(listing.id, listing.seller.userId).catch(() => {})
      }
    }

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: AuditAction.STATUS_CHANGE,
        entityType: 'LISTING',
        entityId: 'BULK_APPROVE',
        metadata: {
          operation: 'BULK_APPROVE',
          count: listingIds.length,
          reason,
          listingIds: listingIds.slice(0, 50),
        },
      },
    })

    return { approved: result.count, failed: listingIds.length - result.count }
  }

  // Bulk reject listings
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
        await this.notifications.notifyListingRejected(listing.id, listing.seller.userId, reason).catch(() => {})
      }
    }

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: AuditAction.STATUS_CHANGE,
        entityType: 'LISTING',
        entityId: 'BULK_REJECT',
        metadata: {
          operation: 'BULK_REJECT',
          count: listingIds.length,
          reason,
        },
      },
    })

    return { rejected: result.count, failed: listingIds.length - result.count }
  }

  // Bulk suspend listings
  async bulkSuspendListings(listingIds: string[], adminId: string, reason?: string) {
    this.logger.log(`Bulk suspending ${listingIds.length} listings`)

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.SUSPENDED,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: AuditAction.STATUS_CHANGE,
        entityType: 'LISTING',
        entityId: 'BULK_SUSPEND',
        metadata: {
          operation: 'BULK_SUSPEND',
          count: listingIds.length,
          reason,
        },
      },
    })

    return { suspended: result.count, failed: listingIds.length - result.count }
  }

  // Bulk unsuspend/activate listings
  async bulkActivateListings(listingIds: string[], adminId: string) {
    this.logger.log(`Bulk activating ${listingIds.length} listings`)

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: ListingStatus.ACTIVE,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: AuditAction.STATUS_CHANGE,
        entityType: 'LISTING',
        entityId: 'BULK_ACTIVATE',
        metadata: {
          operation: 'BULK_ACTIVATE',
          count: listingIds.length,
        },
      },
    })

    return { activated: result.count }
  }

  // Bulk feature listings
  async bulkFeatureListings(listingIds: string[], adminId: string, isFeatured: boolean) {
    this.logger.log(`Bulk ${isFeatured ? 'featuring' : 'unfeaturing'} ${listingIds.length} listings`)

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: { isFeatured },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: AuditAction.UPDATE,
        entityType: 'LISTING',
        entityId: 'BULK_FEATURE',
        metadata: {
          operation: isFeatured ? 'BULK_FEATURE' : 'BULK_UNFEATURE',
          count: listingIds.length,
          isFeatured,
        },
      },
    })

    return { updated: result.count }
  }

  // Bulk delete listings
  async bulkDeleteListings(listingIds: string[], adminId: string) {
    this.logger.log(`Bulk deleting ${listingIds.length} listings`)

    const result = await this.prisma.listings.deleteMany({
      where: { id: { in: listingIds } },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: AuditAction.DELETE,
        entityType: 'LISTING',
        entityId: 'BULK_DELETE',
        metadata: {
          operation: 'BULK_DELETE',
          count: listingIds.length,
          listingIds: listingIds.slice(0, 50),
        },
      },
    })

    return { deleted: result.count }
  }

  // Bulk update listing properties
  async bulkEditListings(
    listingIds: string[],
    adminId: string,
    updates: {
      title?: string
      description?: string
      price?: number
      inventory?: number
      gameName?: string
      region?: string
      platform?: string
      deliveryTime?: string
    },
  ) {
    this.logger.log(`Bulk editing ${listingIds.length} listings`)

    const result = await this.prisma.listings.updateMany({
      where: { id: { in: listingIds } },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: AuditAction.UPDATE,
        entityType: 'LISTING',
        entityId: 'BULK_EDIT',
        metadata: {
          operation: 'BULK_EDIT',
          count: listingIds.length,
          updates,
        },
      },
    })

    return { updated: result.count }
  }

  // Bulk update images
  async bulkUpdateImages(
    listingIds: string[],
    adminId: string,
    imageUrls: string[],
    mode: 'replace' | 'append' = 'replace',
  ) {
    this.logger.log(`Bulk updating images for ${listingIds.length} listings`)

    let updated = 0
    let failed = 0

    for (const listingId of listingIds) {
      try {
        const listing = await this.prisma.listings.findUnique({
          where: { id: listingId },
          select: { images: true },
        })

        if (!listing) {
          failed++
          continue
        }

        const newImages = mode === 'append' ? [...listing.images, ...imageUrls] : imageUrls

        await this.prisma.listings.update({
          where: { id: listingId },
          data: { images: newImages },
        })

        updated++
      } catch (error) {
        this.logger.error(`Failed to update images for listing ${listingId}:`, error)
        failed++
      }
    }

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: AuditAction.UPDATE,
        entityType: 'LISTING',
        entityId: 'BULK_UPDATE_IMAGES',
        metadata: {
          operation: 'BULK_UPDATE_IMAGES',
          count: listingIds.length,
          updated,
          failed,
          mode,
          imageCount: imageUrls.length,
        },
      },
    })

    return { updated, failed }
  }

  // Get listings with advanced filters
  async getFilteredListings(filters: {
    status?: ListingStatus | ListingStatus[]
    categoryId?: string
    subcategoryId?: string
    sellerId?: string
    gameName?: string
    region?: string
    platform?: string
    isFeatured?: boolean
    isSponsored?: boolean
    priceMin?: number
    priceMax?: number
    createdAfter?: Date
    createdBefore?: Date
    search?: string
    limit?: number
    offset?: number
  }) {
    const {
      status,
      categoryId,
      subcategoryId,
      sellerId,
      gameName,
      region,
      platform,
      isFeatured,
      isSponsored,
      priceMin,
      priceMax,
      createdAfter,
      createdBefore,
      search,
      limit = 50,
      offset = 0,
    } = filters

    const where: any = {}

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status
    }
    if (categoryId) where.categoryId = categoryId
    if (subcategoryId) where.subcategoryId = subcategoryId
    if (sellerId) where.sellerId = sellerId
    if (gameName) where.gameName = { contains: gameName, mode: 'insensitive' }
    if (region) where.region = region
    if (platform) where.platform = platform
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (isSponsored !== undefined) where.isSponsored = isSponsored
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {}
      if (priceMin !== undefined) where.price.gte = priceMin
      if (priceMax !== undefined) where.price.lte = priceMax
    }
    if (createdAfter || createdBefore) {
      where.createdAt = {}
      if (createdAfter) where.createdAt.gte = createdAfter
      if (createdBefore) where.createdAt.lte = createdBefore
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [listings, total] = await Promise.all([
      this.prisma.listings.findMany({
        where,
        include: {
          seller: { include: { user: true } },
          category: true,
          subcategory: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 500),
        skip: offset,
      }),
      this.prisma.listings.count({ where }),
    ])

    return {
      listings,
      total,
      limit,
      offset,
      hasMore: offset + listings.length < total,
    }
  }
}
