import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT FILTER
// Detects external contact information in free-text fields.
// Returns the first match found, or null if clean.
// ─────────────────────────────────────────────────────────────────────────────
const EXTERNAL_CONTACT_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  // Phone numbers — international/local formats
  {
    label: 'phone number',
    regex: /(\+?\d[\d\s\-().]{6,}\d)/g,
  },
  // Email addresses
  {
    label: 'email address',
    regex: /[a-zA-Z0-9._%+\-]+\s*@\s*[a-zA-Z0-9.\-]+\s*\.\s*[a-zA-Z]{2,}/g,
  },
  // Discord tags: username#1234 or @username
  {
    label: 'Discord tag',
    regex: /\b\w{2,32}#\d{4}\b|discord\.gg\/\S+/gi,
  },
  // Telegram handles: @handle or t.me/
  {
    label: 'Telegram handle',
    regex: /@[a-zA-Z0-9_]{4,}|t\.me\/\S+|telegram\.me\/\S+/gi,
  },
  // WhatsApp references
  {
    label: 'WhatsApp contact',
    regex: /whatsapp|wa\.me\/\S+/gi,
  },
  // URLs / website links
  {
    label: 'external URL',
    regex: /https?:\/\/[^\s]+|www\.[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}/gi,
  },
  // Instagram / Facebook / Twitter / Snapchat keywords with handles
  {
    label: 'social media handle',
    regex: /\b(instagram|insta|ig|facebook|fb|twitter|snapchat|snap|tiktok)\s*[:/]?\s*@?\s*\w{3,}/gi,
  },
]

export interface FilterResult {
  clean: boolean
  violations: string[]
}

