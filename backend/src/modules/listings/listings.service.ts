import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { SearchListingDto, SortByEnum } from './dto/search-listing.dto'
import { NotFoundException, ForbiddenException } from '@/common/exceptions/custom-exceptions'
import { ListingStatus } from '@prisma/client'

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name)

  constructor(private prisma: PrismaService) {}

  async createListing(userId: string, dto: CreateListingDto) {
    this.logger.log(`Creating listing for user ${userId}`)

    // Look up seller by userId (not seller.id)
    const seller = await this.prisma.sellers.findUnique({
      where: { userId },
    })

    if (!seller) {
      throw new NotFoundException('Seller profile — please create a seller account first')
    }

    // If no categoryId or it's a placeholder, auto-resolve or use first available
    let categoryId = dto.categoryId
    if (!categoryId || categoryId === 'cuid-placeholder-category') {
      const firstCategory = await this.prisma.categories.findFirst({ where: { isActive: true } })
      if (!firstCategory) {
        // Create a default category if none exists
        const cat = await this.prisma.categories.create({
          data: { name: 'Gaming', slug: 'gaming', description: 'Gaming items', sortOrder: 0 },
        })
        categoryId = cat.id
      } else {
        categoryId = firstCategory.id
      }
    } else {
      const category = await this.prisma.categories.findUnique({ where: { id: categoryId } })
      if (!category) throw new NotFoundException('Category')
    }

    const listing = await this.prisma.listings.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        gameName: dto.gameName,
        gameId: dto.gameId,
        categoryId,
        subcategoryId: dto.subcategoryId,
        sellerId: seller.id,
        platform: dto.platform,
        region: dto.region,
        rank: dto.rank,
        level: dto.level,
        playerId: dto.playerId,
        playerUid: dto.playerUid,
        loginMethod: dto.loginMethod,
        deliveryTime: dto.deliveryTime,
        images: dto.images || [],
        videos: dto.videos || [],
        metadata: dto.metadata,
        status: ListingStatus.PENDING_APPROVAL,
      },
      include: {
        seller: true,
        category: true,
      },
    })

    return listing
  }

  async searchListings(dto: SearchListingDto) {
    const where: any = {
      status: ListingStatus.ACTIVE,
    }

    if (dto.search) {
      where.OR = [
        { title: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
        { gameName: { contains: dto.search, mode: 'insensitive' } },
      ]
    }

    if (dto.gameName) {
      where.gameName = { contains: dto.gameName, mode: 'insensitive' }
    }

    if (dto.categoryId) {
      where.categoryId = dto.categoryId
    }

    if (dto.platform) {
      where.platform = dto.platform
    }

    if (dto.region) {
      where.region = dto.region
    }

    if (dto.rank) {
      where.rank = dto.rank
    }

    if (dto.minPrice || dto.maxPrice) {
      where.price = {}
      if (dto.minPrice) where.price.gte = dto.minPrice
      if (dto.maxPrice) where.price.lte = dto.maxPrice
    }

    let orderBy: any = { createdAt: 'desc' }
    if (dto.sortBy === SortByEnum.POPULAR) {
      orderBy = { salesCount: 'desc' }
    } else if (dto.sortBy === SortByEnum.PRICE_LOW) {
      orderBy = { price: 'asc' }
    } else if (dto.sortBy === SortByEnum.PRICE_HIGH) {
      orderBy = { price: 'desc' }
    } else if (dto.sortBy === SortByEnum.RATING) {
      orderBy = { 'seller.averageRating': 'desc' }
    }

    const [listings, total] = await Promise.all([
      this.prisma.listings.findMany({
        where,
        orderBy,
        skip: dto.offset,
        take: dto.limit,
        include: {
          seller: {
            include: { user: true },
          },
          category: true,
        },
      }),
      this.prisma.listings.count({ where }),
    ])

    return {
      listings,
      total,
      page: dto.page,
      limit: dto.limit,
      hasMore: dto.offset + dto.limit < total,
    }
  }

  async getListingById(id: string) {
    const listing = await this.prisma.listings.findUnique({
      where: { id },
      include: {
        seller: {
          include: { user: true },
        },
        category: true,
        orderItems: true,
        listingReviews: {
          include: { buyer: true },
          take: 10,
        },
      },
    })

    if (!listing) {
      throw new NotFoundException('Listing')
    }

    // Increment view count
    await this.prisma.listings.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return listing
  }

  async updateListing(id: string, sellerId: string, dto: Partial<CreateListingDto>) {
    const listing = await this.prisma.listings.findUnique({
      where: { id },
      include: { seller: true },
    })

    if (!listing) {
      throw new NotFoundException('Listing')
    }

    if (listing.seller.id !== sellerId) {
      throw new ForbiddenException('You can only edit your own listings')
    }

    return this.prisma.listings.update({
      where: { id },
      data: {
        title: dto.title || listing.title,
        description: dto.description || listing.description,
        price: dto.price || listing.price,
        platform: dto.platform || listing.platform,
        region: dto.region || listing.region,
        images: dto.images || listing.images,
        videos: dto.videos || listing.videos,
      },
      include: { seller: true, category: true },
    })
  }

  async deleteListing(id: string, sellerId: string) {
    const listing = await this.prisma.listings.findUnique({
      where: { id },
      include: { seller: true },
    })

    if (!listing) {
      throw new NotFoundException('Listing')
    }

    if (listing.seller.id !== sellerId) {
      throw new ForbiddenException('You can only delete your own listings')
    }

    return this.prisma.listings.delete({
      where: { id },
    })
  }

  async getFeaturedListings(limit: number = 10) {
    return this.prisma.listings.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        isFeatured: true,
      },
      take: limit,
      include: {
        seller: { include: { user: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
