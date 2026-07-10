import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { ListingStatus } from '@prisma/client'

export type ImageAssignmentStrategy = 'rotate' | 'all' | 'first' | 'random'

export interface BulkImageFilter {
  categoryId?: string
  subcategoryId?: string
  sellerId?: string
  gameName?: string
  status?: ListingStatus
  region?: string
  platform?: string
}

@Injectable()
export class ImageBulkOperationsService {
  private readonly logger = new Logger(ImageBulkOperationsService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Bulk update listing images with filtering
   */
  async bulkUpdateListingImages(
    imageUrls: string[],
    filter: BulkImageFilter,
    adminId: string,
    assignmentStrategy: ImageAssignmentStrategy = 'rotate',
  ) {
    this.logger.log(`Starting bulk image update with strategy: ${assignmentStrategy}`)

    // Build where clause from filter
    const whereClause: any = {}
    if (filter.categoryId) whereClause.categoryId = filter.categoryId
    if (filter.subcategoryId) whereClause.subcategoryId = filter.subcategoryId
    if (filter.sellerId) whereClause.sellerId = filter.sellerId
    if (filter.gameName) whereClause.gameName = filter.gameName
    if (filter.status) whereClause.status = filter.status
    if (filter.region) whereClause.region = filter.region
    if (filter.platform) whereClause.platform = filter.platform

    // Find matching listings
    const matchedListings = await this.prisma.listings.findMany({
      where: whereClause,
      select: { id: true, images: true, title: true },
    })

    this.logger.log(`Found ${matchedListings.length} matching listings`)

    if (matchedListings.length === 0) {
      return { matched: 0, updated: 0, failed: 0, details: [] }
    }

    let updated = 0
    let failed = 0
    const details: Array<{ listingId: string; title: string; imagesAssigned: string[] }> = []

    // Assign images based on strategy
    for (let i = 0; i < matchedListings.length; i++) {
      try {
        let newImages: string[] = []

        switch (assignmentStrategy) {
          case 'all':
            // Assign all images to each listing
            newImages = imageUrls
            break
          case 'first':
            // Assign only the first image
            newImages = [imageUrls[0]]
            break
          case 'rotate':
            // Rotate through images based on index
            newImages = [imageUrls[i % imageUrls.length]]
            break
          case 'random':
            // Random image from the array
            newImages = [imageUrls[Math.floor(Math.random() * imageUrls.length)]]
            break
        }

        await this.prisma.listings.update({
          where: { id: matchedListings[i].id },
          data: { images: newImages },
        })

        details.push({
          listingId: matchedListings[i].id,
          title: matchedListings[i].title,
          imagesAssigned: newImages,
        })

        updated++
      } catch (err) {
        this.logger.error(`Failed to update listing ${matchedListings[i].id}`, err)
        failed++
      }
    }

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_UPDATE_IMAGES',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: {
          matched: matchedListings.length,
          updated,
          failed,
          strategy: assignmentStrategy,
          filter,
          imageCount: imageUrls.length,
        },
      },
    })

    return {
      matched: matchedListings.length,
      updated,
      failed,
      details: details.slice(0, 20), // Return first 20 for preview
    }
  }

  /**
   * Bulk replace specific images in listings
   */
  async bulkReplaceImages(
    oldImageUrl: string,
    newImageUrl: string,
    filter: BulkImageFilter,
    adminId: string,
  ) {
    this.logger.log(`Replacing image ${oldImageUrl} with ${newImageUrl}`)

    const whereClause: any = {}
    if (filter.categoryId) whereClause.categoryId = filter.categoryId
    if (filter.subcategoryId) whereClause.subcategoryId = filter.subcategoryId
    if (filter.sellerId) whereClause.sellerId = filter.sellerId
    if (filter.gameName) whereClause.gameName = filter.gameName

    // Find listings with the old image
    const listings = await this.prisma.listings.findMany({
      where: {
        ...whereClause,
        images: { has: oldImageUrl },
      },
      select: { id: true, images: true },
    })

    let updated = 0
    for (const listing of listings) {
      const updatedImages = listing.images.map((img) => (img === oldImageUrl ? newImageUrl : img))

      await this.prisma.listings.update({
        where: { id: listing.id },
        data: { images: updatedImages },
      })

      updated++
    }

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_REPLACE_IMAGES',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: {
          oldImageUrl,
          newImageUrl,
          updated,
          filter,
        },
      },
    })

    return { matched: listings.length, updated }
  }

  /**
   * Bulk append images to existing listings
   */
  async bulkAppendImages(
    imageUrls: string[],
    filter: BulkImageFilter,
    adminId: string,
  ) {
    this.logger.log(`Appending ${imageUrls.length} images to listings`)

    const whereClause: any = {}
    if (filter.categoryId) whereClause.categoryId = filter.categoryId
    if (filter.subcategoryId) whereClause.subcategoryId = filter.subcategoryId
    if (filter.sellerId) whereClause.sellerId = filter.sellerId
    if (filter.gameName) whereClause.gameName = filter.gameName
    if (filter.status) whereClause.status = filter.status

    const listings = await this.prisma.listings.findMany({
      where: whereClause,
      select: { id: true, images: true },
    })

    let updated = 0
    for (const listing of listings) {
      const updatedImages = [...listing.images, ...imageUrls]

      await this.prisma.listings.update({
        where: { id: listing.id },
        data: { images: updatedImages },
      })

      updated++
    }

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_APPEND_IMAGES',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: {
          imageCount: imageUrls.length,
          updated,
          filter,
        },
      },
    })

    return { matched: listings.length, updated }
  }

  /**
   * Remove specific image from all listings
   */
  async bulkRemoveImage(imageUrl: string, filter: BulkImageFilter, adminId: string) {
    this.logger.log(`Removing image ${imageUrl} from listings`)

    const whereClause: any = {
      images: { has: imageUrl },
    }
    if (filter.categoryId) whereClause.categoryId = filter.categoryId
    if (filter.sellerId) whereClause.sellerId = filter.sellerId

    const listings = await this.prisma.listings.findMany({
      where: whereClause,
      select: { id: true, images: true },
    })

    let updated = 0
    for (const listing of listings) {
      const updatedImages = listing.images.filter((img) => img !== imageUrl)

      await this.prisma.listings.update({
        where: { id: listing.id },
        data: { images: updatedImages },
      })

      updated++
    }

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: adminId,
        action: 'BULK_REMOVE_IMAGE',
        entityType: 'LISTING',
        entityId: 'BULK',
        metadata: { imageUrl, updated, filter },
      },
    })

    return { matched: listings.length, updated }
  }

  /**
   * Find listings with missing or broken images
   */
  async findListingsWithMissingImages() {
    const listings = await this.prisma.listings.findMany({
      where: {
        OR: [{ images: { isEmpty: true } }, { images: null }],
      },
      select: {
        id: true,
        title: true,
        sellerId: true,
        status: true,
        createdAt: true,
      },
    })

    return listings
  }

  /**
   * Get image usage statistics
   */
  async getImageUsageStats(imageUrl: string) {
    const count = await this.prisma.listings.count({
      where: { images: { has: imageUrl } },
    })

    const listings = await this.prisma.listings.findMany({
      where: { images: { has: imageUrl } },
      select: {
        id: true,
        title: true,
        status: true,
      },
      take: 10,
    })

    return { usageCount: count, sampleListings: listings }
  }
}