export function filterExternalContact(text: string): FilterResult {
  const violations: string[] = []
  for (const pattern of EXTERNAL_CONTACT_PATTERNS) {
    const matches = text.match(pattern.regex)
    if (matches && matches.length > 0) {
      violations.push(`${pattern.label}: "${matches[0]}"`)
    }
  }
  return { clean: violations.length === 0, violations }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SUSPEND threshold
// ─────────────────────────────────────────────────────────────────────────────
const EXTERNAL_CONTACT_SUSPEND_THRESHOLD = 3

@Injectable()
export class BuyerRequestsService {
  private readonly logger = new Logger(BuyerRequestsService.name)

  constructor(private prisma: PrismaService) {}

  // ─── Public: list open requests ───────────────────────────────────────────

  async getOpenRequests(opts: {
    gameName?: string
    itemType?: string
    limit?: number
    offset?: number
  }) {
    const where: any = { status: 'OPEN' }
    if (opts.gameName) where.gameName = { contains: opts.gameName, mode: 'insensitive' }
    if (opts.itemType) where.itemType = opts.itemType
    const [items, total] = await Promise.all([
      this.prisma.buyerRequests.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: opts.limit ?? 20,
        skip: opts.offset ?? 0,
        include: {
          buyer: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          _count: { select: { offers: true } },
        },
      }),
      this.prisma.buyerRequests.count({ where }),
    ])
    return { items, total }
  }

  // ─── Create request ───────────────────────────────────────────────────────

  async createRequest(
    buyerId: string,
    data: {
      gameName: string
      gameSlug?: string
      title: string
      description: string
      itemType?: string
      budgetMin?: number
      budgetMax?: number
      // legacy single budget
      budget?: number
      currency?: string
      region?: string
      platform?: string
      rank?: string
      deliveryTimeframe?: string
      requiredVerificationLevel?: string
    },
  ) {
    // ── Content filter ──────────────────────────────────────────────────────
    const textToScan = `${data.title} ${data.description}`
    const filter = filterExternalContact(textToScan)

    // Description length validation
    if (data.description.trim().length < 50) {
      throw new BadRequestException('Description must be at least 50 characters.')
    }
    if (data.description.trim().length > 500) {
      throw new BadRequestException('Description must not exceed 500 characters.')
    }

    // ── Check if user is auto-suspended ────────────────────────────────────
    const user = await this.prisma.users.findUnique({
      where: { id: buyerId },
      select: { externalContactStrikes: true, isBanned: true },
    })
    if (!user) throw new NotFoundException('User not found')
    if (user.isBanned) throw new ForbiddenException('Your account has been suspended.')

    if ((user.externalContactStrikes ?? 0) >= EXTERNAL_CONTACT_SUSPEND_THRESHOLD) {
      throw new ForbiddenException(
        'Your account has been suspended due to repeated external contact attempts. Contact support to appeal.',
      )
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // ── If violations found, flag the request ──────────────────────────────
    if (!filter.clean) {
      this.logger.warn(
        `Buyer ${buyerId} posted request with external contact violations: ${filter.violations.join(', ')}`,
      )

      // Increment user's strike counter
      const updatedUser = await this.prisma.users.update({
        where: { id: buyerId },
        data: { externalContactStrikes: { increment: 1 } },
        select: { externalContactStrikes: true },
      })

      const newStrikes = updatedUser.externalContactStrikes

      // Create the request in FLAGGED state for admin review
      const req = await this.prisma.buyerRequests.create({
        data: {
          buyerId,
          gameName: data.gameName,
          gameSlug: data.gameSlug,
          title: data.title,
          description: data.description,
          itemType: (data.itemType ?? 'ACCOUNT') as any,
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          budget: data.budget ?? data.budgetMin,
          currency: data.currency ?? 'NGN',
          region: data.region,
          platform: data.platform,
          rank: data.rank,
          deliveryTimeframe: (data.deliveryTimeframe ?? 'FLEXIBLE') as any,
          requiredVerificationLevel: data.requiredVerificationLevel ?? 'NONE',
          status: 'FLAGGED' as any,
          isFlagged: true,
          flagCount: 1,
          flagReason: `External contact detected: ${filter.violations.join('; ')}`,
          flaggedAt: new Date(),
          externalContactAttempts: 1,
          expiresAt,
        },
      })

      // Auto-suspend if threshold reached
      if (newStrikes >= EXTERNAL_CONTACT_SUSPEND_THRESHOLD) {
        await this.prisma.users.update({
          where: { id: buyerId },
          data: { isBanned: true, banReason: 'Auto-suspended: 3 verified external contact attempts.' },
        })
        this.logger.warn(`User ${buyerId} auto-suspended after ${newStrikes} external contact strikes.`)
      }

      return {
        ...req,
        _flagged: true,
        _violations: filter.violations,
        _warning:
          'Your request contains external contact information and has been flagged for review. All transactions must be completed through PIYROX.',
      }
    }

    // ── Clean — create normally ────────────────────────────────────────────
    return this.prisma.buyerRequests.create({
      data: {
        buyerId,
        gameName: data.gameName,
        gameSlug: data.gameSlug,
        title: data.title,
        description: data.description,
        itemType: (data.itemType ?? 'ACCOUNT') as any,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        budget: data.budget ?? data.budgetMin,
        currency: data.currency ?? 'NGN',
        region: data.region,
        platform: data.platform,
        rank: data.rank,
        deliveryTimeframe: (data.deliveryTimeframe ?? 'FLEXIBLE') as any,
        requiredVerificationLevel: data.requiredVerificationLevel ?? 'NONE',
        expiresAt,
      },
    })
  }

  // ─── Close / delete own request ───────────────────────────────────────────

  async closeRequest(id: string, buyerId: string) {
    const req = await this.prisma.buyerRequests.findUnique({ where: { id } })
    if (!req) throw new NotFoundException('Request not found')
    if (req.buyerId !== buyerId) throw new ForbiddenException('Not your request')
    return this.prisma.buyerRequests.update({
      where: { id },
      data: { status: 'CLOSED' as any },
    })
  }

  // ─── Buyer: list own requests ─────────────────────────────────────────────

  async getMyRequests(buyerId: string) {
    return this.prisma.buyerRequests.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { offers: true } },
      },
    })
  }

  // ─── Smart matching ───────────────────────────────────────────────────────
  // Returns seller listings that best match a buyer request.
  // Scoring: game match (required) + price overlap + seller rating + delivery time

  async getMatchingListings(requestId: string) {
    const req = await this.prisma.buyerRequests.findUnique({ where: { id: requestId } })
    if (!req) throw new NotFoundException('Buyer request not found')

    const where: any = {
      status: 'ACTIVE',
      gameName: { contains: req.gameName, mode: 'insensitive' },
    }

    // Budget price-range overlap
    if (req.budgetMax) where.price = { lte: req.budgetMax }
    if (req.budgetMin && !req.budgetMax) where.price = { gte: req.budgetMin }
    if (req.budgetMin && req.budgetMax) {
      where.price = { gte: req.budgetMin, lte: req.budgetMax }
    }

    // Platform filter
    if (req.platform) where.platform = { contains: req.platform, mode: 'insensitive' }
    // Region filter
    if (req.region) where.region = { contains: req.region, mode: 'insensitive' }

    const listings = await this.prisma.listings.findMany({
      where,
      take: 20,
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            averageRating: true,
            deliverySuccessRate: true,
            isVerified: true,
            kycStatus: true,
          },
        },
      },
      orderBy: [{ seller: { averageRating: 'desc' } }, { createdAt: 'desc' }],
    })

    // Score and sort listings
    const scored = listings.map((l) => {
      let score = 0
      // Game exact match bonus
      if (l.gameName.toLowerCase() === req.gameName.toLowerCase()) score += 40
      // Seller rating bonus (0-30 pts)
      score += ((l.seller as any)?.averageRating ?? 0) * 6
      // Delivery time compatibility
      const dlMap: Record<string, number> = {
        WITHIN_1_HOUR: 60,
        WITHIN_24_HOURS: 1440,
        WITHIN_3_DAYS: 4320,
        WITHIN_7_DAYS: 10080,
        FLEXIBLE: 99999,
      }
      const requestedMins = dlMap[req.deliveryTimeframe ?? 'FLEXIBLE'] ?? 99999
      if (l.deliveryTime && l.deliveryTime <= requestedMins) score += 20
      // Verified seller bonus
      if ((l.seller as any)?.isVerified) score += 10
      return { ...l, _matchScore: score }
    })

    scored.sort((a, b) => b._matchScore - a._matchScore)
    return scored
  }

  // ─── Offers ───────────────────────────────────────────────────────────────

  async createOffer(
    sellerId: string, // sellers.id (NOT users.id)
    requestId: string,
    data: { message: string; price: number; currency?: string; deliveryTime?: number },
  ) {
    const req = await this.prisma.buyerRequests.findUnique({ where: { id: requestId } })
    if (!req) throw new NotFoundException('Buyer request not found')
    if (req.status !== 'OPEN') throw new BadRequestException('This request is no longer open.')

    // Content filter on offer message
    const filter = filterExternalContact(data.message)
    if (!filter.clean) {
      throw new BadRequestException(
        `Your offer contains external contact information (${filter.violations[0]}). All communication must remain on PIYROX.`,
      )
    }

    // Check for existing offer from this seller
    const existing = await this.prisma.buyerRequestOffers.findFirst({
      where: { requestId, sellerId, status: { not: 'WITHDRAWN' } },
    })
    if (existing) throw new BadRequestException('You have already submitted an offer for this request.')

    return this.prisma.buyerRequestOffers.create({
      data: {
        requestId,
        sellerId,
        message: data.message,
        price: data.price,
        currency: data.currency ?? req.currency ?? 'NGN',
        deliveryTime: data.deliveryTime,
      },
      include: {
        seller: { select: { id: true, storeName: true, averageRating: true, isVerified: true } },
      },
    })
  }

  async getOffersForRequest(requestId: string, buyerId: string) {
    const req = await this.prisma.buyerRequests.findUnique({ where: { id: requestId } })
    if (!req) throw new NotFoundException('Request not found')
    if (req.buyerId !== buyerId) throw new ForbiddenException('Not your request')

    return this.prisma.buyerRequestOffers.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
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
          },
        },
      },
    })
  }

  async respondToOffer(offerId: string, buyerId: string, accept: boolean) {
    const offer = await this.prisma.buyerRequestOffers.findUnique({
      where: { id: offerId },
      include: { request: true },
    })
    if (!offer) throw new NotFoundException('Offer not found')
    if (offer.request.buyerId !== buyerId) throw new ForbiddenException('Not your request')
    if (offer.status !== 'PENDING') throw new BadRequestException('Offer is no longer pending')

    const newStatus = accept ? 'ACCEPTED' : 'DECLINED'

    const updated = await this.prisma.buyerRequestOffers.update({
      where: { id: offerId },
      data: { status: newStatus },
    })

    // If accepted, close all other pending offers
    if (accept) {
      await this.prisma.buyerRequestOffers.updateMany({
        where: { requestId: offer.requestId, id: { not: offerId }, status: 'PENDING' },
        data: { status: 'DECLINED' },
      })
      await this.prisma.buyerRequests.update({
        where: { id: offer.requestId },
        data: { status: 'CLOSED' as any },
      })
    }

    return updated
  }

  async withdrawOffer(offerId: string, sellerId: string) {
    const offer = await this.prisma.buyerRequestOffers.findUnique({ where: { id: offerId } })
    if (!offer) throw new NotFoundException('Offer not found')
    if (offer.sellerId !== sellerId) throw new ForbiddenException('Not your offer')
    if (offer.status !== 'PENDING') throw new BadRequestException('Cannot withdraw a non-pending offer')
    return this.prisma.buyerRequestOffers.update({
      where: { id: offerId },
      data: { status: 'WITHDRAWN' },
    })
  }

  // ─── Flag a request (report by another user) ──────────────────────────────

  async flagRequest(requestId: string, reporterId: string, reason: string) {
    const req = await this.prisma.buyerRequests.findUnique({ where: { id: requestId } })
    if (!req) throw new NotFoundException('Request not found')

    const updated = await this.prisma.buyerRequests.update({
      where: { id: requestId },
      data: {
        flagCount: { increment: 1 },
        isFlagged: true,
        flagReason: req.flagReason ? `${req.flagReason}; ${reason}` : reason,
        flaggedAt: req.flaggedAt ?? new Date(),
        status: 'FLAGGED' as any,
      },
    })
    return updated
  }

  // ─── Admin: review flagged request ────────────────────────────────────────

  async adminReviewRequest(
    requestId: string,
    adminId: string,
    action: 'CLEAR' | 'CONFIRM_VIOLATION',
  ) {
    const req = await this.prisma.buyerRequests.findUnique({
      where: { id: requestId },
      include: { buyer: { select: { id: true, externalContactStrikes: true } } },
    })
    if (!req) throw new NotFoundException('Request not found')

    if (action === 'CLEAR') {
      return this.prisma.buyerRequests.update({
        where: { id: requestId },
        data: {
          isFlagged: false,
          flagReason: null,
          reviewedByAdminAt: new Date(),
          reviewedByAdminId: adminId,
          status: 'OPEN' as any,
        },
      })
    }

    // CONFIRM_VIOLATION: keep flagged, increment buyer's strikes, potentially suspend
    const buyer = req.buyer
    const newStrikes = (buyer.externalContactStrikes ?? 0) + 1

    await this.prisma.users.update({
      where: { id: buyer.id },
      data: {
        externalContactStrikes: newStrikes,
        ...(newStrikes >= EXTERNAL_CONTACT_SUSPEND_THRESHOLD
          ? { isBanned: true, banReason: 'Suspended: 3 confirmed external contact violations.' }
          : {}),
      },
    })

    return this.prisma.buyerRequests.update({
      where: { id: requestId },
      data: {
        reviewedByAdminAt: new Date(),
        reviewedByAdminId: adminId,
        status: newStrikes >= EXTERNAL_CONTACT_SUSPEND_THRESHOLD ? ('AUTO_SUSPENDED' as any) : ('FLAGGED' as any),
      },
    })
  }

  // ─── Admin: list flagged requests ─────────────────────────────────────────

  async adminGetFlaggedRequests(opts: { limit?: number; offset?: number }) {
    const [items, total] = await Promise.all([
      this.prisma.buyerRequests.findMany({
        where: { isFlagged: true },
        orderBy: { flaggedAt: 'desc' },
        take: opts.limit ?? 25,
        skip: opts.offset ?? 0,
        include: {
          buyer: {
            select: { id: true, email: true, firstName: true, lastName: true, externalContactStrikes: true, isBanned: true },
          },
          _count: { select: { offers: true } },
        },
      }),
      this.prisma.buyerRequests.count({ where: { isFlagged: true } }),
    ])
    return { items, total }
  }

  // ─── Validate text without creating ───────────────────────────────────────
  // Frontend can call this to show real-time warnings before submit

  validateDescription(text: string): FilterResult {
    return filterExternalContact(text)
  }
}
