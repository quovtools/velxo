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
    if (!categoryId || categoryId === 'cuid-placeholder-category' || categoryId === 'auto') {
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

    const isPro = seller.subscriptionTier === 'PRO' || seller.subscriptionTier === 'PREMIUM'
    const wantsFeatured = dto.isFeatured === true
    // Only Seller Pro / Premium subscribers may feature listings.
    const isFeatured = wantsFeatured && isPro ? true : false

    const listing = await this.prisma.listings.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        gameName: dto.gameName,
        gameId: dto.gameSlug || dto.gameName,
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
        isFeatured,
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
    // Determine the status filter.
    // - Public search (no sellerId) defaults to ACTIVE listings only.
    // - Seller-scoped search defaults to ALL of that seller's listings so the
    //   dashboard can show history (sold/expired) and pending (awaiting approval)
    //   listings, not just the live ones.
    // - An explicit `status` param overrides the default (use "ALL" to bypass).
    let statusFilter: any = { status: ListingStatus.ACTIVE }
    if (dto.status) {
      if (dto.status.toUpperCase() === 'ALL') {
        statusFilter = {}
      } else {
        statusFilter = { status: dto.status }
      }
    } else if (dto.sellerId) {
      statusFilter = {}
    }
    const where: any = { ...statusFilter }

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

    if (dto.sellerId) {
      where.seller = { userId: dto.sellerId }
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
      orderBy = { seller: { averageRating: 'desc' } }
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
          include: {
            user: {
              select: {
                id: true, email: true, firstName: true, lastName: true,
                avatarUrl: true, lastSeenAt: true,
              } as any,
            },
          },
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

    // Enrich with computed seller fields
    const enriched = {
      ...listing,
      seller: listing.seller ? {
        ...listing.seller,
        sellerLevel: (listing.seller as any).sellerLevel || 'BRONZE',
        deliverySuccessRate: (listing.seller as any).deliverySuccessRate || 100,
        avgResponseTimeHours: (listing.seller as any).avgResponseTimeHours || 0,
        isOnline: (listing.seller.user as any)?.lastSeenAt
          ? (Date.now() - new Date((listing.seller.user as any).lastSeenAt).getTime()) < 5 * 60 * 1000
          : false,
      } : null,
    }

    return enriched
  }

  async updateListing(id: string, sellerId: string, dto: Partial<CreateListingDto>) {
    const listing = await this.prisma.listings.findUnique({
      where: { id },
      include: { seller: true },
    })

    if (!listing) {
      throw new NotFoundException('Listing')
    }

    if (listing.seller.userId !== sellerId) {
      throw new ForbiddenException('You can only edit your own listings')
    }

    const isPro = listing.seller.subscriptionTier === 'PRO' || listing.seller.subscriptionTier === 'PREMIUM'
    // Preserve existing featured state unless the seller explicitly toggles it;
    // only Seller Pro / Premium subscribers are allowed to feature a listing.
    let isFeatured = listing.isFeatured
    if (dto.isFeatured !== undefined) {
      isFeatured = dto.isFeatured === true && isPro ? true : false
    }

    return this.prisma.listings.update({
      where: { id },
      data: {
        // FIX #26: Use explicit undefined check instead of || fallback so that
        // falsy-but-valid values (price=0, empty description) are not silently ignored.
        title: dto.title !== undefined ? dto.title : listing.title,
        description: dto.description !== undefined ? dto.description : listing.description,
        price: dto.price !== undefined ? dto.price : listing.price,
        platform: dto.platform !== undefined ? dto.platform : listing.platform,
        region: dto.region !== undefined ? dto.region : listing.region,
        images: dto.images !== undefined ? dto.images : listing.images,
        videos: dto.videos !== undefined ? dto.videos : listing.videos,
        isFeatured,
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

    if (listing.seller.userId !== sellerId) {
      throw new ForbiddenException('You can only delete your own listings')
    }

    return this.prisma.listings.delete({
      where: { id },
    })
  }

  async getFeaturedListings(limit: number = 10) {
    const parsedLimit = typeof limit === 'string' ? parseInt(limit as any, 10) : limit
    const take = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10

    return this.prisma.listings.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        isFeatured: true,
        isSold: false,
      },
      take,
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            averageRating: true,
            isVerified: true,
            kycStatus: true,
            sellerLevel: true,
            deliverySuccessRate: true,
            totalSales: true,
          },
        },
        category: true,
        listingReviews: {
          select: { rating: true },
          take: 5,
        },
      },
      orderBy: [{ featuredAt: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async estimateAccountValue(dto: {
    gameId: string
    gameSlug?: string
    rank: string
    level: number
    skins: number | any[]
    platform: string
    hasElitePass?: boolean
    hasBattlePass?: boolean
  }) {
    const skinCount = Array.isArray(dto.skins) ? dto.skins.length : Number(dto.skins) || 0
    const skinValueBonus = Math.min(50, skinCount * 2)
    const GAME_BASE: Record<string, number> = {
      'free-fire': 25,
      'cod-mobile': 30,
      'pubg-mobile': 35,
      'blood-strike': 20,
      'delta-force': 25,
      'valorant': 40,
      'roblox': 15,
      'mobile-legends': 20,
      'efootball': 20,
    }

    const RANK_MULTIPLIER: Record<string, number> = {
      Bronze: 0.5,
      Silver: 0.7,
      Gold: 1.0,
      Platinum: 1.5,
      Diamond: 2.0,
      Heroic: 2.5,
      Mythic: 3.0,
      Grandmaster: 3.5,
      Challenger: 4.0,
      Immortal: 4.5,
      Radiant: 5.0,
    }

    const PLATFORM_MULTIPLIER: Record<string, number> = {
      mobile: 1.0,
      pc: 1.3,
      console: 1.2,
    }

    let base = GAME_BASE[dto.gameSlug] || 20
    const rankMult = RANK_MULTIPLIER[dto.rank] || 1.0
    const platformMult = PLATFORM_MULTIPLIER[dto.platform] || 1.0
    const levelBonus = Math.max(0, (dto.level - 1)) * 0.5
    const eliteBonus = dto.hasElitePass ? 12 : dto.hasBattlePass ? 10 : 0

    const comparable = await this.prisma.listings.findMany({
      where: { gameId: dto.gameId, rank: dto.rank, platform: dto.platform, status: 'ACTIVE' },
      select: { price: true },
    })
    const prices = comparable.map(l => Number(l.price)).sort((a, b) => a - b)
    const sampleSize = prices.length
    let marketMin = base
    let marketMax = base * 2
    if (sampleSize >= 3) {
      marketMin = prices[Math.floor(sampleSize * 0.25)]
      marketMax = prices[Math.floor(sampleSize * 0.75)]
      base = prices[Math.floor(sampleSize * 0.5)]
    }
    const estimated = base * rankMult * platformMult + levelBonus + skinValueBonus + eliteBonus
    const low = Math.max(0, estimated - (estimated * 0.2))
    const high = estimated + (estimated * 0.2)
    const confidence = sampleSize >= 10 ? 'high' : sampleSize >= 3 ? 'medium' : 'low'
    const reasoning = [
      `Base value: $${base.toFixed(2)}`,
      `${dto.rank} rank multiplier: x${rankMult}`,
      `${skinCount} skins: +$${skinValueBonus}`,
      eliteBonus > 0 ? `Battle/Elite Pass: +$${eliteBonus}` : null,
      `Level bonus: +$${levelBonus.toFixed(2)}`,
      sampleSize > 0 ? `Based on ${sampleSize} active listings` : 'No comparable listings found — estimate based on platform averages only.',
    ].filter(Boolean) as string[]

    return {
      suggestedMin: Math.round(low * 100) / 100,
      suggested: Math.round(estimated * 100) / 100,
      suggestedMax: Math.round(high * 100) / 100,
      confidence,
      marketSampleSize: sampleSize,
      reasoning,
    }
  }

  async getMarketStats(gameId: string, rank?: string, platform?: string) {
    const where: any = { gameId, status: 'ACTIVE' }
    if (rank) where.rank = rank
    if (platform) where.platform = platform
    const prices = (await this.prisma.listings.findMany({ where, select: { price: true } })).map(l => Number(l.price)).sort((a, b) => a - b)
    const count = prices.length
    const p25 = count > 0 ? prices[Math.floor(count * 0.25)] : null
    const median = count > 0 ? prices[Math.floor(count * 0.5)] : null
    const p75 = count > 0 ? prices[Math.floor(count * 0.75)] : null
    return { p25, median, p75, count }
  }
}
